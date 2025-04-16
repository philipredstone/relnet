import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';
import Network from '../models/network.model';
import Person from '../models/person.model';
import Relationship from '../models/relationship.model';
import { UserRequest } from '../types/express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

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

    if (!process.env.ENABLE_REGISTRATION) {
      res.status(400).json({ message: 'Registration is disabled' });
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

    // Create a sample demo network
    // Fix: Ensure user._id is treated as ObjectId
    await createSampleDemoNetwork(user._id);

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

// Create a sample demo network for new users
// Fix: Update parameter type to accept both string and ObjectId
const createSampleDemoNetwork = async (userId: mongoose.Types.ObjectId | string): Promise<void> => {
  try {
    // Ensure userId is an ObjectId
    const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

    // Create a demo network
    const network = new Network({
      name: 'My Sample Network',
      description: 'A demo network to help you get started',
      owner: userObjectId,
      isPublic: false,
    });

    await network.save();

    // Create sample people with better spacing
    const people = [
      { firstName: 'John', lastName: 'Smith', position: { x: 200, y: 200 } },
      { firstName: 'Emma', lastName: 'Johnson', position: { x: 600, y: 200 } },
      { firstName: 'Michael', lastName: 'Williams', position: { x: 200, y: 600 } },
      { firstName: 'Sarah', lastName: 'Brown', position: { x: 600, y: 600 } },
      { firstName: 'David', lastName: 'Jones', position: { x: 800, y: 400 } },
      { firstName: 'Lisa', lastName: 'Garcia', position: { x: 400, y: 400 } },
    ];

    // Fix: Update the type to accept string or ObjectId
    const savedPeople: { [key: string]: mongoose.Types.ObjectId | string } = {};

    // Create each person
    for (const person of people) {
      const newPerson = new Person({
        firstName: person.firstName,
        lastName: person.lastName,
        network: network._id,
        position: person.position,
      });

      await newPerson.save();
      savedPeople[`${person.firstName}${person.lastName}`] = newPerson._id;
    }

    // Create relationships between people
    const relationships = [
      { source: 'JohnSmith', target: 'EmmaJohnson', type: 'freund' },
      { source: 'EmmaJohnson', target: 'MichaelWilliams', type: 'familie' },
      { source: 'MichaelWilliams', target: 'SarahBrown', type: 'arbeitskolleg' },
      { source: 'SarahBrown', target: 'DavidJones', type: 'freund' },
      { source: 'DavidJones', target: 'LisaGarcia', type: 'partner' },
      { source: 'JohnSmith', target: 'DavidJones', type: 'arbeitskolleg' },
    ];

    // Create each relationship
    for (const rel of relationships) {
      const newRelationship = new Relationship({
        source: savedPeople[rel.source],
        target: savedPeople[rel.target],
        type: rel.type,
        network: network._id,
      });

      await newRelationship.save();
    }
  } catch (error) {
    console.error('Error creating sample network:', error);
    // Don't throw the error, just log it so that registration can continue
  }
};
