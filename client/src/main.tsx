import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './main.css';
import App from './App';

const domNode = document.getElementById('root') as Element;
const root = createRoot(domNode);
root.render(<React.StrictMode><App/></React.StrictMode>);
