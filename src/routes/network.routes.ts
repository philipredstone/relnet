import express from 'express';
import { check } from 'express-validator';
import * as networkController from '../controllers/network.controller';
import { auth } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/networks
// @desc    Get all networks for current user
// @access  Private
router.get('/', networkController.getUserNetworks);

// @route   POST /api/networks
// @desc    Create a new network
// @access  Private
router.post(
    '/',
    [
        check('name', 'Network name is required').not().isEmpty(),
    ],
    networkController.createNetwork
);

// @route   GET /api/networks/:id
// @desc    Get a specific network
// @access  Private
router.get('/:id', networkController.getNetwork);

// @route   PUT /api/networks/:id
// @desc    Update a network
// @access  Private
router.put(
    '/:id',
    [
        check('name', 'Network name is required if provided').optional().not().isEmpty(),
    ],
    networkController.updateNetwork
);

// @route   DELETE /api/networks/:id
// @desc    Delete a network
// @access  Private
router.delete('/:id', networkController.deleteNetwork);

export default router;