import React, { useEffect, useState } from "react";
import { TTDate } from "../../../shared/types";
import Loader from "./Loader";



const GameEntries = (props: {ttDates:TTDate[], loading:boolean}) => {

    

    return (
        <>
        {props.loading || props.ttDates === [] ? <tr><td colSpan={3}><Loader/></td></tr> : props.ttDates.map(ttDate => {
            return <>
                <tr><td rowSpan={2}>{ttDate.date}</td><td>{ttDate.firstTeam?.enemy}</td><td>{ttDate.secondTeam?.enemy}</td></tr>
                <tr><td colSpan={2}>{ttDate.availablePlayers === [] ? "Bisher keine Spieler..." : ttDate.availablePlayers}</td></tr>
                <tr></tr>
                <tr><td colSpan={3} style={{backgroundColor: "white", boxShadow: "5px 10px"}}></td></tr>
                </>
            }
        )}
        </>
    )
};
export default GameEntries;