import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  },
  { timestamps: true }
);

// One saved item per student — duplicates are impossible at the database level.
wishlistSchema.index({ user: 1, product: 1 }, { unique: true });
// Fast wishlist page queries ordered by recency.
wishlistSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Wishlist', wishlistSchema);
