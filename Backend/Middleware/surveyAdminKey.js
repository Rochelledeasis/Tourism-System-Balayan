import crypto from 'crypto';

// Only authorized personnel may manage survey responses (2.2.2).
// Set ADMIN_KEY in Backend/.env; the Survey > Responses page sends it in the "x-admin-key" header.
export const requireAdminKey = (req, res, next) => {
  const expected = process.env.ADMIN_KEY;
  const given = req.get('x-admin-key') || '';

  if (!expected) {
    return res.status(500).json({ success: false, message: 'ADMIN_KEY is not set in the backend .env file.' });
  }

  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ success: false, message: 'Invalid or missing access key.' });
  }
  next();
};
