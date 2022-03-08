import { TTDate } from "../../shared/types";

export async function fetchDates(activePlayers:string[]): Promise<TTDate[]> {
    let url = `/dates?filters=${JSON.stringify(activePlayers)}`;
    let res = await fetch(url.toString());
    let ttDates = await res.json();
    return ttDates;
}