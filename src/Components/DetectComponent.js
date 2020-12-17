import React, { Component } from 'react'
import Grid from '@material-ui/core/Grid'
import BioMetricImg from '../Assets/scan.gif'
import strings from '../strings/Strings'
import Swal from 'sweetalert2'
const remote = window.require('electron').remote;
const electronFs = remote.require('fs');

const { app, globalShortcut } = window.require('electron').remote
const { execFile, spawn } = window.require('electron').remote.require('child_process');

const AUTHORIZED = 'AUTHORIZED'
const INTRUSION = 'INTRUSION'
const ERROR = 'ERROR'

const WebCamera = require("webcamjs");
export default class DetectComponent extends Component {
    constructor(props) {
        super(props)
        this.state = {
            isValidUser: false,
            isAnalizing: true,
            timeoutId: null,
            intrusionMessage: strings.intrusion,
            retryState: 0
        }
        this.initShortcut()
    }


    componentDidMount() {

        this.mountCamera()
        if (!this.props.dev) {
            let timeoutId = setTimeout(this.takeSnap, 100) // Wait for camera is mounted
            this.setState({ timeoutId: timeoutId })
        }else{
            // Development mode
            console.log("Entered in detect component: development mode")
        }
    }



    initShortcut = () => {
        /* Scurity code CMD||Ctrl + Shift + X + C */
        globalShortcut.register('CommandOrControl+Shift+X+C', () => {
            console.log('Security shortcut inserted')
            clearTimeout(this.state.timeoutId)
            this.setState({ timeoutId: null })
            this.closeWindow()
        })
    }

    /* Verifying if is in debug mode */
    isDebugMode = () => {
        let args = remote.getGlobal('sharedObject').args;
        return args.findIndex((element) => {
            return element === '--debug'
        }) !== -1
    }

    getFaceDetectorScriptPath = () => {
        switch (remote.getGlobal('sharedObject').platform) {
            case 'win32':
                //TODO
                break
            default:
                return '/usr/local/lib/FaceToFace/lib/facedetect'
        }
    }

    shutDown = () => {
        console.log("Firing shutdown")
        let command = null
        switch (remote.getGlobal('sharedObject').platform) {
            case 'win32':
                break
            default:
                command = 'poweroff'
                break;
        }
        spawn(command, null, { shell: true }) //Shutdown
    }

    /* Action in function of authorization */
    authorizationActions = (isAuthorized) => {
        if (!isAuthorized) {
            let timeoutId = setTimeout(this.shutDown, 5000)
            this.setState({
                intrusionMessage: strings.shuttingDown.replace('{secs}', (5000 / 1000)),
                timeoutId: timeoutId
            })
            return
        }
        setTimeout(this.closeWindow, 1500) //Close app
    }

    closeWindow = () => {
        remote.getCurrentWindow().close() //Close app
    }

    /* Init detection and parse results */
    initDetection = (faceToMatch, facesDir) => {
        console.log("INIT SPAWN")
        console.log(app.getAppPath().concat('/lib/facedetect'), this.getFaceDetectorScriptPath())


        const ls = spawn(this.isDebugMode()
            ? app.getAppPath().concat('/lib/facedetect')
            : this.getFaceDetectorScriptPath(), [
            faceToMatch,
            facesDir
        ],
            {
                shell: true
            });

        ls.stdout.on('data', (data) => {
            let responseDetection = data.toString()

            console.log(data.toString())
            console.log("INCLUDES ", (responseDetection.includes(AUTHORIZED)))
            if (this.state.retryState < 2 && !responseDetection.includes(AUTHORIZED)) {
                this.setState({
                    isValidUser: (responseDetection.includes(AUTHORIZED)),
                    isAnalizing: false,
                    isRetrying: true,
                    retryState: this.state.retryState + 1
                })
                this.takeSnap()
                return
            }
            this.setState({
                isValidUser: (responseDetection.includes(AUTHORIZED)),
                isAnalizing: false,
                isRetrying: false
            })

            this.authorizationActions(responseDetection.includes(AUTHORIZED))

        });
        ls.on('close', (code) => {
            console.log(`child process close all stdio with code ${code}`);
        });

        ls.on('exit', (code) => {
            console.log(`child process exited with code ${code}`);
        });


    }

