import {DateTime} from 'luxon';
import fetch, {RequestInit, Response} from 'node-fetch';
import {parse, HTMLElement} from 'node-html-parser';
import {Config, Player, Tables, Team, TeamConfig} from './types.js';
import {getDates} from './googleUtils.js';
import {readClubs, getTeamConfigLocal} from './utils.js';
import logger from './logger.js';
import { TeamResponse } from './team_response.js';
import { PlayerDataResponse } from './player_response.js';

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

/**
 * Parse html tables to get a javascript representation
 * @param {Response} html The html snippet to parse the tables from
 * @return {Array<Array<string>>} The table in an array representation
 */
export function getTablesFromHTML(html: string):Tables {
  /**
   *
   * @param {[HTMLElement]} rows
   * @return {[[string]]}
   */
  function parseTable(rows: HTMLElement[]):string[][] {
    const rowData = [];
    for (const row of rows) {
      if (row.classList.contains('divider-muted')) {
        break;
      }
      if (!row.classList.contains('collapse')) {
        const entries = row.getElementsByTagName('td')
            .map((el) => {
              // el.childNodes.forEach(node => el.removeChild(node));
              return el.innerText.replace(/\n/g, '');
            });
        rowData.push(entries);
      }
    }
    return rowData;
  }
  const root = parse(html);
  const playingPlanDesktop = root.querySelectorAll('#playingPlanDesktop > tbody > tr');
  const gamestatsTable = root.querySelectorAll('#gamestatsTable > tbody > tr');
  if (playingPlanDesktop && gamestatsTable) {
    return {
      playingPlanDesktop: parseTable(playingPlanDesktop),
      gamestatsTable: parseTable(gamestatsTable),
    };
  } else {
    throw Error('Table "playingPlanDesktop" or "gamestatsTable" not found');
  }
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

async function fetchPlayers(teams:TeamResponse[]):Promise<Player[]> {
  const players: Record<string, Player> = {}
  let teamCounter = 1;
  for (const team of teams) {
    for (const sheet of team.data.balancesheet) {
      for (const statistic of sheet.single_player_statistics) {
        const player: Player = {
          team: teamCounter,
          name: `${statistic.player_firstname} ${statistic.player_lastname}`,
          actions: Number(statistic.meeting_count), 
          loses: statistic.single_statistics.filter(item => item.points_lost == "1").length,
          wins: statistic.single_statistics.filter(item => item.points_won == "1").length,
        }
        if (players.hasOwnProperty(statistic.player_id)) {
          players[statistic.player_id] = {
            team: player.team,
            name: player.name,
            actions: player.actions + players[statistic.player_id].actions,
            loses: player.loses + players[statistic.player_id].loses,
            wins: player.wins + players[statistic.player_id].wins,
          }
        }
        else {
          players[statistic.player_id] = player;
        }
      }
    }
    teamCounter++;
  }
  const promises = Object.keys(players).map(key => fetchTTRValues(players[key], key));
  try {
    const results = await Promise.all(promises);
    return results;
  } catch(e) {
    logger.error(`Something went wrong on fetching player ttr data: ${e}`);
  }
  return Object.keys(players).map(key => players[key]);
}

/**
 * @param {RequestInit} loginOpt
 * @return {Promise<Player[]>}
 */
export async function getMyTTOkiTeamData():Promise<Player[]> {
  const config:Config = await getTeamConfigLocal();
  const teams = await fetchTeams(config.teams, config.saison, config.round);
  const players = await fetchPlayers(teams);
  return players;
}

/**
 * @param {RequestInit} loginOpt
 * @param {string} teamName
 * @return {Promise<Player[] | undefined>}
 */
async function getEnemyPlayers(teamName:string):Promise<Player[] | undefined> {
  let enemy = undefined;
  let league = undefined;
  let groupId = undefined;
  const config = await getTeamConfigLocal();
  for (const team of config.teams) {
    enemy = team.enemies?.find((enemy) => enemy.enemyName === teamName.replace(/ /g, '-')
        .replace(/ö/g, 'oe').replace(/ä/g, 'ae').replace(/ü/g, 'ue'));
    if (enemy) {
      league = team.league;
      groupId = team.groupId;
      const clubId = enemy.enemyClubId;
      const response = await fetchTeam(config.saison,
          league,
          groupId,
          enemy?.enemyId,
          enemy?.enemyName,
          config.round);
      const players = await fetchPlayers([response]);
      return players;
    }
  }
}

/**
 * @param {RequestInit} loginOpt
 * @return {Promise<{allies:Team[], enemies:Team[]}>}
 */
export async function getUpcoming(okiPlayers: Player[]):Promise<{allies:Team[], enemies:Team[]}> {
  const data = (await getDates([]));
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
  const clubs:{name:string, id:string}[] = await readClubs();
  const clubId:(string|undefined) = clubs.find((el) => 'TSG Oberkirchberg'.includes(el.name))?.id;
  if (clubId) {
    allies.push({
      name: 'TSG Oberkirchberg',
      members: playerObjectsFirst.filter(player => player.team == 1).slice(0, 6),
    });
  }
  if (clubId) {
    let members;
    if (nextDateFirstTeam?.date === nextDateSecondTeam?.date) {
      members = playerObjectsSecond.slice(6);
    } else {
      members = playerObjectsSecond.filter((el) => el.team == 2);
    }
    allies.push({
      name: 'TSG Oberkirchberg II',
      members: members,
    });
  }
  if (nextDateFirstTeam) {
    enemies.push({
      name: nextDateFirstTeam.firstTeam.enemy,
      members: await getEnemyPlayers(nextDateFirstTeam.firstTeam.enemy) || [],
    });
  }
  if (nextDateSecondTeam) {
    enemies.push({
      name: nextDateSecondTeam.secondTeam.enemy,
      members: await getEnemyPlayers(nextDateSecondTeam.secondTeam.enemy) || [],
    });
  }
  return {allies: allies, enemies: enemies};
}
