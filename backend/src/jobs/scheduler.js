import cron from 'node-cron';
import { MailSyncService } from '../services/mailSync.js';
import { mailSyncQueue } from './queues.js';

const mailSyncService = new MailSyncService();

// Schedule mail sync every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('🕐 Running scheduled mail sync for all active accounts');
  
  try {
    // This will sync all active mail accounts
    const results = await mailSyncService.syncAllActiveAccounts();
    console.log(`📧 Scheduled sync completed. Processed ${results.length} accounts`);
  } catch (error) {
    console.error('❌ Scheduled mail sync failed:', error);
  }
});

console.log('⏰ Cron scheduler initialized - mail sync every 6 hours');