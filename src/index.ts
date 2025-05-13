import { Hono } from "hono";
import { eventSchema } from "./event";
import { createMessage } from "./message";
import { postTraqMessage } from "./traq";

const app = new Hono();

app.post("/webhook/*", async (c) => {
  const payload = await c.req.json();
  try {
    const parsed = eventSchema.parse(payload);
    const message = createMessage(parsed);
    await postTraqMessage(message);
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "ZodError") {
        console.error("Unknown event detected");
        console.log(JSON.stringify(payload));
      }
    }
    console.error(err);
    return c.json({ error: "Invalid payload" }, 400);
  }
});

app.get("/", (c) => c.text("Jira Webhook Bot is running!"));

export default app;
