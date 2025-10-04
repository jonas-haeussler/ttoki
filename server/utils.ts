import {Config, GoogleConfig, Player} from './types.js';
import logger from './logger.js';
import { Firestore } from '@google-cloud/firestore';
import NodeCache from "node-cache";
import { printServiceAccount } from './googleUtils.js';

const updateTime = process.env.NODE_ENV === 'production' ? 3600 : 10;
const cache = new NodeCache({ stdTTL: updateTime });
/**
 * 
 */
export async function getTeamConfig(db: Firestore):Promise<Config | undefined> {
  const cachedTeamConfig = cache.get("teamConfig");
    if (cachedTeamConfig) {
      logger.debug("Returning cached team config");
      return cachedTeamConfig as Config;
    }
    logger.info("Getting team config from firestore");
    try {
      const teamConfig = await getTeamConfigFirebase(db);
      cache.set("teamConfig", teamConfig);
      return teamConfig;
    } catch(error) {
      console.error("Failed to get teamconfig from firestore");
    }
    return undefined;
}
async function getTeamConfigFirebase(db: Firestore):Promise<Config | undefined> {
  
  const configSnapshot = await db.collection("saisons")
    .where("current", "==", true)
    .limit(1)
    .get();
  
  if (configSnapshot.empty) {
    logger.warn("Current config not found");
    return undefined;
  }
  logger.debug("Found current saison in db");
  const config = configSnapshot.docs[0].data();
  const teamSnapshots = await db.collection('myTeams').get();
  if (teamSnapshots.empty) {
    logger.info("Teams not found");
    return undefined;
  }
  logger.debug("Found myTeams in db");
  const teams = teamSnapshots.docs.map(doc => {
    const team = doc.data();
    return team;
  });
  config.teams = teams;
  logger.debug(`Created config: ${JSON.stringify(config)}`);
  return config as Config;
}

export async function getPlayersForTeamsFirebase(db: Firestore, teamIds: string[]):Promise<Player[] | undefined> {
  var promises = teamIds.map(async teamId => { 
    const doc = await db.collection('teams').doc(teamId).get();
    if (doc === undefined || doc.data() === undefined) {
      logger.warn("Team not found");
      return [];
    }
    
    const players = doc.data().players;
    if (players === undefined) {
      logger.warn("Team contains no players");
      return [];
    }
    logger.debug(`Found players for team: ${JSON.stringify(players)}`)
    return players;
  });
  const result = (await Promise.all(promises)).flat();
  logger.debug(`Found players from firestore: ${JSON.stringify(result)}`);
  return result;
}
/**
 * 
 * @returns 
 */
export async function getClubs(db: Firestore):Promise<{name:string, id:string}[]> {
  const cachedClubs = cache.get("clubs");
    if (cachedClubs) {
      logger.debug("Returning cached clubs");
      return cachedClubs as {name:string, id:string}[];
    }
    logger.info("Getting clubs from firestore");
    try {
      const clubs = await getClubsFirebase(db);
      cache.set("clubs", clubs);
      return clubs;
    } catch(error) {
      console.error("Failed to get clubs from firestore");
    }
    return undefined;
}
async function getClubsFirebase(db: Firestore):Promise<{name:string, id:string}[] | undefined> {
  
  const clubsSnapshot = await db.collection("clubs").get();
  
  if (clubsSnapshot.empty) {
    logger.warn("Clubs not found");
    return undefined;
  }
  logger.debug("Found clubs in db");
  const clubs = clubsSnapshot.docs.map(doc => doc.data() as {name:string, id:string})
  return clubs;
}

/**
 * 
 * @returns 
 */
export async function getCurrentGoogleConfig(db: Firestore):Promise<GoogleConfig | undefined> {
  const cachedGoogleConfig = cache.get("googleConfig");
    if (cachedGoogleConfig) {
      logger.debug("Returning cached google config");
      return cachedGoogleConfig as GoogleConfig;
    }
    logger.info("Getting google config from firestore");
    try {
      const googleConfig = await getGoogleConfigFirebase(db);
      cache.set("googleConfig", googleConfig);
      return googleConfig;
    } catch(error) {
      console.error("Failed to get googleConfig from firestore");
    }
    return undefined;
}

async function getGoogleConfigFirebase(db: Firestore):Promise<GoogleConfig | undefined> {
  try {
    await printServiceAccount();
    const configSnapshot = await db.collection("spreadsheets")
    .where("current", "==", true)
    .limit(1)
    .get();
  
    if (configSnapshot.empty) {
      logger.warn("Current spreadsheet config not found");
      return undefined;
    }
    logger.debug("Found current spreadsheet in db");
    const config = configSnapshot.docs[0].data();
    return {...config, spreadSheetId: configSnapshot.docs[0].id} as GoogleConfig;
  } catch(error) {
    logger.error("Failed to load googleConfig from firestore.");
  }
  return undefined;
}
/**
* 
* @param enemies 
*/
// export async function writeEnemies(enemies:{enemyId:string, enemyName:string, enemyClubId:string}[][]):Promise<void> {
//   const raw = (await safeReadFile(teamConfigPath, teamLock)).toString();
//   const config:Config = JSON.parse(raw) as Config;
//   for (let i = 0; i < config.teams.length; i++) {
//     config.teams[i].enemies = enemies[i];
//   }
//   await safeWriteFile(teamConfigPath, JSON.stringify(config, null, '\t'), teamLock);
// }

