/**
 * Quick preview script — generates rendered HTML files with dummy data
 * so you can open them in a browser and check the layout before PDF generation.
 *
 * Run: node previewTemplates.js
 * Output: server/uploads/preview-loa.html & server/uploads/preview-earning.html
 */

import './config/env.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadTemplate } from './utils/templateLoader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// ── Dummy data that mirrors a real finalization ──────────────────────────────
const data = {
  name:            'Rahul Sharma',
  email:           'rahul.sharma@example.com',
  phone:           '9876543210',
  address:         '123 Fake Street, City',
  teacherMentRId:  'TMBHACANDOR',
  preferredTimeSlots: 'Flexible (M, A, E)',
  minAV:           '2',
  date:            '27/03/2026',
  classCode:       'A-5',
  cpc:             'AP-3',
  category:        'A',
  subjects:        'All',
  minClasses:      20,
  boards:          'CBSE, ICSE',
  hourlyRate:      120,
  halfRate:        54,
  parentMonthly:   3499,
  fullAmount:      '2,400',
  halfAmount:      '270',
  total:           '2,670',
  studentCount:    3,
  grandTotal:      '8,010',
  grandFullAmount: '7,200',
  grandHalfAmount: '810',
  maxStudentCount: 10,
  maxSlotsOpted:   10,
  totalSlots:      11,
  maxFullAmount:   '24,000',
  maxHalfAmount:   '2,700',
  maxTotal:        '26,700',
};

async function preview() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  const loaHTML     = await loadTemplate('loaTemplate.html',     data);
  const earningHTML = await loadTemplate('earningTemplate.html', data);

  const loaOut     = path.join(UPLOADS_DIR, 'preview-loa-v3.html');
  const earningOut = path.join(UPLOADS_DIR, 'preview-earning-v3.html');

  await fs.writeFile(loaOut,     loaHTML,     'utf-8');
  await fs.writeFile(earningOut, earningHTML, 'utf-8');

  console.log('✅ Preview files generated:');
  console.log('   →', loaOut);
  console.log('   →', earningOut);
  console.log('\nOpen these files in your browser to check the layout.');
}

preview().catch(console.error);
