import { Response } from 'express';
import Person from '../models/person.model';
import Relationship from '../models/relationship.model';
import { UserRequest } from '../types/express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

// Get all people in a network
export const getPeople = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const networkId = req.params.networkId;

    if (!req.user || !req.network) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const people = await Person.find({ network: networkId });

    res.json({ success: true, data: people });
  } catch (error) {
    console.error('Get people error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a person to the network
export const addPerson = async (req: UserRequest, res: Response): Promise<void> => {
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

    // Check if user is the owner (only owners can add people)
    if (req.network.owner.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Only the network owner can add people' });
      return;
    }

    const { firstName, lastName, birthday, position } = req.body;

    // Check if person already exists in this network
    const existingPerson = await Person.findOne({
      firstName,
      lastName,
      network: networkId,
    });

    if (existingPerson) {
      res.status(400).json({ message: 'This person already exists in the network' });
      return;
    }

    const person = new Person({
      firstName,
      lastName,
      birthday: birthday || undefined,
      network: networkId,
      position: position || { x: 100 + Math.random() * 800, y: 100 + Math.random() * 600 },
    });

    await person.save();

    res.status(201).json({ success: true, data: person });
  } catch (error) {
    console.error('Add person error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a person
export const updatePerson = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const networkId = req.params.networkId;
    const personId = req.params.id;

    if (!req.user || !req.network) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    // Check if user is the owner (only owners can update people)
    if (req.network.owner.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Only the network owner can update people' });
      return;
    }

    const person = await Person.findOne({
      _id: personId,
      network: networkId,
    });

    if (!person) {
      res.status(404).json({ message: 'Person not found' });
      return;
    }

    const { firstName, lastName, birthday, position } = req.body;

    // Update person
    if (firstName) person.firstName = firstName;
    if (lastName) person.lastName = lastName;
    if (birthday !== undefined) person.birthday = birthday || undefined;
    if (position) person.position = position;

    await person.save();

    res.json({ success: true, data: person });
  } catch (error) {
    console.error('Update person error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove a person from the network
export const removePerson = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const networkId = req.params.networkId;
    const personId = req.params.id;

    if (!req.user || !req.network) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    // Check if user is the owner (only owners can remove people)
    if (req.network.owner.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Only the network owner can remove people' });
      return;
    }

    const person = await Person.findOne({
      _id: personId,
      network: networkId,
    });

    if (!person) {
      res.status(404).json({ message: 'Person not found' });
      return;
    }

    // Remove all relationships involving this person
    await Relationship.deleteMany({
      network: networkId,
      $or: [{ source: personId }, { target: personId }],
    });

    // Remove the person
    await person.deleteOne(); // Changed from remove() to deleteOne()

    res.json({
      success: true,
      message: 'Person and associated relationships removed successfully',
    });
  } catch (error) {
    console.error('Remove person error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
