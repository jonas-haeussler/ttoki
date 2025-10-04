/* eslint-disable camelcase */

import express from 'express';

import bodyParser from 'body-parser';

import {getAllPlayers, getDates, postPlayer} from './googleUtils.js';
import {Player, TTDate} from './types';
import {getMyTTOkiTeamData, getMyTTTeam, getUpcoming, login} from './myTTUtils.js';
import {RequestInit} from 'node-fetch';
import * as path from 'path';
import dotenv from 'dotenv';
import logger from './logger.js';
import { Firestore } from '@google-cloud/firestore';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}
const PORT = process.env.PORT || 3001;

// @ts-ignore
const app = express();
const db = new Firestore({
  databaseId: "ttoki"
});

let opt:RequestInit;


async function tryUpdateMyTTR(db: Firestore) {
  try {
  // const loginOpt = await login();
    const players = await getMyTTOkiTeamData(db);
    Object.entries(players).forEach(async playerData => {
      const currentPlayers = (await db.collection("teams").doc(playerData[0]).get()).data().players ?? [];
      playerData[1].forEach(player => {
        let oldPlayerIndex = currentPlayers.findIndex(p => player.name === p.name);
        if (oldPlayerIndex === -1)
          currentPlayers.push(player);
        else if (player.ttr) {
          currentPlayers[oldPlayerIndex] = player;
          logger.debug(`writing player ${JSON.stringify(player)}`);
        }
        db.collection("teams").doc(playerData[0]).set({
          players: currentPlayers
        });
      });
    });
    const upcoming = await getUpcoming(db, Object.values(players).flat(), true);
    upcoming.enemies.forEach(async enemy => {
      await db.collection("teams").doc(enemy.id).set({players: enemy.members}, {merge: true});
    });
    

  } catch(err){
     // logger.error(`Error occurred: ${err.message}`)
     throw err;
  }
}

async function init() {
  // await tryFetchGoogleConfigsDrive();
  // await tryFetchTeamConfigDrive();
  // await tryFetchClubConfigDrive();
  // await tryUpdateMyTTR();
}


if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'client', 'build', 'index.html'));
  });
  app.get('/planning', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'client', 'build', 'index.html'));
  });
  app.get('/statistics', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'client', 'build', 'index.html'));
  });
  app.get('/upcoming', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'client', 'build', 'index.html'));
  });
}
app.get('/api/players', async (req, res) => {
  const players = await getAllPlayers(db);
  logger.debug('Getting players from Google Sheets');
  res.json(players);
});
app.get('/api/dates', async (req, res) => {
  const filters = req.query.filters;
  if (filters) {
    logger.debug('Getting dates from Google Sheets');
    const activePlayers:string[] = JSON.parse(filters.toString());
    const dates = (await getDates(db, activePlayers))?.ttDates;
    res.json(dates);
  }
});
app.post('/api/player', bodyParser.json(), async (req, res) => {
  logger.debug('Posting players to Google Sheets');
  const date:TTDate = req.body as TTDate;
  const answer = await postPlayer(db, date);
});
app.get('/api/myTTTeam', async (req, res) => {
  const players = await getMyTTTeam(db);
  res.json(players);
});
app.get('/api/nextMatches', async (req, res) => {
  const players = await getMyTTTeam(db);
  const upcoming = await getUpcoming(db, Object.values(players).flat(), false);
  res.json(upcoming);
});
app.get('/api/fetchMyTTData', async (req, res) => {
  await tryUpdateMyTTR(db);
  res.status(200).send("OK");
})
// setInterval(async() => {
//   try {
//     await tryFetchGoogleConfigsDrive();
//     await tryFetchTeamConfigDrive();
//     await tryFetchClubConfigDrive();
//   } catch(err) {
//     logger.error("Failed to fetch google configs from drive");
//   }
// }, fetchTime);


// setInterval(async() => {
//   await tryUpdateMyTTR();
// }, 3600000);
app.listen(PORT as number, () => {
  logger.info(`Server listening on ${PORT}`);
  init().catch(err => logger.error("Init failed:", err));
});