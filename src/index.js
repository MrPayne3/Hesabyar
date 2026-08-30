// Hesabyar Bot - Cloudflare Worker Entry Point

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // بررسی متد درخواست (فقط POST برای وب‌هوک تلگرام مجاز است)
    if (request.method === "POST") {
      try {
        const update = await request.json();
        
        // پردازش آپدیت‌های تلگرام
        await handleUpdate(update, env);
        
        return new Response("OK", { status: 200 });
      } catch (error) {
        console.error("Error processing update:", error);
        return new Response("Internal Server Error", { status: 500 });
      }
    }
    
    // پاسخ به درخواست‌های GET (برای تست)
    if (request.method === "GET") {
      return new Response("Hesabyar Bot is running!", { 
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }
    
    return new Response("Method not allowed", { status: 405 });
  }
};

async function handleUpdate(update, env) {
  // اینجا منطق پردازش پیام‌های تلگرام قرار می‌گیرد
  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text;
    
    // پاسخ ساده برای تست
    await sendMessage(chatId, `دریافت شد: ${text}`, env.TELEGRAM_BOT_TOKEN);
  }
}

async function sendMessage(chatId, text, botToken) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text
    })
  });
}
