/* eslint-disable camelcase */

import express from 'express';

import bodyParser from 'body-parser';

import {getAllPlayers, getDates, postPlayer} from './googleUtils.js';
import {TTDate} from './types';
import {getMyTTOkiTeamData, getUpcoming, login} from './myTTUtils.js';
import {RequestInit} from 'node-fetch';
import * as path from 'path';

const PORT = process.env.PORT || 3001;

// @ts-ignore
const app = express();

let opt:RequestInit;
/* login().then((res) => {
  opt = res;
  loopLogIn();
});

**
 *
 *
function loopLogIn() {
  setTimeout(async () => {
    console.log('Relogging in to mytischtennis');
    opt = await login();
    loopLogIn();
  }, 3600000);
}
*/


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

app.listen(PORT as number, () => {
  console.log(`Server listening on ${PORT}`);
});

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
  let myTTTeamData = await getMyTTOkiTeamData(opt);
  if (myTTTeamData.every((player) => player.ttr === 0)) {
    opt = await login();
    myTTTeamData = await getMyTTOkiTeamData(opt);
  }
  res.json(myTTTeamData);
});
app.get('/api/nextMatches', async (req, res) => {
  let teams = await getUpcoming(opt);
  for (const ally of teams.allies) {
    if (ally.members.every((member) => member.ttr === 0)) {
      opt = await login();
      teams = await getUpcoming(opt);
    }
  }
  res.json(teams);
});
