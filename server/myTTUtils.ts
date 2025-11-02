import {DateTime} from 'luxon';
import fetch, {RequestInit, Response} from 'node-fetch';
import {parse, HTMLElement} from 'node-html-parser';
import {Config, Player, Tables, Team, TeamConfig} from './types.js';
import {getDates} from './googleUtils.js';
import {getTeamConfig, getPlayersForTeamsFirebase} from './utils.js';
import logger from './logger.js';
import { TeamResponse } from './team_response.js';
import { PlayerDataResponse } from './player_response.js';
import { Firestore } from '@google-cloud/firestore';

/**
 * Login for mytischtennis
 * @return {RequestInit} options for a get Request with the login cookie
 */
export async function login(): Promise<RequestInit> {
  /**
   *
   * @param {Response} response
   * @return {string}
   */
  function parseCookies(response:Response) {
    const raw = response.headers.raw()['set-cookie'];
    return raw.map((entry) => {
      const parts = entry.split(';');
      const cookiePart = parts[0];
      return cookiePart;
    }).join(';');
  }
  const formData:URLSearchParams = new URLSearchParams();
  formData.append('email', process.env.MYTT_EMAIL);
  formData.append('password', process.env.MYTT_PASSWORD);
  formData.append('intent', 'login');
  const options:RequestInit = {
    method: 'POST',
    headers: {
      'accept': '*/*',
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'origin': 'https://www.mytischtennis.de',
      'referer': 'https://www.mytischtennis.de/'
    },
    body: formData,
  };
  logger.debug("Trying to login to mytischtennis");
  const url = new URL("https://www.mytischtennis.de/login");
  url.searchParams.set("next", "/");
  url.searchParams.set("_data", "routes/_auth+/login");
  const login:Response = await fetch(url, options);
  logger.debug(`Login request returned status ${login.status}`);
  if (login.headers.raw()['set-cookie'])
    logger.debug(`Got login cookie from mytischtennis`);
  else
    logger.warn(`Failed to get login cookie from mytischtennis`);
  
  if (login == null || login == undefined)
    throw Error('Login returned empty result.');
  const cookies = parseCookies(login);
  if (cookies == null) {
    throw Error('Did not get a valid login cookie');
  } else {
    const opt:RequestInit = {
      headers: {
        // eslint-disable-next-line max-len
        'Cookie': cookies,
      },
    };
    return opt;
  }
}
/**
 *
 * @param {string} saison
 * @param {string} league
 * @param {string} groupId
 * @param {string} teamId
 * @param {string} teamName
 * @param {string} round
 * @return {Promise<Response>}
 */
async function fetchTeam(saison:string,
    league:string,
    groupId:string,
    teamId:string,
    teamName:string,
    round:string):Promise<TeamResponse> {
  const url = new URL(`https://www.mytischtennis.de/click-tt/TTBW/` +
    `${saison}/ligen/${league}/gruppe/${groupId}/mannschaft/${teamId}/` +
    `${teamName}/spielerbilanzen/${round}`);
  url.searchParams.set('_data', 'routes/click-tt+/$association+/$season+/$type+/($groupname).gruppe.$urlid_.mannschaft.$teamid.$teamname+/spielerbilanzen.$filter');
  logger.debug(`Trying to fetch statistics for team ${teamName}`);
  const response = await fetch(url);
  if (response.status >= 400)
    logger.error(`Got response code ${response.status} from server.`);
  else 
    logger.debug("Successfully got response from server");
  logger.debug(response.body);
  const team = await response.json() as TeamResponse;
  logger.debug(`Successfully parsed server result into object: ${JSON.stringify(team)}`);
  return team;
}

/**
 *
 */
export async function fetchTeams(teams: TeamConfig[], saison: string, round: string):Promise<TeamResponse[]> {
  const teamPromises = teams.map(team =>
    fetchTeam(saison,
      team.league,
      team.groupId,
      team.teamId,
      team.teamName,
      round));
  return await Promise.all(teamPromises);
}


