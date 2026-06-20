import dotenv from 'dotenv';
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const botUrl = `https://api.telegram.org/bot${token}`;

export const sendTelegramShloka = async (chatId, messageText, imageUrl) => {
  if (!token) {
    console.warn(`[Telegram] No TELEGRAM_BOT_TOKEN configured. Simulated message to ${chatId}`);
    return { success: true, simulated: true };
  }

  try {
    let response;
    if (imageUrl) {
      // Send Photo with caption
      response = await fetch(`${botUrl}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: imageUrl,
          caption: messageText,
          parse_mode: 'Markdown'
        })
      });
    } else {
      // Send plain text message
      response = await fetch(`${botUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: 'Markdown'
        })
      });
    }

    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.description || 'Failed to send message to Telegram');
    }

    console.log(`[Telegram] Message sent to ${chatId}. Message ID: ${data.result.message_id}`);
    return { success: true };
  } catch (error) {
    console.error(`[Telegram] Error sending message to ${chatId}:`, error);
    return { success: false, error: error.message };
  }
};

// Send a simple text confirmation
export const sendTelegramText = async (chatId, text) => {
  if (!token) return { success: true, simulated: true };
  try {
    const response = await fetch(`${botUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
    const data = await response.json();
    return { success: data.ok };
  } catch (e) {
    console.error(`[Telegram] Error sending text to ${chatId}`, e);
    return { success: false };
  }
};

let lastOffset = 0;
let pollingIntervalId = null;

export const startTelegramPolling = (onSubscribe) => {
  if (!token) {
    console.warn('[Telegram] No TELEGRAM_BOT_TOKEN set. Telegram bot polling will not start.');
    return;
  }

  console.log('[Telegram] Starting updates polling loop...');
  
  const pollUpdates = async () => {
    try {
      const response = await fetch(`${botUrl}/getUpdates?offset=${lastOffset}&timeout=30`);
      const data = await response.json();
      
      if (data.ok && data.result) {
        for (const update of data.result) {
          lastOffset = update.update_id + 1;
          
          const message = update.message;
          if (message && message.text) {
            const chatId = message.chat.id;
            const text = message.text.trim();
            
            // Check for /start <hex_email>
            if (text.startsWith('/start')) {
              const params = text.split(' ');
              if (params.length > 1) {
                const hexParam = params[1];
                try {
                  const email = Buffer.from(hexParam, 'hex').toString('utf8');
                  if (email.includes('@')) {
                    console.log(`[Telegram] Subscribing user ${email} with Chat ID ${chatId}`);
                    const success = await onSubscribe(email, chatId);
                    if (success) {
                      await sendTelegramText(chatId, `🪔 *Welcome to Krishna Bodha!* 🪔\n\nYou have successfully subscribed to receive daily wisdom and AI reflections directly in this chat at 6:00 AM every morning.\n\nType *shloka* at any time to receive a test shloka!`);
                    } else {
                      await sendTelegramText(chatId, `❌ *Subscription failed.*\n\nWe couldn't find a Krishna Bodha account for email: *${email}*. Please make sure you sign up on the website first!`);
                    }
                  }
                } catch (e) {
                  console.error(`[Telegram] Error decoding start parameters:`, e);
                  await sendTelegramText(chatId, `❌ *Oops!* Something went wrong processing your subscription link. Please try again from the website.`);
                }
              } else {
                await sendTelegramText(chatId, `🪔 *Welcome to Krishna Bodha!* 🪔\n\nTo link this Telegram chat with your website account, please click the *"Connect Telegram Bot"* link on your website settings page.`);
              }
            } else if (text.toLowerCase() === 'shloka') {
              // Trigger a manual test shloka
              onSubscribe(null, chatId, true); // flag to trigger test shloka send
            }
          }
        }
      }
    } catch (error) {
      // Avoid spamming the logs on network timeouts
      if (error.code !== 'ETIMEDOUT') {
        console.error('[Telegram] Error polling updates:', error);
      }
    }
  };

  // Run poll every 3 seconds
  pollingIntervalId = setInterval(pollUpdates, 3000);
};

export const stopTelegramPolling = () => {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
    console.log('[Telegram] Polling stopped.');
  }
};
