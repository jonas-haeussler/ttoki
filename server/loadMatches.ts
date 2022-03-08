import {Config, Game, TTDate, TTDates, Venue} from '../shared/types';
import fetch, {Response, RequestInit} from 'node-fetch';
import parse from 'node-html-parser';

const configFile = require('../teamConfig.json');
/**
 * Parse html tables to get a javascript representation
 * @param {Response} html The html snippet to parse the tables from
 * @return {Array<Array<string>>} The table in an array representation
 */
function getTableFromHTML(html: string):string[][] {
  const root = parse(html);
  const table = root.getElementsByTagName('table')
      .find((el) => el.id === 'playingPlanDesktop');
  if (table) {
    const rows = table.getElementsByTagName('tr');
    const rowData = [];
    for (const row of rows) {
      const entries = row.getElementsByTagName('td')
          .map((el) => el.innerText.replace(/\n/g, ''));
      rowData.push(entries);
    }
    return rowData;
  } else {
    throw Error('Table \"playingPlanDesktop\" not found');
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
      const time = entry[1];
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

/**
 * Load the table tennis matches from mytischtennis
 */
export async function loadMatches() {
  const opt = await login();
  const config:Config = configFile as Config;
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
  const tablesFirstTeam = getTableFromHTML(await team1.text());
  const tablesSecondTeam = getTableFromHTML(await team2.text());
  const gamesFirstTeam = getGamesForTeam(tablesFirstTeam);
  const gamesSecondTeam = getGamesForTeam(tablesSecondTeam);
  const dates = [];
  // TODO: load data from google spreadsheet and
  // compare it with mytischtennis data
  for (let i = 0; i < gamesFirstTeam.length; i++) {
    dates.push(gamesFirstTeam[i].date);
  }
  for (let i = 0; i < matchesSecondTeam.length; i++) {
    if (dates.indexOf(matchesSecondTeam[i].date) == -1) {
      dates.push(matchesSecondTeam[i].date);
    }
  }
  dates.sort(TTOkiUtils.compareDates);

  playersFirstTeam = TTOkiUtils.getPlayersForTeam(tablesFirstTeam);
  playersSecondTeam = TTOkiUtils.getPlayersForTeam(tablesSecondTeam);


  url = 'https://docs.google.com/spreadsheets/d/14kbJabtKo82l7OOnEiKN-YP5Y56jjj15etDrje-aeG0/edit?usp=sharing';
  ss = SpreadsheetApp.openByUrl(url);
  ws = ss.getSheetByName('Mannschaften');
  range = ws.getRange(1, 3, 3, dates.length + 1);
  range.setNumberFormat('@STRING@');

  for (i = 0; i < dates.length; i++) {
    range.getCell(1, 1 + i).setValue(dates[i]);
    for (j = 0; j < matchesFirstTeam.length; j++) {
      if (matchesFirstTeam[j].date == dates[i]) {
        range.getCell(2, 1 + i).setValue(matchesFirstTeam[j].toString());
      }
    }
    for (j = 0; j < matchesSecondTeam.length; j++) {
      if (matchesSecondTeam[j].date == dates[i]) {
        range.getCell(3, 1 + i).setValue(matchesSecondTeam[j].toString());
      }
    }
  }
}
