/* eslint-disable camelcase */
import {DateTime, Duration} from 'luxon';

import * as express from 'express';
import {Request, Response} from 'express';

import * as bodyParser from 'body-parser';

// eslint-disable-next-line camelcase
import {google, sheets_v4} from 'googleapis';
import {Game, Option, TTDates, TTDate, Venue} from '../shared/types';
import {v4 as uuid} from 'uuid';

import {loadMatches} from './loadMatches';

const PORT = process.env.PORT || 3001;

// @ts-ignore
const app = express();

const SPREADSHEET_ID = '1z5bmcFTl3qiLwJBybcH-nuDdpw7UluJw-c3fhMqVeWY';

const PLAYER_RANGE = 'Hauptseite!B9:B';

const DATES_RANGE = 'Hauptseite!C1:1';
const FIRST_TEAM_DATA_RANGE = 'Hauptseite!C2:Z4';
const SECOND_TEAM_DATA_RANGE = 'Hauptseite!C5:Z7';
const ALL_ENTRIES_RANGE = 'Hauptseite!C9:ZZZ';


/**
 * Accomplishes the auth process and gets the needed google spreadsheets
 * @return {Promise<sheets_v4.Sheets>} The google spreadsheets
 */
async function getGoogleSheets():Promise<sheets_v4.Sheets> {
  const auth = new google.auth.GoogleAuth({
    keyFile: './server/lithe-paratext-282507-55e107b033a1.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']});
  const client = await auth.getClient();
  const sheets:sheets_v4.Sheets = google.sheets({version: 'v4', auth: client});
  return sheets;
}
/**
 * 
 * @param playerIndex 
 * @param dateIndex 
 * @return 
 */
function getPlayerRange(playerIndex:number, dateIndex:number):string {
  if (dateIndex) {
    return `R[${8 + playerIndex}]C[${3 + dateIndex}]`;
  }
  return `R[${8 + playerIndex}]`;
}

/**
 * 
 * @param sheets 
 * @param ranges 
 * @returns 
 */
async function getRangeData(sheets:sheets_v4.Sheets, ranges:string[]) {
  const data = (await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SPREADSHEET_ID,
    ranges: ranges,
  })).data;
  return data.valueRanges;
}

/**
 * Gets the players currently available in the Google spreadsheet
 * @return {Promise<strin | undefined>} The currently available players
 */
async function getPlayers():Promise<string[] | undefined> {
  const sheets:sheets_v4.Sheets = await getGoogleSheets();
  try {
    const data = (await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: PLAYER_RANGE,
    })).data;
    if (data.values !== undefined && data.values !== null) {
      const players:string[] = data.values.map(p => p[0]);
      return players;
    }
  } catch (err) {
    console.error(err);
  }
  return undefined;
}

/**
 * Get a TTDates object from Google Spreadsheets for the given active players
 * @param {Array<string>} activePlayers The active players in the React App
 * @return {Promise<TTDate |undefined>} The result of the query
 */
