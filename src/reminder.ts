import {
  JIRA_API_TOKEN,
  JIRA_EMAIL,
  JIRA_ORG_ID,
  JIRA_PROJECT_KEY,
  JIRA_USER_ID_MAP_JSON,
} from "./env";

const AUTH_HEADER = {
  Authorization: `Basic ${
    Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")
  }`,
  Accept: "application/json",
};

const FIELDS = [
  "summary",
  "duedate",
  "priority",
  "parent",
  "issuelinks",
  "assignee",
  "status",
];

interface Issue {
  key: string;
  fields: {
    summary: string;
    duedate?: string;
    priority?: { name: string };
    assignee?: { accountId: string };
    parent?: { key: string; fields: { summary: string } };
    status?: { name: string };
    issuelinks?: any[];
  };
}

const fetchAllIssues = async (): Promise<Issue[]> => {
  const issues: Issue[] = [];
  let startAt = 0;
  const maxResults = 50;

  while (true) {
    const url = new URL(
      `https://${JIRA_ORG_ID}.atlassian.net/rest/api/3/search`,
    );
    url.searchParams.set("jql", `project=${JIRA_PROJECT_KEY}`);
    url.searchParams.set("fields", FIELDS.join(","));
    url.searchParams.set("startAt", startAt.toString());
    url.searchParams.set("maxResults", maxResults.toString());

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: AUTH_HEADER,
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch issues: ${res.status} ${res.statusText}`,
      );
    }

    const data = await res.json();
    issues.push(...data.issues);

    if (data.issues.length < maxResults) break;
    startAt += maxResults;
  }

  return issues;
};

const formatStatus = (issue: Issue): string => {
  const status = issue.fields.status?.name || "";
  const statusMap: Record<string, string> = {
    "To Do": ":loudspeaker:",
    "進行中": ":loading:",
    "クローズ": ":x:",
    "完了": ":white_check_mark:",
  };
  return statusMap[status] ?? status;
};

const formatTaskName = (issue: Issue): string => {
  const name = issue.fields.summary;
  const link = `//${JIRA_ORG_ID}.atlassian.net/browse/${issue.key}`;
  return `[**${name}**](${link})`;
};

const formatTaskNameWithParent = (issue: Issue, issues: Issue[]): string => {
  const taskName = formatTaskName(issue);

  if (!issue.fields.parent) return taskName;

  let currentIssue = issue;
  const parentChain: string[] = [];

  while (currentIssue.fields.parent) {
    const parentKey = currentIssue.fields.parent.key;
    const parentIssue = issues.find((i) => i.key === parentKey);

    if (!parentIssue) {
      throw new Error(`Parent issue not found: ${parentKey}`);
    }

    parentChain.unshift(`**${parentIssue.fields.summary}**`);

    currentIssue = parentIssue;
  }

  return `${parentChain.join(" > ")} > ${taskName}`;
};

const formatPriority = (issue: Issue): string => {
  const priority = issue.fields.priority?.name || "";
  const priorityMap: Record<string, string> = {
    "Highest": ":fire:",
    "High": ":warning:",
    "Medium": ":notepad_spiral:",
    "Low": ":green_circle:",
    "Lowest": ":blue_circle:",
  };
  return priorityMap[priority] ?? priority;
};

const formatDueDate = (issue: Issue): string => {
  const dueDate = issue.fields.duedate;
  if (!dueDate) return "";
  const date = new Date(dueDate);
  const dateString = date.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
  const todayDate = new Date();
  const diffDays = (date.getTime() - todayDate.getTime()) / (1000 * 3600 * 24);
  if (diffDays < 0) return `:fire: ${dateString}`;
  if (diffDays < 3) return `:warning: ${dateString}`;
  if (diffDays < 7) return `:alarm_clock: ${dateString}`;
  return dateString;
};

const formatAssignee = (issue: Issue): string => {
  const assignee = issue.fields.assignee;
  if (!assignee) return "";
  const username = JIRA_USER_ID_MAP_JSON[assignee.accountId];
  if (!username) {
    throw new Error(`User not found: ${assignee.accountId}`);
  }
  return `:@${username}:`;
};

const formatBlockers = (issue: Issue): string => {
  const blockers = issue.fields.issuelinks
    ?.filter((link) => link.outwardIssue)
    .map((link) => formatTaskName(link.outwardIssue))
    .join(" ") ?? "";
  return blockers;
};

const sortByDueDate = (issues: Issue[]): Issue[] => {
  return issues.sort((a, b) => {
    const dateA = a.fields.duedate
      ? new Date(a.fields.duedate).getTime()
      : Infinity;
    const dateB = b.fields.duedate
      ? new Date(b.fields.duedate).getTime()
      : Infinity;
    return dateA - dateB;
  });
};

const formatMarkdownTable = (issues: Issue[], allIssues: Issue[]): string => {
  const sorted = sortByDueDate(issues);
  const rows = [
    `| 状態 | タスク名 | 優先度 | 期限 | 担当者 | ブロッカー |`,
    `|---|---|---|---|---|---|`,
  ];

  for (const issue of sorted) {
    if (["完了", "クローズ"].includes(issue.fields.status?.name!)) continue;
    const status = formatStatus(issue);
    const name = formatTaskNameWithParent(issue, allIssues);
    const priority = formatPriority(issue);
    const dueDate = formatDueDate(issue);
    const assignee = formatAssignee(issue);
    const blockers = formatBlockers(issue);

    rows.push(
      `| ${status} | ${name} | ${priority} | ${dueDate} | ${assignee} | ${blockers} |`,
    );
  }

  return rows.join("\n");
};

const formatMessage = (issues: Issue[]): string => {
  const msInDay = 1000 * 60 * 60 * 24;
  const overdueIssues = issues.filter(
    (issue) =>
      issue.fields.duedate && new Date(issue.fields.duedate) <= new Date(),
  );
  const urgentIssues = issues.filter(
    (issue) =>
      issue.fields.duedate &&
      new Date() < new Date(issue.fields.duedate) &&
      new Date(issue.fields.duedate) <= new Date(Date.now() + 3 * msInDay),
  );
  const normalIssues = issues.filter(
    (issue) =>
      issue.fields.duedate &&
      new Date(Date.now() + 3 * msInDay) < new Date(issue.fields.duedate) &&
      new Date(issue.fields.duedate) <= new Date(Date.now() + 31 * msInDay),
  );
  const overdueMarkdown = formatMarkdownTable(overdueIssues, issues);
  const urgentMarkdown = formatMarkdownTable(urgentIssues, issues);
  const normalMarkdown = formatMarkdownTable(normalIssues, issues);
  return [
    `## :alert.large: 期限切れタスク\n${overdueMarkdown}`,
    `## :warning.large: 緊急のタスク\n${urgentMarkdown}`,
    `## :memo-nya.large: 1か月以内のタスク\n${normalMarkdown}`,
  ].join("\n\n");
};

export const getReminderMessage = async (): Promise<string> => {
  const issues = await fetchAllIssues();
  const message = formatMessage(issues);
  return message;
};
