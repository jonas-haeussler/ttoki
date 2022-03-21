import React from "react";
import { Table } from "react-bootstrap"
import { TTDate } from "../../../shared/types";

import GameEntries from "./GameEntries";

const Overview = (props: {ttDates:TTDate[], loading:boolean}) => {
    return (
          <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>1. Mannschaft</th>
                  <th>2. Mannschaft</th>
                </tr>
              </thead>
              <tbody id="game-entries">
                <GameEntries ttDates={props.ttDates} loading={props.loading} />
              </tbody>
          </Table>
    )
};
export default Overview;