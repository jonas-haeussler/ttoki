import { useEffect, useState } from "react";
import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";


const App = () => {

  return (
  <React.StrictMode>
      <Router>
        <Switch>
          <Route>
              Hallo!
          </Route>
          <Route>
            Hallo 2
          </Route>
        </Switch>
      </Router>
    </React.StrictMode>
  )
};

export default App;