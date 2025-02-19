import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { S3Event } from 'aws-lambda';

const client = new S3Client();

export const handler = async (event: S3Event) => {
  // Get the object from the event and show its content type
  console.log('event:', JSON.stringify(event));
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, ' ')
  );

  try {
    const { ContentType } = await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    console.log('CONTENT TYPE:', ContentType);
    return ContentType;
  } catch (err) {
    console.log(err);
    const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
    console.log(message);
    throw new Error(message);
  }
};
