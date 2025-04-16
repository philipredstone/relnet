import express from 'express';
import { check } from 'express-validator';
import * as relationshipController from '../controllers/relationship.controller';
import { auth } from '../middleware/auth.middleware';
import { checkNetworkAccess } from '../middleware/network-access.middleware';
import { RELATIONSHIP_TYPES } from '../models/relationship.model';


const router = express.Router();

// All routes require authentication and network access check
router.use('/:networkId/relationships', auth, checkNetworkAccess);

// @route   GET /api/networks/:networkId/relationships
// @desc    Get all relationships in a network
// @access  Private
router.get('/:networkId/relationships', relationshipController.getRelationships);

// @route   POST /api/networks/:networkId/relationships
// @desc    Add a relationship to the network
// @access  Private
router.post(
  '/:networkId/relationships',
  [
    check('source', 'Source person ID is required').not().isEmpty().isMongoId(),
    check('target', 'Target person ID is required').not().isEmpty().isMongoId(),
    check('type', 'Relationship type is required').isIn(RELATIONSHIP_TYPES),
    check('customType', 'Custom type is required when type is custom')
      .if(check('type').equals('custom'))
      .not()
      .isEmpty(),
  ],
  relationshipController.addRelationship
);

// @route   PUT /api/networks/:networkId/relationships/:id
// @desc    Update a relationship
// @access  Private
router.put(
  '/:networkId/relationships/:id',
  [
    check('type', 'Relationship type must be valid if provided')
      .optional()
      .isIn(RELATIONSHIP_TYPES),
    check('customType', 'Custom type is required when type is custom')
      .if(check('type').equals('custom'))
      .not()
      .isEmpty(),
  ],
  relationshipController.updateRelationship
);

// @route   DELETE /api/networks/:networkId/relationships/:id
// @desc    Remove a relationship
// @access  Private
router.delete('/:networkId/relationships/:id', relationshipController.removeRelationship);

export default router;
