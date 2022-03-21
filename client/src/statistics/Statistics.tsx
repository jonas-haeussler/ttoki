import React, { ChangeEvent, useEffect, useState } from "react";
import { Container, Table } from "react-bootstrap";
import { Player } from "../../../shared/types";
import Loader from "../Loader";
const Fade = require("react-reveal/Fade");

const Statistics = () => {

    const filter = (e:ChangeEvent<HTMLInputElement>) => {
        setFilteredPlayers(players.filter((player) => player.name.toLowerCase().includes(e.target.value.toLowerCase())));
    }
    const [players, setPlayers] = useState<Player[]>([]);
    const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);

    useEffect(() => {
        const loadPlayers = async () => {
            const url = `/myTTTeam`;
            let res = await fetch(url.toString());
            let myTTPlayerData = await res.json();
            if(myTTPlayerData && myTTPlayerData.length > 0) {
                setPlayers(myTTPlayerData);
                setFilteredPlayers(myTTPlayerData);
            }
        }
        loadPlayers();
    }, [])
    return (
        <Container fluid="md">
            <Table responsive striped bordered id="playersTable" style={{marginTop: "1%"}}>
                <thead>
                    <tr>
                        <th colSpan={2}>Spieler</th><th>Einsätze</th><th>Bilanz</th><th>TTR</th><th>QTTR+-</th>
                    </tr>
                    <tr>
                        <th colSpan={100}>
                            <input className="form-control" placeholder="Nach Namen filtern..." onChange={filter}/> 
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {players.length === 0 ? <td colSpan={100} style={{backgroundColor:"lightgray"}}><Loader/></td> : filteredPlayers.map((player) => 
                    <Fade left delay={filteredPlayers.indexOf(player) * 50}>
                        <tr>
                            <td>{player.team + '.' + player.position}</td>
                            <td>{player.name}</td>
                            <td>{player.actions}</td>
                            <td style={player.wins >= player.loses ? {color:"green"} : {color:"red"}}>{player.wins + ':' + player.loses}</td>
                            <td>{player.ttr}</td>
                            <td style={player.ttr >= player.qttr ? {color:"green"} : {color:"red"}}>
                                {player.ttr >= player.qttr ? '+' + (player.ttr - player.qttr):(player.ttr - player.qttr)}
                            </td>
                        </tr>
                    </Fade>)}
                </tbody>
            </Table>
        </Container>
    )
}
export default Statistics;