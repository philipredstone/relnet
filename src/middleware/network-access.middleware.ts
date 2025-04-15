import { Response, NextFunction } from 'express';
import Network from '../models/network.model';
import { UserRequest } from '../types/express';

export const checkNetworkAccess = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const networkId = req.params.networkId;

    if (!networkId) {
      res.status(400).json({ message: 'Network ID is required' });
      return;
    }

    const network = await Network.findById(networkId);

    if (!network) {
      res.status(404).json({ message: 'Network not found' });
      return;
    }

    // Check if user is the owner or the network is public
    if (network.owner.toString() !== req.user?._id.toString() && !network.isPublic) {
      res.status(403).json({ message: 'You do not have permission to access this network' });
      return;
    }

    // Add network to the request
    req.network = network;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
