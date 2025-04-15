import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { UserRequest } from '../types/express';

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this';

export const auth = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Get token from cookie or authorization header
        const token = req.cookies.token ||
            (req.headers.authorization && req.headers.authorization.startsWith('Bearer')
                ? req.headers.authorization.split(' ')[1]
                : null);

        if (!token) {
            res.status(401).json({ message: 'No token, authorization denied' });
            return;
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

        // Find user by id
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }

        // Set user in request object
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};