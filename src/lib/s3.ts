import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function uploadToS3(file: File) {
  try {
    const s3 = new S3Client({
      region: 'ap-south-1',
      credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
      }
    });

    const file_key = 'uploads/' + Date.now().toString() + file.name.replace(/\s+/g, '-');
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
      Key: file_key,
      Body: uint8Array,
    });

    await s3.send(command);
    console.log("Successfully uploaded to S3!", file_key);

    return {
      file_key,
      file_name: file.name,
    };

  } catch (error) {
    console.error("Upload failed:", error);
    throw new Error("S3 upload failed: " + (error as Error).message);
  }
}

export function getS3Url(file_key: string) {
  const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.ap-southeast-1.amazonaws.com/${file_key}`;
  return url;
}