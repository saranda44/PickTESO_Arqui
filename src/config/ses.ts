import { SESClient } from '@aws-sdk/client-ses';

// =========================================================
// AWS SES Client
// Credentials are loaded from environment variables:
//   AWS_ACCESS_KEY_ID
//   AWS_SECRET_ACCESS_KEY
//   AWS_REGION
// =========================================================

const sesClient = new SESClient({
  region: process.env.AWS_REGION ?? 'us-east-2',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
});

export default sesClient;