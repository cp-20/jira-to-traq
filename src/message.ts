import { Event } from "./event";

const orgId = process.env.ORG_ID;
if (!orgId) {
  throw new Error("ORG_ID is not set");
}

if (!process.env.USER_ID_MAP) {
  throw new Error("USER_ID_MAP is not set");
}
const userIdMap = JSON.parse(process.env.USER_ID_MAP ?? "{}") as Record<
  string,
  string
>;

export const createUserMention = (userId: string): string => {
  const username = userIdMap[userId];
  return `@${username}`;
};

export const createIssueLink = (issueKey: string): string => {
  return `//${orgId}.atlassian.net/browse/${issueKey}`;
};

export const createMessage = (event: Event): string => {
  if (
    event.webhookEvent === "jira:issue_created" ||
    event.webhookEvent === "jira:issue_updated"
  ) {
    const user = createUserMention(event.user.accountId);
    const title = event.issue.fields.summary;
    const link = createIssueLink(event.issue.key);

    if (event.webhookEvent === "jira:issue_created") {
      return `${user} によって **[:jira: ${title}](${link})** が作成されました。`;
    }
    if (event.webhookEvent === "jira:issue_updated") {
      if (event.issue_event_type_name === "issue_assigned") {
        const assignee = event.issue.fields.assignee;
        if (assignee) {
          const assigneeUser = createUserMention(assignee.accountId);
          return `${user} によって **[:jira: ${title}](${link})** が ${assigneeUser} に割り当てられました。`;
        } else {
          return `${user} によって **[:jira: ${title}](${link})** の割り当てが解除されました。`;
        }
      } else if (event.issue_event_type_name === "issue_generic") {
        const status = event.issue.fields.status;
        const statusName = status.name;
        return `${user} によって **[:jira: ${title}](${link})** のステータスが ${statusName} に変更されました。`;
      }
      return `${user} によって **[:jira: ${title}](${link})** が更新されました。`;
    }
  }

  if (event.webhookEvent === "comment_created") {
    const user = createUserMention(event.comment.author.accountId);
    const title = event.issue.fields.summary;
    const link = createIssueLink(event.issue.key);
    const comment = event.comment.body
      .replace(/\>/g, "\\>")
      .replace(/^/gm, "> ");

    return `${user} によって **[:jira: ${title}](${link})** にコメントが追加されました。\n\n${comment}`;
  }

  const _: never = event;
  throw new Error(`Unsupported event: ${event}`);
};
