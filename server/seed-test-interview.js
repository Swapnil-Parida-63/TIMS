/**
 * Seed script: patch the existing interview for swapnilparida7@gmail.com
 * to have a real CPC range and class code so Reports section reflects data.
 *
 * Run: node seed-test-interview.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tims';

// ── Inline minimal schemas to avoid loading the full app ──────────────────────
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

  // ── 1. Find or create the candidate ─────────────────────────────────────────
  let candidate = await Candidate.findOne({ email: 'swapnilparida7@gmail.com' });

  if (!candidate) {
    candidate = await Candidate.create({
      firstName: 'Swapnil',
      lastName: 'Parida',
      email: 'swapnilparida7@gmail.com',
      phone: '4648649846',
      status: 'interview scheduled',
      subjectToTeach: 'Mathematics',
      boardsToTeach: ['CBSE', 'ICSE'],
      classesToTeach: ['9', '10', '11'],
      mediumOfInstruction: ['English'],
      mediumComfortable: 'English',
      serviceLocation: ['BBSR'],
      institutionalExperience: '3 years',
      tuitionExperience: '2 years',
    });
    console.log('✅  Candidate created:', candidate._id);
  } else {
    console.log('✅  Candidate found:', candidate._id);
  }

  // ── 2. Find existing interview(s) for this candidate ───────────────────────
  const existing = await Interview.find({ candidate: candidate._id });
  console.log(`ℹ️   Found ${existing.length} existing interview(s)`);

  // ── 3. Patch ALL of them with a real CPC range + class code ─────────────────
  const pricing = {
    cpc:       'EP-10',       // single-point CPC
    cpcFrom:   'EP-10',
    cpcTo:     'EP-10',
    category:  'EP',
    classCode: 'A-4',
    details: {
      parentMonthly:  12000,
      parentYearly:  132000,
      teacherMonthly:  9600,
      teacherYearly:  105600,
    },
  };

  if (existing.length > 0) {
    for (const iv of existing) {
      iv.pricing = pricing;
      iv.status  = 'completed';
      await iv.save();
      console.log('✅  Patched interview:', iv._id);
    }
  } else {
    // No interview yet — create a dummy one (no Zoom needed for reports)
    const iv = await Interview.create({
      candidate: candidate._id,
      scheduledAt: new Date(),
      status: 'completed',
      pricing,
      zoomMeetingId: 'seed-dummy',
      zoomJoinUrl:   'https://zoom.us/j/seed',
      zoomStartUrl:  'https://zoom.us/s/seed',
    });
    console.log('✅  Created interview:', iv._id);
  }

  await mongoose.disconnect();
  console.log('✅  Done. Refresh the Reports page to see the data.');
}

run().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
