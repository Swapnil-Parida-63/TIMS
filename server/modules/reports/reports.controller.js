import {
  getFinalizedReport,
  getReservedReport,
  getMeetingsReport,
  getCpcReport,
  getClassCodeReport,
  getLocationsReport,
  getCandidatesAppliedReport,
  getCandidatesBreakdownReport,
} from './reports.service.js';

export async function getReport(req, res) {
  try {
    const { type, period = 'month', location } = req.query;

    let data;

    switch (type) {
      case 'finalized':
        data = await getFinalizedReport(period);
        break;
      case 'reserved':
      case 'rejected': // backward compat
        data = await getReservedReport(period);
        break;
      case 'meetings':
        data = await getMeetingsReport(period);
        break;
      case 'cpc':
        data = await getCpcReport(period);
        break;
      case 'classCode':
        data = await getClassCodeReport(period);
        break;
      case 'locations':
        data = await getLocationsReport(location || null);
        break;
      case 'candidatesApplied':
        data = await getCandidatesAppliedReport(period);
        break;
      case 'candidatesBreakdown':
        data = await getCandidatesBreakdownReport(location || null);
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type. Valid types: finalized, reserved, meetings, cpc, classCode, locations, candidatesApplied, candidatesBreakdown' });
    }

    res.json({ type, period, location: location || null, data });
  } catch (err) {
    console.error('[Reports] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
