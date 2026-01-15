import {
  CloudAdapter,
  ConfigurationBotFrameworkAuthentication,
  ConfigurationBotFrameworkAuthenticationOptions,
} from 'botbuilder';

/**
 * Bot Framework authentication configuration
 */
const botFrameworkAuthConfig: ConfigurationBotFrameworkAuthenticationOptions = {
  MicrosoftAppId: process.env.MICROSOFT_APP_ID,
  MicrosoftAppPassword: process.env.MICROSOFT_APP_PASSWORD,
  MicrosoftAppTenantId: process.env.MICROSOFT_APP_TENANT_ID,
  MicrosoftAppType: 'MultiTenant',
};

/**
 * Create the Bot Framework adapter
 * This handles authentication and message routing
 */
const botFrameworkAuth = new ConfigurationBotFrameworkAuthentication(
  botFrameworkAuthConfig
);

export const adapter = new CloudAdapter(botFrameworkAuth);

/**
 * Error handler for unhandled errors
 */
adapter.onTurnError = async (context, error) => {
  console.error('[Bot Error]', error);

  // Send a message to the user
  await context.sendActivity(
    'Sorry, something went wrong. Please try again or contact support if this persists.'
  );
};
