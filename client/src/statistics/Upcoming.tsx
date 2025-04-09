import { useEffect, useState } from "react";
import { Container, Spinner, Table } from "react-bootstrap";
import { Team } from "../types";
import Loader from "../Loader";
import { Fade } from "react-awesome-reveal";

const TeamTable = (props:{team:Team | undefined}) => {

    return (
        <Container fluid="md">
            <Table responsive striped bordered style={{marginTop: "1rem"}}>
                <thead>
                    <tr>
                        <th colSpan={100} style={{textAlign: "center"}}>{props.team ? props.team.name : <Spinner animation="border" />}</th>
                    </tr>
                </thead>
                <tbody>
                    {!props.team ? <Loader /> : 
                    <>
                    <tr>
                        <th>Spieler</th>{props.team?.members.map((player) => <td >{player.name}</td>)}
                    </tr>
                    <tr>
                        <th>Einsätze</th>{props.team?.members.map((player) => <td >{player.actions}</td>)}
                    </tr>
                    <tr>
                        <th>Bilanz</th>{props.team?.members.map((player) => <td >{`${player.wins}:${player.loses}`}</td>)}
                    </tr>
                    <tr>
                        <th>TTR</th>{props.team?.members.map((player) => <td >{player.ttr}</td>)}
                    </tr>
                    <tr>
                        <th>QTTR+-</th>{props.team?.members.map((player) => <td  style={player.ttr >= player.qttr ? {color:"green"} : {color:"red"}}>{player.ttr >= player.qttr ? '+' + (player.ttr - player.qttr):(player.ttr - player.qttr)}</td>)}
                    </tr></>
                    }
                </tbody>
            </Table>
        </Container>
    );
}

const Upcoming = () => {
    

    const [team1, setTeam1] = useState<Team>();
    const [team2, setTeam2] = useState<Team>();

    const [enemy1, setEnemy1] = useState<Team>();
    const [enemy2, setEnemy2] = useState<Team>();

    useEffect(() => {
        const loadUpcoming = async () => {
            const url = `/api/nextMatches`;
            const res = await fetch(url.toString()).catch(rej => console.log(rej));
            const teams = await res?.json().catch(rej => console.log(rej));
            console.log(teams.allies);
            if (teams) {
                if (teams.allies.length === 2) {
                    setTeam1(teams.allies[0]);
                    setTeam2(teams.allies[1]);
                }
                if (teams.enemies.length === 2) {
                    setEnemy1(teams.enemies[0]);
                    setEnemy2(teams.enemies[1]);
                }
            }
        }
        loadUpcoming();
    }, []);
    

    return (
        <>
        <Container style={{marginTop: "2%"}} className="content">
            <Fade direction="left" triggerOnce={true}>
                <TeamTable team={team1}></TeamTable>
            </Fade>
            <Fade direction="left" delay={1} triggerOnce={true}>
                <TeamTable team={enemy1}></TeamTable>
            </Fade>
        </Container>
        <hr
        style={{
            color: "black",
            backgroundColor: "black",
            height: 3,
            marginTop: "2%"
        }}
        />
        <Container style={{marginTop: "2%"}} className="content">
            <Fade direction="left" delay={2} triggerOnce={true}>
                <TeamTable team={team2} ></TeamTable>
            </Fade>
            <Fade direction="left" delay={3} triggerOnce={true}>
                <TeamTable team={enemy2}></TeamTable>
            </Fade>
        </Container>
        </>
    );
}
export default Upcoming;