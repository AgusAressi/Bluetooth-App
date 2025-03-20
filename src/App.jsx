import React from 'react';
import './App.css';
import BluetoothConnector from "./components/BluetoothConnector/index";
import BLEConnect from './components/BLEConnect';


function App() {
  return (
    <div className="flex justify-center">
      <BluetoothConnector />
    </div>
  );
}

export default App;
