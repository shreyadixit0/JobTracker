import { google } from 'googleapis';
import { googleOAuth2Client } from '../../config/oauth.js';
import { StatusRulesService } from '../statusRules.js';

export class GoogleMailService {
  constructor() {
    this.statusRules = new StatusRulesService();
  }

  async fetchJobRelatedEmails(mailAccount, sinceDate) {
    try {
      // Set up OAuth credentials
      googleOAuth2Client.setCredentials({
        access_token: mailAccount.access_token,
        refresh_token: mailAccount.refresh_token,
      });

      const gmail = google.gmail({ version: 'v1', auth: googleOAuth2Client });

      // Build search query for job-related emails
      const query = this.buildJobSearchQuery(sinceDate);
      
      // Search for messages
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 100
      });

      const messages = response.data.messages || [];
      const jobEmails = [];

      // Fetch details for each message
      for (const message of messages) {
        try {
          const details = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'Date']
          });

          const headers = details.data.payload.headers;
          const from = headers.find(h => h.name === 'From')?.value || '';
          const to = headers.find(h => h.name === 'To')?.value || '';
          const subject = headers.find(h => h.name === 'Subject')?.value || '';
          const dateHeader = headers.find(h => h.name === 'Date')?.value || '';

          // Get snippet
          const snippet = details.data.snippet || '';

          // Check if actually job-related using our rules
          if (this.statusRules.isJobRelatedEmail(subject, from, snippet)) {
            jobEmails.push({
              providerMessageId: message.id,
              from,
              to,
              subject,
              snippet,
              timestamp: new Date(dateHeader || details.data.internalDate)
            });
          }
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error);
        }
      }

      return jobEmails;
    } catch (error) {
      console.error('Gmail fetch error:', error);
      throw error;
    }
  }

  buildJobSearchQuery(sinceDate) {
    const dateStr = sinceDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    return `after:${dateStr} (subject:application OR subject:interview OR subject:offer OR subject:position OR subject:job OR from:indeed.com OR from:linkedin.com OR from:naukri.com OR from:greenhouse.io OR from:lever.co OR from:workday.com OR from:glassdoor.com)`;
  }
}