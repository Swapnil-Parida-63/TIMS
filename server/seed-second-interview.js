/**
 * Seed script: create a SECOND completed interview for swapnilparida7@gmail.com
 * with a different class code and CPC so the Reports page shows richer data.
 *
 * Run: node seed-second-interview.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tims';

const candidateSchema = new mongoose.Schema({
  firstName: String, lastName: String,
  email: String, phone: String, status: { type: String, default: 'applied' },
  rejectionReason: String, rejectionNotes: String,
  boardsToTeach: [String], boardsTaught: [String],
  classesToTeach: [String], classesTaught: [String],
  subjectToTeach: String, subjectTaught: String,
  mediumOfInstruction: [String], mediumComfortable: String,
  institutionalExperience: String, tuitionExperience: String,
  serviceLocation: [String],
}, { timestamps: true });

const interviewSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  scheduledAt: Date,
  status: { type: String, default: 'scheduled' },
  rejectionReason: String, rejectionNotes: String,
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
const Interview  = mongoose.model('Interview',  interviewSchema);

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB');

  // 1. Find the candidate
  const candidate = await Candidate.findOne({ email: 'swapnilparida7@gmail.com' });
  if (!candidate) {
    console.error('❌  Candidate swapnilparida7@gmail.com not found. Run seed-test-interview.js first.');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log('✅  Candidate found:', candidate._id);

  // 2. Create a NEW interview with a different class code + CPC
  const pricing = {
    cpc:       'BP-2',
    cpcFrom:   'BP-1',
    cpcTo:     'BP-2',
    category:  'BP',
    classCode: 'B-3',
    details: {
      parentMonthly:  18000,
      parentYearly:  198000,
      teacherMonthly: 14400,
      teacherYearly: 158400,
    },
  };

  const iv = await Interview.create({
    candidate:    candidate._id,
    scheduledAt:  new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    status:       'completed',
    pricing,
    zoomMeetingId: 'seed-dummy-2',
    zoomJoinUrl:   'https://zoom.us/j/seed2',
    zoomStartUrl:  'https://zoom.us/s/seed2',
  });

  console.log('✅  Created second interview:', iv._id);
  console.log('    Class Code : B-3');
  console.log('    CPC        : BP-2  (range BP-1 → BP-2)');
  console.log('    Monthly Fee: ₹18,000');

  await mongoose.disconnect();
  console.log('\n✅  Done. Refresh the Reports page to see the updated data.');
}

run().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
