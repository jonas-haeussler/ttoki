/* eslint-disable camelcase */

import express = require('express');

import bodyParser = require('body-parser');

import {getAllPlayers, getDates, postPlayer} from './googleUtils';
import {TTDate} from '../shared/types';
import {getMyTTOkiTeamData, getUpcoming, login} from './myTTUtils';
import {RequestInit} from 'node-fetch';

const PORT = process.env.PORT || 3001;

// @ts-ignore
const app = express();

let opt:RequestInit;
login().then((res) => {
  opt = res;
  loopLogIn();
});

/**
 * 
 */
function loopLogIn() {
  setTimeout(async () => {
    console.log('Relogging in to mytischtennis');
    opt = await login();
    loopLogIn();
  }, 3600000);
}


if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  const path = require('path');
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

app.listen(PORT as number, '0.0.0.0', () => {
  console.log(`Server listening on ${PORT}`);
});

app.get('/players', async (req, res) => {
  const players = await getAllPlayers();
  console.log('Getting players from Google Sheets');
  res.json(players);
});
app.get('/dates', async (req, res) => {
  const filters = req.query.filters;
  if (filters) {
    console.log('Getting dates from Google Sheets');
    const activePlayers:string[] = JSON.parse(filters.toString());
    const dates = (await getDates(activePlayers))?.ttDates;
    res.json(dates);
  }
});
app.post('/player', bodyParser.json(), async (req, res) => {
  console.log('Posting players to Google Sheets');
  const date:TTDate = req.body as TTDate;
  const answer = await postPlayer(date);
});
app.get('/myTTTeam', async (req, res) => {
  const myTTTeamData = await getMyTTOkiTeamData(opt);
  res.json(myTTTeamData);
});
app.get('/nextMatches', async (req, res) => {
  const teams = await getUpcoming(opt);
  console.log(JSON.stringify(teams));
  res.json(teams);
});
