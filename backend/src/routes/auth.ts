import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Generate JWT token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'iconic-fm-super-secret-jwt-key-2025';
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  console.log('Generating token for user:', userId);
  return jwt.sign(
    { userId }, 
    secret,
    { expiresIn: '7d' } as jwt.SignOptions
  );
};

// Register
router.post('/register', [
  body('username').isLength({ min: 3, max: 30 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: role || 'visitor'
    });

    await user.save();

    // Generate token
    const token = generateToken((user._id as any).toString());

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        preferences: user.preferences,
        stats: user.stats
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken((user._id as any).toString());

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        preferences: user.preferences,
        stats: user.stats
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Return the user directly, not wrapped in a user object
    res.json({
      _id: req.user!._id,
      username: req.user!.username,
      email: req.user!.email,
      role: req.user!.role,
      isActive: req.user!.isActive,
      profile: req.user!.profile,
      preferences: req.user!.preferences,
      stats: req.user!.stats,
      createdAt: req.user!.createdAt
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Refresh token
router.post('/refresh', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const token = generateToken((req.user!._id as any).toString());
    res.json({ token });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
