import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    description?: string;
    icon: string;
    color: string;
    isActive: boolean;
    episodeCount: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 50
    },
    description: {
        type: String,
        maxlength: 200
    },
    icon: {
        type: String,
        required: true,
        default: '📁'
    },
    color: {
        type: String,
        required: true,
        default: '#6B7280'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    episodeCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Index for better query performance
CategorySchema.index({ isActive: 1, name: 1 });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);