    /* Process the b64 image from the snap of WebCamera */
    processBase64Image = (dataString) => {
        let matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/), response = {};

        if (!matches || !matches.length || matches.length !== 3) {
            return null
        }

        response.type = matches[1];
        response.data = new Buffer(matches[2], 'base64');

        return response;
    }

    /* Take a snaps */

    takeSnap = () => {
        console.log("WEB", WebCamera.loaded)
        if (WebCamera.loaded) {
            WebCamera.snap((data_uri) => {
                let imageBuffer = this.processBase64Image(data_uri)

                if (!imageBuffer) {
                    let timeoutId = setTimeout(this.takeSnap, 2000)
                    this.setState({ timeoutId: timeoutId })
                    return
                }
                let userAppDataPath = app.getPath('appData')
                let dataDir = userAppDataPath + "/" + "FaceToFaceData/current"
                let exists = electronFs.existsSync(userAppDataPath)
                let existsUserDataDir = electronFs.existsSync(dataDir)
                if ((!exists || !existsUserDataDir) && electronFs.mkdirSync(dataDir)) {
                    console.log("User data folder created")
                }

                let fileName = 'logincapture';
                let completePath = dataDir + "/" + fileName + ".jpg"

                electronFs.writeFile(completePath, imageBuffer.data, (err) => {
                    if (err) {
                        Swal.fire('Error', err, 'error')
                    }
                    console.log("captured your face")
                    clearTimeout(this.state.timeoutId)
                    this.setState({ timeoutId: null })

                    this.initDetection(completePath, userAppDataPath + "/" + "FaceToFaceData/")
                })
            })

            return
        }
        let timeoutId = setTimeout(this.takeSnap, 100)
        this.setState({ timeoutId: timeoutId })
    }

    mountCamera = () => {
        WebCamera.attach('#camera');
        WebCamera.set({
            width: '25rem',
            height: '15rem',
            // dest_height: 768,
            // dest_width: 1024,
            image_format: 'jpeg',
            jpeg_quality: 100,
            force_flash: false,
            flip_horiz: true,
            fps: 45
        })

    }


    render() {
        return (
            <>
                {/* <img id='imgFile' src=''></img> */}
                <div style={{ textAlign: 'center' }}>
                    <Grid container style={{ textAlign: 'center' }}>
                        <Grid item xs={12} style={{ textAlign: 'center', fontFamily: 'Roboto' }}>
                            <h2 style={{ color: 'white', padding: 0 }}>{strings.appName}</h2>
                        </Grid>
                        <Grid item xs={12} style={{ textAlign: 'center', fontFamily: 'Roboto' }}>
                            <h4 style={{ color: '#BDBDBD', padding: 0 }}>{strings.subtitle}</h4>
                        </Grid>
                        <Grid item xs={12} style={{ textAlign: 'center' }}>
                            <img src={BioMetricImg} width='300' height='250'></img>
                        </Grid>
                        <Grid item xs={12} style={{ textAlign: 'center' }}>
                            {
                                this.state.isAnalizing
                                    ? <h4 style={{ color: '#BDBDBD', padding: 0, fontFamily: 'Roboto' }}>{strings.detectDescription}</h4>
                                    : this.state.isRetrying
                                        ? <h4 style={{ color: '#BDBDBD', padding: 0, fontFamily: 'Roboto' }}>{strings.retrying}</h4>
                                        : this.state.isValidUser
                                            ? <h4 style={{ color: '#8BC34A', padding: 0, fontFamily: 'Roboto' }}>{strings.authorized}</h4>
                                            : <h4 style={{ color: 'red', padding: 0, fontFamily: 'Roboto' }}>{strings.intrusion}: {this.state.intrusionMessage}</h4>
                            }
                        </Grid>
                        <Grid item xs={12} style={{ textAlign: 'center', fontFamily: 'Roboto', padding: '1rem' }}>
                            <div style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid #333333', display: 'inline-flex' }}>
                                <div id="camera" style={{ width: '25rem', height: '16rem', textAlign: 'center', margin: '0 auto' }}/>
                            </div>
                        </Grid>
                    </Grid>

                    {/* <Button color='primary' onClick={() => { this.initDetection() }}>Detect</Button> */}
                </div>
            </>
        )
    }
}