import nodemailer from 'nodemailer';

// =========================================================
// Nodemailer SMTP transporter
// Credentials loaded from environment variables:
//   SMTP_HOST
//   SMTP_PORT
//   SMTP_USER
//   SMTP_PASS
// =========================================================

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default transporter;
