import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = () => process.env.AWS_S3_BUCKET;

/**
 * Uploads a PDF buffer to S3.
 * @param {Buffer} buffer  - The PDF content
 * @param {string} key     - S3 object key e.g. "loa/teacherId.pdf"
 * @returns {Promise<string>} - The S3 key stored
 */
export const uploadPDF = async (buffer, key) => {
  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET(),
    Key:         key,
    Body:        buffer,
    ContentType: 'application/pdf',
  }));
  return key;
};

/**
 * Generates a short-lived pre-signed URL for a stored PDF (valid 10 minutes).
 * @param {string} key - S3 object key
 * @returns {Promise<string>} - Pre-signed URL
 */
export const getPresignedUrl = async (key) => {
  const command = new GetObjectCommand({ Bucket: BUCKET(), Key: key });
  return getSignedUrl(s3, command, { expiresIn: 600 }); // 10 minutes
};

/**
 * Deletes a PDF from S3. Non-throwing — logs error if fails.
 * @param {string} key - S3 object key
 */
export const deletePDF = async (key) => {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key }));
    console.log(`🗑️ S3 object deleted: ${key}`);
  } catch (err) {
    console.error(`❌ Failed to delete S3 object ${key}:`, err.message);
  }
};
