import mongoose from 'mongoose';

export const CATEGORIES = [
  'Books & Study Materials',
  'Electronics',
  'Calculators',
  'Bicycles',
  'Hostel Essentials',
  'Furniture',
  'Sports Equipment',
  'Stationery',
  'Others',
];

export const CONDITIONS = ['Brand New', 'Like New', 'Good', 'Fair'];
export const STATUSES = ['available', 'sold', 'removed'];

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: null },
    provider: { type: String, enum: ['cloudinary', 'local'], default: 'cloudinary' },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: 4000 },
    category: { type: String, required: true, enum: CATEGORIES, index: true },
    price: { type: Number, required: [true, 'Price is required'], min: 0, max: 10_000_000 },
    originalPrice: { type: Number, min: 0, max: 10_000_000, default: null },
    condition: { type: String, required: true, enum: CONDITIONS },
    images: {
      type: [imageSchema],
      validate: {
        validator: (images) => images.length <= 5,
        message: 'A listing can have at most 5 images',
      },
    },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    college: { type: String, required: true, trim: true, index: true },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    status: { type: String, enum: STATUSES, default: 'available', index: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1, category: 1, price: 1 });
productSchema.index({ seller: 1, createdAt: -1 });
productSchema.index({ title: 'text', description: 'text', category: 'text' });

productSchema.virtual('isSold').get(function () {
  return this.status === 'sold';
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.model('Product', productSchema);
