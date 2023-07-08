import { SerialPort } from "serialport";
import { saveToServer} from "./aws-utils.js";
import { getNumStrokes } from "./data-utils.js";

var connectionInterval;

export function serialStart(){
    connectionInterval = setInterval(monitorPortConnection, 5000);
}

async function checkPortConnection(portName) {
    return new Promise((resolve, reject) => {
      SerialPort.list().then((ports) => {
        const connectedPort = ports.find((port) => port.path === portName);
        if (connectedPort) {
          resolve(true);
        } else {
          resolve(false); 
        }
      }).catch((err) => {
        reject(err);
      });
    });
  }
  
  let serialPort = null;
  async function monitorPortConnection() {
    checkPortConnection('COM6').then((connected) => {
      if (connected) {
        clearInterval(connectionInterval);
        serialPort = new SerialPort({ path: "COM6", baudRate: 115200 });
        getSerialFileList();
      }
    }).catch((err) => {
      console.error('Error:', err.message);
    });
  }
  
  function getSerialFileList() {
    serialPort.removeAllListeners();
    serialPort.write("Show file list", function (err) {
      if (err) {
        return console.log("Error on write: ", err.message);
      }
      console.log("Asked for file list.");
    });
  
    let fileList = [];
    serialPort.addListener("data", function (data) {
      let message = data.toString();
      if (message.localeCompare("End of list") != 0) {
        var messages = message.split('\r\n');
        messages.forEach(m => {
          m = m.trim().replace(/\s+/g, " ");
          if (m != "" && m != "Files:") fileList.push(m);
          console.log(m)
        });
      } else {
        serialPort.removeAllListeners();
        transferFilesSequentiallyArduino(fileList);
      }
    });
  }
  
  async function transferFilesSequentiallyArduino(fileList) {
    for (const fileName of fileList) {
      try {
        console.log("Hi");
        await sendSerialFileRequest(fileName);
        console.log("File transferred successfully: " + fileName);
      } catch (error) {
        console.log("Error occurred during file transfer: ", error);
        break; 
      }
    }
    console.log("All files transferred successfully");
  }
  
  function sendSerialFileRequest(fileName) {
    console.log("ask for: " + fileName);
    return new Promise((resolve, reject) => {
      serialPort.removeAllListeners();
  
      serialPort.write(fileName, function (err) {
        if (err) {
          console.log("Error on write: ", err.message);
          reject(err);
        } else {
          var content = "";
          serialPort.addListener("data", function (data) {
            let message = data.toString();
            if (message.includes("End of file")) {
              let formattedContent = formatContent(content)
              saveToServer("swimu-raw", fileName.replace(/\//g, "") + ".txt", content);
              console.log(getNumStrokes(formattedContent));
              saveToServer("swimu-treated", fileName.replace(/\//g, "") + ".txt", JSON.stringify(getNumStrokes(formattedContent)));
              serialPort.removeAllListeners();
              resolve();
            } else {
              content += message.replace(/[ \t\r\n]+/g, " "); //.trim().replace(/\s+/g, " ");
            }
          });
        }
      });
    });
  }  

  function formatContent(data) {
    const values = data.split(";").join(" ").split(" ").filter(Boolean);
    const numRows = values.length / 4;
    const result = [];
  
    for (let i = 1; i < numRows; i++) {
      const obj = {
        timestamp: values[i * 4],
        roll: String(Math.abs(parseFloat(values[i * 4 + 1]))),
        pitch: values[i * 4 + 2],
        yaw: values[i * 4 + 3],
      };
      result.push(obj);
    }
    return result;
  }