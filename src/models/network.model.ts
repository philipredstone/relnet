import mongoose, { Document, Schema } from 'mongoose';

export interface INetwork extends Document {
    _id: string;
    name: string;
    description?: string;
    owner: mongoose.Types.ObjectId;
    isPublic: boolean;
}

const NetworkSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Network name is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export default mongoose.model<INetwork>('Network', NetworkSchema);

