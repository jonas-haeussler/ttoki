import { TTDate } from "./types";

export async function fetchDates(activePlayers:string[]): Promise<TTDate[]> {
    const url = `/api/dates?filters=${JSON.stringify(activePlayers)}`;
    const res = await fetch(url.toString());
    const ttDates = await res.json();
    return ttDates;
}