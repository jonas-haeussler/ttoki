import {Game, TTDate, TTDates, Venue} from './types.js';
import {addNewGoogleConfig, createNewSpreadsheet, postTable} from './googleUtils.js';
import {DateTime} from 'luxon';
import {v4 as uuid} from 'uuid';
import {fetchTeams, getTablesFromHTML} from './myTTUtils.js';
import parse from 'node-html-parser';
import {getPlayersForTeam, readClubs, readTeamConfig, writeEnemies} from './utils.js';
import fetch from 'node-fetch';


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

/**
 * 
 * @param dateIndex 
 * @returns
 */
function getDateRange(dateIndex:number):string {
  return `R[1-3]C[${3 + dateIndex}]`;
}

/**
 * Load the table tennis matches from mytischtennis
 */
async function loadMatches():Promise<TTDates> {
  const teams = await fetchTeams();
  const tablesFirstTeam = getTablesFromHTML(await teams[0].text());
  const tablesSecondTeam = getTablesFromHTML(await teams[1].text());
  const gamesFirstTeam = getGamesForTeam(tablesFirstTeam.playingPlanDesktop)[Symbol.iterator]();
  const gamesSecondTeam = getGamesForTeam(tablesSecondTeam.playingPlanDesktop)[Symbol.iterator]();
  const playersFirstTeam = getPlayersForTeam(tablesFirstTeam.gamestatsTable);
  const playersSecondTeam = getPlayersForTeam(tablesSecondTeam.gamestatsTable);
  
  let gameFirstTeam = gamesFirstTeam.next();
  let gameSecondTeam = gamesSecondTeam.next();
  const entries:TTDate[] = [];
  while (true) {
    if (gameFirstTeam.done && gameSecondTeam.done) break;
    let firstDate = DateTime.now().setZone('Europe/Paris');
    let secondDate = DateTime.now().setZone('Europe/Paris');
    if (gameFirstTeam.value) {
      firstDate = DateTime.fromFormat(gameFirstTeam.value.date, 'dd.MM.yy', {zone: 'Europe/Paris'});
    }
    if (gameSecondTeam.value) {
      secondDate = DateTime.fromFormat(gameSecondTeam.value.date, 'dd.MM.yy', {zone: 'Europe/Paris'});
    }
    const entry:Record<string, any> = {
      id: uuid(),
      activePlayers: [],
      availablePlayers: [],
    };
    if (gameFirstTeam.value &&
       (!gameSecondTeam.value || firstDate.startOf('day') <= secondDate.startOf('day'))) {
      entry.date = firstDate.toFormat('dd.MM.yy');
      entry.firstTeam = gameFirstTeam.value.game;
      gameFirstTeam = gamesFirstTeam.next();
    }
    if (gameSecondTeam.value && 
      (!gameFirstTeam.value || firstDate.startOf('day') >= secondDate.startOf('day'))) {
      entry.date = secondDate.toFormat('dd.MM.yy');
      entry.secondTeam = gameSecondTeam.value.game;
      gameSecondTeam = gamesSecondTeam.next();
    }
    entries.push(entry as TTDate);
  }
  const allPlayers:{team:string, name:string, nickName:string}[] = [];
  for (const player of playersFirstTeam.concat(playersSecondTeam)) {
    allPlayers.push({team: 'Team', name: player, nickName: 'Spitzname'});
  }
  return {ttDates: entries, allPlayers: allPlayers};
}
/**
 * 
 */
