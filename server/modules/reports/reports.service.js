import Teacher    from '../teacher/teacher.model.js';
import Interview  from '../interview/interview.model.js';
import Candidate  from '../candidate/candidate.model.js';
import Meeting    from '../meeting/meeting.model.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Returns a $dateToString format string based on period.
 * day   → "2026-04-01"
 * week  → "2026-W14"       (year-week)
 * month → "2026-04"
 */
function dateFormat(period) {
  if (period === 'day')   return '%Y-%m-%d';
  if (period === 'week')  return '%Y-W%V';
  return '%Y-%m';  // month (default)
}

/** Shared time-series aggregation builder. */
function timeSeriesPipeline(collection, matchStage, dateField, period, groupExtra = {}) {
  return collection.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat(period), date: `$${dateField}` } },
        count: { $sum: 1 },
        ...groupExtra,
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

// ─── 1. Finalized Teachers ─────────────────────────────────────────────────
export async function getFinalizedReport(period) {
  const timeSeries = await timeSeriesPipeline(Teacher, {}, 'createdAt', period);

  const total = await Teacher.countDocuments();

  // Return full teacher list with candidate info populated for the detail table
  const teachers = await Teacher.find({})
    .populate('candidate', 'firstName lastName email phone serviceLocation')
    .sort({ createdAt: -1 })
    .lean();

  return { total, timeSeries, teachers };
}

// ─── 2. Reserved Candidates ──────────────────────────────────────────────────
export async function getReservedReport(period) {
  const match = { status: 'reserved' };

  // Time series: count candidates moved to reserved over time (by updatedAt)
  const fmt = dateFormat(period);
  const timeSeries = await Candidate.aggregate([
    { $match: match },
    { $group: {
        _id: { $dateToString: { format: fmt, date: '$updatedAt' } },
        count: { $sum: 1 }
    }},
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', count: 1 } }
  ]);

  const total = await Candidate.countDocuments(match);

  // Full list of reserved candidates with contact + reserve reason
  const reserved = await Candidate.find(match)
    .sort({ updatedAt: -1 })
    .lean();

  return { total, timeSeries, reserved };
}

// ─── 3. Meetings Held ─────────────────────────────────────────────────────
export async function getMeetingsReport(period) {
  // Panelist/Teacher meetings
  const meetingMatch = { status: 'completed' };
  const meetingsTimeSeries = await timeSeriesPipeline(Meeting, meetingMatch, 'updatedAt', period);
  const meetingsTotal = await Meeting.countDocuments(meetingMatch);

  // Candidate interviews (completed + selected + reserved all count as "held")
  const interviewMatch = { status: { $in: ['completed', 'selected', 'reserved'] } };
  const interviewsTimeSeries = await timeSeriesPipeline(Interview, interviewMatch, 'updatedAt', period);
  const interviewsTotal = await Interview.countDocuments(interviewMatch);

  return {
    // meetings sub-section
    total: meetingsTotal,
    timeSeries: meetingsTimeSeries,
    // interviews sub-section
    interviewsTotal,
    interviewsTimeSeries,
  };
}

