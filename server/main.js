const express = require('express');
var bodyParser = require('body-parser')
const server = express();
var jsonParser = bodyParser.json()
const port = 3000;
const http = require('http').Server(server);
const { SerialPort } = require('serialport')

const serialPort = new SerialPort({path: 'COM10', baudRate: 9600 }, function (err) {
  if (err) {
    return console.log('Error: ', err.message)
  }
})

function getFileList() {
  serialPort.write('Show file list', function(err) {
    if (err) {
      return console.log('Error on write: ', err.message)
    }
    console.log('Write // Asked for file list.')
  })
  
  let fileList = {}
  serialPort.on('data', function(data) {
    let message = data.toString()

    if (message.localeCompare("End of list") != 0 ) 
    { 
      let comps = message.split(" - ")
      if (comps.length == 2) {
        let fileNum  = comps[0].trim().replace(/\s+/g, '')
        let fileDate = comps[1].trim().replace(/\s+/g, '')
        fileList[fileNum] = fileDate
      }
    } 
    else 
    {
      serialPort.close(function(err) {
        if (err) {
          return console.log('Error on close: ', err.message)
        }
        console.log('Serial port closed.')
      })
  
     // console.log(fileList)
      return fileList
    }
  })
}

//getFileList()

server.post('/SwimuWeb', jsonParser, (req, res) => {
  sendFileRequest(req.body.file_name)
  res.send()
})

function sendFileRequest(fileName) {
  console.log(fileName)
  serialPort.write(fileName, function(err) {
    if (err) {
      return console.log('Error on write: ', err.message)
    }
    console.log('Asked for file')
  })

  serialPort.on('data', function(data) {
    let message = data.toString()
    console.log(message)
  })
}

http.listen(port, function(){
  console.log('Server listening on *:3000');
});
