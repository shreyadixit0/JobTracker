import { GoogleMailService } from '../services/providers/gmailService.js';
import { MicrosoftMailService } from '../services/providers/outlookService.js';
import { MailSyncService } from '../services/mailSync.js';
import { supabase } from '../config/supabase.js';
import { googleOAuth2Client, googleScopes, msalClient, microsoftScopes } from '../config/oauth.js';
import { mailSyncQueue } from '../jobs/queues.js';
import jwt from 'jsonwebtoken';

export class IntegrationController {
  constructor() {
    this.googleMailService = new GoogleMailService();
    this.microsoftMailService = new MicrosoftMailService();
    this.mailSyncService = new MailSyncService();
  }

  // Google OAuth methods
  async connectGoogle(req, res, next) {
    try {
      const userId = req.user.id;
      
      // Generate state with user info
      const state = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '10m' });
      
      const authUrl = googleOAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: googleScopes,
        state,
        prompt: 'consent'
      });

      res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  async googleCallback(req, res, next) {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?error=missing_params`);
      }

      // Verify state and extract user ID
      let userId;
      try {
        const decoded = jwt.verify(state, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?error=invalid_state`);
      }

      // Exchange code for tokens
      const { tokens } = await googleOAuth2Client.getToken(code);
      googleOAuth2Client.setCredentials(tokens);

      // Get user email from Google
      const gmail = google.gmail({ version: 'v1', auth: googleOAuth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });

      // Store mail account in database
      const { error } = await supabase
        .from('mail_accounts')
        .upsert([
          {
            user_id: userId,
            provider: 'GMAIL',
            email_address: profile.data.emailAddress,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: new Date(tokens.expiry_date),
            active: true
          }
        ], {
          onConflict: 'user_id,provider,email_address'
        });

      if (error) throw error;

      // Queue initial sync
      await mailSyncQueue.add('sync-gmail', {
        userId,
        provider: 'GMAIL',
        emailAddress: profile.data.emailAddress
      });

      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?success=gmail_connected`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?error=connection_failed`);
    }
  }

  async syncGoogle(req, res, next) {
    try {
      const userId = req.user.id;

      // Get Google mail account
      const { data: mailAccount, error } = await supabase
        .from('mail_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'GMAIL')
        .eq('active', true)
        .single();

      if (error || !mailAccount) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Google mail account not found or not active'
          }
        });
      }

      // Queue sync job
      await mailSyncQueue.add('sync-gmail', {
        userId,
        provider: 'GMAIL',
        emailAddress: mailAccount.email_address
      });

      res.json({
        success: true,
        data: {
          message: 'Gmail sync initiated successfully'
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async disconnectGoogle(req, res, next) {
    try {
      const userId = req.user.id;

      const { error } = await supabase
        .from('mail_accounts')
        .delete()
        .eq('user_id', userId)
        .eq('provider', 'GMAIL');

      if (error) throw error;

      res.json({
        success: true,
        data: {
          message: 'Google account disconnected successfully'
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Microsoft OAuth methods
  async connectMicrosoft(req, res, next) {
    try {
      const userId = req.user.id;
      
      // Generate state with user info
      const state = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '10m' });
      
      const authUrl = await msalClient.getAuthCodeUrl({
        scopes: microsoftScopes,
        redirectUri: process.env.MS_REDIRECT_URI,
        state
      });

      res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  async microsoftCallback(req, res, next) {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?error=missing_params`);
      }

      // Verify state and extract user ID
      let userId;
      try {
        const decoded = jwt.verify(state, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?error=invalid_state`);
      }

      // Exchange code for tokens
      const tokenResponse = await msalClient.acquireTokenByCode({
        code,
        scopes: microsoftScopes,
        redirectUri: process.env.MS_REDIRECT_URI,
      });

      // Get user email from Microsoft Graph
      const userEmail = tokenResponse.account.username;

      // Store mail account in database
      const { error } = await supabase
        .from('mail_accounts')
        .upsert([
          {
            user_id: userId,
            provider: 'OUTLOOK',
            email_address: userEmail,
            access_token: tokenResponse.accessToken,
            refresh_token: tokenResponse.refreshToken,
            token_expires_at: new Date(tokenResponse.expiresOn),
            active: true
          }
        ], {
          onConflict: 'user_id,provider,email_address'
        });

      if (error) throw error;

      // Queue initial sync
      await mailSyncQueue.add('sync-outlook', {
        userId,
        provider: 'OUTLOOK',
        emailAddress: userEmail
      });

      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?success=outlook_connected`);
    } catch (error) {
      console.error('Microsoft callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?error=connection_failed`);
    }
  }

  async syncMicrosoft(req, res, next) {
    try {
      const userId = req.user.id;

      // Get Microsoft mail account
      const { data: mailAccount, error } = await supabase
        .from('mail_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'OUTLOOK')
        .eq('active', true)
        .single();

      if (error || !mailAccount) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Microsoft mail account not found or not active'
          }
        });
      }

      // Queue sync job
      await mailSyncQueue.add('sync-outlook', {
        userId,
        provider: 'OUTLOOK',
        emailAddress: mailAccount.email_address
      });

      res.json({
        success: true,
        data: {
          message: 'Microsoft Outlook sync initiated successfully'
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async disconnectMicrosoft(req, res, next) {
    try {
      const userId = req.user.id;

      const { error } = await supabase
        .from('mail_accounts')
        .delete()
        .eq('user_id', userId)
        .eq('provider', 'OUTLOOK');

      if (error) throw error;

      res.json({
        success: true,
        data: {
          message: 'Microsoft account disconnected successfully'
        }
      });

    } catch (error) {
      next(error);
    }
  }
}