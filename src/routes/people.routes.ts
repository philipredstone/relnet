import express from 'express';
import { check } from 'express-validator';
import * as peopleController from '../controllers/people.controller';
import { auth } from '../middleware/auth.middleware';
import { checkNetworkAccess } from '../middleware/network-access.middleware';

const router = express.Router();

// All routes require authentication and network access check
router.use('/:networkId/people', auth, checkNetworkAccess);

// @route   GET /api/networks/:networkId/people
// @desc    Get all people in a network
// @access  Private
router.get('/:networkId/people', peopleController.getPeople);

// @route   POST /api/networks/:networkId/people
// @desc    Add a person to the network
// @access  Private
router.post(
  '/:networkId/people',
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('birthday', 'Birthday must be a valid date if provided').optional().isISO8601().toDate(),
  ],
  peopleController.addPerson
);

// @route   PUT /api/networks/:networkId/people/:id
// @desc    Update a person
// @access  Private
router.put(
  '/:networkId/people/:id',
  [
    check('firstName', 'First name must not be empty if provided').optional().not().isEmpty(),
    check('lastName', 'Last name must not be empty if provided').optional().not().isEmpty(),
    check('birthday', 'Birthday must be a valid date if provided').optional().isISO8601().toDate(),
  ],
  peopleController.updatePerson
);

// @route   DELETE /api/networks/:networkId/people/:id
// @desc    Remove a person from the network
// @access  Private
router.delete('/:networkId/people/:id', peopleController.removePerson);

export default router;
