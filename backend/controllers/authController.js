const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// In-Memory Fallback User Registry for offline / IP-restricted MongoDB Atlas access
const inMemoryUsers = new Map();

/**
 * Get or generate JWT secret.
 * If JWT_SECRET is not set or is the placeholder, generate a random one
 * for this process and log a warning.
 */
function getJwtSecret() {
  const envSecret = process.env.JWT_SECRET;
  if (envSecret && envSecret !== 'CHANGE_ME_generate_with_node_e_crypto_randomBytes_64_toString_hex') {
    return envSecret;
  }

  // Generate a secure random secret for this process
  if (!getJwtSecret._generated) {
    getJwtSecret._generated = crypto.randomBytes(64).toString('hex');
    console.log('[secondLook] WARNING: JWT_SECRET not set. Generated temporary secret. Set JWT_SECRET in .env for production.');
  }
  return getJwtSecret._generated;
}

/**
 * Helper Function: Generates signed JWT token containing userId and role
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    getJwtSecret(),
    { expiresIn: '30d' }
  );
};

/**
 * @desc    Register a new candidate or recruiter
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      return next(new Error('Please provide name, email, and password'));
    }

    const cleanEmail = email.toLowerCase().trim();
    const userRole = role || 'candidate';

    // 1. Try MongoDB Atlas registration first
    try {
      const userExists = await User.findOne({ email: cleanEmail });
      if (userExists) {
        res.status(400);
        return next(new Error('User already exists with this email address'));
      }

      const user = await User.create({
        name,
        email: cleanEmail,
        password,
        role: userRole
      });

      const token = generateToken(user._id, user.role);
      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.profile || {}
        }
      });
    } catch (dbErr) {
      console.log('[secondLook] MongoDB registration fallback:', dbErr.message);

      // 2. Fallback to in-memory registration if MongoDB Atlas is offline/IP-blocked
      if (inMemoryUsers.has(cleanEmail)) {
        res.status(400);
        return next(new Error('User already exists with this email address'));
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const mockId = 'usr_' + Date.now();

      const newUser = {
        _id: mockId,
        name,
        email: cleanEmail,
        password: hashedPassword,
        role: userRole,
        profile: {}
      };

      inMemoryUsers.set(cleanEmail, newUser);

      const token = generateToken(mockId, userRole);
      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        token,
        user: {
          _id: mockId,
          name,
          email: cleanEmail,
          role: userRole,
          profile: {}
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user and return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      res.status(400);
      return next(new Error('Please provide email and password'));
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Try MongoDB Atlas authentication first
    try {
      const user = await User.findOne({ email: cleanEmail }).select('+password');
      if (user && (await user.matchPassword(password))) {
        if (role && user.role !== role) {
          res.status(401);
          return next(new Error(`Account registered as ${user.role}. Please select the correct role.`));
        }

        const token = generateToken(user._id, user.role);
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          token,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profile: user.profile || {}
          }
        });
      }
    } catch (dbErr) {
      console.log('[secondLook] MongoDB login fallback:', dbErr.message);
    }

    // 2. Try In-Memory Fallback authentication
    const memUser = inMemoryUsers.get(cleanEmail);
    if (memUser) {
      const match = await bcrypt.compare(password, memUser.password);
      if (match) {
        if (role && memUser.role !== role) {
          res.status(401);
          return next(new Error(`Account registered as ${memUser.role}. Please select the correct role.`));
        }

        const token = generateToken(memUser._id, memUser.role);
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          token,
          user: {
            _id: memUser._id,
            name: memUser.name,
            email: memUser.email,
            role: memUser.role,
            profile: memUser.profile || {}
          }
        });
      }
    }

    res.status(401);
    return next(new Error('Invalid email or password'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    // Re-fetch from DB for full profile
    let user = null;
    try {
      user = await User.findById(req.user._id).select('-password');
    } catch (err) {
      console.log('[secondLook] getMe DB notice:', err.message);
    }

    if (!user) {
      user = req.user;
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile || {}
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile (candidate details)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, profile } = req.body;
    const userId = req.user._id;

    let user = null;
    try {
      user = await User.findById(userId);
    } catch (err) {
      console.log('[secondLook] Profile update DB notice:', err.message);
    }

    if (!user) {
      // In-memory fallback
      for (const [email, memUser] of inMemoryUsers) {
        if (memUser._id.toString() === userId.toString()) {
          if (name) memUser.name = name;
          if (profile) memUser.profile = { ...memUser.profile, ...profile };
          return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
              _id: memUser._id,
              name: memUser.name,
              email: memUser.email,
              role: memUser.role,
              profile: memUser.profile || {}
            }
          });
        }
      }
      res.status(404);
      return next(new Error('User not found'));
    }

    if (name) user.name = name;
    if (profile) {
      user.profile = {
        ...user.profile?.toObject?.() || {},
        ...profile
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile || {}
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  getJwtSecret,
};
