/* eslint-disable camelcase */

import express from 'express';

import bodyParser from 'body-parser';

import {getAllPlayers, getDates, postPlayer, fetchGoogleConfigsDrive, fetchTeamConfigDrive} from './googleUtils.js';
import {TTDate} from './types';
import {getMyTTOkiTeamData, getUpcoming, login} from './myTTUtils.js';
import {RequestInit} from 'node-fetch';
import * as path from 'path';
import { fetchTime } from './utils.js';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const PORT = process.env.PORT || 3001;

// @ts-ignore
const app = express();

let opt:RequestInit;


async function UpdateMyTTR() {
  const loginOpt = await login();
  app.locals.upcoming = await getUpcoming(loginOpt);
  app.locals.statistics = await getMyTTOkiTeamData(loginOpt);
}

async function init() {
  await fetchGoogleConfigsDrive();
  await fetchTeamConfigDrive();
  await UpdateMyTTR();
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
  console.log('Getting players from Google Sheets');
  res.json(players);
});
app.get('/api/dates', async (req, res) => {
  const filters = req.query.filters;
  if (filters) {
    console.log('Getting dates from Google Sheets');
    const activePlayers:string[] = JSON.parse(filters.toString());
    const dates = (await getDates(activePlayers))?.ttDates;
    res.json(dates);
  }
});
app.post('/api/player', bodyParser.json(), async (req, res) => {
  console.log('Posting players to Google Sheets');
  const date:TTDate = req.body as TTDate;
  const answer = await postPlayer(date);
});
app.get('/api/myTTTeam', async (req, res) => {
  res.json(app.locals.statistics);
});
app.get('/api/nextMatches', async (req, res) => {
  res.json(app.locals.upcoming);
});
init().then(() => {
  setInterval(async() => {
  try {
    await fetchGoogleConfigsDrive();
    await fetchTeamConfigDrive();
  } catch(err) {
    console.error("Failed to fetch google configs from drive");
  }
}, fetchTime);


  setInterval(async() => {
    await UpdateMyTTR();
  }, 3600000);
  app.listen(PORT as number, () => {
    console.log(`Server listening on ${PORT}`);
  });

});
