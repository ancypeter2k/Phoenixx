import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      discountPrice: {
        type: Number,
      },
      
      couponCode: {
        type: String,
      },
      couponDiscountAmount: {
        type: Number,
      },
      itemTotal: {
        type: Number,
        required: true
      },
      discountAmount: {
        type: Number,
      },
      totalDiscount: {
        type: Number,
      },
      itemStatus: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned','Return Requested', 'Approved', 'Rejected', 'Refunded'],
        default: 'Pending',
      },
      returnRequested: {
        type: Boolean,
        default: false,
      },
      returnReason: {
        type: String,
      },
      returnStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Refunded'],
        default: 'Pending',
      },
      returnDate: {
        type: Date,
      },
      returnProcessedAt: {
        type: Date,
      },

    },
  ],
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'address',
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'Razorpay', 'Wallet'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending',
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Return Requested', 'Approved', 'Rejected', 'Refunded'],
    
  },
  orderedAt: {
    type: Date,
    default: Date.now,
  },
  deliveredAt: {
    type: Date,
  },
  couponCode: {
    type: String,
  },
  couponDiscountAmountAll: {
    type: Number,
    default: 0,
  },
  totalDiscount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;