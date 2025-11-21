import mongoose from 'mongoose';
import { TAGS } from '../constants/tags.js';

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    content: { type: String, trim: true, default: '' },
    tag: { type: String, enum: TAGS, default: null },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },

  {
    timestamps: true,
  },
);

noteSchema.index({ title: 'text', content: 'text' });

export const Note = mongoose.model('Note', noteSchema);
