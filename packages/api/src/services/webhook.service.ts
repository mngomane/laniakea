import { User } from "../models/user.model.js";
import { Activity } from "../models/activity.model.js";
import { recordActivity } from "./activity.service.js";
import type { ActivityType, RecordActivityInput } from "../types/index.js";

interface WebhookDelivery {
  deliveryId: string;
  processedAt: Date;
}

const processedDeliveries = new Map<string, WebhookDelivery>();
const MAX_DELIVERY_CACHE = 10000;

function isAlreadyProcessed(deliveryId: string): boolean {
  return processedDeliveries.has(deliveryId);
}

function markProcessed(deliveryId: string): void {
  if (processedDeliveries.size >= MAX_DELIVERY_CACHE) {
    // Evict oldest entries
    const oldest = processedDeliveries.keys().next().value;
    if (oldest !== undefined) {
      processedDeliveries.delete(oldest);
    }
  }
  processedDeliveries.set(deliveryId, {
    deliveryId,
    processedAt: new Date(),
  });
}

interface PushPayload {
  commits: Array<{ id: string; message: string; author: { username?: string } }>;
  sender: { id: number; login: string };
  repository: { full_name: string };
  ref: string;
}

interface PullRequestPayload {
  action: string;
  pull_request: { number: number; title: string; merged: boolean };
  sender: { id: number; login: string };
  repository: { full_name: string };
}

interface PullRequestReviewPayload {
  action: string;
  review: { id: number; state: string };
  pull_request: { number: number };
  sender: { id: number; login: string };
  repository: { full_name: string };
}

interface IssuesPayload {
  action: string;
  issue: { number: number; title: string };
  sender: { id: number; login: string };
  repository: { full_name: string };
}

interface ActivityToRecord {
  type: ActivityType;
  metadata: Record<string, unknown>;
}

function parseActivitiesFromPush(payload: PushPayload): ActivityToRecord[] {
  return payload.commits.map((commit) => ({
    type: "Commit" as const,
    metadata: {
      commitId: commit.id,
      message: commit.message,
      repo: payload.repository.full_name,
      branch: payload.ref,
    },
  }));
}

function parseActivitiesFromPR(payload: PullRequestPayload): ActivityToRecord[] {
  if (payload.action === "opened") {
    return [{
      type: "PullRequest" as const,
      metadata: {
        prNumber: payload.pull_request.number,
        title: payload.pull_request.title,
        repo: payload.repository.full_name,
      },
    }];
  }

  if (payload.action === "closed" && payload.pull_request.merged) {
    return [{
      type: "Merge" as const,
      metadata: {
        prNumber: payload.pull_request.number,
        title: payload.pull_request.title,
        repo: payload.repository.full_name,
      },
    }];
  }

  return [];
}

function parseActivitiesFromReview(payload: PullRequestReviewPayload): ActivityToRecord[] {
  if (payload.action === "submitted") {
    return [{
      type: "Review" as const,
      metadata: {
        reviewId: payload.review.id,
        state: payload.review.state,
        prNumber: payload.pull_request.number,
        repo: payload.repository.full_name,
      },
    }];
  }
  return [];
}

function parseActivitiesFromIssue(payload: IssuesPayload): ActivityToRecord[] {
  if (payload.action === "closed") {
    return [{
      type: "Issue" as const,
      metadata: {
        issueNumber: payload.issue.number,
        title: payload.issue.title,
        repo: payload.repository.full_name,
      },
    }];
  }
  return [];
}

export interface WebhookProcessResult {
  processed: number;
  skipped: boolean;
  reason?: string;
}

export async function processGitHubWebhook(
  eventType: string,
  deliveryId: string,
  body: string,
): Promise<WebhookProcessResult> {
  if (isAlreadyProcessed(deliveryId)) {
    return { processed: 0, skipped: true, reason: "duplicate delivery" };
  }

  const payload = JSON.parse(body) as Record<string, unknown>;
  const senderId = String(
    (payload.sender as { id: number } | undefined)?.id ?? "",
  );

  if (!senderId) {
    return { processed: 0, skipped: true, reason: "no sender" };
  }

  const user = await User.findOne({ githubId: senderId });
  if (!user) {
    console.warn(
      `Webhook: GitHub user ${senderId} not registered in Laniakea`,
    );
    return { processed: 0, skipped: true, reason: "user not found" };
  }

  const userId = (user._id as { toString(): string }).toString();
  let activities: ActivityToRecord[];

  switch (eventType) {
    case "push":
      activities = parseActivitiesFromPush(payload as unknown as PushPayload);
      break;
    case "pull_request":
      activities = parseActivitiesFromPR(payload as unknown as PullRequestPayload);
      break;
    case "pull_request_review":
      activities = parseActivitiesFromReview(payload as unknown as PullRequestReviewPayload);
      break;
    case "issues":
      activities = parseActivitiesFromIssue(payload as unknown as IssuesPayload);
      break;
    default:
      return { processed: 0, skipped: true, reason: `unsupported event: ${eventType}` };
  }

  let processed = 0;
  for (const activity of activities) {
    const input: RecordActivityInput = {
      userId,
      type: activity.type,
      metadata: activity.metadata,
    };
    await recordActivity(input);
    processed++;
  }

  markProcessed(deliveryId);
  return { processed, skipped: false };
}

// Exported for testing
export function clearDeliveryCache(): void {
  processedDeliveries.clear();
}