async function initTable() {
  const ttDates:TTDates = await loadMatches();
  const spreadSheetId = await createNewSpreadsheet();
  if (spreadSheetId) {
    addNewGoogleConfig({
      spreadSheetId: spreadSheetId,
      ranges: {
        meta: 'Sheet1!A1:B7',
        players: 'Sheet1!A9:C',
        dates: 'Sheet1!D1:1',
        gamesFirstTeam: 'Sheet1!D2:Z4',
        gamesSecondTeam: 'Sheet1!D5:Z7',
        entries: 'Sheet1!D9:ZZZ',
      },
    });
    const dateValues = [];
    const firstTeamEnemies = [];
    const firstTeamTimes = [];
    const firstTeamVenues = [];
    const secondTeamEnemies = [];
    const secondTeamTimes = [];
    const secondTeamVenues = [];
    for (const ttDate of ttDates.ttDates) {
      dateValues.push(ttDate.date);
      firstTeamEnemies.push(ttDate.firstTeam?.enemy ? ttDate.firstTeam.enemy : '');
      let venue = (ttDate.firstTeam?.venue === Venue.Home ? 'Heim':'Auswärts');
      firstTeamVenues.push(ttDate.firstTeam?.venue !== undefined ? venue : '');
      firstTeamTimes.push(ttDate.firstTeam?.time ? ttDate.firstTeam.time : '');
      secondTeamEnemies.push(ttDate.secondTeam?.enemy ? ttDate.secondTeam.enemy : '');
      venue = ttDate.secondTeam?.venue === Venue.Home ? 'Heim':'Auswärts';
      secondTeamVenues.push(ttDate.secondTeam?.venue !== undefined ? venue : '');
      secondTeamTimes.push(ttDate.secondTeam?.time ? ttDate.secondTeam.time : '');
    }
    for (let i = 0; i < ttDates.allPlayers.length; i++) {
      const currentPlayer = ttDates.allPlayers[i];
      if (ttDates.allPlayers.slice(i + 1).includes(currentPlayer)) {
        ttDates.allPlayers.splice(i, 1);
        i--;
      }
    }
    postTable([dateValues],
        [firstTeamEnemies, firstTeamVenues, firstTeamTimes],
        [secondTeamEnemies, secondTeamVenues, secondTeamTimes],
        ttDates.allPlayers.map((player) => {
          const result = player.name.split(', ');
          return ['Mannschaft', result[1] + ' ' + result[0], 'Spitzname'];
        }));
  }
}

/**
 * 
 */
async function findEnemies(teamIndex:number):
              Promise<{enemyId:string, enemyName:string, enemyClubId:string}[]> {
  /**
   * 
   * @param link 
   */
  function parseLink(link:string):{enemyId:string, enemyName:string} | undefined {
    const split = link.split('/');
    for (let i = 0; i < split.length; i++) {
      if (split[i].toLowerCase() === 'mannschaft') {
        return {enemyId: split[i + 1], enemyName: split[i + 2]};
      }
    }
  }
  const config = await readTeamConfig();
  const response = await fetch(`https://www.mytischtennis.de/clicktt/TTBW/` +
  `${config.saison}/ligen/${config.teams[teamIndex].league}/gruppe/` +
  `${config.teams[teamIndex].groupId}/tabelle/${config.round}`);
  const html = parse(await response.text());
  const table = html.querySelector('table > tbody');
  const rows = table?.querySelectorAll('tr') || [];
  const enemies:{enemyId:string, enemyName:string, enemyClubId:string}[] = [];
  for (const row of rows) {
    const cell = row.querySelector('td > a');
    const link = cell?.getAttribute('href');
    if (link) {
      const enemy = parseLink(link);
      const clubs:{name:string, id:string}[] = readClubs();
      if (typeof String.prototype.replaceAll === 'undefined') {
        String.prototype.replaceAll = function(match, replace) {
           return this.replace(new RegExp(match, 'g'), () => replace);
        }
      }
      const clubId:(string|undefined) = clubs.find(
          (el) => enemy?.enemyName.includes(el.name.replaceAll(' ', '-')
              .replaceAll('ö', 'oe').replaceAll('ä', 'ae').replaceAll('ü', 'ue')))?.id;
      if (enemy && clubId) {
        enemies.push({enemyId: enemy.enemyId, enemyName: enemy.enemyName, enemyClubId: clubId});
      }
    }
  }
  return enemies;
}
/**
 * 
 */
async function initAllEnemies() {
  writeEnemies([await findEnemies(0), await findEnemies(1)]);
}
initTable();
initAllEnemies();
