import mongoose, { Document, Schema } from 'mongoose';

export interface IRelationship extends Document {
    _id: string;
    source: mongoose.Types.ObjectId;
    target: mongoose.Types.ObjectId;
    type: string;
    customType?: string;
    network: mongoose.Types.ObjectId;
}

const RelationshipSchema = new Schema(
    {
        source: {
            type: Schema.Types.ObjectId,
            ref: 'Person',
            required: true,
        },
        target: {
            type: Schema.Types.ObjectId,
            ref: 'Person',
            required: true,
        },
        type: {
            type: String,
            required: [true, 'Relationship type is required'],
            enum: ['freund', 'partner', 'familie', 'arbeitskolleg', 'custom'],
        },
        customType: {
            type: String,
            trim: true,
        },
        network: {
            type: Schema.Types.ObjectId,
            ref: 'Network',
            required: true,
        },
    },
    { timestamps: true }
);

// Create compound index to ensure unique relationships in a network
RelationshipSchema.index(
    { source: 1, target: 1, network: 1 },
    { unique: true }
);

export default mongoose.model<IRelationship>('Relationship', RelationshipSchema);