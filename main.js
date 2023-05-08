const express = require('express');
const server = express();
const port = 3000;
const http = require('http').Server(server);
const { SerialPort } = require('serialport')

server.get('/', (req, res) => {
  res.send('Hello World!')
})

const serialPort = new SerialPort({path: 'COM10', baudRate: 9600 }, function (err) {
  if (err) {
    return console.log('Error: ', err.message)
  }
})

serialPort.write('Begin transfer', function(err) {
  if (err) {
    return console.log('Error on write: ', err.message)
  }
  console.log('message written')
})

serialPort.on('data', function(data) {
  var message = data.toString(); 
  if (message.includes("Ready")) { 
  }

});
