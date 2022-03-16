import {Config, Game, Tables, TTDate, TTDates, Venue} from '../shared/types';
import fetch, {Response, RequestInit} from 'node-fetch';
import parse, {HTMLElement, NodeType} from 'node-html-parser';
import {addNewGoogleConfig, createNewSpreadsheet, postTable} from './utils';
import { DateTime } from 'luxon';
import {v4 as uuid} from 'uuid';
import { readFileSync } from 'fs';

/**
 * Parse html tables to get a javascript representation
 * @param {Response} html The html snippet to parse the tables from
 * @return {Array<Array<string>>} The table in an array representation
 */
function getTablesFromHTML(html: string):Tables {
  function parseTable(rows: HTMLElement[]):string[][] {
    const rowData = [];
    for (const row of rows) {
      if(row.classList.contains('divider-muted')) {
        break;
      }
      if(!row.classList.contains('collapse')) {
        const entries = row.getElementsByTagName('td')
            .map((el) => {
              // el.childNodes.forEach(node => el.removeChild(node));
              return el.innerText.replace(/\n/g, '')
            });
        rowData.push(entries);
      }
    }
    console.log(rowData);
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
 * Extract all information about matches from a table representation
 * @param {Array<Array<string>>} table The table to get the matches from
 * @return {{date, Array<Game>}} A TTDates representation of dates parsed from tables
 */
function getGamesForTeam(table: string[][]):{date:string, game:Game}[] {
  const arr = [];
  for (const entry of table) {
    if (entry.length > 0) {
      const date = entry[0];
      const time = entry[1].split(' ')[0];
      const venue = entry[3].includes('Oberkirchberg') ?
        Venue.Home : Venue.Abroad;
      const enemy = venue === Venue.Home ? entry[4] : entry[3];
      const game:Game = {
        time: time,
        enemy: enemy,
        venue: venue,
      };
      arr.push({date: date.split(' ')[1], game: game});
    }
  }
  return arr;
}
function getPlayersForTeam(table: string[][]):string[] {
  const arr = [];
  for (const entry of table) {
    if (entry.length > 0) {
      const name = entry[1];
      arr.push(name);
    }
  }
  return arr;
}


/**
 * Login for mytischtennis
 * @return {RequestInit} options for a get Request with the login cookie
 */
async function login(): Promise<RequestInit> {
  const formData:URLSearchParams = new URLSearchParams();
  formData.append('userNameB', '--Johnny--');
  formData.append('userPassWordB', 'fraudech1');
  formData.append('targetPage', 'https://www.mytischtennis.de/community/index?fromlogin=1');
  formData.append('goLogin', 'Einloggen');
  const options:RequestInit = {
    method: 'POST',
    redirect: 'manual',
    body: formData,
  };


  const login:Response = await fetch('https://www.mytischtennis.de/community/login', options);
  const cookies = login.headers.get('Set-Cookie');
  if (cookies == null) {
    throw Error('Did not get a valid login cookie');
  } else {
    const opt:RequestInit = {
      method: 'GET',
      headers: {
        'Cookie': cookies,
      },
      redirect: 'manual',
    };
    return opt;
  }
}

function getDateRange(dateIndex:number):string {
  return `R[1-3]C[${3 + dateIndex}]`;
}

/**
 * Load the table tennis matches from mytischtennis
 */
async function loadMatches():Promise<TTDates> {
  const opt = await login();
  const raw = readFileSync('./teamConfig.json').toString();
  const config:Config = JSON.parse(raw) as Config;
  const team1 = await fetch('https://www.mytischtennis.de/clicktt/TTBW/'+
                    config['saison']+
                    '/ligen/'+
                    config['teams'][0]['league']+
                    '/gruppe/'+
                    config['teams'][0]['groupId']+
                    '/mannschaft/'+
                    config['teams'][0]['teamId']+
                    '/TSG-Oberkirchberg/spielerbilanzen/'+
                    config['round']+
                    '/', opt);
  const team2 = await fetch('https://www.mytischtennis.de/clicktt/TTBW/'+
                    config['saison']+
                    '/ligen/'+
                    config['teams'][1]['league']+
                    '/gruppe/'+
                    config['teams'][1]['groupId']+
                    '/mannschaft/'+
                    config['teams'][1]['teamId']+
                    '/Herren%20II/spielerbilanzen/'+
                    config['round']+
                    '/', opt);
  const tablesFirstTeam = getTablesFromHTML(await team1.text());
  const tablesSecondTeam = getTablesFromHTML(await team2.text());
  const gamesFirstTeam = getGamesForTeam(tablesFirstTeam.playingPlanDesktop)[Symbol.iterator]();
  const gamesSecondTeam = getGamesForTeam(tablesSecondTeam.playingPlanDesktop)[Symbol.iterator]();
  const playersFirstTeam = getPlayersForTeam(tablesFirstTeam.gamestatsTable);
  const playersSecondTeam = getPlayersForTeam(tablesSecondTeam.gamestatsTable);
  let gameFirstTeam = gamesFirstTeam.next();
  let gameSecondTeam = gamesSecondTeam.next();
  const entries:TTDate[] = [];
  while (true) {
    if (gameFirstTeam.done && gameSecondTeam.done) break;
    let firstDate = DateTime.now();
    let secondDate = DateTime.now();
    if (gameFirstTeam.value)
      firstDate = DateTime.fromFormat(gameFirstTeam.value.date, 'dd.MM.yy');
    if (gameSecondTeam.value)
      secondDate = DateTime.fromFormat(gameSecondTeam.value.date, 'dd.MM.yy')
    const entry:Record<string, any> = {
      id: uuid(),
      activePlayers: [],
      availablePlayers: [],
    }
    if (firstDate.startOf('day') <= secondDate.startOf('day')) {
      entry.date = firstDate.toFormat('dd.MM.yy');
      entry.firstTeam = gameFirstTeam.value.game;
      gameFirstTeam = gamesFirstTeam.next();
    }
    if (firstDate.startOf('day') >= secondDate.startOf('day')) {
      entry.date = secondDate.toFormat('dd.MM.yy');
      entry.secondTeam = gameSecondTeam.value.game;
      gameSecondTeam = gamesSecondTeam.next();
    }
    entries.push(entry as TTDate);
  }
  return {ttDates: entries, allPlayers: playersFirstTeam.concat(playersSecondTeam)};
}
async function initTable() {
  const ttDates:TTDates = await loadMatches();
  const spreadSheetId = await createNewSpreadsheet();
  if (spreadSheetId) {
    addNewGoogleConfig({
      spreadSheetId: spreadSheetId,
      ranges: {
        meta: "Sheet1!A1:B7",
        players:"Sheet1!B9:B",
        dates: "Sheet1!C1:1",
        gamesFirstTeam: "Sheet1!C2:Z4",
        gamesSecondTeam: "Sheet1!C5:Z7",
        entries: "Sheet1!C9:ZZZ"
      }
    })
    const dateValues = [];
    const firstTeamEnemies = [];
    const firstTeamTimes = [];
    const firstTeamVenues = [];
    const secondTeamEnemies = [];
    const secondTeamTimes = [];
    const secondTeamVenues = [];
    console.log(ttDates.ttDates);
    for (const ttDate of ttDates.ttDates) {
      dateValues.push(ttDate.date);
      firstTeamEnemies.push(ttDate.firstTeam?.enemy ? ttDate.firstTeam.enemy : '');
      let venue = (ttDate.firstTeam?.venue === Venue.Home ? 'Heim':'Auswärts');
      firstTeamVenues.push(ttDate.firstTeam?.venue !== undefined ? venue : '');
      firstTeamTimes.push(ttDate.firstTeam?.time ? ttDate.firstTeam.time : '');
      secondTeamEnemies.push(ttDate.secondTeam?.enemy ? ttDate.secondTeam.enemy : '');
      venue = ttDate.secondTeam?.venue === Venue.Home ? 'Heim':'Auswärts';
      secondTeamVenues.push(ttDate.secondTeam?.venue !== undefined ? venue : '');
      secondTeamTimes.push(ttDate.secondTeam?.time ? ttDate.secondTeam.time  : '');
    }
    console.log(ttDates.allPlayers);
    for(let i = 0; i < ttDates.allPlayers.length; i++) {
      const currentPlayer = ttDates.allPlayers[i];
      if(ttDates.allPlayers.slice(i + 1).includes(currentPlayer)) {
        ttDates.allPlayers.splice(i, 1);
        i--;
      }
    }
    postTable([dateValues],
      [firstTeamEnemies, firstTeamVenues, firstTeamTimes],
      [secondTeamEnemies, secondTeamVenues, secondTeamTimes],
      ttDates.allPlayers.map((player) => {
        const result = player.split(', ');
        return [result[1] + ' ' + result[0]];
      }));
  }
}
initTable();
