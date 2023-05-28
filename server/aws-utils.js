// Import required AWS SDK clients and commands for Node.js.
import { PutObjectCommand } from "@aws-sdk/client-s3";
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



export { saveToServer };
