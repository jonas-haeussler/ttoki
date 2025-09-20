/* eslint-disable camelcase */

import express from 'express';

import bodyParser from 'body-parser';

import {getAllPlayers, getDates, postPlayer, tryFetchGoogleConfigsDrive, tryFetchTeamConfigDrive, tryFetchClubConfigDrive} from './googleUtils.js';
import {TTDate} from './types';
import {getMyTTOkiTeamData, getUpcoming, login} from './myTTUtils.js';
import {RequestInit} from 'node-fetch';
import * as path from 'path';
import { fetchTime } from './utils.js';
import dotenv from 'dotenv';
import logger from './logger.js';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const PORT = process.env.PORT || 3001;

// @ts-ignore
const app = express();

let opt:RequestInit;


async function tryUpdateMyTTR() {
  try {
  // const loginOpt = await login();
    app.locals.statistics = await getMyTTOkiTeamData();
    app.locals.upcoming = await getUpcoming(app.locals.statistics);
  } catch(err){
     logger.error(`Error occurred: ${err.message}`)
  }
}

async function init() {
  await tryFetchGoogleConfigsDrive();
  await tryFetchTeamConfigDrive();
  await tryFetchClubConfigDrive();
  await tryUpdateMyTTR();
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
  const players = await getAllPlayers();
  logger.debug('Getting players from Google Sheets');
  res.json(players);
});
app.get('/api/dates', async (req, res) => {
  const filters = req.query.filters;
  if (filters) {
    logger.debug('Getting dates from Google Sheets');
    const activePlayers:string[] = JSON.parse(filters.toString());
    const dates = (await getDates(activePlayers))?.ttDates;
    res.json(dates);
  }
});
app.post('/api/player', bodyParser.json(), async (req, res) => {
  logger.debug('Posting players to Google Sheets');
  const date:TTDate = req.body as TTDate;
  const answer = await postPlayer(date);
});
app.get('/api/myTTTeam', async (req, res) => {
  res.json(app.locals.statistics);
});
app.get('/api/nextMatches', async (req, res) => {
  res.json(app.locals.upcoming);
});
setInterval(async() => {
  try {
    await tryFetchGoogleConfigsDrive();
    await tryFetchTeamConfigDrive();
    await tryFetchClubConfigDrive();
  } catch(err) {
    logger.error("Failed to fetch google configs from drive");
  }
}, fetchTime);


setInterval(async() => {
  await tryUpdateMyTTR();
}, 3600000);
app.listen(PORT as number, () => {
  logger.info(`Server listening on ${PORT}`);
  init().catch(err => logger.error("Init failed:", err));
});