export const sendTelegramMessage = async ({ message }: { message: string }) => {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
    }),
  })
  if (!res.ok) return `Failed to send: ${res.status}`
  return "Message sent."
}