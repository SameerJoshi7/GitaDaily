import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using SMTP transport
let transporter;

if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // false for 587 (uses STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
  });
}

export const sendEmailOTP = async (toEmail, otp) => {
  // If EmailJS is configured, prioritize sending via HTTP (avoids SMTP blocks on Render)
  if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_PUBLIC_KEY) {
    try {
      console.log(`[Mailer] Sending OTP to ${toEmail} using EmailJS HTTP API...`);
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_OTP_TEMPLATE_ID,
          user_id: process.env.EMAILJS_PUBLIC_KEY,
          accessToken: process.env.EMAILJS_PRIVATE_KEY,
          template_params: {
            to_email: toEmail,
            otp: otp
          }
        })
      });

      if (response.ok) {
        console.log(`[Mailer] EmailJS OTP sent successfully to ${toEmail}`);
        return { success: true };
      } else {
        const errText = await response.text();
        throw new Error(errText || 'EmailJS API returned an error');
      }
    } catch (error) {
      console.error('[Mailer] EmailJS HTTP API error:', error);
      return { success: false, error: error.message };
    }
  }

  // If Resend API Key is configured, prioritize sending via HTTP (avoids Render SMTP block)
  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`[Mailer] Sending OTP to ${toEmail} using Resend HTTP API...`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Krishna Bodha <onboarding@resend.dev>',
          to: toEmail,
          subject: 'Your Krishna Bodha Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
              <h2><img src="https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/flute-icon.png" alt="Flute Logo" style="width: 28px; height: 28px; vertical-align: middle; margin-right: 8px;" />Krishna Bodha</h2>
              <p>Your verification code is:</p>
              <h1 style="color: #FACC15; font-size: 32px; letter-spacing: 4px;">${otp}</h1>
              <p>This code will expire in 5 minutes.</p>
            </div>
          `,
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[Mailer] Resend API successful: ${data.id}`);
        return { success: true };
      } else {
        throw new Error(data.message || 'Resend API returned an error');
      }
    } catch (error) {
      console.error('[Mailer] Resend HTTP API error:', error);
      return { success: false, error: error.message };
    }
  }

  if (!transporter) {
    console.error(`[Mailer] No EMAIL_USER and EMAIL_APP_PASSWORD configured. Cannot send OTP to ${toEmail}`);
    return { success: false, error: 'Email configuration is missing on the server. Please set EMAIL_USER and EMAIL_APP_PASSWORD in the .env file.' };
  }

  try {
    const mailOptions = {
      from: `"Krishna Bodha" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your Krishna Bodha Verification Code',
      text: `Your Krishna Bodha verification code is: ${otp}\n\nThis code will expire in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2><img src="https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/flute-icon.png" alt="Flute Logo" style="width: 28px; height: 28px; vertical-align: middle; margin-right: 8px;" />Krishna Bodha</h2>
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

export const sendDailyShlokaEmail = async (toEmail, shloka, reflection, language = 'english') => {
  const artworks = [
    'https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/images/chariot.jpg',
    'https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/images/discourse.jpg',
    'https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/images/vishwaroopa.jpg'
  ];
  const activeArtwork = artworks[(shloka.chapter + shloka.verse) % artworks.length];

  const subject = `🦚 Krishna Bodha Ch ${shloka.chapter}, Verse ${shloka.verse} (${language.toUpperCase()})`;

  const htmlContent = `
    <div style="font-family: 'Georgia', serif; background-color: #050508; color: #e2e8f0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #111116; border: 1px solid #1a1a24; border-radius: 12px; overflow: hidden;">
        <!-- Header -->
        <div style="background-color: rgba(212, 175, 55, 0.05); padding: 30px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.1);">
        <h1 style="color: #fbbf24; font-size: 24px; margin: 0; font-weight: 700; letter-spacing: 1px;"><img src="https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/flute-icon.png" alt="Flute Logo" style="width: 28px; height: 28px; vertical-align: middle; margin-right: 8px;" />Krishna Bodha <img src="https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/flute-icon.png" alt="Flute Logo" style="width: 28px; height: 28px; vertical-align: middle; margin-left: 8px;" /></h1>
        <p style="color: #9ca3af; font-size: 13px; margin: 5px 0 0 0;">Your Daily Dose of AI-Powered Reflection & Wisdom</p>
      </div>
      
      <div style="border-radius: 8px; overflow: hidden; margin-bottom: 20px; text-align: center;">
        <img src="${activeArtwork}" alt="Sacred Gita Art" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px;" />
      </div>

      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="color: #fbbf24; font-size: 20px; margin: 0 0 10px 0;">Chapter ${shloka.chapter}, Verse ${shloka.verse}</h2>
        <div style="font-size: 18px; font-style: italic; color: #f59e0b; line-height: 1.6; margin: 15px 0; font-family: 'Georgia', serif;">
          ${shloka.sanskrit}
        </div>
        <p style="font-size: 13px; color: #9ca3af; line-height: 1.5; margin: 0 0 5px 0;"><strong>Transliteration:</strong> ${reflection.translatedTransliteration || shloka.transliteration}</p>
        <p style="font-size: 15px; color: #fbbf24; line-height: 1.6; margin: 10px 0 0 0;"><strong>Translation:</strong> ${reflection.translatedTranslation || shloka.translation}</p>
      </div>

      <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;" />

      <div style="margin-bottom: 20px;">
        <h3 style="color: #f59e0b; font-size: 15px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">✨ AI Reflection</h3>
        <p style="font-size: 14px; color: #d1d5db; line-height: 1.6; margin: 0;">${reflection.modernReflection}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #f59e0b; font-size: 15px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">🧘 Emotional Well-being</h3>
        <p style="font-size: 14px; color: #d1d5db; line-height: 1.6; margin: 0;">${reflection.emotionalWellbeing}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #f59e0b; font-size: 15px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">💼 Career Application</h3>
        <p style="font-size: 14px; color: #d1d5db; line-height: 1.6; margin: 0;">${reflection.careerApplication}</p>
      </div>

      <div style="background-color: #1e1b4b; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
        <h3 style="color: #fbbf24; font-size: 13px; margin: 0 0 5px 0; text-transform: uppercase;">🌸 Daily Mindfulness Exercise</h3>
        <p style="font-size: 14px; color: #e0e7ff; line-height: 1.5; margin: 0; font-style: italic;">"${reflection.mindfulnessTip}"</p>
      </div>

      <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #6b7280; border-top: 1px solid #1f2937; padding-top: 15px;">
        <p style="margin: 0;">You received this because you subscribed to daily reflections from Krishna Bodha.</p>
        <p style="margin: 5px 0 0 0;">Made with ❤️ by <a href="https://www.linkedin.com/in/sameer-joshi-691457146/" target="_blank" style="color: #fbbf24; text-decoration: none; font-weight: 500;">Sameer Joshi</a> (<a href="https://github.com/SameerJoshi7" target="_blank" style="color: #fbbf24; text-decoration: none;">GitHub</a> | <a href="https://www.linkedin.com/in/sameer-joshi-691457146/" target="_blank" style="color: #fbbf24; text-decoration: none;">LinkedIn</a>)</p>
        <p style="margin: 5px 0 0 0;">Have a blessed day! 🌸</p>
      </div>
    </div>
  `;

  if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_PUBLIC_KEY) {
    try {
      console.log(`[Mailer] Sending daily email to ${toEmail} using EmailJS HTTP API...`);
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_SHLOKA_TEMPLATE_ID,
          user_id: process.env.EMAILJS_PUBLIC_KEY,
          accessToken: process.env.EMAILJS_PRIVATE_KEY,
          template_params: {
            to_email: toEmail,
            chapter: shloka.chapter,
            verse: shloka.verse,
            language: language.toUpperCase(),
            artwork: activeArtwork,
            sanskrit: shloka.sanskrit,
            transliteration: reflection.translatedTransliteration || shloka.transliteration,
            translation: reflection.translatedTranslation || shloka.translation,
            reflection: reflection.modernReflection,
            wellbeing: reflection.emotionalWellbeing,
            career: reflection.careerApplication,
            mindfulness: reflection.mindfulnessTip
          }
        })
      });

      if (response.ok) {
        console.log(`[Mailer] EmailJS Daily email sent successfully to ${toEmail}`);
        return { success: true };
      } else {
        const errText = await response.text();
        throw new Error(errText || 'EmailJS API returned an error');
      }
    } catch (error) {
      console.error('[Mailer] EmailJS HTTP API error:', error);
      return { success: false, error: error.message };
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`[Mailer] Sending daily email to ${toEmail} using Resend HTTP API...`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Krishna Bodha <onboarding@resend.dev>',
          to: toEmail,
          subject: subject,
          html: htmlContent
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[Mailer] Resend API successful: ${data.id}`);
        return { success: true };
      } else {
        throw new Error(data.message || 'Resend API returned an error');
      }
    } catch (error) {
      console.error('[Mailer] Resend HTTP API error:', error);
      return { success: false, error: error.message };
    }
  }

  if (!transporter) {
    console.error(`[Mailer] No EMAIL_USER and EMAIL_APP_PASSWORD configured. Cannot send daily email to ${toEmail}`);
    return { success: false, error: 'Email configuration is missing on the server.' };
  }

  try {
    const mailOptions = {
      from: `"Krishna Bodha" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      text: `Krishna Bodha Chapter ${shloka.chapter}, Verse ${shloka.verse}\n\nSanskrit:\n${shloka.sanskrit}\n\nTranslation:\n${reflection.translatedTranslation || shloka.translation}\n\nAI Reflection:\n${reflection.modernReflection}\n\nMindfulness Tip:\n${reflection.mindfulnessTip}`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Daily shloka email sent to ${toEmail}: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error(`[Mailer] Error sending daily shloka email to ${toEmail}:`, error);
    return { success: false, error: error.message };
  }
};
