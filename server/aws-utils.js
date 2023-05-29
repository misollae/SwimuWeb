// Import required AWS SDK clients and commands for Node.js.
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../libs/aws-client.js";

async function saveToServer(filename, content) {
  const params = {
    Bucket: "swimu",
    Key: filename,
    Body: content,
  };

  try {
    const results = await s3Client.send(new PutObjectCommand(params));
    console.log(
        "Successfully created " +
        params.Key +
        " and uploaded it to " +
        params.Bucket +
        "/" +
        params.Key
    );
    return results; 
  } catch (err) {
    console.log("Error", err);
  }
}

async function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

async function getFromServer(filename) {
  const params = {
    Bucket: "swimu",
    Key: filename,
  };

  try {
    const response = await s3Client.send(new GetObjectCommand(params));
    const fileContent = await streamToString(response.Body);
    return formatContent(fileContent);
  } catch (err) {
    console.log("Error", err);
  }
}

function formatContent(data){
  const values  = data.split('; ').join(' ').split(' ').filter(Boolean);
  const numRows = values.length / 4;
  const result  = [];

  for (let i = 1; i < numRows; i++) {
    const obj = {
      timestamp: values[i * 4],
      roll:      values[i * 4 + 1],
      pitch:     values[i * 4 + 2],
      yaw:       values[i * 4 + 3]
    };
    result.push(obj);
  }
  return result;
}

export { saveToServer, getFromServer };