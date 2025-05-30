import { z } from "zod";

const baseEventSchema = z.object({
  timestamp: z.number().int().transform((val) => new Date(val)),
});

const userSchema = z.object({
  self: z.string().url(),
  accountId: z.string(),
  avatarUrls: z.object({
    "48x48": z.string().url(),
    "24x24": z.string().url(),
    "16x16": z.string().url(),
    "32x32": z.string().url(),
  }),
  displayName: z.string(),
  active: z.boolean(),
  timeZone: z.string(),
  accountType: z.string(),
});

const statusSchema = z.object({
  self: z.string().url(),
  description: z.string(),
  iconUrl: z.string().url(),
  name: z.string(),
  id: z.string(),
  statusCategory: z.object({
    self: z.string().url(),
    id: z.number().int(),
    key: z.string(),
    colorName: z.string(),
    name: z.string(),
  }).optional(),
});

const issueTpeSchema = z.object({
  self: z.string().url(),
  id: z.string(),
  description: z.string(),
  iconUrl: z.string().url(),
  name: z.string(),
  subtask: z.boolean(),
  avatarId: z.number().int(),
  entityId: z.string(),
  hierarchyLevel: z.number().int(),
});

const commentSchema = z.object({
  self: z.string().url(),
  id: z.string(),
  author: userSchema,
  body: z.string(),
  updateAuthor: userSchema,
  created: z.string().transform((str) => new Date(str)),
  updated: z.string().transform((str) => new Date(str)),
  jsdPublic: z.boolean(),
});

const issueSchema = z.object({
  id: z.string(),
  self: z.string().url(),
  key: z.string(),
  fields: z.object({
    summary: z.string(),
    issuetype: issueTpeSchema,
    parent: z.object({
      id: z.string(),
      key: z.string(),
      self: z.string().url(),
      fields: z.object({
        summary: z.string(),
        status: statusSchema,
        priority: z.object({
          self: z.string().url(),
          iconUrl: z.string().url(),
          name: z.string(),
          id: z.string(),
        }),
        issuetype: issueTpeSchema,
      }),
    }).optional(),
    project: z.object({
      self: z.string().url(),
      id: z.string(),
      key: z.string(),
      name: z.string(),
      projectTypeKey: z.string(),
      simplified: z.boolean(),
      avatarUrls: z.object({
        "48x48": z.string().url(),
        "24x24": z.string().url(),
        "16x16": z.string().url(),
        "32x32": z.string().url(),
      }),
    }),
    assignee: z.nullable(userSchema),
    priority: z.object({
      self: z.string().url(),
      iconUrl: z.string().url(),
      name: z.string(),
      id: z.string(),
    }),
    status: statusSchema,
  }),
});

const commentCreatedEventSchema = baseEventSchema.extend({
  webhookEvent: z.literal("comment_created"),
  comment: commentSchema,
  issue: issueSchema,
  eventType: z.string(),
});

export type CommentCreatedEvent = z.infer<typeof commentCreatedEventSchema>;

const issueAssignedEventSchema = baseEventSchema.extend({
  webhookEvent: z.literal("jira:issue_updated"),
  issue_event_type_name: z.literal("issue_assigned"),
  user: userSchema,
  issue: issueSchema,
  changelog: z.object({
    id: z.string(),
    items: z.array(z.object({
      field: z.string(),
      fieldtype: z.string(),
      fieldId: z.string(),
      from: z.string().nullable(),
      fromString: z.string().nullable(),
      to: z.string().nullable(),
      toString: z.string().nullable(),
    })),
  }),
});

export type IssueAssignedEvent = z.infer<typeof issueAssignedEventSchema>;

const issueCreatedEventSchema = baseEventSchema.extend({
  webhookEvent: z.literal("jira:issue_created"),
  issue_event_type_name: z.literal("issue_created"),
  user: userSchema,
  issue: issueSchema,
  changelog: z.object({
    id: z.string(),
    items: z.array(z.object({
      field: z.string(),
      fieldtype: z.string(),
      fieldId: z.string(),
      from: z.string().nullable(),
      fromString: z.string().nullable(),
      to: z.string().nullable(),
      toString: z.string().nullable(),
      tmpFromAccountId: z.string().nullable().optional(),
      tmpToAccountId: z.string().optional(),
    })),
  }),
});

export type IssueCreatedEvent = z.infer<typeof issueCreatedEventSchema>;

const issueUpdatedGenericEventSchema = baseEventSchema.extend({
  webhookEvent: z.literal("jira:issue_updated"),
  issue_event_type_name: z.literal("issue_generic"),
  user: userSchema,
  issue: issueSchema,
  changelog: z.object({
    id: z.string(),
    items: z.array(z.object({
      field: z.string(),
      fieldtype: z.string(),
      fieldId: z.string(),
      from: z.string().nullable(),
      fromString: z.string().nullable(),
      to: z.string().nullable(),
      toString: z.string().nullable(),
      tmpFromAccountId: z.string().nullable().optional(),
      tmpToAccountId: z.string().optional(),
    })),
  }),
});

export type IssueUpdatedEvent = z.infer<typeof issueUpdatedGenericEventSchema>;

const issueUpdatedEventSchema = baseEventSchema.extend({
  webhookEvent: z.literal("jira:issue_updated"),
  issue_event_type_name: z.literal("issue_updated"),
  user: userSchema,
  issue: issueSchema,
  changelog: z.object({
    id: z.string(),
    items: z.array(z.object({
      field: z.string(),
      fieldtype: z.string(),
      fieldId: z.string(),
      from: z.string().nullable(),
      fromString: z.string().nullable(),
      to: z.string().nullable(),
      toString: z.string().nullable(),
      tmpFromAccountId: z.string().nullable().optional(),
      tmpToAccountId: z.string().optional(),
    })),
  }),
});

export type IssueUpdatedDateEvent = z.infer<typeof issueUpdatedEventSchema>;

export const eventSchema = z.union([
  commentCreatedEventSchema,
  issueAssignedEventSchema,
  issueCreatedEventSchema,
  issueUpdatedGenericEventSchema,
  issueUpdatedEventSchema,
]);

export type Event = z.infer<typeof eventSchema>;
