import jwt from 'jsonwebtoken';
import User from '../modules/user/user.model.js'; 

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware function to protect routes, it checks for the presence of a JWT token in the Authorization header, verifies it, and attaches the user object to the request if valid. If the token is missing or invalid, it responds with an unauthorized error.

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  req.user = user; // Attach the user object to the request for use in subsequent middleware or route handlers
  next();
  } 
    catch (err) {
        res.status(401).json({ message: "Invalid token" });
        }
  }

