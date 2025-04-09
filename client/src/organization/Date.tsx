import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { ButtonGroup, Table, ToggleButton } from "react-bootstrap";
import { Option, TTDate } from "../types";
import { Fade } from "react-awesome-reveal";

const CustomButton = (props: {dateID:string, buttonID:string, handler:React.Dispatch<React.SetStateAction<Option>>, radioValue:string}) => {
    return (
        <ToggleButton
           className="mb-2"
           id={`${props.dateID}-${props.buttonID}`}
           type="checkbox"
           variant={props.buttonID === 'ja' ? "outline-success" : (props.buttonID === 'nein' ? "outline-danger" : "outline-warning")}
           checked={props.radioValue === props.buttonID}
           value={props.buttonID}
           onChange={(e) => props.handler(e.currentTarget.value as unknown as Option)}
           >
           {props.buttonID === "ja" ? "Ja" : (props.buttonID === "nein" ? "Nein" : "Weiß noch nicht") }
        </ToggleButton>
    )
}

const Date = (props: {ttDate:TTDate, delay:number}) => {
    const [radioValue, setRadioValue] = useState(props.ttDate.option);
    const [hide, setHide] = useState(false);
    useEffect(() => {
        const postOption = async (ttDate:TTDate) => {
            try {
                const res = await fetch("/api/player", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(ttDate)
                });
                return res;
            }
            catch(e) {
                console.log(e);
                throw new Error();
            }
            
          }
        setHide(DateTime.fromISO(props.ttDate.date).diffNow().toMillis() < 0);
        if(radioValue !== props.ttDate.option) {
            console.log("RadioValue: " + radioValue);
            const oldOption = props.ttDate.option;
            props.ttDate.option = radioValue;
            console.log(props.ttDate);
            postOption(props.ttDate).then(res => res.status !== 200 ? props.ttDate.option = oldOption : null)
                .catch(rej => console.log(rej))
                .then(_ => setRadioValue(props.ttDate.option))
                .catch(rej => console.log(rej));
        }

    }, [radioValue]);
    return (
        <Fade direction="up" delay={props.delay} triggerOnce={true}>
            <Table style={hide ? {display:"none"}:{}} striped bordered hover >
                <thead>
                    <tr><th colSpan={2} style={{textAlign:"center"}}><h2>{DateTime.fromISO(props.ttDate.date).toFormat("dd.MM.yyyy")}</h2></th></tr>
                    <tr><th style={{width: "50%"}}>1. Mannschaft</th>
                    <th style={{width: "50%"}}>2. Mannschaft</th></tr>
                </thead>
                <tbody>
                    <tr>
                        {props.ttDate.firstTeam ? <td>{`
                                                        ${props.ttDate.firstTeam.enemy} 
                                                        ${DateTime.fromISO(props.ttDate.firstTeam.time).toFormat("HH:mm")} 
                                                        ${props.ttDate.firstTeam.venue === 0 ? "(Heimspiel)" : "(Auswärtsspiel)"}`}
                                                    </td> : <td></td>}
                        {props.ttDate.secondTeam ? <td>{`
                                                        ${props.ttDate.secondTeam.enemy} 
                                                        ${DateTime.fromISO(props.ttDate.secondTeam.time).toFormat("HH:mm")} 
                                                        ${props.ttDate.secondTeam.venue === 0 ? "(Heimspiel)" : "(Auswärtsspiel)"}`}
                                                    </td> : <td></td>}
                    </tr>
                    <tr>
                    <td align="center" colSpan={2}> 
                        <ButtonGroup aria-label="Options">
                            <CustomButton dateID={props.ttDate.id} buttonID={"ja"} handler={setRadioValue} radioValue={radioValue} />
                            <CustomButton dateID={props.ttDate.id} buttonID={"nein"} handler={setRadioValue} radioValue={radioValue} />
                            <CustomButton dateID={props.ttDate.id} buttonID={"vielleicht"} handler={setRadioValue} radioValue={radioValue} />
                        </ButtonGroup>
                    </td>
                    </tr>
                </tbody>
            </Table>
            <div style={hide ? {display:"none"}:{}} className="wrapper"><div className="divider div-transparent"></div></div>
        </Fade>
        );
};
export default Date;