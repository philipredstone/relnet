import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';
import { UserRequest } from '../types/express';
import { validationResult } from 'express-validator';

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this';
// Token expiration (1 day)
const TOKEN_EXPIRY = '1d';

// Generate JWT token
const generateToken = (user: IUser): string => {
    return jwt.sign({ id: user._id }, JWT_SECRET, {
        expiresIn: TOKEN_EXPIRY,
    });
};

// Set cookie with JWT token
const setTokenCookie = (res: Response, token: string): void => {
    // Cookie options
    const options = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };

    res.cookie('token', token, options);
};

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        if(!process.env.ENABLE_REGISTRATION)
        {
            res.status(403).json({errors: ["Registration is disabled"]});
            return;
        }

        const { email, password, username } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        // Create new user
        user = new User({
            email,
            password,
            username,
        });

        // Save user to database
        await user.save();

        // Generate JWT token
        const token = generateToken(user);

        // Set token cookie
        setTokenCookie(res, token);

        // Send response
        res.status(201).json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        // Check if password is correct
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        // Generate JWT token
        const token = generateToken(user);

        // Set token cookie
        setTokenCookie(res, token);

        // Send response
        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Logout user
export const logout = (req: Request, res: Response): void => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000), // 10 seconds
        httpOnly: true,
    });

    res.json({ success: true, message: 'Logged out successfully' });
};

// Get current user
export const getCurrentUser = async (req: UserRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;

        if (!user) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
            },
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};