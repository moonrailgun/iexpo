import { env } from "@/env";
import {
  S3Client,
  PutObjectCommand,
  type PutObjectCommandInput,
  type PutObjectCommandOutput,
} from "@aws-sdk/client-s3";
import mime from "mime";
import path from "path";

const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

export async function uploadFile(
  key: string,
  buffer: Buffer,
): Promise<PutObjectCommandOutput> {
  try {
    const mimeType = mime.getType(path.extname(key));

    const uploadParams = {
      Bucket: env.S3_BUCKET_NAME,
      Key: key, // 文件存储在 S3 上的路径
      Body: buffer,
      ContentType: mimeType ?? undefined,
    } satisfies PutObjectCommandInput;

    const command = new PutObjectCommand(uploadParams);
    const response = await s3Client.send(command);
    console.log("Upload Success", response);

    return response;
  } catch (err) {
    console.error("Upload Error", err);

    throw err;
  }
}
