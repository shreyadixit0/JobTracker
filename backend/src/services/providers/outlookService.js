import axios from 'axios';
import { StatusRulesService } from '../statusRules.js';

export class MicrosoftMailService {
  constructor() {
    this.statusRules = new StatusRulesService();
  }

  async fetchJobRelatedEmails(mailAccount, sinceDate) {
    try {
      const accessToken = mailAccount.access_token;
      const dateFilter = sinceDate.toISOString();

      // Build search query for job-related emails
      const searchQuery = this.buildJobSearchQuery();
      
      const response = await axios.get('https://graph.microsoft.com/v1.0/me/messages', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          $search: searchQuery,
          $filter: `receivedDateTime ge ${dateFilter}`,
          $select: 'id,subject,from,toRecipients,bodyPreview,receivedDateTime',
          $top: 100
        }
      });

      const messages = response.data.value || [];
      const jobEmails = [];

      for (const message of messages) {
        const from = message.from?.emailAddress?.address || '';
        const to = message.toRecipients?.[0]?.emailAddress?.address || '';
        const subject = message.subject || '';
        const snippet = message.bodyPreview || '';

        // Check if actually job-related using our rules
        if (this.statusRules.isJobRelatedEmail(subject, from, snippet)) {
          jobEmails.push({
            providerMessageId: message.id,
            from,
            to,
            subject,
            snippet,
            timestamp: new Date(message.receivedDateTime)
          });
        }
      }

      return jobEmails;
    } catch (error) {
      console.error('Outlook fetch error:', error);
      throw error;
    }
  }

  buildJobSearchQuery() {
    return '"application" OR "interview" OR "offer" OR "position" OR "job" OR "career"';
  }
}