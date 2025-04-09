import { DateTime } from "luxon";
import { Table } from "react-bootstrap";
import { TTDate } from "../types";

import GameEntries from "./GameEntries";

const Overview = (props: {ttDates:TTDate[], loading:boolean}) => {
    return (
        <>
          <Table striped bordered hover className="custom-table">
              <thead>
                <tr>
                  <th className="date">Datum</th>
                  <th className="team">1. Mannschaft</th>
                  <th className="team">2. Mannschaft</th>
                </tr>
              </thead>
            </Table>
            <GameEntries ttDates={props.ttDates.filter((date) => {
                  return DateTime.fromISO(date.date).diffNow().toMillis() > 0;
                  })} loading={props.loading} />
          </>
    )
};
export default Overview;