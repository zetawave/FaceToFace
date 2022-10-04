import React from 'react';
import Settings from './Components/Settings';
import DetectComponent from './Components/DetectComponent';
var remote = window.require('electron').remote

const args = remote.getGlobal('sharedObject').args;

function App() {
  const isDetectableMode = () => {
    console.log(args);
    return args.findIndex((element) => {
      return element === '--detect'
    }) !== -1
  }

  const isDevelopmentMode = () => {
    console.log(args)
    return args.findIndex((e)=>{
      return e === '-dev'
    }) !== -1
  }
  console.log("Is detect mode", isDetectableMode())

  return (
    // <DetectComponent />

    isDetectableMode()
    ? <DetectComponent dev={isDevelopmentMode()}/>
    : <Settings />
  );
}

export default App;
