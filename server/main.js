
import express from "express";
import bodyParser from "body-parser";
const server = express();
const jsonParser = bodyParser.json();
const port = 3000;
import { createServer } from "http";
import { serialStart } from "./serial-utils";

const http = createServer(server);
serialStart();



http.listen(port, function () {
  console.log("Server listening on *:3000");
});
