
const {app, BrowserWindow} =  require('electron')
const path = require('path')
const Positioner = require('electron-positioner')


global.sharedObject = {
  args: process.argv,
  platform: process.platform,
  exePath: process.env.PORTABLE_EXECUTABLE_DIR
} // Shared object that refer argv outside of main.js

function createWindow(){
  const isDetectableMode = ()=>{
    let args = process.argv;
    console.log(args);
    return args.findIndex((element) => {
      return element === '--detect'
    }) !== -1
  }


    let win= new BrowserWindow({
        minWidth: 800,
        minHeight: 900,
        webPreferences: {
          webSecurity: true, 
          nodeIntegration: true
          },
          frame: !isDetectableMode() ?  true : false, 
          transparent: true,
    })
    
    win.loadURL('http://localhost:3000/') // FOR DEVELOPMENT
    
    //win.loadURL("file://"+path.join(__dirname, '../build/index.html')) //TO BUILD RELEASE 
    //win.webContents.openDevTools() //DEV TOOLS
    
    win.setMenu(null)

    let positioner = new Positioner(win)
    positioner.move('topCenter')


}

app.whenReady().then(createWindow)
// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
})