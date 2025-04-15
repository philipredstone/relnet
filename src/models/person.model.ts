import mongoose, { Document, Schema } from 'mongoose';

export interface IPerson extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  birthday?: Date;
  network: mongoose.Types.ObjectId;
  position: {
    x: number;
    y: number;
  };
}

const PersonSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    birthday: {
      type: Date,
    },
    network: {
      type: Schema.Types.ObjectId,
      ref: 'Network',
      required: true,
    },
    position: {
      x: {
        type: Number,
        default: 0,
      },
      y: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }
);

// Create compound index to ensure uniqueness within a network
PersonSchema.index({ firstName: 1, lastName: 1, network: 1 }, { unique: true });

export default mongoose.model<IPerson>('Person', PersonSchema);
