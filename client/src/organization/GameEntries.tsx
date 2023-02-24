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
                <tr style={hide ? {display:"none"}:{}}><td rowSpan={5} style={{verticalAlign: "middle", fontFamily:"PT Sans"}}>{DateTime.fromISO(ttDate.date).toFormat("dd.MM.yy")}</td>
                    <td>
                    <span style={{fontFamily:"Roboto Slab", textAlign:"center", margin:"0"}}>{ttDate.firstTeam ? ttDate.firstTeam?.enemy: ""}</span><br></br>
                    <span>{ttDate.firstTeam ? DateTime.fromISO(ttDate.firstTeam?.time).toFormat("HH:mm") : ""}</span><br></br>
                    <span>{ttDate.firstTeam ? (ttDate.firstTeam?.venue === 0 ? "(Heimspiel)" : "(Auswärtsspiel)") : ""}</span>
                    </td>
                    <td>
                        <span style={{fontFamily:"Roboto Slab"}}>{`${ttDate.secondTeam ? ttDate.secondTeam?.enemy : ""}`}</span><br></br>
                        <span>{ttDate.secondTeam ? DateTime.fromISO(ttDate.secondTeam?.time).toFormat("HH:mm") : ""}</span><br></br>
                        <span>{ttDate.secondTeam ? (ttDate.secondTeam?.venue === 0 ? "(Heimspiel)" : "(Auswärtsspiel)") : ""}</span>
                    </td></tr>
                <tr>
                    <td colSpan={2}><p style={{margin:"0", fontFamily:"Dosis"}}>Verfügbar:</p>
                        {ttDate.availablePlayers === undefined || ttDate.availablePlayers.length === 0 ? "" : 
                            ttDate.availablePlayers.filter(player => player.option === "ja").map(
                                (player) => {
                                    let result = <></>;
                                    result = <span className="text-success">{player.nickName}</span>;

                                    result = <>{ttDate.availablePlayers.filter(player => player.option === "ja").indexOf(player) !== 0 ? ", ": ""}{result}</>
                                    return result;
                                })
                        }
                    </td>
                    </tr>
                    <tr>
                        <td colSpan={2}><p style={{margin:"0", fontFamily:"Dosis"}}>Vielleicht verfügbar:</p>{ttDate.availablePlayers === undefined || ttDate.availablePlayers.length === 0 ? "" : 
                            ttDate.availablePlayers.filter(player => player.option === "vielleicht").map(
                                (player) => {
                                    let result = <></>;
                                    result = <span className="text-warning">{player.nickName}</span>;
                                    result = <>{ttDate.availablePlayers.filter(player => player.option === "vielleicht").indexOf(player) !== 0 ? ", ": ""}{result}</>
                                    return result;
                                })
                            }
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={2}><p style={{margin:"0", fontFamily:"Dosis"}}>Nicht verfügbar:</p>{ttDate.availablePlayers === undefined || ttDate.availablePlayers.length === 0 ? "" : 
                            ttDate.availablePlayers.filter(player => player.option === "nein").map(
                                (player) => {
                                    let result = <></>;
                                    result = <span className="text-danger"><del>{player.nickName}</del></span>;

                                    result = <>{ttDate.availablePlayers.filter(player => player.option === "nein").indexOf(player) !== 0 ? ", ": ""}{result}</>
                                    return result;
                                })
                            }
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={2}><p style={{margin:"0", fontFamily:"Dosis"}}>Nicht eingetragen:</p>{ttDate.availablePlayers === undefined || ttDate.availablePlayers.length === 0 ? "" : 
                            ttDate.availablePlayers.filter(player => player.option === "dunno").map(
                                (player) => {
                                    let result = <></>;
                                    result = <span className="text-secondary">{player.nickName}</span>;
                                    result = <>{ttDate.availablePlayers.filter(player => player.option === "dunno").indexOf(player) !== 0 ? ", ": ""}{result}</>
                                    return result;
                                })
                            }
                        </td>
                    </tr>

                </Fade>
            }
        )}
        </>
    )
};
export default GameEntries;