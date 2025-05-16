import { createHmac } from "crypto";
import { TRAQ_WEBHOOK_SECRET, TRAQ_WEBHOOK_URL } from "./env";

export const postTraqMessage = async (message: string) => {
  const res = await fetch(TRAQ_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-TRAQ-Signature": calcHmacSha1(message, TRAQ_WEBHOOK_SECRET),
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
