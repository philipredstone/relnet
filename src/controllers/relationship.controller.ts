import { Response } from 'express';
import Relationship from '../models/relationship.model';
import Person from '../models/person.model';
import { UserRequest } from '../types/express';
import { validationResult } from 'express-validator';

// Get all relationships in a network
export const getRelationships = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const networkId = req.params.networkId;

    if (!req.user || !req.network) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const relationships = await Relationship.find({ network: networkId });

    res.json({ success: true, data: relationships });
  } catch (error) {
    console.error('Get relationships error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a relationship to the network
export const addRelationship = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const networkId = req.params.networkId;

    if (!req.user || !req.network) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    // Check if user is the owner (only owners can add relationships)
    if (req.network.owner.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Only the network owner can add relationships' });
      return;
    }

    const { source, target, type, customType } = req.body;

    // Check if source and target exist and belong to the network
    const sourcePerson = await Person.findOne({
      _id: source,
      network: networkId,
    });

    const targetPerson = await Person.findOne({
      _id: target,
      network: networkId,
    });

    if (!sourcePerson || !targetPerson) {
      res.status(400).json({ message: 'Source or target person not found in this network' });
      return;
    }

    // Check if relationship already exists
    const existingRelationship = await Relationship.findOne({
      $or: [
        { source, target, network: networkId },
        { source: target, target: source, network: networkId },
      ],
    });

    if (existingRelationship) {
      res.status(400).json({ message: 'A relationship already exists between these people' });
      return;
    }

    const relationship = new Relationship({
      source,
      target,
      type,
      customType: type === 'custom' ? customType : undefined,
      network: networkId,
    });

    await relationship.save();

    res.status(201).json({ success: true, data: relationship });
  } catch (error) {
    console.error('Add relationship error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a relationship
export const updateRelationship = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const networkId = req.params.networkId;
    const relationshipId = req.params.id;

    if (!req.user || !req.network) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    // Check if user is the owner (only owners can update relationships)
    if (req.network.owner.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Only the network owner can update relationships' });
      return;
    }

    const relationship = await Relationship.findOne({
      _id: relationshipId,
      network: networkId,
    });

    if (!relationship) {
      res.status(404).json({ message: 'Relationship not found' });
      return;
    }

    const { type, customType } = req.body;

    // Update relationship
    if (type) relationship.type = type;
    if (type === 'custom' && customType) relationship.customType = customType;

    await relationship.save();

    res.json({ success: true, data: relationship });
  } catch (error) {
    console.error('Update relationship error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove a relationship
export const removeRelationship = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const networkId = req.params.networkId;
    const relationshipId = req.params.id;

    if (!req.user || !req.network) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    // Check if user is the owner (only owners can remove relationships)
    if (req.network.owner.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Only the network owner can remove relationships' });
      return;
    }

    const relationship = await Relationship.findOne({
      _id: relationshipId,
      network: networkId,
    });

    if (!relationship) {
      res.status(404).json({ message: 'Relationship not found' });
      return;
    }

    await relationship.deleteOne(); // Changed from remove() to deleteOne()

    res.json({ success: true, message: 'Relationship removed successfully' });
  } catch (error) {
    console.error('Remove relationship error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
