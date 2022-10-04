import React from "react";
import { TTDate } from "../../../shared/types";
import Loader from "../Loader";
import { DateTime } from "luxon";
const Fade = require("react-reveal/Fade");



const GameEntries = (props: {ttDates:TTDate[], loading:boolean}) => {

    

    return (
        <>
        {props.loading || props.ttDates.length === 0 ? <tr><td colSpan={3}><Loader/></td></tr> : props.ttDates.map(ttDate => {
            const hide = DateTime.fromISO(ttDate.date).diffNow().toMillis() < 0;
            return <Fade bottom delay={0}>
                <tr style={hide ? {display:"none"}:{}}><td rowSpan={2} style={{verticalAlign: "middle"}}>{DateTime.fromISO(ttDate.date).toFormat("dd.MM.yy")}</td>
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
                    (player) => player.nickName + (ttDate.availablePlayers.indexOf(player) !== ttDate.availablePlayers.length -1 ? ", ": ""))
                }</td></tr>
                </Fade>
            }
        )}
        </>
    )
};
export default GameEntries;