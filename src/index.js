// Hesabyar Bot with Pollinations.ai - Cloudflare Worker Entry Point

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // بررسی متد درخواست (فقط POST برای وب‌هوک تلگرام مجاز است)
    if (request.method === "POST") {
      try {
        const update = await request.json();
        
        // پردازش آپدیت‌های تلگرام
        // استفاده از ctx.waitUntil برای جلوگیری از تایم‌اوت شدن وب‌هوک تلگرام
        ctx.waitUntil(handleUpdate(update, env));
        
        return new Response("OK", { status: 200 });
      } catch (error) {
        console.error("Error processing update:", error);
        return new Response("Internal Server Error", { status: 500 });
      }
    }
    
    // پاسخ به درخواست‌های GET (برای تست)
    if (request.method === "GET") {
      return new Response("AI Bot is running!", { 
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }
    
    return new Response("Method not allowed", { status: 405 });
  }
};

async function handleUpdate(update, env) {
  // بررسی وجود پیام و متن متنی (برای جلوگیری از خطای عکس و استیکر)
  if (update.message && update.message.text) {
    const chatId = update.message.chat.id;
    const text = update.message.text;
    const botToken = env.TELEGRAM_BOT_TOKEN;
    
    // ۱. ارسال وضعیت "در حال تایپ..." به کاربر
    await sendChatAction(chatId, "typing", botToken);

    try {
      // ۲. دریافت پاسخ از هوش مصنوعی Pollinations
      const aiResponse = await getPollinationsResponse(text);
      
      // ۳. ارسال پاسخ هوش مصنوعی به کاربر
      await sendMessage(chatId, aiResponse, botToken);
    } catch (error) {
      console.error("AI API Error:", error);
      await sendMessage(chatId, "❌ متاسفانه در ارتباط با هوش مصنوعی خطایی رخ داد. لطفا دوباره تلاش کنید.", botToken);
    }
  }
}

// تابع ارتباط با API متنی Pollinations
async function getPollinationsResponse(prompt) {
  // استفاده از اندپوینت متنی Pollinations
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Pollinations API Error: ${response.status}`);
  }
  
  // خروجی به صورت متن ساده (Plain text) برمی‌گردد
  return await response.text();
}

// تابع ارسال پیام در تلگرام
async function sendMessage(chatId, text, botToken) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown" // پشتیبانی از ظاهر شدن بولد و ایتالیک در پیام
    })
  });
}

// تابع ارسال اکشن (مثل در حال تایپ کردن)
async function sendChatAction(chatId, action, botToken) {
  const url = `https://api.telegram.org/bot${botToken}/sendChatAction`;
  
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      action: action
    })
  });
}
