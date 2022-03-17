import FormData = require('form-data');
import {readFileSync, writeFileSync} from 'fs';
import fetch, {RequestInit, Response} from 'node-fetch';
import parse, {HTMLElement} from 'node-html-parser';
import {Config, Player, Tables} from '../shared/types';
import {getPlayers} from './googleUtils';

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
 */
export async function fetchTeams():Promise<Response[]> {
  const raw = readFileSync('./teamConfig.json').toString();
  const config:Config = JSON.parse(raw) as Config;
  const team1 = await fetch('https://www.mytischtennis.de/clicktt/TTBW/'+
                    config.saison+
                    '/ligen/'+
                    config.teams[0].league+
                    '/gruppe/'+
                    config.teams[0].groupId+
                    '/mannschaft/'+
                    config.teams[0].teamId+
                    '/TSG-Oberkirchberg/spielerbilanzen/'+
                    config.round+
                    '/');
  const team2 = await fetch('https://www.mytischtennis.de/clicktt/TTBW/'+
                    config.saison+
                    '/ligen/'+
                    config.teams[1].league+
                    '/gruppe/'+
                    config.teams[1].groupId+
                    '/mannschaft/'+
                    config.teams[1].teamId+
                    '/Herren%20II/spielerbilanzen/'+
                    config.round+
                    '/');
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
function getTTRForPlayers(players:{playerName:string, ttr:number, qttr:number}[],
    html:string, quartal:boolean):{playerName:string, ttr:number, qttr:number}[] {
  const root = parse(html);
  const th = root.querySelectorAll('.table-mytt > thead > tr > th');
  const ttrIndex = th.indexOf(th.find((el) => el.innerHTML.includes('TTR')) || th[0]);
  const table = root.querySelectorAll('.table-mytt > tbody').find((el) => el.childNodes.length > 0);
  const rows = table?.querySelectorAll('tr').filter((el) => {
    return players.some((player) => el.rawText.includes(player.playerName));
  });
  for (let i = 0; i < players.length; i++) {
    const row = rows?.find((r) => r.rawText.includes(players[i].playerName));
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
 * @param ttrs 
 */
async function getPlayerStats(ttrs:{playerName:string,
  ttr:number,
  qttr:number}[]):Promise<Player[]> {
  const teams = await fetchTeams();
  const tablesFirstTeam = getTablesFromHTML(await teams[0].text());
  const tablesSecondTeam = getTablesFromHTML(await teams[1].text());
  const players:Player[] = [];
  for (const player of ttrs) {
    let team:1 | 2 = 1;
    let position = 0;
    let actions = 0;
    let wins = 0;
    let loses = 0;
    let row = tablesFirstTeam.gamestatsTable.find((el) => {
      const names = player.playerName.split(' ');
      const playerNameMod = `${names[1]}, ${names[0]}`;
      return el[1].includes(playerNameMod);
    });
    if (row) {
      const temp = parseInt(row[0].split('.')[0]);
      team = temp === 1 || temp === 2 ? temp : 1;
      position = parseInt(row[0].split('.')[1]);
      actions += parseInt(row[2]);
      const balance = row[9];
      wins += parseInt(balance.split(':')[0]);
      loses += parseInt(balance.split(':')[1]);
    }
    row = tablesSecondTeam.gamestatsTable.find((el) => {
      const names = player.playerName.split(' ');
      const playerNameMod = `${names[1]}, ${names[0]}`;
      return el[1].includes(playerNameMod);
    });
    if (row) {
      const temp = parseInt(row[0].split('.')[0]);
      team = temp === 1 || temp === 2 ? temp : 1;
      position = parseInt(row[0].split('.')[1]);
      actions += parseInt(row[2]);
      const balance = row[9];
      wins += parseInt(balance.split(':')[0]);
      loses += parseInt(balance.split(':')[1]);
    }
    players.push({
      team: team,
      position: position,
      name: player.playerName,
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
 */
export async function getMyTTOkiTeamData(loginOpt:RequestInit):Promise<Player[]> {
  const players = await getPlayers();
  if (players === undefined) return [];
  const raw = readFileSync('./teamConfig.json').toString();
  const config = JSON.parse(raw) as Config;
  let playerObjects = players.map((player) => {
    return {playerName: player, ttr: 0, qttr: 0};
  });
  let html = await fetch(`https://www.mytischtennis.de/community/ajax/_rankingList?vereinid=${config.vereinId},TTBW`, loginOpt);
  playerObjects = getTTRForPlayers(playerObjects, await html.text(), false);
  html = await fetch(`https://www.mytischtennis.de/community/ajax/_rankingList?vereinid=${config.vereinId},TTBW&ttrQuartalorAktuell=quartal`, loginOpt);
  playerObjects = getTTRForPlayers(playerObjects, await html.text(), true);
  return await getPlayerStats(playerObjects);
}
