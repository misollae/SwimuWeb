const express = require('express');
const server = express();
const port = 3000;
const http = require('http').Server(server);
const { SerialPort } = require('serialport')

const serialPort = new SerialPort({path: 'COM10', baudRate: 9600 }, function (err) {
  if (err) {
    return console.log('Error: ', err.message)
  }
})


server.get('/', (req, res) => {
  res.send('Hello World!')
})


function requestFile(){
    let file_name = document.getElementById(file_name)
    serialPort.write(file_name)
    // server.get('/', (req, res) => {
    //     res.send(file_name)
    // })
}


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
