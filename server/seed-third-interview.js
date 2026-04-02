/**
 * Seed script: create a THIRD completed interview for swapnilparida7@gmail.com
 * with a different class code (D-5) so Reports/Dashboard show more diverse data.
 *
 * Run: node seed-third-interview.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tims';

const candidateSchema = new mongoose.Schema({
  firstName: String, lastName: String,
  email: String, phone: String, status: { type: String, default: 'applied' },
}, { timestamps: true });

const interviewSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  scheduledAt: Date,
  status: { type: String, default: 'scheduled' },
  pricing: {
    cpc: String, cpcFrom: String, cpcTo: String, category: String,
    classCode: String,
    details: {
      parentMonthly: Number, parentYearly: Number,
      teacherMonthly: Number, teacherYearly: Number,
    },
  },
  zoomMeetingId: String, zoomJoinUrl: String, zoomStartUrl: String,
}, { timestamps: true });

const Candidate = mongoose.model('Candidate', candidateSchema);
const Interview = mongoose.model('Interview', interviewSchema);

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected');

  const candidate = await Candidate.findOne({ email: 'swapnilparida7@gmail.com' });
  if (!candidate) {
    console.error('❌  Candidate not found. Run seed-test-interview.js first.');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log('✅  Candidate:', candidate._id);

  const pricing = {
    cpc:       'DP-5',
    cpcFrom:   'DP-4',
    cpcTo:     'DP-5',
    category:  'DP',
    classCode: 'D-5',
    details: {
      parentMonthly:  3499,
      parentYearly:  38489,
      teacherMonthly: 2800,
      teacherYearly: 30800,
    },
  };

  const iv = await Interview.create({
    candidate:    candidate._id,
    scheduledAt:  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    status:       'completed',
    pricing,
    zoomMeetingId: 'seed-dummy-3',
    zoomJoinUrl:   'https://zoom.us/j/seed3',
    zoomStartUrl:  'https://zoom.us/s/seed3',
  });

  console.log('✅  Created third interview:', iv._id);
  console.log('    Class Code : D-5');
  console.log('    CPC        : DP-5  (range DP-4 → DP-5)');
  console.log('    Monthly Fee: ₹3,499');

  await mongoose.disconnect();
  console.log('\n✅  Done. Refresh Dashboard / Reports to see updated data.');
}

run().catch(err => { console.error('❌ Failed:', err.message); process.exit(1); });
