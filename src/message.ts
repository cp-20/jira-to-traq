import { JIRA_ORG_ID, JIRA_USER_ID_MAP_JSON } from "./env";
import { Event } from "./event";

export const createUserMention = (userId: string): string => {
  const username = JIRA_USER_ID_MAP_JSON[userId];
  return `@${username}`;
};

export const createIssueLink = (issueKey: string): string => {
  return `//${JIRA_ORG_ID}.atlassian.net/browse/${issueKey}`;
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
