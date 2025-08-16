import { google } from 'googleapis';
import { Client } from '@azure/msal-node';
import dotenv from 'dotenv';

dotenv.config();

// Google OAuth Configuration
export const googleOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const googleScopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid'
];

// Microsoft OAuth Configuration
export const msalConfig = {
  auth: {
    clientId: process.env.MS_CLIENT_ID,
    clientSecret: process.env.MS_CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${process.env.MS_TENANT || 'common'}`
  }
};

export const msalClient = new Client(msalConfig);

export const microsoftScopes = [
  'https://graph.microsoft.com/Mail.Read',
  'offline_access',
  'openid',
  'email'
];