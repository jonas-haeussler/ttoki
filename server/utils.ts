/* eslint-disable camelcase */

import {google, sheets_v4, drive_v3} from 'googleapis';
import {DateTime, Duration} from 'luxon';
import {Game, Option, TTDates, TTDate, Venue, GoogleConfig} from '../shared/types';
import {v4 as uuid} from 'uuid';
import {readFileSync, writeFileSync} from 'fs';


function getGoogleCredentials():Object | undefined {
  const keysVar = process.env['GOOGLE_CREDENTIALS'];
  if (keysVar) {
    const keys = JSON.parse(keysVar);
    return keys;
  }
}

/**
 * 
 * @returns 
 */
async function getGoogleDrive():Promise<drive_v3.Drive | undefined> {
  const credentials = getGoogleCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: ['https://www.googleapis.com/auth/drive']});
  const client = await auth.getClient();
  const drive:drive_v3.Drive = google.drive({version: 'v3', auth: client});
  return drive;
}

/**
 * Accomplishes the auth process and gets the needed google spreadsheets
 * @return {Promise<sheets_v4.Sheets>} The google spreadsheets
 */
async function getGoogleSheets():Promise<sheets_v4.Sheets> {
  const credentials = getGoogleCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
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
  if (dateIndex !== undefined) {
    return `R[${8 + playerIndex}]C[${2 + dateIndex}]`;
  }
  return `R[${8 + playerIndex}]`;
}

/**
 * 
 * @param config 
 */
export function addNewGoogleConfig(config:GoogleConfig) {
  const raw = readFileSync('./googleConfigs.json').toString();
  const configs = JSON.parse(raw) as Array<GoogleConfig>;
  configs.push(config);
  writeFileSync('./googleConfigs.json', JSON.stringify(configs));
}
/**
 * 
 * @returns 
 */
function getGoogleConfig():GoogleConfig {
  const raw = readFileSync('./googleConfigs.json').toString();
  const configs = JSON.parse(raw) as Array<GoogleConfig>;
  return configs.pop()!;
}

/**
 * 
 * @param sheets 
 * @param ranges 
 * @returns 
 */
async function getRangeData(sheets:sheets_v4.Sheets, ranges:string[]) {
  const googleConfig = getGoogleConfig();
  const data = (await sheets.spreadsheets.values.batchGet({
    spreadsheetId: googleConfig.spreadSheetId,
    ranges: ranges,
  })).data;
  return data.valueRanges;
}
/**
 *
 */
export async function createNewSpreadsheet():Promise<string|undefined> {
  const drive = await getGoogleDrive();
  if (drive) {
    const spreadSheetId = (await drive.files.create({
      requestBody: {
        name: 'Mannschaftsplanung',
        parents: ['1Lt5HFmeRgoNJ1OQGNCvauvtKOf-nF3VZ'],
        mimeType: 'application/vnd.google-apps.spreadsheet',
      },
    })).data.id;
    if (spreadSheetId) {
      return spreadSheetId;
    }
  }
}

/**
 * Gets the players currently available in the Google spreadsheet
 * @return {Promise<string | undefined>} The currently available players
 */
export async function getPlayers():Promise<string[] | undefined> {
  const sheets = await getGoogleSheets();
  const googleConfig = getGoogleConfig();
  try {
    const data = (await sheets.spreadsheets.values.get({
      spreadsheetId: googleConfig.spreadSheetId,
      range: googleConfig.ranges.players,
    })).data;
    if (data.values !== undefined && data.values !== null) {
      const players:string[] = data.values.map((p) => p[0]);
      return players;
    }
  } catch (err) {
    console.error(err);
  }
  return undefined;
}
/**
   * A helper function to get a Date string from day and time strings
   * @param {string} day The day of the date
   * @param {string} time The time of the date at the given day
   * @return {string} An ISO representation of the date
   */
export function parseDate(day:string, time?:string) : string {
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
 * Get a TTDates object from Google Spreadsheets for the given active players
 * @param {Array<string>} activePlayers The active players in the React App
 * @return {Promise<TTDate |undefined>} The result of the query
 */
export async function getDates(activePlayers:string[]):Promise<TTDates|undefined> {
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
    if (matches.every((elem) => elem[dateIndex] !== undefined && elem[dateIndex] !== '')) {
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
  const googleConfig = getGoogleConfig();
  const ranges = [
    googleConfig.ranges.dates,
    googleConfig.ranges.gamesFirstTeam,
    googleConfig.ranges.gamesSecondTeam,
    googleConfig.ranges.players,
    googleConfig.ranges.entries,
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
      if (activePlayers && activePlayers.length > 0 && entries && entries.length > 0) {
        const activePlayerIndex = allPlayers.indexOf(activePlayers[0]);
        if (entries.length > activePlayerIndex && entries[activePlayerIndex].length > i) {
          option = entries[activePlayerIndex][i].toLowerCase() as Option;
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
      }
      if (!(Object.values(Option).some((v) => v === option))) {
        option = Option.Dunno;
      }
      const availablePlayers:string[] = [];
      for (let j = 0; j < allPlayers.length; j++) {
        if (entries.length > j && entries[j].length > i && entries[j][i] === Option.Yes) {
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
export async function postPlayer(ttDate:TTDate):Promise<string> {
  const sheets:sheets_v4.Sheets = await getGoogleSheets();
  const googleConfig = getGoogleConfig();
  try {
    const values =[[ttDate.option]];
    const dates = await getDates(ttDate.activePlayers);
    let players:string[] = [];
    if (dates) {
      players = dates.allPlayers;
    }
    if (dates && players) {
      const playerRanges = ttDate.activePlayers.map((player) => {
        const dateObj = dates?.ttDates.find((date) => date.date === ttDate.date);
        if (dateObj) {
          return getPlayerRange(players?.indexOf(player),
              dates?.ttDates.indexOf(dateObj));
        }
      });
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: googleConfig.spreadSheetId,
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

/**
 * 
 * @param dates 
 * @param gamesFirstTeam 
 * @param gamesSecondTeam 
 * @param players 
 */
export async function postTable(dates:string[][],
    gamesFirstTeam:string[][],
    gamesSecondTeam:string[][],
    players:string[][]) {
  const sheets:sheets_v4.Sheets = await getGoogleSheets();
  const googleConfig:GoogleConfig = getGoogleConfig();
  try {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: googleConfig.spreadSheetId,
      requestBody: {

        data: [
          {range: googleConfig.ranges.dates, values: dates},
          {range: googleConfig.ranges.gamesFirstTeam, values: gamesFirstTeam},
          {range: googleConfig.ranges.gamesSecondTeam, values: gamesSecondTeam},
          {range: googleConfig.ranges.players, values: players},
        ],
        valueInputOption: 'RAW',
      },
    },
    );
  } catch (e) {
    console.error(e);
  }
}