// ─── 4. CPC Assigned ────────────────────────────────────────────────────
export async function getCpcReport(period) {
  // TOP CPC — sorted by tier (EP=4 > DP=3 > BP=2 > AP=1), then by most recent assignment
  // Tier is determined by the first two chars of the CPC string.
  const topCpc = await Interview.aggregate([
    { $match: { 'pricing.cpc': { $exists: true, $nin: [null, ''] } } },
    {
      $group: {
        _id: '$pricing.cpc',
        count: { $sum: 1 },
        latestAt: { $max: '$updatedAt' },
        firstCandidate: { $last: '$candidate' }, // last = most recent candidate
      },
    },
    {
      // Compute tier: EP=4, DP=3, BP=2, AP=1, else 0
      $addFields: {
        tierPrefix: { $toUpper: { $substrCP: ['$_id', 0, 2] } },
      },
    },
    {
      $addFields: {
        tierOrder: {
          $switch: {
            branches: [
              { case: { $eq: ['$tierPrefix', 'EP'] }, then: 4 },
              { case: { $eq: ['$tierPrefix', 'DP'] }, then: 3 },
              { case: { $eq: ['$tierPrefix', 'BP'] }, then: 2 },
              { case: { $eq: ['$tierPrefix', 'AP'] }, then: 1 },
            ],
            default: 0,
          },
        },
      },
    },
    // Sort: highest tier first, then most recently assigned
    { $sort: { tierOrder: -1, latestAt: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'candidates',
        localField: 'firstCandidate',
        foreignField: '_id',
        as: 'candidateInfo',
      },
    },
    {
      $addFields: {
        candidateName: {
          $trim: {
            input: {
              $concat: [
                { $ifNull: [{ $arrayElemAt: ['$candidateInfo.firstName', 0] }, ''] },
                ' ',
                { $ifNull: [{ $arrayElemAt: ['$candidateInfo.lastName', 0] }, ''] },
              ],
            },
          },
        },
        email: { $arrayElemAt: ['$candidateInfo.email', 0] },
        phone: { $arrayElemAt: ['$candidateInfo.phone', 0] },
      },
    },
    { $project: { candidateInfo: 0, firstCandidate: 0, tierPrefix: 0, tierOrder: 0 } },
  ]);

  // All interviews with CPC assigned — flat list with candidate details
  const allCpcAssigned = await Interview.find({
    'pricing.cpc': { $exists: true, $ne: null, $ne: '' },
  })
    .populate('candidate', 'firstName lastName email phone')
    .sort({ updatedAt: -1 })
    .lean();

  // Top CPC ranges (most assigned)
  const topCpcRange = await Interview.aggregate([
    {
      $match: {
        'pricing.cpcFrom': { $exists: true, $ne: '' },
        'pricing.cpcTo':   { $exists: true, $ne: '' },
      },
    },
    {
      $group: {
        _id: { from: '$pricing.cpcFrom', to: '$pricing.cpcTo' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $project: {
        range: { $concat: ['$_id.from', ' → ', '$_id.to'] },
        count: 1,
      },
    },
  ]);

  // Time-series of CPC assignments per period
  const timeSeries = await Interview.aggregate([
    { $match: { 'pricing.cpc': { $exists: true, $ne: null, $ne: '' } } },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat(period), date: '$updatedAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const total = await Interview.countDocuments({
    'pricing.cpc': { $exists: true, $ne: null, $ne: '' },
  });

  return { total, timeSeries, topCpc, topCpcRange, allCpcAssigned };
}

// ─── 5. Class Code Report ─────────────────────────────────────────────────
export async function getClassCodeReport(period) {
  // TOP CLASS CODES — sorted by tier (E=4 > D=3 > B=2 > A=1), then by most recent assignment
  const topClassCodes = await Teacher.aggregate([
    // Unwind all assigned class codes into individual rows
    {
      $project: {
        candidate: 1,
        createdAt: 1,
        codes: {
          $cond: {
            if: { $gt: [{ $size: { $ifNull: ['$classCodes', []] } }, 0] },
            then: '$classCodes.code',
            else: ['$classCode'],
          },
        },
      },
    },
    { $unwind: '$codes' },
    { $match: { codes: { $nin: [null, ''] } } },
    {
      $group: {
        _id: '$codes',
        count: { $sum: 1 },
        latestAt: { $max: '$createdAt' },
        recentCandidate: { $last: '$candidate' }, // candidate from most recent teacher record
      },
    },
    {
      // Compute sort tier from first char: E=4, D=3, B=2, A=1, else 0
      $addFields: {
        codePrefix: { $toUpper: { $substrCP: ['$_id', 0, 1] } },
      },
    },
    {
      $addFields: {
        tierOrder: {
          $switch: {
            branches: [
              { case: { $eq: ['$codePrefix', 'E'] }, then: 4 },
              { case: { $eq: ['$codePrefix', 'D'] }, then: 3 },
              { case: { $eq: ['$codePrefix', 'B'] }, then: 2 },
              { case: { $eq: ['$codePrefix', 'A'] }, then: 1 },
            ],
            default: 0,
          },
        },
      },
    },
    // Sort: highest tier first, then most recently assigned within same tier
    { $sort: { tierOrder: -1, latestAt: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'candidates',
        localField: 'recentCandidate',
        foreignField: '_id',
        as: 'candidateInfo',
      },
    },
    {
      $addFields: {
        email: { $arrayElemAt: ['$candidateInfo.email', 0] },
        phone: { $arrayElemAt: ['$candidateInfo.phone', 0] },
        candidateName: {
          $trim: {
            input: {
              $concat: [
                { $ifNull: [{ $arrayElemAt: ['$candidateInfo.firstName', 0] }, ''] },
                ' ',
                { $ifNull: [{ $arrayElemAt: ['$candidateInfo.lastName', 0] }, ''] },
              ],
            },
          },
        },
      },
    },
    { $project: { candidateInfo: 0, recentCandidate: 0, codePrefix: 0, tierOrder: 0 } },
  ]);

  // Time-series based on Teacher creation date
  const timeSeries = await Teacher.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: dateFormat(period), date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Total unique teachers with class codes assigned
  const total = await Teacher.countDocuments({
    $or: [
      { classCode: { $exists: true, $nin: [null, ''] } },
      { 'classCodes.code': { $exists: true, $nin: [null, ''] } }
    ]
  });

  return { total, timeSeries, topClassCodes };
}

// ─── 6. Locations Report ──────────────────────────────────────────────────
/**
 * Returns candidate counts and teacher counts per service location.
 * Optionally filtered to a specific location.
 */
export async function getLocationsReport(locationFilter) {
  const locationMatch = locationFilter
    ? { serviceLocation: locationFilter }
    : {};

  // Candidates per location
  const candidatesByLocation = await Candidate.aggregate([
    { $match: locationMatch },
    { $unwind: '$serviceLocation' },
    ...(locationFilter ? [{ $match: { serviceLocation: locationFilter } }] : []),
    { $group: { _id: '$serviceLocation', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Teachers per location (via Teacher.serviceLocation)
  const teachersByLocation = await Teacher.aggregate([
    { $match: locationMatch },
    { $unwind: { path: '$serviceLocation', preserveNullAndEmptyArrays: false } },
    ...(locationFilter ? [{ $match: { serviceLocation: locationFilter } }] : []),
    { $group: { _id: '$serviceLocation', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return { candidatesByLocation, teachersByLocation };
}

// ─── 7. Candidates Applied ───────────────────────────────────────────────────
/** 
 * How many candidates applied — broken down by time period.
 */
export async function getCandidatesAppliedReport(period) {
  const timeSeries = await timeSeriesPipeline(Candidate, {}, 'createdAt', period);
  const total = await Candidate.countDocuments();

  // Full candidate list for drill-down
  const candidates = await Candidate.find({})
    .select('firstName lastName email phone status serviceLocation createdAt')
    .sort({ createdAt: -1 })
    .lean();

  return { total, timeSeries, candidates };
}

// ─── 8. Teachers by Board / Class / Location ────────────────────────────────
/**
 * Groups finalized teachers by board, class/grade, and service location.
 * Returns each group with a list of teacher (candidate) objects for drill-down.
 */
export async function getCandidatesBreakdownReport() {
  // Helper: aggregate Teacher by a flat string-array field (classes[], serviceLocation[])
  const groupByFlatField = async (fieldPath) => {
    return Teacher.aggregate([
      { $unwind: { path: fieldPath, preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: fieldPath,
          count: { $sum: 1 },
          teacherStubs: {
            $push: {
              teacherId: '$_id',
              candidateId: '$candidate',
              classCode: '$classCode',
              cpc: '$cpc',
            }
          }
        }
      },
      { $sort: { count: -1 } },
    ]);
  };

  // Boards require a special pipeline: students is [{board:'ICSE'},...] — an object array
  const byBoardRaw = await Teacher.aggregate([
    { $unwind: { path: '$students', preserveNullAndEmptyArrays: false } },
    { $match: { 'students.board': { $nin: [null, ''] } } },
    {
      $group: {
        _id: '$students.board',
        count: { $sum: 1 },
        teacherStubs: {
          $push: {
            teacherId: '$_id',
            candidateId: '$candidate',
            classCode: '$classCode',
            cpc: '$cpc',
          }
        }
      }
    },
    { $sort: { count: -1 } },
  ]);

  // Classes and locations are flat string arrays — use the shared helper
  const [byClassRaw, byLocationRaw] = await Promise.all([
    groupByFlatField('$classes'),
    groupByFlatField('$serviceLocation'),
  ]);

  // Enrich raw groups: fetch candidate details for each teacher stub in JS
  const enrichGroups = async (rawGroups) => {
    if (!rawGroups.length) return [];
    const allCandidateIds = rawGroups.flatMap(g => g.teacherStubs.map(t => t.candidateId));
    const cands = await Candidate.find({ _id: { $in: allCandidateIds } })
      .select('firstName lastName email phone').lean();
    const candMap = Object.fromEntries(cands.map(c => [c._id.toString(), c]));
    return rawGroups.map(group => ({
      _id: group._id,
      count: group.count,
      teachers: group.teacherStubs.map(t => {
        const cand = candMap[t.candidateId?.toString()] || {};
        return {
          teacherId: t.teacherId,
          name: `${cand.firstName || ''} ${cand.lastName || ''}`.trim() || 'Unknown',
          email: cand.email || '',
          phone: cand.phone || '',
          classCode: t.classCode || '',
          cpc: t.cpc || '',
        };
      }),
    }));
  };

  const [byBoard, byClass, byLocation] = await Promise.all([
    enrichGroups(byBoardRaw),
    enrichGroups(byClassRaw),
    enrichGroups(byLocationRaw),
  ]);

  const total = await Teacher.countDocuments();

  return { total, byBoard, byClass, byLocation };
}

