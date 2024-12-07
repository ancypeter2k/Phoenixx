import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
  },
  minSpend: {
    type: Number,
    default: 0,
  },
  usageLimit: {
    type: Number,
    default: 1,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  startDate: {
    type: Date,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  applicableType: {
    type: String,
    enum: ['product', 'category','all']
  },
  applicableCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  applicableProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
},{ timestamps: true });

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;