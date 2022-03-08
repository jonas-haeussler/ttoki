import { useEffect, useState } from "react";
import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import TabPanel from  "./organization/TabPanel";
import Statistics from "./statistics/Statistics";


const App = () => {
  const a = useState();

  return (
  <React.StrictMode>
      <Router>
        <Routes>
          <Route path="/" element={<TabPanel />}/>
          <Route path="statistics" element={<Statistics/>}/>
        </Routes>
      </Router>
    </React.StrictMode>
  )
};

export default App;