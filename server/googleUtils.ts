/* eslint-disable camelcase */
import {google, sheets_v4, drive_v3} from 'googleapis';
import { JWT, OAuth2Client } from "google-auth-library";
import {DateTime, Duration} from 'luxon';
import {Game, Option, TTDates, TTDate, Venue, GoogleConfig} from './types.js';
import {v4 as uuid} from 'uuid';
import logger from './logger.js';
import { getCurrentGoogleConfig } from './utils.js';
import { Firestore } from '@google-cloud/firestore';


export async function printServiceAccount() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  // Get the client (OAuth2Client or JWT)
  const client = await auth.getClient();

  // Get the access token
  const tokenInfo = await client.getAccessToken();
  logger.info('Using Access token:', tokenInfo?.token);
  
  // Print client type
  logger.info('Client constructor:', client.constructor.name);
}
/**
 * 
 * @returns 
 */
export async function getGoogleDrive():Promise<drive_v3.Drive | undefined> {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive']
  });
  const client = (await auth.getClient());
  logger.debug("Access token info for google drive:", await auth.getAccessToken());
  const drive:drive_v3.Drive = google.drive({version: 'v3', auth: auth});
  return drive;
}

/**
 * Accomplishes the auth process and gets the needed google spreadsheets
 * @return {Promise<sheets_v4.Sheets>} The google spreadsheets
 */
async function getGoogleSheets():Promise<sheets_v4.Sheets> {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'] 
   });
  const sheets:sheets_v4.Sheets = google.sheets({version: 'v4', auth: auth});
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
async function getRangeData(db: Firestore, sheets:sheets_v4.Sheets, ranges:string[]) {
  const googleConfig = await getCurrentGoogleConfig(db);
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
 * @return {Promise<{team:string, name:string, nickName:string}[] | undefined>}
 * The currently available players
 */
export async function getAllPlayers(db: Firestore):
Promise<{team:string, name:string, nickName:string}[] | undefined> {
  const sheets = await getGoogleSheets();
  const googleConfig = await getCurrentGoogleConfig(db);
  if (googleConfig === undefined)
    return undefined;
  try {
    const data = (await sheets.spreadsheets.values.get({
      spreadsheetId: googleConfig.spreadSheetId,
      range: googleConfig.ranges.players,
    })).data;
    if (data.values !== undefined && data.values !== null) {
      const players:{team:string, name:string, nickName:string}[] = data.values.map((p) => {
        return {team: p[0], name: p[1], nickName: p[2]};
      });
      return players;
    }
  } catch (err) {
    logger.error(err);
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
  const date:DateTime = DateTime.fromFormat(day, 'dd.MM.yy').setZone('Europe/Paris');
  if (time) {
    const parsed:DateTime = DateTime.fromISO(time).setZone('Europe/Paris');
    const today:DateTime = DateTime.now().startOf('day').setZone('Europe/Paris');
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
export async function getDates(db: Firestore, activePlayers:string[]):Promise<TTDates|undefined> {
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
  const googleConfig = await getCurrentGoogleConfig(db);
  if (googleConfig === undefined)
    return undefined;
  const ranges = [
    googleConfig.ranges.dates,
    googleConfig.ranges.gamesFirstTeam,
    googleConfig.ranges.gamesSecondTeam,
    googleConfig.ranges.players,
    googleConfig.ranges.entries,
  ];
  const data = await getRangeData(db, sheets, ranges);
  if (data !== undefined) {
    let dates:string[] = [];
    let matchesFirstTeam:string[][] = [];
    let matchesSecondTeam:string[][] = [];
    let allPlayers:{team:string, name:string, nickName:string}[] = [];
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
      allPlayers = data[3].values.map((p) => {
        return {team: p[0], name: p[1], nickName: p[2]};
      });
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
        const activePlayerIndex = allPlayers.map((player) => player.name).indexOf(activePlayers[0]);
        if (entries.length > activePlayerIndex && entries[activePlayerIndex].length > i) {
          option = entries[activePlayerIndex][i].toLowerCase() as Option;
          if (activePlayers.length > 1) {
            option = activePlayers.map(
                (activePlayer) => {
                  let entry = entries[allPlayers.map((player) => player.name)
                      .indexOf(activePlayer)][i];
                  if (entry === undefined) return '';
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
      const availablePlayers:{team:string, name:string, nickName:string}[] = [];
      for (let j = 0; j < allPlayers.length; j++) {
        if (entries.length > j && entries[j].length > i) {
          const player = {team: allPlayers[j].team,
            name: allPlayers[j].name,
            nickName: allPlayers[j].nickName,
            option: entries[j][i]};
          availablePlayers.push(player);
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
export async function postPlayer(db: Firestore, ttDate:TTDate):Promise<string> {
  const sheets:sheets_v4.Sheets = await getGoogleSheets();
  const googleConfig = await getCurrentGoogleConfig(db);
  logger.debug("Start to post player");
  try {
    const values =[[ttDate.option]];
    const dates = await getDates(db, ttDate.activePlayers);
    let players:string[] = [];
    if (dates) {
      players = dates.allPlayers.map((player) => player.name);
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
export async function postTable(
    googleConfig: GoogleConfig,
    dates:string[][],
    gamesFirstTeam:string[][],
    gamesSecondTeam:string[][],
    players:string[][]) {
  const sheets:sheets_v4.Sheets = await getGoogleSheets();
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
