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
    <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; background-color: #050508; background-image: linear-gradient(to bottom, rgba(5, 5, 8, 0.75), rgba(5, 5, 8, 0.95)), url('${activeArtwork}'); background-size: cover; background-position: center; color: #e2e8f0; padding: 20px; text-align: center;">
      <!-- Main Card Container -->
      <div style="max-width: 600px; margin: 0 auto; background-color: rgba(13, 15, 22, 0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; padding: 30px 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        
        <!-- Header: Logo & App Title -->
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="margin-bottom: 8px;">
            <img src="https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/flute-icon.png" alt="Flute Logo" style="width: 32px; height: 32px; filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.5)); vertical-align: middle; margin-right: 8px;" />
            <span style="font-size: 24px; font-weight: 700; color: #d4af37; font-family: 'Georgia', serif; vertical-align: middle;">कृष्णबोध</span>
          </div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 3px; font-family: 'Cinzel', serif;">Krishna Bodha</div>
        </div>

        <!-- Meta Chapter & Verse -->
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #fbbf24; font-size: 14px; margin: 0; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Chapter ${shloka.chapter}, Verse ${shloka.verse}</h2>
        </div>

        <!-- Sanskrit & Transliteration -->
        <div style="margin-bottom: 30px;">
          <div style="font-size: 22px; font-weight: bold; color: #fbbf24; line-height: 1.6; margin-bottom: 10px; font-family: 'Rozha One', 'Georgia', serif; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">
            ${shloka.sanskrit}
          </div>
          <div style="font-size: 14px; font-style: italic; color: #9ca3af; line-height: 1.5;">
            ${reflection.translatedTransliteration || shloka.transliteration}
          </div>
        </div>

        <!-- Translation Box -->
        <div style="background-color: rgba(25, 28, 43, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; margin-bottom: 30px; text-align: left;">
          <div style="font-size: 11px; color: #fbbf24; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Translation</div>
          <p style="font-size: 15px; color: #ffffff; line-height: 1.6; margin: 0;">${reflection.translatedTranslation || shloka.translation}</p>
        </div>

        <!-- AI Deep Understanding -->
        <div style="text-align: left;">
          <h3 style="color: #fbbf24; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 10px;">
            ✨ AI Deep Understanding
          </h3>

          <!-- Reflection Cards (Stacked for Email Compatibility) -->
          <div style="background-color: rgba(18, 20, 31, 0.5); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 15px; margin-bottom: 15px;">
            <div style="color: #f59e0b; font-size: 13px; font-weight: 600; margin-bottom: 8px;">🧠 Modern Relevance</div>
            <p style="font-size: 14px; color: #e5e7eb; line-height: 1.5; margin: 0;">${reflection.modernReflection}</p>
          </div>

          <div style="background-color: rgba(18, 20, 31, 0.5); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 15px; margin-bottom: 15px;">
            <div style="color: #f59e0b; font-size: 13px; font-weight: 600; margin-bottom: 8px;">❤️ Emotional Well-being</div>
            <p style="font-size: 14px; color: #e5e7eb; line-height: 1.5; margin: 0;">${reflection.emotionalWellbeing}</p>
          </div>

          <div style="background-color: rgba(18, 20, 31, 0.5); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 15px; margin-bottom: 25px;">
            <div style="color: #f59e0b; font-size: 13px; font-weight: 600; margin-bottom: 8px;">💼 Career & Focus</div>
            <p style="font-size: 14px; color: #e5e7eb; line-height: 1.5; margin: 0;">${reflection.careerApplication}</p>
          </div>

          <!-- Mindfulness Banner -->
          <div style="background-color: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 10px; padding: 15px; text-align: center;">
            <div style="font-size: 20px; margin-bottom: 8px;">🧘</div>
            <div style="color: #fbbf24; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Mindful Practice for Today</div>
            <p style="font-size: 14px; color: #ffffff; font-style: italic; margin: 0;">"${reflection.mindfulnessTip}"</p>
          </div>
        </div>

      </div>

      <!-- Footer / Watermark -->
      <div style="text-align: center; margin-top: 30px;">
        <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 600; color: #d4af37; letter-spacing: 1px; text-shadow: 0 2px 6px rgba(0,0,0,0.5); margin-bottom: 6px;">
          श्रीकृष्णार्पणमस्तु
        </div>
        <div style="font-size: 12px; color: rgba(255,255,255,0.5); letter-spacing: 1px; text-transform: uppercase; font-weight: 500; margin-bottom: 15px;">
          <a href="https://www.linkedin.com/in/sameer-joshi-691457146/" target="_blank" style="color: inherit; text-decoration: none;">By Sameer Joshi</a>
        </div>
        
        <div style="font-size: 11px; color: #6b7280; line-height: 1.5;">
          You received this because you subscribed to daily reflections.
        </div>
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

export const sendFeedbackEmail = async (userEmail, guidanceRating, appRating, suggestions) => {
  const subject = `New Feedback Received for Krishna Bodha`;
  const fromEmail = userEmail || 'Anonymous User';
  
  const htmlContent = `
    <div style="font-family: 'Inter', Arial, sans-serif; background-color: #050508; color: #e2e8f0; padding: 20px; text-align: left;">
      <div style="max-width: 600px; margin: 0 auto; background-color: rgba(13, 15, 22, 0.9); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; padding: 30px;">
        <h2 style="color: #fbbf24; text-align: center; margin-bottom: 25px;">New User Feedback</h2>
        
        <div style="margin-bottom: 20px;">
          <strong style="color: #d4af37;">From:</strong> ${fromEmail}
        </div>
        
        <div style="margin-bottom: 20px; background-color: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
          <div style="margin-bottom: 10px;">
            <strong style="color: #fbbf24;">Guidance Accuracy Rating:</strong> ${guidanceRating} / 5
          </div>
          <div>
            <strong style="color: #fbbf24;">Overall App Experience:</strong> ${appRating} / 5
          </div>
        </div>

        <div style="background-color: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
          <strong style="color: #fbbf24; display: block; margin-bottom: 10px;">Suggestions / Improvements:</strong>
          <p style="white-space: pre-wrap; margin: 0; color: #e5e7eb;">${suggestions || 'No suggestions provided.'}</p>
        </div>
      </div>
    </div>
  `;

  // Send to the admin's email (using the EMAIL_USER address)
  const toEmail = process.env.EMAIL_USER;

  if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_PUBLIC_KEY) {
    try {
      console.log(`[Mailer] Sending feedback email using EmailJS HTTP API...`);
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_FEEDBACK_TEMPLATE_ID,
          user_id: process.env.EMAILJS_PUBLIC_KEY,
          accessToken: process.env.EMAILJS_PRIVATE_KEY,
          template_params: {
            userEmail: fromEmail,
            guidanceRating: guidanceRating,
            appRating: appRating,
            suggestions: suggestions || 'None'
          }
        })
      });

      if (response.ok) {
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
      console.log(`[Mailer] Sending feedback email using Resend HTTP API...`);
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
    return { success: false, error: 'Email configuration is missing on the server.' };
  }

  try {
    const mailOptions = {
      from: `"Krishna Bodha Feedback" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error(`[Mailer] Error sending feedback email:`, error);
    return { success: false, error: error.message };
  }
};
