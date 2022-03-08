import { DateTime } from "luxon";
import React, { useEffect, useState } from "react";
import { ButtonGroup, Button, Table, ToggleButton } from "react-bootstrap";
import { Game, TTDate } from "../../../shared/types";

const CustomButton = (props: {dateID:string, buttonID:string, handler:Function, radioValue:string}) => {
    return (
        <ToggleButton
           className="mb-2"
           id={`${props.dateID}-${props.buttonID}`}
           type="checkbox"
           variant={props.buttonID === 'ja' ? "outline-success" : (props.buttonID === 'nein' ? "outline-danger" : "outline-warning")}
           checked={props.radioValue === props.buttonID}
           value={props.buttonID}
           onChange={(e) => props.handler(e.currentTarget.value)}
           >
           {props.buttonID === "ja" ? "Ja" : (props.buttonID === "nein" ? "Nein" : "Weiß noch nicht") }
        </ToggleButton>
    )
}

const Date = (props: {ttDate:TTDate}) => {
    const [radioValue, setRadioValue] = useState(props.ttDate.option);
    useEffect(() => {
        const postOption = async (ttDate:TTDate) => {
            let res = await fetch("/player", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                  },
                body: JSON.stringify(ttDate)
            });
            return res;
          }
        if(radioValue !== props.ttDate.option) {
            let oldOption = props.ttDate.option;
            props.ttDate.option = radioValue;
            console.log(props.ttDate);
            postOption(props.ttDate).then(res => res.status !== 200 ? props.ttDate.option = oldOption : null).then(_ => setRadioValue(props.ttDate.option));
        }

    }, [radioValue]);
    return (
        
        <>
            <h2>{DateTime.fromISO(props.ttDate.date).toFormat("dd.MM.yyyy")}</h2>
            <Table striped bordered hover>
            <thead>
                <tr><th>1. Mannschaft</th>
                <th>2. Mannschaft</th></tr>
            </thead>
            <tbody>
                <tr>
                    {props.ttDate.firstTeam ? <td>{`
                                                    ${props.ttDate.firstTeam.enemy} 
                                                    ${DateTime.fromISO(props.ttDate.firstTeam.time).toFormat("hh:mm")} 
                                                    ${props.ttDate.firstTeam.venue === 0 ? "(Heimspiel)" : "(Auswärtsspiel)"}`}
                                                </td> : <td></td>}
                    {props.ttDate.secondTeam ? <td>{`
                                                    ${props.ttDate.secondTeam.enemy} 
                                                    ${DateTime.fromISO(props.ttDate.secondTeam.time).toFormat("hh:mm")} 
                                                    ${props.ttDate.secondTeam.venue === 0 ? "(Heimspiel)" : "(Auswärtsspiel)"}`}
                                                </td> : <td></td>}
                </tr>
                <tr>
                <td colSpan={2}> 
                    <ButtonGroup aria-label="Options">
                        <CustomButton dateID={props.ttDate.id} buttonID={"ja"} handler={setRadioValue} radioValue={radioValue} />
                        <CustomButton dateID={props.ttDate.id} buttonID={"nein"} handler={setRadioValue} radioValue={radioValue} />
                        <CustomButton dateID={props.ttDate.id} buttonID={"vielleicht"} handler={setRadioValue} radioValue={radioValue} />
                    </ButtonGroup>
                </td>
                </tr>
            </tbody>
            </Table>
        </>
        )
};
export default Date;