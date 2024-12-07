import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        discountPrice: {
          type: Number,
          required: true,
        },
        couponCode: {
          type: String
        },
        couponDiscountAmount: {
          type: Number,
          default: 0
        }
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      default: 0
    },
    offer:{
      type:Number,
      default: 0
    },
    couponCode: {
      type: String
    },
    couponDiscount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
