import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: [true, 'Password is required'], select: false, minlength: 8 },
    college: { type: String, required: [true, 'College is required'], trim: true, maxlength: 120 },
    department: { type: String, required: [true, 'Department is required'], trim: true, maxlength: 80 },
    year: { type: String, required: [true, 'Year of study is required'], trim: true, maxlength: 20 },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    profileImage: { type: String, default: '' },
    role: { type: String, enum: ['student', 'admin'], default: 'student', index: true },
    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    verificationTokenExpires: { type: Date, select: false },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.verificationToken;
        delete ret.verificationTokenExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
