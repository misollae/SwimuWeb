
import { getFromServer, listServerFiles } from "./aws-utils.js";
import { getNumStrokes } from "./data-utils.js";
import express from "express";
import bodyParser from "body-parser";
const server = express();
const jsonParser = bodyParser.json();
const port = 3000;
import { createServer } from "http";
import { serialStart } from "./serial-utils.js";

const http = createServer(server);
serialStart();

server.get("/SwimuWeb/SessionList", jsonParser, async (req, res) => {
  try {
    const fileList = await listServerFiles();
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(fileList));
  } catch (err) {
    console.log("Error", err);
    res.status(500).send("An error occurred while retrieving the file list.");
  }
});

server.post("/SwimuWeb/ShowSession", jsonParser, async (req, res) => {
  try {
    const values = await getFromServer(req.body.filename);
    res.setHeader("Content-Type", "application/json");    
    const numStrokes = getNumStrokes(values);
    res.send(JSON.stringify(numStrokes));
  } catch (err) {
    console.log("Error", err);
    res.status(500).send("An error occurred while retrieving the file.");
  }

});

http.listen(port, function () {
  console.log("Server listening on *:3000");
});
