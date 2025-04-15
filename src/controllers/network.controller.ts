import { Response } from 'express';
import Network from '../models/network.model';
import { UserRequest } from '../types/express';
import { validationResult } from 'express-validator';

// Get all networks for current user and all public networks
export const getUserNetworks = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    // Find networks that either:
    // 1. Belong to the current user, OR
    // 2. Are public networks (created by any user)
    const networks = await Network.find({
      $or: [{ owner: req.user._id }, { isPublic: true }],
    }).populate('owner', 'username _id'); // Populate owner field with username

    res.json({ success: true, data: networks });
  } catch (error) {
    console.error('Get networks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new network
export const createNetwork = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const { name, description, isPublic } = req.body;

    const network = new Network({
      name,
      description,
      owner: req.user._id,
      isPublic: isPublic || false,
    });

    await network.save();

    res.status(201).json({ success: true, data: network });
  } catch (error) {
    console.error('Create network error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific network
export const getNetwork = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const networkId = req.params.id;

    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const network = await Network.findById(networkId).populate('owner', 'username _id');

    if (!network) {
      res.status(404).json({ message: 'Network not found' });
      return;
    }

    // Check if user is owner or network is public
    if (network.owner._id.toString() !== req.user._id.toString() && !network.isPublic) {
      res.status(403).json({ message: 'You do not have permission to access this network' });
      return;
    }

    res.json({ success: true, data: network });
  } catch (error) {
    console.error('Get network error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a network
export const updateNetwork = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const networkId = req.params.id;

    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const network = await Network.findById(networkId);

    if (!network) {
      res.status(404).json({ message: 'Network not found' });
      return;
    }

    // Check if user is owner
    if (network.owner.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'You do not have permission to update this network' });
      return;
    }

    const { name, description, isPublic } = req.body;

    network.name = name || network.name;
    network.description = description !== undefined ? description : network.description;
    network.isPublic = isPublic !== undefined ? isPublic : network.isPublic;

    await network.save();

    res.json({ success: true, data: network });
  } catch (error) {
    console.error('Update network error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a network
export const deleteNetwork = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const networkId = req.params.id;

    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const network = await Network.findById(networkId);

    if (!network) {
      res.status(404).json({ message: 'Network not found' });
      return;
    }

    // Check if user is owner
    if (network.owner.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'You do not have permission to delete this network' });
      return;
    }

    await network.deleteOne(); // Changed from remove() to deleteOne()

    res.json({ success: true, message: 'Network deleted successfully' });
  } catch (error) {
    console.error('Delete network error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
