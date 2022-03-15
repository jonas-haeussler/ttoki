/* eslint-disable camelcase */

import * as express from 'express';
import {Request, Response} from 'express';

import * as bodyParser from 'body-parser';

import {getPlayers, getDates, postPlayer} from './utils';
import {TTDate} from '../shared/types';

const PORT = process.env.PORT || 3001;

// @ts-ignore
const app = express();

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

app.get('/players', async (req:Request, res:Response) => {
  const players = await getPlayers();
  res.json(players);
});
app.get('/dates', async (req:Request, res:Response) => {
  const filters = req.query.filters;
  if (filters) {
    const activePlayers:string[] = JSON.parse(filters.toString());
    const dates = (await getDates(activePlayers))?.ttDates;
    res.json(dates);
    console.log(dates);
  }
});
app.post('/player', bodyParser.json(), async (req:Request, res:Response) => {
  const date:TTDate = req.body as TTDate;
  console.log(date);
  const answer = await postPlayer(date);
  console.log(answer);
});
