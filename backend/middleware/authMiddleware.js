const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-super-secret-jwt-key-here'; // Hardcoded secret key
const JWT_EXPIRY = '30d'; // Token expiry time - extended to 30 days

const authenticateJWT = (req, res, next) => {
  console.log('Authenticating JWT');
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  console.log('Token found:', !!token);

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified for user:', decoded.userId);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

const generateToken = (user) => {
  // Create a simple payload with only necessary user data
  const payload = {
    userId: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
};

const setCookie = (res, token) => {
  console.log('Setting token cookie');
  res.cookie('token', token, cookieOptions);
};

module.exports = {
  authenticateJWT,
  generateToken,
  setCookie,
  cookieOptions,
  JWT_SECRET, // Export for consistency
  JWT_EXPIRY
};
