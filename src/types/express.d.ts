import { Request } from 'express';
import { IUser } from '../models/user.model';
import { INetwork } from '../models/network.model';

export interface UserRequest extends Request {
  user?: IUser;
  network?: INetwork;
}
