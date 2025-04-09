import {readFileSync, writeFileSync, createWriteStream} from 'fs';
import {Config, GoogleConfig} from './types.js';
import {DateTime, Duration} from 'luxon';
import {getGoogleDrive} from './googleUtils.js';

let teamConfigPath = './teamConfig.json';
if (process.env.NODE_ENV === 'production') {
  teamConfigPath = '/tmp/teamConfig.json';
}
var lastGoogleSyncTeams: DateTime = DateTime.fromMillis(0);
/**
 * 
 */
export async function readTeamConfig():Promise<Config> {
  let promiseResolve, promiseReject;
  const result = new Promise<Config>(function(resolve, reject){
    promiseResolve = resolve;
    promiseReject = reject;
  });
  if (-lastGoogleSyncTeams.diffNow().milliseconds > 300000) {
    console.log("Getting team config from drive");
    const drive = await getGoogleDrive();
    const writeStream = createWriteStream(teamConfigPath);
    const raw = await drive.files.get({ fileId: "1ROdQUPNJhPkKdgIL1YbDPn-2O52VXoah", alt: "media" }, {responseType: "stream"});
    
    raw.data.on('end', () => {
      const rawContent = readFileSync(teamConfigPath).toString();
      const configs = JSON.parse(rawContent) as Array<GoogleConfig>;
      promiseResolve(configs);
    });
    raw.data.on('error', err => {
      promiseReject(err);
    })
    raw.data.pipe(writeStream);
    lastGoogleSyncTeams = DateTime.now();
  }
  else {
    console.log("Getting team config from local");
    const raw = readFileSync(teamConfigPath).toString();
    const config:Config = JSON.parse(raw) as Config;
    promiseResolve(config);
  }
  return await result;
}
/**
 * 
 * @returns 
 */
export function readClubs():{name:string, id:string}[] {
  const raw = readFileSync('./clubs.json').toString();
  const clubs = JSON.parse(raw);
  return clubs;
}
/**
* 
* @param enemies 
*/
export function writeEnemies(enemies:{enemyId:string, enemyName:string, enemyClubId:string}[][]) {
  const raw = readFileSync(teamConfigPath).toString();
  const config:Config = JSON.parse(raw) as Config;
  for (let i = 0; i < config.teams.length; i++) {
    config.teams[i].enemies = enemies[i];
  }
  writeFileSync(teamConfigPath, JSON.stringify(config, null, '\t'));
}

/**
 *
 * @param table
 * @returns
 */
export function getPlayersForTeam(table: string[][]):string[] {
  const arr: Array<string> = [];
  for (const entry of table) {
    if (entry.length > 0) {
      const name = entry[1];
      if (name.includes('kampflos')) {
        break;
      }
      arr.push(name);
    }
  }
  return arr;
}
