import React, { Component } from "react";
import Grid from "@material-ui/core/Grid";
import AppLogo from "../Assets/biometrics.png";
import strings from "../strings/Strings";
import Button from "@material-ui/core/Button";
import moment from "moment";
import Swal from "sweetalert2";
import hash from "hash.js";
const { dialog, app } = window.require("electron").remote;
const remote = window.require("electron").remote;
const electronFs = remote.require("fs");
const path = remote.require("path");
const WebCamera = require("webcamjs");

/* Settings class to import images of faces */

export default class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      camEnabled: false,
    };
  }

  componentDidUpdate() {
    if (this.state.camEnabled) {
      WebCamera.attach("#camera");
      WebCamera.set({
        width: "25rem",
        height: "15rem",
        image_format: "jpeg",
        jpeg_quality: 100,
        force_flash: false,
        flip_horiz: true,
        fps: 45,
      });
      console.log("The camera has been started");
    } else {
      WebCamera.reset();
      console.log("The camera has been disabled");
    }
  }

  /* Get images selected and copy these images to the path appData/FaceToFaceData/ */
  copyImageFiles = (filePaths) => {
    let userAppDataPath = app.getPath("appData");
    let dataDir = userAppDataPath + "/" + "FaceToFaceData";
    let exists = electronFs.existsSync(userAppDataPath);
    let existsUserDataDir = electronFs.existsSync(dataDir);
    if (!exists && !existsUserDataDir && electronFs.mkdirSync(dataDir)) {
      console.log("User data folder created");
    }
    for (let file of filePaths) {
      electronFs.copyFileSync(file, dataDir + "/" + path.parse(file).base);
    }
    Swal.fire(strings.fileCopied, strings.fileCopiedDescr, "success");
  };

  /* Handle selected images */
  handleFileSelect = (e) => {
    dialog
      .showOpenDialog({
        properties: [strings.fileChooserTitle, "multiSelections"],
        filters: [
          { name: "jpg", extensions: ["jpg"] },
          { name: "png", extensions: ["png"] },
        ],
      })
      .then((res) => {
        if (res.canceled) {
          console.debug("canceled");
          return;
        }
        this.copyImageFiles(res.filePaths);
        return;
      })
      .catch((err) => {
        return alert(err);
      });
  };

  enableDisableCamera = () => {
    this.setState({ camEnabled: !this.state.camEnabled });
  };

  capture = () => {
    WebCamera.snap((data_uri) => {
      let imageBuffer = this.processBase64Image(data_uri);
      let userAppDataPath = app.getPath("appData");
      let fileName = hash
        .sha256()
        .update(moment().toISOString())
        .digest("hex")
        .toString()
        .slice(0, 6);
      let dataDir = userAppDataPath + "/" + "FaceToFaceData";

      let exists = electronFs.existsSync(userAppDataPath);
      let existsUserDataDir = electronFs.existsSync(dataDir);
      if ((!exists || !existsUserDataDir) && electronFs.mkdirSync(dataDir)) {
        console.log("User data folder created");
      }

      electronFs.writeFile(
        dataDir + "/" + fileName + ".jpg",
        imageBuffer.data,
        (err) => {
          if (err) {
            console.log(err);
            Swal.fire("Error", err, "error");
          } else {
            Swal.fire("Success", strings.snapSuccess, "success");
          }
        }
      );
    });
    console.log("Captured!");
  };

  processBase64Image = (dataString) => {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
      response = {};

    if (matches.length !== 3) {
      return new Error("Invalid input string");
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], "base64");

    return response;
  };

  /* Delete all photos saved */

  deleteAllMedias = () => {
    let userAppDataPath = app.getPath("appData");
    let dataDir = userAppDataPath + "/" + "FaceToFaceData";
    electronFs.readdir(dataDir, (err, files) => {
      if (err) {
        return Swal.fire("Error", err, "error");
      }
      let errors = [];

      files.forEach((file) => {
        if (!electronFs.lstatSync(dataDir + "/" + file).isDirectory()) {
          electronFs.unlink(dataDir + "/" + file, (err) => {
            if (err) {
              console.log("ERROR ", err);
              errors.push(err);
            }
          });
        }
        // console.log(file, electronFs.lstatSync(dataDir + "/" + file).isDirectory())
      });
      if (errors && errors.length > 0) {
        Swal.fire("Errors occurred", errors, "error");
      }
      Swal.fire("Success", strings.deleteSuccess, "success");
    });
  };

  render() {
    return (
      <>
        <div style={{ textAlign: "center" }}>
          <Grid container style={{ textAlign: "center" }}>
            <Grid item xs={12} style={{ textAlign: "center" }}>
              <img  alt='logo' src={AppLogo} width="200" height="200"></img>
            </Grid>
            <Grid
              item
              xs={12}
              style={{ textAlign: "center", fontFamily: "Roboto" }}
            >
              <h2 style={{ color: "white", padding: 0 }}>{strings.appName}</h2>
            </Grid>
            <Grid
              item
              xs={12}
              style={{ textAlign: "center", fontFamily: "Roboto" }}
            >
              <h4
                style={{
                  color: "#EEEEEE",
                  padding: 0,
                  fontStyle: "italic",
                  margin: 0,
                }}
              >
                {strings.description}
              </h4>
            </Grid>
            <Grid
              item
              xs={12}
              style={{
                textAlign: "center",
                fontFamily: "Roboto",
                padding: "1rem",
              }}
            >
              <Button
                variant={"outlined"}
                color="primary"
                onClick={this.handleFileSelect}
              >
                {strings.buttonUpload}
              </Button>
              <Button
                style={{
                  marginLeft: "1rem",
                  color: "orange",
                  borderColor: "orange",
                }}
                variant={"outlined"}
                onClick={this.deleteAllMedias}
              >
                {strings.deleteMedia}
              </Button>
            </Grid>
            <Grid
              item
              xs={12}
              style={{
                textAlign: "center",
                fontFamily: "Roboto",
                padding: "1rem",
              }}
            >
              <Button
                variant={"outlined"}
                color={this.state.camEnabled ? "secondary" : "primary"}
                onClick={this.enableDisableCamera}
              >
                {this.state.camEnabled ? strings.disable : strings.capture}
              </Button>
            </Grid>

            <Grid
              item
              xs={12}
              style={{
                textAlign: "center",
                fontFamily: "Roboto",
                padding: "1rem",
              }}
            >
              <div
                style={
                  this.state.camEnabled
                    ? {
                        padding: "0.5rem",
                        borderRadius: "10px",
                        border: this.state.camEnabled
                          ? "1px solid #333333"
                          : "0px",
                        display: "inline-flex",
                      }
                    : null
                }
              >
                {this.state.camEnabled ? (
                  <div
                    id="camera"
                    style={{
                      width: "25rem",
                      height: "16rem",
                      textAlign: "center",
                      margin: "0 auto",
                    }}
                  ></div>
                ) : (
                  <></>
                )}
                <Button
                  variant={"contained"}
                  color="primary"
                  onClick={this.capture}
                  style={
                    !this.state.camEnabled
                      ? { display: "none" }
                      : { margin: "1rem" }
                  }
                >
                  {strings.take}
                </Button>
              </div>
            </Grid>
          </Grid>
        </div>
      </>
    );
  }
}
