import React from 'react';
import Settings from './Components/Settings';
import DetectComponent from './Components/DetectComponent';
var remote = window.require('electron').remote


function App() {


  const isDetectableMode = () => {
    let args = remote.getGlobal('sharedObject').args;
    console.log(args);
    return args.findIndex((element) => {
      return element === '--detect'
    }) !== -1
  }


  console.log("Is detect mode", isDetectableMode())

  return (
    // <DetectComponent />

    isDetectableMode()
    ? <DetectComponent/>
    : <Settings />
  );
}

export default App;
