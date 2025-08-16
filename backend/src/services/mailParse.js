import { supabase } from '../config/supabase.js';
import { StatusRulesService } from './statusRules.js';

export class MailParseService {
  constructor() {
    this.statusRules = new StatusRulesService();
  }

  async parseMessage(messageId, userId, mailAccountId) {
    try {
      console.log(`Parsing message ${messageId}`);

      // Get message from database
      const { data: message, error: messageError } = await supabase
        .from('mail_messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (messageError || !message) {
        throw new Error(`Message not found: ${messageError?.message}`);
      }

      // Parse using rules service
      const parseResult = this.statusRules.parseEmailContent({
        subject: message.subject,
        from: message.from_address,
        snippet: message.snippet,
        timestamp: new Date(message.timestamp)
      });

      // Update message with parsed data
      const { error: updateError } = await supabase
        .from('mail_messages')
        .update({
          parsed_status: parseResult.status,
          parsed_company: parseResult.company,
          parsed_position: parseResult.position
        })
        .eq('id', messageId);

      if (updateError) {
        console.error('Error updating parsed message:', updateError);
      }

      // Try to match with existing application or create new one
      if (parseResult.company && parseResult.position) {
        await this.matchOrCreateApplication(userId, parseResult, message);
      }

      console.log(`Completed parsing message ${messageId}`);
      return parseResult;

    } catch (error) {
      console.error('Message parsing error:', error);
      throw error;
    }
  }

  async matchOrCreateApplication(userId, parseResult, message) {
    try {
      let matchedApplication = null;

      // First try to match by external reference if available
      if (parseResult.externalRef) {
        const { data: extRefMatch } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', userId)
          .eq('external_ref', parseResult.externalRef)
          .single();

        matchedApplication = extRefMatch;
      }

      // If no external ref match, try fuzzy matching by company and position
      if (!matchedApplication && parseResult.company && parseResult.position) {
        const { data: fuzzyMatches } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', userId)
          .ilike('company', `%${parseResult.company}%`)
          .ilike('position', `%${parseResult.position}%`)
          .gte('created_at', new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()) // last 120 days
          .limit(1);

        matchedApplication = fuzzyMatches?.[0];
      }

      if (matchedApplication) {
        // Update existing application
        await this.updateExistingApplication(matchedApplication, parseResult, message);
      } else {
        // Create new application
        await this.createNewApplication(userId, parseResult, message);
      }

    } catch (error) {
      console.error('Error matching/creating application:', error);
    }
  }

  async updateExistingApplication(application, parseResult, message) {
    try {
      const updates = {};
      const notes = application.notes || '';
      
      // Update status if it's a progression
      if (parseResult.status && this.isStatusProgression(application.status, parseResult.status)) {
        updates.status = parseResult.status;
      }

      // Add timeline entry to notes
      const timelineEntry = `\n[${new Date(message.timestamp).toLocaleDateString()}] Email: ${parseResult.status} - "${message.subject}"`;
      updates.notes = notes + timelineEntry;

      // Update external ref if not present
      if (parseResult.externalRef && !application.external_ref) {
        updates.external_ref = parseResult.externalRef;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('applications')
          .update(updates)
          .eq('id', application.id);

        if (error) {
          console.error('Error updating application:', error);
        } else {
          console.log(`Updated application ${application.id} with email data`);
        }

        // Link message to application
        await supabase
          .from('mail_messages')
          .update({ linked_application_id: application.id })
          .eq('id', message.id);
      }

    } catch (error) {
      console.error('Error updating existing application:', error);
    }
  }

  async createNewApplication(userId, parseResult, message) {
    try {
      const applicationData = {
        user_id: userId,
        company: parseResult.company,
        position: parseResult.position,
        status: parseResult.status || 'APPLIED',
        portal: parseResult.portal || 'OTHER',
        date_applied: parseResult.dateApplied || new Date(message.timestamp),
        source: 'EMAIL',
        external_ref: parseResult.externalRef,
        notes: `Created from email: "${message.subject}" on ${new Date(message.timestamp).toLocaleDateString()}`
      };

      const { data: newApplication, error } = await supabase
        .from('applications')
        .insert([applicationData])
        .select()
        .single();

      if (error) {
        console.error('Error creating application:', error);
      } else {
        console.log(`Created new application ${newApplication.id} from email`);
        
        // Link message to application
        await supabase
          .from('mail_messages')
          .update({ linked_application_id: newApplication.id })
          .eq('id', message.id);
      }

    } catch (error) {
      console.error('Error creating new application:', error);
    }
  }

  isStatusProgression(currentStatus, newStatus) {
    const statusOrder = {
      'SAVED': 0,
      'APPLIED': 1,
      'PENDING': 1,
      'INTERVIEW': 2,
      'OFFER': 3,
      'HIRED': 4,
      'REJECTED': -1
    };

    const currentOrder = statusOrder[currentStatus] || 0;
    const newOrder = statusOrder[newStatus] || 0;

    // Allow progression forward or to rejected
    return newOrder > currentOrder || newStatus === 'REJECTED';
  }
}