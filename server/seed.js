/**
 * Seed Script — Creates the initial super_admin account.
 * Run ONCE from /server directory:
 *   node seed.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin', 'micro_observer', 'expert'], required: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('❌  MONGO_URI not found in .env');
  process.exit(1);
}

const SEED_USERS = [
  {
    name: 'Super Admin',
    email: 'superadmin@thementr.com',
    password: 'Admin@1234',
    role: 'super_admin',
  },
  {
    name: 'Admin User',
    email: 'admin@thementr.com',
    password: 'Admin@1234',
    role: 'admin',
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB\n');

  for (const u of SEED_USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`⚠️   Already exists: ${u.email} (${u.role}) — skipped`);
      continue;
    }
    const hashed = await bcrypt.hash(u.password, 10);
    await User.create({ ...u, password: hashed });
    console.log(`✅  Created: ${u.email}  role=${u.role}  password=${u.password}`);
  }

  console.log('\n🚀  Seeding complete. You can now log in!\n');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
