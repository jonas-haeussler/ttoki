import React, { useState } from "react";
import { Form, Table } from "react-bootstrap";
import { Player } from "../../../shared/types";


const Statistics = () => {

    const filter = () => {

    }
    const [players, setPlayers] = useState<Player[]>([]);
    return (
        <Table striped bordered hover id="playersTable" style={{marginTop: "1%"}}>
            <thead>
                <tr>
                    <th colSpan={2}>Spieler</th><th>Einsätze</th><th>Bilanz</th><th>TTR</th><th>QTTR +-</th>
                </tr>
                <tr>
                    <th colSpan={100}>
                        <Form>
                        </Form><Form.Text placeholder="Nach Namen filtern" id="filter" onChange={filter}></Form.Text> 
                    </th>
                </tr>
            </thead>
            <tbody>
                {players.map((player) => 
                <tr>
                    <td>{player.name}</td>
                    <td>{player.actions}</td>
                    <td>{player.wins + ':' + player.loses}</td>
                    <td>{player.ttr}</td>
                    <td>{player.ttr - player.qttr}</td>
                </tr>)}
            </tbody>
        </Table>
    )
}
export default Statistics;