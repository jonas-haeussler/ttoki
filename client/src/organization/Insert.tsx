import React, { useEffect } from "react";
import { useState } from "react";
import { Button, Form, FormControl, InputGroup } from "react-bootstrap";
import { TTDate } from "../types";
import { fetchDates } from "../main";
import Date from "./Date";
import Loader from "../Loader";


const Insert = () => {

    const [activePlayers, SetActivePlayers] = useState(() => new Set<string>());
    const [allPlayers, SetAllPlayers] = useState<string[]>([]);
    const [dates, SetDates] = useState<TTDate[]>([]);
    useEffect(() => {
        const getDates = async () => {
            SetLoading(true);
            SetDates([]);
            let ttDates:TTDate[] = [];
            if(activePlayers.size > 0) {
                try {
                    ttDates = await fetchDates(Array.from(activePlayers));
                }
                catch(e) {
                    console.log(e);
                    throw new Error();
                }
            }
            SetDates(ttDates);
            SetLoading(false);
        }
        getDates().catch(rej => console.log(rej));
    }, [activePlayers])

    useEffect(() => {
        const fetchPlayers = async () => {
            const data = await fetch("/api/players").catch(rej => console.log(rej));
            const res = await data?.json().catch(rej => console.log(rej));
            const allPlayers = res.map((el:{team:string, name:string, nickName:string}) => el.name);
            SetAllPlayers(allPlayers);
            console.log(allPlayers);
        }
        fetchPlayers();
        }, [])

    const addActivePlayer = (item:string) => {
        SetActivePlayers(prev => new Set<string>(prev).add(item));
      }
    const removeActivePlayer = (item:string) => {
        SetActivePlayers(prev => {
            const next = new Set<string>(prev);
            next.delete(item);
            return next;
        });
      } 
    const [loading, SetLoading] = useState<boolean>();
    
    function doValidate(e:React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        const inputElem = e.target as HTMLInputElement;
        const name = inputElem.value;
        if(allPlayers.includes(name)) {
            SetDates([]);
            inputElem.value = "";
            addActivePlayer(name);
        }
        
    }
    

    return (
        <>
        <Form>
            <Form.Group className="mb-3">
                <Form.Label>Gib deinen Namen ein:</Form.Label>
                <InputGroup className="mb-3">
                    {
                        Array.from(activePlayers).map((player:string) => <>
                            <Button variant="outline-secondary" disabled>{player}</Button>
                            <Button variant="outline-secondary" onClick={(_) => removeActivePlayer(player)} >X</Button>
                            </>
                        )
                    }
                    <FormControl placeholder="Vorname Nachname" list="players" onChange={(e) => doValidate(e)}/>
                </InputGroup>
                <datalist id="players">
                        {
                            allPlayers.map(player => <option value={player}/>)
                        }
                </datalist>
            </Form.Group>
        </Form>
         
        {dates.map(date => {
            return <><Date ttDate={date} delay={0} /></>
                    
        })}
        { loading ? <Loader/> : <></> }
        </>
    )
};
export default Insert;