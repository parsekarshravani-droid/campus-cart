import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    message: { type: String, required: [true, 'Message is required'], trim: true, maxlength: 1200 },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Conversation lookups: newest-first per product between two students.
messageSchema.index({ sender: 1, receiver: 1, product: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, read: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
