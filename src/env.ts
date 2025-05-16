if (process.env.JIRA_ORG_ID === undefined) {
  throw new Error("JIRA_ORG_ID is not set");
}
export const JIRA_ORG_ID = process.env.JIRA_ORG_ID;

if (process.env.JIRA_PROJECT_KEY === undefined) {
  throw new Error("JIRA_PROJECT_KEY is not set");
}
export const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

if (process.env.JIRA_API_TOKEN === undefined) {
  throw new Error("JIRA_API_TOKEN is not set");
}
export const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

if (process.env.JIRA_EMAIL === undefined) {
  throw new Error("JIRA_EMAIL is not set");
}
export const JIRA_EMAIL = process.env.JIRA_EMAIL;

if (process.env.JIRA_USER_ID_MAP === undefined) {
  throw new Error("JIRA_USER_ID_MAP is not set");
}
export const JIRA_USER_ID_MAP = process.env.JIRA_USER_ID_MAP;
export const JIRA_USER_ID_MAP_JSON = JSON.parse(
  JIRA_USER_ID_MAP || "{}",
) as Record<string, string>;

if (process.env.TRAQ_WEBHOOK_URL === undefined) {
  throw new Error("TRAQ_WEBHOOK_URL is not set");
}
export const TRAQ_WEBHOOK_URL = process.env.TRAQ_WEBHOOK_URL;

if (process.env.TRAQ_WEBHOOK_SECRET === undefined) {
  throw new Error("TRAQ_WEBHOOK_SECRET is not set");
}
export const TRAQ_WEBHOOK_SECRET = process.env.TRAQ_WEBHOOK_SECRET;
