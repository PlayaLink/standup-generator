import {
  ActivityHandler,
  TurnContext,
  CardFactory,
  MessageFactory,
} from 'botbuilder';
import { handleSetupCommand, handleSetupAction } from './handlers/setup';
import { handleStandupCommand } from './handlers/standup';
import { createHelpCard } from './cards/help';

/**
 * StandupBot - Microsoft Teams bot for generating standup reports
 *
 * Commands:
 * - setup: Connect Jira account and select board
 * - standup: Generate weekly standup report
 * - help: Show available commands
 */
export class StandupBot extends ActivityHandler {
  constructor() {
    super();

    // Handle incoming messages
    this.onMessage(async (context, next) => {
      // Check if this is a card action submission
      if (context.activity.value && context.activity.value.action) {
        await this.handleCardAction(context);
      } else {
        await this.handleMessage(context);
      }
      await next();
    });

    // Handle new members added to conversation
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded || [];

      for (const member of membersAdded) {
        // Don't greet the bot itself
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity(
            MessageFactory.attachment(CardFactory.adaptiveCard(createHelpCard()))
          );
        }
      }

      await next();
    });
  }

  /**
   * Handle Adaptive Card action submissions
   */
  private async handleCardAction(context: TurnContext): Promise<void> {
    const data = context.activity.value;
    const action = data.action;

    switch (action) {
      case 'setup':
      case 'changeBoard':
      case 'selectBoard':
        await handleSetupAction(context, action, data);
        break;

      case 'standup':
        await handleStandupCommand(context);
        break;

      default:
        await context.sendActivity(`Unknown action: ${action}`);
    }
  }

  /**
   * Handle incoming message and route to appropriate command handler
   */
  private async handleMessage(context: TurnContext): Promise<void> {
    const text = context.activity.text?.trim().toLowerCase() || '';

    // Remove bot mention if present (Teams includes @mention in text)
    const cleanedText = this.removeBotMention(text, context);

    // Route to appropriate handler
    switch (cleanedText) {
      case 'setup':
        await handleSetupCommand(context);
        break;

      case 'standup':
      case 'weekly':
      case 'report':
        await handleStandupCommand(context);
        break;

      case 'help':
      case '':
        await context.sendActivity(
          MessageFactory.attachment(CardFactory.adaptiveCard(createHelpCard()))
        );
        break;

      default:
        await context.sendActivity(
          `I didn't understand "${cleanedText}". Try "setup", "standup", or "help".`
        );
        break;
    }
  }

  /**
   * Remove bot @mention from message text
   */
  private removeBotMention(text: string, context: TurnContext): string {
    const mentions = context.activity.entities?.filter(
      (e) => e.type === 'mention'
    );

    if (!mentions || mentions.length === 0) {
      return text;
    }

    // Remove each mention from the text
    let cleanedText = text;
    for (const mention of mentions) {
      if (mention.mentioned?.id === context.activity.recipient.id) {
        const mentionText = mention.text?.toLowerCase() || '';
        cleanedText = cleanedText.replace(mentionText, '').trim();
      }
    }

    return cleanedText;
  }
}

// Export singleton instance
export const bot = new StandupBot();
