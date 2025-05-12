import { createHmac } from "crypto";

const webhookUrl = process.env.TRAQ_WEBHOOK_URL;
if (!webhookUrl) {
  throw new Error("TRAQ_WEBHOOK_URL is not set");
}
const webhookSecret = process.env.TRAQ_WEBHOOK_SECRET;
if (!webhookSecret) {
  throw new Error("TRAQ_WEBHOOK_SECRET is not set");
}

export const postTraqMessage = async (message: string) => {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-TRAQ-Signature": calcHmacSha1(message, webhookSecret),
    },
    body: message,
  });
  if (!res.ok) {
    throw new Error(`Failed to post message: ${res.statusText}`);
  }
};

function calcHmacSha1(message: string, secret: string) {
  return createHmac("sha1", secret).update(message).digest("hex");
}
