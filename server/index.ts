/* eslint-disable camelcase */

import express = require('express');

import bodyParser = require('body-parser');

import {getPlayers, getDates, postPlayer} from './utils';
import {TTDate} from '../shared/types';

const PORT = process.env.PORT || 3001;

// @ts-ignore
const app = express();

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  const path = require('path');
  app.get('/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'client', 'build', 'index.html'));
  });
}

app.listen(PORT as number, '0.0.0.0', () => {
  console.log(`Server listening on ${PORT}`);
});

app.get('/players', async (req, res) => {
  const players = await getPlayers();
  res.json(players);
});
app.get('/dates', async (req, res) => {
  const filters = req.query.filters;
  if (filters) {
    const activePlayers:string[] = JSON.parse(filters.toString());
    const dates = (await getDates(activePlayers))?.ttDates;
    res.json(dates);
  }
});
app.post('/player', bodyParser.json(), async (req, res) => {
  const date:TTDate = req.body as TTDate;
  const answer = await postPlayer(date);
});
