/**
 * CPC_MAP mirrored on the frontend so we don't need an extra API call.
 * Kept in sync with /server/config/cpcMap.js
 */
export const CPC_MAP = {
  AP: {
    "AP-1": ["A-1","A-2","A-3","A-4"],
    "AP-2": ["A-2","A-3","A-4","A-5"],
    "AP-3": ["A-3","A-4","A-5","A-6"],
    "AP-4": ["A-4","A-5","A-6","A-7"],
    "AP-5": ["A-5","A-6","A-7","A-8"],
    "AP-6": ["A-6","A-7","A-8","A-9"],
    "AP-7": ["A-7","A-8","A-9","A-10"],
    "AP-8": ["A-8","A-9","A-10","A-11"],
    "AP-9": ["A-9","A-10","A-11","A-12"],
    "AP-10": ["A-10","A-11","A-12","A-13"],
  },
  BP: {
    "BP-1": ["B-1","B-2","B-3","B-4"],
    "BP-2": ["B-2","B-3","B-4","B-5"],
    "BP-3": ["B-3","B-4","B-5","B-6"],
    "BP-4": ["B-4","B-5","B-6","B-7"],
    "BP-5": ["B-5","B-6","B-7","B-8"],
    "BP-6": ["B-6","B-7","B-8","B-9"],
    "BP-7": ["B-7","B-8","B-9","B-10"],
    "BP-8": ["B-8","B-9","B-10","B-11"],
    "BP-9": ["B-9","B-10","B-11","B-12"],
    "BP-10": ["B-10","B-11","B-12","B-13"],
  },
  DP: {
    "DP-1": ["D-1","D-2","D-3","D-4"],
    "DP-2": ["D-2","D-3","D-4","D-5"],
    "DP-3": ["D-3","D-4","D-5","D-6"],
    "DP-4": ["D-4","D-5","D-6","D-7"],
    "DP-5": ["D-5","D-6","D-7","D-8"],
    "DP-6": ["D-6","D-7","D-8","D-9"],
    "DP-7": ["D-7","D-8","D-9","D-10"],
    "DP-8": ["D-8","D-9","D-10","D-11"],
    "DP-9": ["D-9","D-10","D-11","D-12"],
    "DP-10": ["D-10","D-11","D-12","D-13"],
  },
  EP: {
    "EP-1": ["E-1","E-2","E-3","E-4"],
    "EP-2": ["E-2","E-3","E-4","E-5"],
    "EP-3": ["E-3","E-4","E-5","E-6"],
    "EP-4": ["E-4","E-5","E-6","E-7"],
    "EP-5": ["E-5","E-6","E-7","E-8"],
    "EP-6": ["E-6","E-7","E-8","E-9"],
    "EP-7": ["E-7","E-8","E-9","E-10"],
    "EP-8": ["E-8","E-9","E-10","E-11"],
    "EP-9": ["E-9","E-10","E-11","E-12"],
    "EP-10": ["E-10","E-11","E-12","E-13"],
  },
};

export const SECTION_LABELS = {
  AP: "AP — Primary All Subjects",
  BP: "BP — Primary All Subjects (Higher)",
  DP: "DP — Secondary Specific Subjects",
  EP: "EP — Secondary Sciences",
};

/**
 * parentMonthly values for every class code — mirrored from server/config/classCodes.js.
 * Only parentMonthly is needed here (for price-range display in the CPC picker).
 */
export const CLASS_MONTHLY = {
  "A-1": 1499,  "A-2": 1999,  "A-3": 2499,  "A-4": 2999,  "A-5": 3499,
  "A-6": 3499,  "A-7": 3999,  "A-8": 4499,  "A-9": 4999,  "A-10": 5499,
  "A-11": 5999, "A-12": 5999, "A-13": 6499,

  "B-1": 1999,  "B-2": 2499,  "B-3": 2999,  "B-4": 3499,  "B-5": 3499,
  "B-6": 3999,  "B-7": 4499,  "B-8": 4999,  "B-9": 5499,  "B-10": 5999,
  "B-11": 5999, "B-12": 6499, "B-13": 6999,

  "D-1": 1499,  "D-2": 1999,  "D-3": 2499,  "D-4": 2999,  "D-5": 3499,
  "D-6": 3999,  "D-7": 3999,  "D-8": 4499,  "D-9": 4499,  "D-10": 4999,
  "D-11": 4999, "D-12": 5499, "D-13": 5999,

  "E-1": 1999,  "E-2": 2499,  "E-3": 2999,  "E-4": 3499,  "E-5": 3999,
  "E-6": 3999,  "E-7": 4499,  "E-8": 4499,  "E-9": 4999,  "E-10": 4999,
  "E-11": 5499, "E-12": 5999, "E-13": 6499,
};

/**
 * Returns { min, max } parentMonthly for all class codes covered by a single CPC.
 * e.g. getCpcPriceRange("AP-3") → { min: 2499, max: 3499 }
 */
export const getCpcPriceRange = (cpc) => {
  const prefix = cpc.split("-")[0];                  // "AP"
  const codes  = CPC_MAP[prefix]?.[cpc] || [];       // ["A-3","A-4","A-5","A-6"]
  const prices = codes.map(c => CLASS_MONTHLY[c]).filter(Boolean);
  if (!prices.length) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
};

/** Formats a price range pair as "₹1,499 – ₹3,499" */
export const formatPriceRange = ({ min, max }) => {
  const fmt = (n) => `₹${n.toLocaleString('en-IN')}`;
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
};