async function getDates(activePlayers:string[]):Promise<TTDates | undefined> {
  /**
   * A helper function to get a Date string from day and time strings
   * @param {string} day The day of the date
   * @param {string} time The time of the date at the given day
   * @return {string} An ISO representation of the date
   */
  function parseDate(day:string, time?:string) : string {
    const date:DateTime = DateTime.fromFormat(day, 'dd.MM.yy');
    if (time) {
      const parsed:DateTime = DateTime.fromISO(time);
      const today:DateTime = DateTime.now().startOf('day');
      const timeOfDay:Duration = parsed.diff(today);
      const result:DateTime = date.startOf('day').plus(timeOfDay);
      return result.toISO();
    }
    return date.toISO();
  }
  /**
   * 
   * @param matches 
   * @param dateIndex 
   * @param dates 
   * @returns 
   */
  function getGame(matches:string[][],
      dateIndex:number,
      dates:string[]): Game | null {
    if (matches.every((elem) => elem[dateIndex] !== undefined &&
      elem[dateIndex] !== '')) {
      const date:string = parseDate(dates[dateIndex], matches[2][dateIndex]);
      return {
        time: date,
        enemy: matches[0][dateIndex],
        venue: matches[1][dateIndex] === 'Heim'? Venue.Home : Venue.Abroad,
      };
    }
    return null;
  }

  // eslint-disable-next-line camelcase
  const sheets:sheets_v4.Sheets = await getGoogleSheets();
  const ranges = [
    DATES_RANGE,
    FIRST_TEAM_DATA_RANGE,
    SECOND_TEAM_DATA_RANGE,
    PLAYER_RANGE,
    ALL_ENTRIES_RANGE,
  ];
  const data = await getRangeData(sheets, ranges);
  if (data !== undefined) {
    let dates:string[] = [];
    let matchesFirstTeam:string[][] = [];
    let matchesSecondTeam:string[][] = [];
    let allPlayers:string[] = [];
    let entries:string[][] = [];
    if (data[0].values !== undefined && data[0].values !== null) {
      dates = data[0].values[0];
    }
    if (data[1].values !== undefined && data[1].values !== null) {
      matchesFirstTeam = data[1].values;
    }
    if (data[2].values !== undefined && data[2].values !== null) {
      matchesSecondTeam = data[2].values;
    }
    if (data[3].values !== undefined && data[3].values !== null) {
      allPlayers = data[3].values.map((p) => p[0]);
    }
    if (data[4].values !== undefined && data[4].values !== null) {
      entries = data[4].values;
    }

    const ttDates:TTDate[] = [];
    for (let i = 0; i < dates.length; i++) {
      const firstTeam:Game | null = getGame(matchesFirstTeam, i, dates);
      const secondTeam:Game | null = getGame(matchesSecondTeam, i, dates);
      let option:Option = Option.Dunno;
      if (activePlayers && activePlayers.length > 0) {
        option = entries[
            allPlayers.indexOf(activePlayers[0])][i].toLowerCase() as Option;
        if (activePlayers.length > 1) {
          option = activePlayers.map(
              (activePlayer) => {
                let entry = entries[allPlayers.indexOf(activePlayer)][i];
                entry = entry.toLowerCase();
                return entry;
              }).reduce(
              (prev, curr) =>
              prev === curr ? curr : Option.Dunno) as Option;
        }
      }
      if (!(Object.values(Option).some((v) => v === option))) {
        option = Option.Dunno;
      }
      const availablePlayers:string[] = [];
      for (let j = 0; j < allPlayers.length; j++) {
        if (entries[j][i] === Option.Yes) {
          availablePlayers.push(allPlayers[j]);
        }
      }
      const ttDate:Record<string, any> = {
        id: uuid(),
        date: parseDate(dates[i]),
        activePlayers: activePlayers,
        availablePlayers: availablePlayers,
        option: option,
      };
      if (firstTeam) {
        ttDate.firstTeam = firstTeam;
      }
      if (secondTeam) {
        ttDate.secondTeam = secondTeam;
      }
      ttDates.push(ttDate as TTDate);
    }
    return {ttDates: ttDates, allPlayers: allPlayers};
  }
  return undefined;
}
/**
 * 
 * @param ttDate 
 * @returns 
 */
async function postPlayer(ttDate:TTDate):Promise<string> {
  // eslint-disable-next-line camelcase
  const sheets:sheets_v4.Sheets = await getGoogleSheets();
  try {
    const values =[[ttDate.option]];
    const dates = await getDates(ttDate.activePlayers);
    let players:string[] = [];
    if (dates) {
      players = dates.allPlayers;
    }
    if (dates && players) {
      const playerRanges = ttDate.activePlayers.map((player) => {
        return getPlayerRange(players?.indexOf(player),
            dates?.ttDates.indexOf(ttDate));
      });
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          data: playerRanges.map((range) => ({range: range, values: values})),
          valueInputOption: 'RAW',
        },
      });
    }
  } catch (err) {
    console.error(err);
  }
  return 'Success';
}

loadMatches();
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

app.get('/players', async (req:Request, res:Response) => {
  const players = await getPlayers();
  res.json(players);
});
app.get('/dates', async (req:Request, res:Response) => {
  const filters = req.query.filters;
  if (filters) {
    const activePlayers:string[] = JSON.parse(filters.toString());
    const dates = (await getDates(activePlayers))?.ttDates;
    res.json(dates);
    console.log(dates);
  }
});
app.post('/player', bodyParser.json(), async (req:Request, res:Response) => {
  const date:TTDate = req.body as TTDate;
  console.log(date);
  const answer = await postPlayer(date);
  console.log(answer);
});
