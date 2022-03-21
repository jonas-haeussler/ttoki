import { writeFileSync } from 'fs';
import {DateTime} from 'luxon';
import fetch, {RequestInit, Response} from 'node-fetch';
import parse, {HTMLElement} from 'node-html-parser';
import {Config, Player, Tables, Team} from '../shared/types';
import {getDates, getAllPlayers} from './googleUtils';
import {getPlayersForTeam, readTeamConfig, writeEnemies} from './utils';

/**
 * Login for mytischtennis
 * @return {RequestInit} options for a get Request with the login cookie
 */
export async function login(): Promise<RequestInit> {
  /**
   * 
   * @param response 
   * @returns 
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
  formData.append('userNameB', '--Johnny--');
  formData.append('userPassWordB', 'fraudech1');
  formData.append('targetPage', 'https://www.mytischtennis.de/community/index?fromlogin=1');
  formData.append('goLogin', 'Einloggen');
  const options:RequestInit = {
    method: 'POST',
    headers: {
      'accept': '*/*',
      'content-type': 'application/x-www-form-urlencoded',
    },
    redirect: 'manual',
    follow: 0,
    // body: 'userNameB=--Johnny--&userPassWordB=fraudech1&permalogin=1&targetPage=https://www.mytischtennis.de/community/index?fromlogin=1&goLogin=Einloggen',
    body: formData,
  };


  const login:Response = await fetch('https://www.mytischtennis.de/community/login', options);
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
 * @param saison 
 * @param league 
 * @param groupId 
 * @param teamId 
 * @param round 
 */
async function fetchTeam(saison:string,
    league:string,
    groupId:string,
    teamId:string,
    teamName:string,
    round:string):Promise<Response> {
  return await fetch(`https://www.mytischtennis.de/clicktt/TTBW/` +
    `${saison}/ligen/${league}/gruppe/${groupId}/mannschaft/${teamId}/` +
    `${teamName}/spielerbilanzen/${round}/`);
}

/**
 * 
 */
export async function fetchTeams():Promise<Response[]> {
  const config:Config = readTeamConfig();
  const team1 = await fetchTeam(config.saison,
      config.teams[0].league,
      config.teams[0].groupId,
      config.teams[0].teamId,
      config.teams[0].teamName,
      config.round);
  const team2 = await fetchTeam(config.saison,
      config.teams[1].league,
      config.teams[1].groupId,
      config.teams[1].teamId,
      config.teams[1].teamName,
      config.round);
  return [team1, team2];
}

/**
 * Parse html tables to get a javascript representation
 * @param {Response} html The html snippet to parse the tables from
 * @return {Array<Array<string>>} The table in an array representation
 */
