import { supabase } from '../config/supabase.js';
import { GoogleMailService } from './providers/gmailService.js';
import { MicrosoftMailService } from './providers/outlookService.js';
import { MailParseService } from './mailParse.js';
import { mailParseQueue } from '../jobs/queues.js';

export class MailSyncService {
  constructor() {
    this.googleService = new GoogleMailService();
    this.microsoftService = new MicrosoftMailService();
    this.parseService = new MailParseService();
  }

  async syncUserMails(userId, provider, emailAddress) {
    try {
      console.log(`Starting mail sync for user ${userId}, provider: ${provider}`);

      // Get mail account
      const { data: mailAccount, error: accountError } = await supabase
        .from('mail_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('email_address', emailAddress)
        .eq('active', true)
        .single();

      if (accountError || !mailAccount) {
        throw new Error(`Mail account not found: ${accountError?.message}`);
      }

      // Get last sync date
      const lastSyncAt = mailAccount.last_sync_at 
        ? new Date(mailAccount.last_sync_at)
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

      let messages = [];

      // Fetch messages based on provider
      if (provider === 'GMAIL') {
        messages = await this.googleService.fetchJobRelatedEmails(mailAccount, lastSyncAt);
      } else if (provider === 'OUTLOOK') {
        messages = await this.microsoftService.fetchJobRelatedEmails(mailAccount, lastSyncAt);
      }

      console.log(`Found ${messages.length} job-related messages`);

      // Process each message
      for (const message of messages) {
        // Check if message already exists
        const { data: existingMessage } = await supabase
          .from('mail_messages')
          .select('id')
          .eq('mail_account_id', mailAccount.id)
          .eq('provider_message_id', message.providerMessageId)
          .single();

        if (existingMessage) {
          continue; // Skip already processed messages
        }

        // Store message
        const { data: storedMessage, error: messageError } = await supabase
          .from('mail_messages')
          .insert([{
            user_id: userId,
            mail_account_id: mailAccount.id,
            provider_message_id: message.providerMessageId,
            from_address: message.from,
            to_address: message.to,
            subject: message.subject,
            snippet: message.snippet,
            timestamp: message.timestamp
          }])
          .select()
          .single();

        if (messageError) {
          console.error('Error storing message:', messageError);
          continue;
        }

        // Queue message for parsing
        await mailParseQueue.add('parse-message', {
          messageId: storedMessage.id,
          userId,
          mailAccountId: mailAccount.id
        });
      }

      // Update last sync time
      await supabase
        .from('mail_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', mailAccount.id);

      console.log(`Mail sync completed for user ${userId}`);
      return { success: true, messagesFound: messages.length };

    } catch (error) {
      console.error('Mail sync error:', error);
      throw error;
    }
  }

  async syncAllActiveAccounts() {
    try {
      console.log('Starting sync for all active mail accounts');

      const { data: accounts, error } = await supabase
        .from('mail_accounts')
        .select('user_id, provider, email_address')
        .eq('active', true);

      if (error) {
        throw error;
      }

      const results = [];
      for (const account of accounts) {
        try {
          const result = await this.syncUserMails(
            account.user_id, 
            account.provider, 
            account.email_address
          );
          results.push({
            ...account,
            success: true,
            messagesFound: result.messagesFound
          });
        } catch (error) {
          console.error(`Sync failed for account ${account.email_address}:`, error);
          results.push({
            ...account,
            success: false,
            error: error.message
          });
        }
      }

      console.log(`Completed sync for ${accounts.length} accounts`);
      return results;

    } catch (error) {
      console.error('Bulk sync error:', error);
      throw error;
    }
  }
}