async function fetchTTRValues(player: Player, playerId: string): Promise<Player> {
  const slicedPlayerId = playerId.startsWith("NU") ? playerId.slice(2) : playerId;
  const url = new URL(`https://www.mytischtennis.de/click-tt/spieler/${slicedPlayerId}/spielerportrait`);
  url.searchParams.set('_data', 'routes/click-tt+/spieler.$id.spielerportrait.($match_type)');
  logger.debug(`Trying to get ttr data for player ${slicedPlayerId}`);
  const response = await fetch(url);
  if (response.status >= 400)
    logger.error(`Got response code ${response.status} from server.`);
  else 
    logger.debug("Successfully got response from server");
  const playerData = await response.json() as PlayerDataResponse;
  logger.debug(`Successfully parsed server result into object: ${JSON.stringify(playerData)}`);
  try {
    const playerWithTtr = {...player, ttr: playerData.data.player_infos.ttr, qttr: playerData.data.player_infos.qttr};
    return playerWithTtr;
  } catch(e) {
    logger.warning(`Something went wrong on getting ttr values out of server retrieved result: ${e}`);
  }
  return player;
}

async function fetchPlayers(teams:TeamResponse[]):Promise<Record<string, Player[]>> {
  const players: Record<string, {teamId: string, player: Player}> = {}
  let teamCounter = 1;
  for (const team of teams) {
    for (const sheet of team.data.balancesheet) {
      for (const statistic of sheet.single_player_statistics) {
        const player: Player = {
          team: teamCounter,
          name: `${statistic.player_firstname} ${statistic.player_lastname}`,
          actions: Number(statistic.meeting_count), 
          loses: statistic.single_statistics.reduce((acc, item) => acc + Number(item.points_lost), 0),
          wins: statistic.single_statistics.reduce((acc, item) => acc + Number(item.points_won), 0),
        }
        if (players.hasOwnProperty(statistic.player_id)) {
          players[statistic.player_id] = {
            teamId: team.teamid,
            player: {
              team: player.team,
              name: player.name,
              actions: player.actions + players[statistic.player_id].player.actions,
              loses: player.loses + players[statistic.player_id].player.loses,
              wins: player.wins + players[statistic.player_id].player.wins
            }
          }
        }
        else {
          players[statistic.player_id] = { teamId: team.teamid, player: player };
        }
      }
    }
    players 
    teamCounter++;
  }
  
  try {
    const unresolved = Object.keys(players).map(async key => { 
      return { teamId: players[key].teamId, player: await fetchTTRValues(players[key].player, key) }
    });
  const resolved = await Promise.all(unresolved);
  const results: Record<string, Player[]> = Object.entries(resolved).reduce(
    (acc, [playerId, { teamId, player }]) => {
      if (!acc[teamId]) acc[teamId] = [];
      acc[teamId].push(player);
      return acc;
    },
    {} as Record<string, Player[]>
  );
    return results;
  } catch(e) {
    logger.error(`Something went wrong on fetching player ttr data: ${e}`);
  }
  return Object.entries(players).reduce(
    (acc, [playerId, { teamId, player }]) => {
      if (!acc[teamId]) acc[teamId] = [];
      acc[teamId].push(player);
      return acc;
    },
    {} as Record<string, Player[]>
  );
}

/**
 * @param {RequestInit} loginOpt
 * @return {Promise<Player[]>}
 */
export async function getMyTTOkiTeamData(db: Firestore):Promise<Record<string, Player[]>> {
  const config:Config = await getTeamConfig(db);
  const teams = await fetchTeams(config.teams, config.saison, config.round);
  const players = await fetchPlayers(teams);
  return players;
}

export async function getMyTTTeam(db: Firestore):Promise<Player[]> {
  var config = await getTeamConfig(db);
    if (config === undefined)
      return;
  return await getPlayersForTeamsFirebase(db, config.teams.map(team => team.teamId));
}

/**
 * @param {RequestInit} loginOpt
 * @param {string} teamName
 * @return {Promise<Player[] | undefined>}
 */
async function getEnemyPlayers(
  saison: string, 
  round: string, 
  team: TeamConfig, 
  enemy: {enemyId:string, enemyName:string, enemyClubId:string}):Promise<Player[] | undefined> {
  let league = undefined;
  let groupId = undefined;
  if (enemy) {
    league = team.league;
    groupId = team.groupId;
    const response = await fetchTeam(saison,
        league,
        groupId,
        enemy?.enemyId,
        enemy?.enemyName,
        round);
    const players = await fetchPlayers([response]);
    return Object.values(players)[0];
  }
}

/**
 * @param {RequestInit} loginOpt
 * @return {Promise<{allies:Team[], enemies:Team[]}>}
 */
