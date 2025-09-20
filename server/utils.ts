import { readFile, writeFile } from 'fs/promises';
import {Config, GoogleConfig} from './types.js';
import { Mutex } from 'async-mutex';
import { DateTime } from 'luxon';
import logger from './logger.js';

export let teamConfigPath = './teamConfig.json';
export const teamLock = new Mutex();
export const googleLock = new Mutex();
export const clubLock = new Mutex();
export let clubConfigPath = './clubs.json';
export let googleConfigPath = './googleConfigs.json';
export let fetchTime = 10000;
if (process.env.NODE_ENV === 'production') {
  teamConfigPath = '/tmp/teamConfig.json';
  clubConfigPath = '/tmp/clubs.json';
  googleConfigPath = '/tmp/googleConfigs.json';
  fetchTime = 300000;
}

let cachedTeamConfig:Config = null;
let lastTimeTeamConfigFetched = DateTime.now();
let cachedGoogleConfigs:Array<GoogleConfig> = null;
let lastTimeGoogleConfigFetched = DateTime.now();
/**
 * 
 */
export async function getTeamConfigLocal():Promise<Config> {
    if (lastTimeTeamConfigFetched.diffNow().milliseconds < fetchTime && cachedTeamConfig !== null)
      return structuredClone(cachedTeamConfig);
    logger.info("Getting team config from local");
    try {
      const raw = (await safeReadFile(teamConfigPath, teamLock)).toString();
      const config:Config = JSON.parse(raw) as Config;
      cachedTeamConfig = config;
      lastTimeTeamConfigFetched = DateTime.now();
      return structuredClone(config);
    } catch(error) {
      console.error("Failed to read file " + teamConfigPath);
    }
    return undefined;
}
/**
 * 
 * @returns 
 */
export async function readClubs():Promise<{name:string, id:string}[]> {
  const raw = (await safeReadFile(clubConfigPath, clubLock)).toString();
  const clubs = JSON.parse(raw);
  return clubs;
}
/**
 * 
 * @returns 
 */
export async function getGoogleConfigsLocal():Promise<GoogleConfig[]> {
  if (lastTimeGoogleConfigFetched.diffNow().milliseconds < fetchTime && cachedGoogleConfigs !== null) {
      return structuredClone(cachedGoogleConfigs);
  }
  logger.debug("Getting local googleConfig");
  try {
    const rawContent = await safeReadFile(googleConfigPath, googleLock);
    const configs = JSON.parse(rawContent) as Array<GoogleConfig>;
    cachedGoogleConfigs = configs;
    lastTimeGoogleConfigFetched = DateTime.now();
    return structuredClone(configs);
  } catch(error) {
    logger.error("Failed to load file: " + googleConfigPath);
  }
  return undefined;
}
/**
 * 
 * @returns 
 */
export async function getGoogleConfig():Promise<GoogleConfig> {
  const configs = await getGoogleConfigsLocal(); 
  return configs?.pop()!;
}
/**
* 
* @param enemies 
*/
export async function writeEnemies(enemies:{enemyId:string, enemyName:string, enemyClubId:string}[][]):Promise<void> {
  const raw = (await safeReadFile(teamConfigPath, teamLock)).toString();
  const config:Config = JSON.parse(raw) as Config;
  for (let i = 0; i < config.teams.length; i++) {
    config.teams[i].enemies = enemies[i];
  }
  await safeWriteFile(teamConfigPath, JSON.stringify(config, null, '\t'), teamLock);
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

export async function safeReadFile(filePath: string, lock: Mutex): Promise<string> {
  return lock.runExclusive(async () => {
    return await readFile(filePath, 'utf-8');
  });
}

export async function safeWriteFile(filePath: string, data: string, lock: Mutex) {
  return lock.runExclusive(async () => {
    await writeFile(filePath, data, 'utf-8');
  });
}
