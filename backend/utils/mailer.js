import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using SMTP transport
let transporter;

if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this if using another provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
}

export const sendEmailOTP = async (toEmail, otp) => {
  if (!transporter) {
    console.warn(`[Mailer] No EMAIL_USER and EMAIL_APP_PASSWORD configured. Simulated OTP for ${toEmail}: ${otp}`);
    return { success: true, simulated: true };
  }

  try {
    const mailOptions = {
      from: `"GitaDaily" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your GitaDaily Verification Code',
      text: `Your GitaDaily verification code is: ${otp}\n\nThis code will expire in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2>🪔 GitaDaily</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #FACC15; font-size: 32px; letter-spacing: 4px;">${otp}</h1>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Email sent to ${toEmail}: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error(`[Mailer] Error sending email to ${toEmail}:`, error);
    return { success: false, error: error.message };
  }
};
