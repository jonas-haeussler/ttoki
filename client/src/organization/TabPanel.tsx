import { useState } from "react"
import { Container, Tab, Tabs } from "react-bootstrap"
import { TTDate } from "../types";
import { fetchDates } from "../main";

import Insert from "./Insert";
import Overview from "./Overview";

// const [gameEntries, SetGameEntries] = useState<string[]>();

const TabPanel = () => {

    const [ttDates, SetTTDates] = useState<TTDate[]>([]);
    const [loading, SetLoading] = useState<boolean>(false);
    const updateGameEntries = async () => {
        SetLoading(true);
        const ttDates = (await fetchDates([]).catch(rej => console.log(rej)));
        
        if (ttDates) {
            SetTTDates(ttDates);
            SetLoading(false);
        }
    }
    return (
        <Container fluid="md" className="content" style={{minHeight: "500px"}}>
            <Tabs defaultActiveKey="insert" id="uncontrolled-tab-example" className="mb-3" onSelect={(e) => e === "overview" ? updateGameEntries() : undefined }>
                <Tab eventKey="insert" title="Eintragen">
                    <Insert />
                </Tab>
                <Tab eventKey="overview" title="Überblick" onClick={(_) => updateGameEntries()}>
                    <Overview ttDates={ttDates} loading={loading}/>
                </Tab>  
                    
            </Tabs>
        </Container>
        )
};

export default TabPanel;