import {readFileSync, writeFileSync} from 'fs';
import {Config} from '../shared/types';

/**
 * 
 */
export function readTeamConfig():Config {
  const raw = readFileSync('./teamConfig.json').toString();
  const config:Config = JSON.parse(raw) as Config;
  return config;
}
/**
* 
* @param enemies 
*/
export function writeEnemies(enemies:{enemyId:string, enemyName:string}[][]) {
  const raw = readFileSync('./teamConfig.json').toString();
  const config:Config = JSON.parse(raw) as Config;
  for (let i = 0; i < config.teams.length; i++) {
    config.teams[i].enemies = enemies[i];
  }
  writeFileSync('./teamConfig.json', JSON.stringify(config));
}

/**
 *
 * @param table
 * @returns
 */
export function getPlayersForTeam(table: string[][]):string[] {
  const arr = [];
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
