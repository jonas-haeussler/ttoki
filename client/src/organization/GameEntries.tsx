import React from "react";
import { TTDate } from "../../../shared/types";
import Loader from "../Loader";
import { DateTime } from "luxon";



const GameEntries = (props: {ttDates:TTDate[], loading:boolean}) => {

    

    return (
        <>
        {props.loading || props.ttDates === [] ? <tr><td colSpan={3}><Loader/></td></tr> : props.ttDates.map(ttDate => {
            return <>
                <tr><td rowSpan={2} style={{verticalAlign: "middle"}}>{DateTime.fromISO(ttDate.date).toFormat("dd.MM.yy")}</td>
                    <td>
                        {`${ttDate.firstTeam ? ttDate.firstTeam?.enemy: ""} 
                        ${ttDate.firstTeam ? DateTime.fromISO(ttDate.firstTeam?.time).toFormat("HH:mm") : ""} 
                        ${ttDate.firstTeam ? (ttDate.firstTeam?.venue === 0 ? "(Heimspiel)" : "(Auswärtsspiel)") : ""}`}
                    </td>
                    <td>
                        {`${ttDate.secondTeam ? ttDate.secondTeam?.enemy : ""} 
                        ${ttDate.secondTeam ? DateTime.fromISO(ttDate.secondTeam?.time).toFormat("HH:mm") : ""} 
                        ${ttDate.secondTeam ? (ttDate.secondTeam?.venue === 0 ? "(Heimspiel)" : "(Auswärtsspiel)") : ""}`}
                    </td></tr>
                <tr><td colSpan={2}>{ttDate.availablePlayers === undefined || ttDate.availablePlayers.length === 0 ? "Bisher keine Spieler..." : ttDate.availablePlayers.map(
                    (player) => player.split(" ")[0] + (ttDate.availablePlayers.indexOf(player) !== ttDate.availablePlayers.length -1 ? ", ": ""))
                }</td></tr>
                </>
            }
        )}
        </>
    )
};
export default GameEntries;