export async function getUpcoming(db: Firestore, okiPlayers: Player[], fetch: boolean):Promise<{allies:Team[], enemies:Team[]}> {
  const data = (await getDates(db, []));
  const ttDates = data?.ttDates;
  const nextDateFirstTeam = ttDates?.find((d) => {
    if (d.firstTeam) {
      return DateTime.fromISO(d.date).diffNow().toMillis() > 0;
    }
  });
  const nextDateSecondTeam = ttDates?.find((d) => {
    if (d.secondTeam) {
      return DateTime.fromISO(d.date).diffNow().toMillis() > 0;
    }
  });
  let playerObjectsFirst = nextDateFirstTeam?.availablePlayers.map((player) => {
    return {team: player.team, name: player.name, nickName: player.nickName, ttr: 0, qttr: 0, actions: 0, wins: 0, loses: 0};
  });
  playerObjectsFirst = playerObjectsFirst.map(player => {
    const okiPlayer = okiPlayers.find(pl => pl.name == player.name);
    return {...player, ttr: okiPlayer?.ttr, qttr: okiPlayer?.qttr, actions: okiPlayer?.actions, wins: okiPlayer?.wins, loses: okiPlayer?.loses};
  });
  logger.debug(`Found oki players for next match first: ${playerObjectsFirst.length}`)
  let playerObjectsSecond = nextDateSecondTeam?.availablePlayers.map((player) => {
    return {team: player.team, name: player.name, nickName: player.nickName, ttr: 0, qttr: 0, actions: 0, wins: 0, loses: 0};
  });
  playerObjectsSecond = playerObjectsSecond.map(player => {
    const okiPlayer = okiPlayers.find(pl => pl.name == player.name);
    if (okiPlayer)
      return {...player, ttr: okiPlayer?.ttr, qttr: okiPlayer?.qttr, actions: okiPlayer?.actions, wins: okiPlayer?.wins, loses: okiPlayer?.loses};
    return {...player, ttr: 0, qttr: 0, actions: 0, wins: 0, loses: 0};
  });
  logger.debug(`Found oki players for next match second: ${playerObjectsSecond.length}`)
  const allies:Team[] = [];
  const enemies:Team[] = [];
  // const clubs:{name:string, id:string}[] = await getClubs(db);
  // const clubId:(string|undefined) = clubs.find((el) => 'TSG Oberkirchberg'.includes(el.name))?.id;
  const teamConfig = await getTeamConfig(db);
  allies.push({
    id: teamConfig.teams[0].teamId,
    members: playerObjectsFirst.filter(player => player.team == 1).slice(0, 6),
  });
  let members;
  if (nextDateFirstTeam?.date === nextDateSecondTeam?.date) {
    members = playerObjectsSecond.slice(6);
  } else {
    members = playerObjectsSecond.filter((el) => el.team == 2);
  }
  allies.push({
    id: teamConfig.teams[1].teamId,
    members: members,
  });
  if (nextDateFirstTeam) {
    logger.debug(`Start processing enemy ${nextDateFirstTeam.firstTeam.enemy}`);
    const teamName = nextDateFirstTeam.firstTeam.enemy;
    logger.debug(`Looking up in teams ${JSON.stringify(teamConfig.teams[0].enemies)}`);
    const enemy = teamConfig.teams[0].enemies?.find((enemy) => enemy.enemyName === teamName);
    logger.debug(`Trying to get enemy players for enemy ${enemy?.enemyName}`);
    if (enemy) {
      enemies.push({
        id: enemy.enemyId,
        members: fetch ? await getEnemyPlayers(teamConfig.saison, teamConfig.round, teamConfig.teams[0], enemy) || [] : await getPlayersForTeamsFirebase(db, [enemy.enemyId]),
      });
    }
  }
  if (nextDateSecondTeam) {
    logger.debug(`Start processing enemy ${nextDateSecondTeam.secondTeam.enemy}`);
    const teamName = nextDateSecondTeam.secondTeam.enemy;
    const enemy = teamConfig.teams[1].enemies?.find((enemy) => enemy.enemyName === teamName);
    logger.debug(`Trying to get enemy players for enemy ${enemy?.enemyName}`);
    if (enemy) {
      enemies.push({
        id: enemy.enemyId,
        members: fetch ? await getEnemyPlayers(teamConfig.saison, teamConfig.round, teamConfig.teams[1], enemy) || [] : await getPlayersForTeamsFirebase(db, [enemy.enemyId]),
      });
    }
  }
  logger.debug(`Found enemies: ${JSON.stringify(enemies)}`);
  return {allies: allies, enemies: enemies};
}