export function getTablesFromHTML(html: string):Tables {
  /**
   * 
   * @param rows 
   * @returns 
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

/**
 * 
 * @param players 
 * @param html 
 */
function getTTRForPlayers(players:{name:string, ttr:number, qttr:number}[],
    html:string, quartal:boolean):{name:string, ttr:number, qttr:number}[] {
  const root = parse(html);
  const th = root.querySelectorAll('.table-mytt > thead > tr > th');

  const ttrIndex = th.indexOf(th.find((el) => el.innerHTML.includes('TTR')) || th[0]);
  const table = root.querySelectorAll('.table-mytt > tbody').find((el) => el.childNodes.length > 0);
  const rows = table?.querySelectorAll('tr').filter((el) => {
    return players.some((player) => el.rawText.includes(player.name));
  });
  for (let i = 0; i < players.length; i++) {
    const row = rows?.find((r) => r.rawText.includes(players[i].name));
    const ttrStr = row?.getElementsByTagName('td')[ttrIndex].innerHTML;
    if (ttrStr) {
      const ttr = parseInt(ttrStr);
      if (quartal) {
        players[i].qttr = ttr;
      } else {
        players[i].ttr = ttr;
      }
    }
  }
  return players;
}

/**
 * 
 * @returns 
 */
function parsePlayerStats(ttrs:Player[],
    gamestatsTable:string[][]) {
  const players:Player[] = [];
  for (const player of ttrs) {
    let team:typeof player.team = 1;
    let position = player.position;
    let actions = player.actions;
    let wins = player.wins;
    let loses = player.loses;
    const row = gamestatsTable.find((el) => {
      const names = player.name.split(' ');
      const playerNameMod = `${names[1]}, ${names[0]}`;
      return el[1].includes(playerNameMod);
    });
    if (row) {
      const temp = parseInt(row[0].split('.')[0]);
      team = temp === 1 || temp === 2 || temp === 3 || temp === 4 || temp === 5 || temp === 6 || temp === 7 ? temp : 1;
      position = parseInt(row[0].split('.')[1]);
      actions += parseInt(row[2]);
      const balance = row[9];
      wins += parseInt(balance.split(':')[0]);
      loses += parseInt(balance.split(':')[1]);
    }
    players.push({
      team: team,
      position: position,
      name: player.name,
      ttr: player.ttr,
      qttr: player.qttr,
      actions: actions,
      wins: wins,
      loses: loses});
  }
  return players;
}

/**
 * 
 * @param ttrs 
 */
async function getPlayerStats(
    ttrs:Player[]):Promise<Player[]> {
  const teams = await fetchTeams();
  const tablesFirstTeam = getTablesFromHTML(await teams[0].text());
  const tablesSecondTeam = getTablesFromHTML(await teams[1].text());
  const playersFirstTeam = parsePlayerStats(ttrs, tablesFirstTeam.gamestatsTable);
  const players = parsePlayerStats(playersFirstTeam, tablesSecondTeam.gamestatsTable);
  return players;
}

/**
 * 
 * @param quartal 
 * @returns 
 */
function getTTRLink(quartal:boolean, groupId?:string) {
  if (groupId) {
    return quartal ? `https://www.mytischtennis.de/community/ajax/_rankingList?groupId=${groupId}&ttrQuartalorAktuell=quartal` :
  `https://www.mytischtennis.de/community/ajax/_rankingList?groupId=${groupId}`;
  } else {
    const config = readTeamConfig();
    return quartal ? `https://www.mytischtennis.de/community/ajax/_rankingList?vereinid=${config.vereinId},TTBW&ttrQuartalorAktuell=quartal` :
    `https://www.mytischtennis.de/community/ajax/_rankingList?vereinid=${config.vereinId},TTBW`;
  }
}

/**
 * 
 * @returns 
 */
async function getStatisticsForPlayers(loginOpt:RequestInit,
    players:{name:string,
    ttr:number,
    qttr:number}[],
    groupId?:string):Promise<Player[]> {
  let quartal = false;
  let html = await fetch(getTTRLink(quartal, groupId), loginOpt);
  let ttrs = getTTRForPlayers(players, await html.text(), quartal);
  quartal = true;
  html = await fetch(getTTRLink(quartal, groupId), loginOpt);
  ttrs = getTTRForPlayers(ttrs, await html.text(), quartal);
  const playerObjects:Player[] = [];
  for (const elem of ttrs) {
    playerObjects.push({
      ...elem,
      team: 1,
      position: 0,
      actions: 0,
      wins: 0,
      loses: 0,
    });
  }
  return await getPlayerStats(playerObjects);
}

/**
 * 
 */
export async function getMyTTOkiTeamData(loginOpt:RequestInit):Promise<Player[]> {
  const players = await getAllPlayers();
  if (players === undefined) return [];
  const playerObjects = players.map((player) => {
    return {name: player, ttr: 0, qttr: 0};
  });
  return await getStatisticsForPlayers(loginOpt, playerObjects);
}

/**
 * 
 * @param teamName 
 */
async function getEnemyPlayers(loginOpt:RequestInit,
    teamName:string):Promise<Player[] | undefined> {
  let enemy = undefined;
  let league = undefined;
  let groupId = undefined;
  const config = readTeamConfig();
  for (const team of config.teams) {
    enemy = team.enemies?.find((enemy) => enemy.enemyName === teamName.replaceAll(' ', '-')
        .replaceAll('ö', 'oe').replaceAll('ä', 'ae').replaceAll('ü', 'ue'));
    if (enemy) {
      league = team.league;
      groupId = team.groupId;
      const response = await fetchTeam(config.saison,
          league,
          groupId,
          enemy?.enemyId,
          enemy?.enemyName,
          config.round);
      const tables = getTablesFromHTML(await response.text());
      const playerNames = getPlayersForTeam(tables.gamestatsTable);
      const playerObjects = playerNames.map((player) => {
        const names = player.split(', ');
        return {name: names[1] + ' ' + names[0], ttr: 0, qttr: 0};
      });
      const ttrs = await getStatisticsForPlayers(loginOpt, playerObjects, groupId);
      const players = parsePlayerStats(ttrs, tables.gamestatsTable);
      return players;
    }
  }
}

/**
 * 
 * @param loginOpt 
 */
export async function getUpcoming(loginOpt:RequestInit):Promise<{allies:Team[], enemies:Team[]}> {
  const ttDates = (await getDates([]))?.ttDates;
  const nextDate = ttDates?.find((d) => {
    return DateTime.fromFormat(d.date, 'dd.MM.yy').diffNow().toMillis() > 0 || true;
  });
  const playerObjects = nextDate?.availablePlayers.map((player) => {
    return {name: player, ttr: 0, qttr: 0};
  });
  const allies:Team[] = [];
  const enemies:Team[] = [];
  if (playerObjects) {
    allies.push({
      name: 'TSG Oberkirchberg',
      members: (await getStatisticsForPlayers(loginOpt, playerObjects)).slice(0, 7),
    });
    allies.push({
      name: 'TSG Oberkirchberg II',
      members: (await getStatisticsForPlayers(loginOpt, playerObjects)).slice(7),
    });
  }
  if (nextDate) {
    enemies.push({
      name: nextDate.firstTeam.enemy,
      members: await getEnemyPlayers(loginOpt, nextDate.firstTeam.enemy) || [],
    });
    enemies.push({
      name: nextDate.secondTeam.enemy,
      members: await getEnemyPlayers(loginOpt, nextDate.secondTeam.enemy) || [],
    });
  }
  return {allies: allies, enemies: enemies};
}
