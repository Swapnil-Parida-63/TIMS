export const normalizeKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const normalized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Convert to lowercase and strip all spaces/special characters
    const newKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    normalized[newKey] = value;
  }
  return normalized;
};
