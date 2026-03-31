import cron from 'node-cron';
import Interview from '../modules/interview/interview.model.js';
import { fetchRecording, deleteRecording } from './zoom.service.js';

export const initCronJobs = () => {
  // 1. Fetch Recording Job - Runs every 1 hour (Minute 0 of every hour)
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Executing recording fetch task...');
    try {
      const interviews = await Interview.find({
        status: 'completed',
        zoomRecordingStatus: 'pending',
        zoomMeetingId: { $exists: true, $ne: null }
      });

      for (const interview of interviews) {
        try {
          const recData = await fetchRecording(interview.zoomMeetingId);
          if (recData && recData.downloadUrl) {
            interview.zoomRecordingUrl = recData.downloadUrl;
            interview.zoomRecordingStatus = 'available';
            await interview.save();
            console.log(`[CRON] Saved recording for interview: ${interview._id}`);
          }
        } catch (err) {
          console.error(`[CRON] Error parsing recording for ${interview._id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[CRON] Global failure in fetcher job:', err.message);
    }
  });

  // 2. Cleanup Job - Runs at midnight, every 2 days
  cron.schedule('0 0 */2 * *', async () => {
    console.log('[CRON] Executing recording cleanup task...');
    try {
      // Define cleanup threshold: Recordings from interviews older than 7 days
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - 7);

      const staleInterviews = await Interview.find({
        zoomRecordingStatus: 'available',
        zoomMeetingId: { $exists: true, $ne: null },
        scheduledAt: { $lt: thresholdDate }
      });

      for (const interview of staleInterviews) {
        try {
          await deleteRecording(interview.zoomMeetingId);
          // Set to deleted regardless of zoom 404 (already deleted) state since it's gone
          interview.zoomRecordingStatus = 'deleted';
          interview.zoomRecordingUrl = null;
          await interview.save();
          console.log(`[CRON] Deleted stale recording for interview: ${interview._id}`);
        } catch (err) {
          console.error(`[CRON] Failed deleting recording for ${interview._id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[CRON] Global failure in cleanup job:', err.message);
    }
  });

  console.log('✅ Cron services initialized successfully.');
};
