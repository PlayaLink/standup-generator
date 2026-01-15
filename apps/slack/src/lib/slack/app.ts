import { App, ExpressReceiver } from '@slack/bolt';

let _receiver: ExpressReceiver | null = null;
let _app: App | null = null;

/**
 * Get the Express receiver (lazy-initialized)
 */
export function getReceiver(): ExpressReceiver {
  if (_receiver) {
    return _receiver;
  }

  if (!process.env.SLACK_SIGNING_SECRET) {
    throw new Error('Missing SLACK_SIGNING_SECRET environment variable');
  }

  _receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    processBeforeResponse: true,
  });

  return _receiver;
}

/**
 * Get the Slack Bolt app (lazy-initialized)
 */
export function getApp(): App {
  if (_app) {
    return _app;
  }

  if (!process.env.SLACK_BOT_TOKEN) {
    throw new Error('Missing SLACK_BOT_TOKEN environment variable');
  }

  _app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    receiver: getReceiver(),
  });

  return _app;
}

/**
 * Send a DM to a user
 */
export async function sendDirectMessage(
  userId: string,
  text: string,
  blocks?: any[]
): Promise<void> {
  await getApp().client.chat.postMessage({
    channel: userId,
    text,
    blocks,
  });
}

/**
 * Open a modal for user interaction
 */
export async function openModal(
  triggerId: string,
  view: any
): Promise<void> {
  await getApp().client.views.open({
    trigger_id: triggerId,
    view,
  });
}

/**
 * Update a modal view
 */
export async function updateModal(
  viewId: string,
  view: any
): Promise<void> {
  await getApp().client.views.update({
    view_id: viewId,
    view,
  });
}
