import { Queue, Worker } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { MailSyncService } from '../services/mailSync.js';
import { MailParseService } from '../services/mailParse.js';

// Create queues
export const mailSyncQueue = new Queue('mail-sync', { connection: redisConfig.connection });
export const mailParseQueue = new Queue('mail-parse', { connection: redisConfig.connection });

// Create services
const mailSyncService = new MailSyncService();
const mailParseService = new MailParseService();

// Mail sync worker
const mailSyncWorker = new Worker('mail-sync', async (job) => {
  const { userId, provider, emailAddress } = job.data;
  
  console.log(`Processing mail sync job for ${emailAddress}`);
  
  try {
    const result = await mailSyncService.syncUserMails(userId, provider, emailAddress);
    console.log(`Mail sync completed for ${emailAddress}:`, result);
    return result;
  } catch (error) {
    console.error(`Mail sync failed for ${emailAddress}:`, error);
    throw error;
  }
}, { 
  connection: redisConfig.connection,
  concurrency: 3,
  removeOnComplete: 10,
  removeOnFail: 5
});

// Mail parse worker
const mailParseWorker = new Worker('mail-parse', async (job) => {
  const { messageId, userId, mailAccountId } = job.data;
  
  console.log(`Processing mail parse job for message ${messageId}`);
  
  try {
    const result = await mailParseService.parseMessage(messageId, userId, mailAccountId);
    console.log(`Mail parse completed for message ${messageId}:`, result);
    return result;
  } catch (error) {
    console.error(`Mail parse failed for message ${messageId}:`, error);
    throw error;
  }
}, { 
  connection: redisConfig.connection,
  concurrency: 5,
  removeOnComplete: 20,
  removeOnFail: 10
});

// Error handling
mailSyncWorker.on('failed', (job, err) => {
  console.error(`Mail sync job ${job.id} failed:`, err);
});

mailParseWorker.on('failed', (job, err) => {
  console.error(`Mail parse job ${job.id} failed:`, err);
});

console.log('✅ BullMQ workers initialized');