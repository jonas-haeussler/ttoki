import React, { useEffect } from "react";
import { useState } from "react"
import { Container, Tab, Tabs } from "react-bootstrap"
import { TTDate } from "../../../shared/types";
import { fetchDates } from "../main";

import Insert from "./Insert";
import Overview from "./Overview";

// const [gameEntries, SetGameEntries] = useState<string[]>();

const TabPanel = () => {

    const [ttDates, SetTTDates] = useState<TTDate[]>([]);
    const [loading, SetLoading] = useState<boolean>(false);
    const updateGameEntries = async () => {
        SetLoading(true);
        const ttDates:TTDate[] = await fetchDates([]);
        
        console.log(ttDates);
        SetTTDates(ttDates);
        SetLoading(false);
    }
    return (
        <Container fluid="md" className="content" style={{minHeight: "500px"}}>
            <Tabs defaultActiveKey="insert" id="uncontrolled-tab-example" className="mb-3" onSelect={(e) => e === "overview" ? updateGameEntries() : undefined }>
                <Tab eventKey="insert" title="Eintragen">
                    <Insert />
                </Tab>
                <Tab eventKey="overview" title="Überblick" onClick={(e) => updateGameEntries()}>
                    <Overview ttDates={ttDates} loading={loading}/>
                </Tab>  
                    
            </Tabs>
        </Container>
        )
};

export default TabPanel;