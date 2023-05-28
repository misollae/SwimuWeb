import { saveToServer } from "./aws-utils.js";
import express from "express";
import bodyParser from "body-parser";
const server = express();
const jsonParser = bodyParser.json();
const port = 3000;
import { createServer } from "http";
const http = createServer(server);
import { SerialPort } from "serialport";

const serialPort = new SerialPort({ path: "COM10", baudRate: 9600 });

server.post("/SwimuWeb", jsonParser, (req, res) => {
  sendFileRequest(req.body.file_name);
  res.send();
});

server.get("/SwimuWeb/FileList", jsonParser, (req, res) => {
  serialPort.removeAllListeners();
  serialPort.write("Show file list", function (err) {
    if (err) {
      return console.log("Error on write: ", err.message);
    }
    console.log("Asked for file list.");
  });

  let fileList = [];

  const timeoutNoResponse = setTimeout(() => {
    serialPort.removeAllListeners();
    res.status(500).send("Server Error Response");
  }, 5000);

  serialPort.addListener("data", function (data) {
    let message = data.toString();
    if (message.localeCompare("End of list") != 0) {
      var messages = message.split('\r\n')
      messages.forEach(m => {
        m = m.trim().replace(/\s+/g, " ");
        if (m != "" && m != "Files:") fileList.push(m)
      });
    } else {
      serialPort.removeAllListeners();
      clearTimeout(timeoutNoResponse);
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(fileList));
      transferFilesSequentially(fileList);
    }
  });
});

async function transferFilesSequentially(fileList) {
  for (const fileName of fileList) {
    try {
      await sendFileRequest(fileName);
      console.log("File transferred successfully: " + fileName);
    } catch (error) {
      console.log("Error occurred during file transfer: ", error);
      break; // Stop transferring files if an error occurs
    }
  }
  console.log("All files transferred successfully");
}


function sendFileRequest(fileName) {
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
            saveToServer(fileName.replace(/\//g, "") + ".txt", content);
            serialPort.removeAllListeners();
            resolve();
          } else {
            content += message.trim().replace(/\s+/g, " ") + "\n";
          }
        });
      }
    });
  });
}

http.listen(port, function () {
  console.log("Server listening on *:3000");
});
