import {
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand
} from "@aws-sdk/client-s3";
import { s3Client } from "../libs/aws-client.js";

/*** Saving to Cloud ***/
async function saveToServer(bucketname, filename, content) {
  const params = {
    Bucket: bucketname,
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

/*** Getting from Cloud ***/
async function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

async function getFromServer(bucketname, filename) {
  const params = {
    Bucket: bucketname,
    Key: filename,
  };

  try {
    const response = await s3Client.send(new GetObjectCommand(params));
    const fileContent = await streamToString(response.Body);
    const reply = formatContent(fileContent);
    return formatContent(fileContent);
  } catch (err) {
    console.log("Error", err);
  }
}

/*** Deleting from Cloud ***/
async function deleteFromServer(filename) {
  const params = {
    Bucket: "swimu",
    Key: filename,
  };

  try {
    const results = await s3Client.send(new DeleteObjectCommand(params));
    console.log("Successfully deleted " + params.Key + " from " + params.Bucket);
    return results;
  } catch (err) {
    console.log("Error", err);
  }
}

function formatContent(data) {
  const values = data.split(";").join(" ").split(" ").filter(Boolean);
  const numRows = values.length / 4;
  const result = [];

  for (let i = 1; i < numRows; i++) {
    const obj = {
      timestamp: values[i * 4],
      roll: values[i * 4 + 1],
      pitch: values[i * 4 + 2],
      yaw: values[i * 4 + 3],
    };
    result.push(obj);
  }
  return result;
}

/*** Listing from Cloud ***/
async function listServerFiles() {
  const params = {
    Bucket: "swimu",
  };

  try {
    const response = await s3Client.send(new ListObjectsV2Command(params));
    const files = response.Contents.map((file) => file.Key);
    return files;
  } catch (err) {
    console.log("Error", err);
  }
}

export { saveToServer, getFromServer, deleteFromServer, listServerFiles };
