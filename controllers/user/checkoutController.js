import cartModel from '../../models/cart.js';
import addressModel from '../../models/address.js';
import orderModel from '../../models/order.js';
import productModel from '../../models/product.models.js';
import couponModel from '../../models/coupon.js';
import {razorpay}  from '../../config/razorpay.js'
import Razorpay from 'razorpay';
import crypto from 'crypto';
import walletModel from '../../models/wallet.js'

//^ //  //  //   //  //          get Checkout page     //  //  //  //  //  //  //
export const getCheckoutPage = async (req, res) => {
  try {
    // Get the user's cart
    const cart = await cartModel.findOne({ user: req.session.userID }).populate({path:'items.product', populate:{path:'category'}});
    
    if (cart.couponCode) {
      cart.couponCode = null;
      cart.couponDiscount = 0;
      await cart.save();
    }
    
    const outOfStockItems = cart.items.filter(item => item.product.stock < item.quantity)
    if(outOfStockItems.length > 0){      
      return res.status(400).json({error:'Some of the items in your cart are out of stock.Please update your cart before proceeding to checkout.'})
    }
    
    const addresses = await addressModel.find({ userId: req.session.userID });
    
    // calculate the subtotal and total discount of the cart items in the cart for the checkout page for the user for the order 
    const { subtotal, totalDiscount } = calculateSubtotal(cart.items);
    
    const coupons = await couponModel.find({}).populate('applicableCategory').populate('applicableProduct');
    
    // Render the checkout page
    res.render('user/checkout', {
      cart,
      addresses,
      totalDiscount,
      originalPrice: subtotal + totalDiscount,
      user: req.session.userID,
      coupons,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      title:"Checkout"
    });
  } catch (error) {
    console.error('Error loading checkout page:', error);
    res.status(500).send('Server Error');
  }
};

//^ //  //  //   //  //         Placing a Order in checkout     //  //  //  //  //  //  //


export const postOrder = async (req, res) => {
  try {
    const userId = req.session.userID;
    const { addressId, paymentMethod } = req.body;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    const cart = await cartModel.findOne({ user: userId }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }

    const address = await addressModel.findById(addressId);
    if (!address) {
      return res.status(400).json({ message: 'Invalid address' });
    }

    const totalAmount = cart.total
    if (paymentMethod === 'COD'  && totalAmount > 1000) {
      return res.status(400).json({success:false, message:"COD is not available for orders above ₹1000"})
    }

    const items = cart.items.map(item => {
      const itemTotal = (Number(item.discountPrice) || 0) * (Number(item.quantity) || 0) - (Number(item.couponDiscountAmount) || 0);
      const discountAmount = (Number(item.product.price)|| 0) -  (Number(item.discountPrice)|| 0) ||  (Number(item.product.price)|| 0) *  (Number(item.quantity)|| 0);
      const totalDiscount = (Number(discountAmount)|| 0) + (Number(item.couponDiscountAmount) || 0);
      return {
        product: item.product._id, 
        quantity: item.quantity, 
        price: (Number(item.product.price)), 
        discountPrice: (Number(item.discountPrice)), 
        itemTotal: (Number(itemTotal)), 
        discountAmount: (Number(discountAmount)), 
        couponCode: item.couponCode || null, 
        couponDiscountAmount: item.couponDiscountAmount || 0, 
        totalDiscount: totalDiscount > 0 ? totalDiscount : 0 
      };
    });

    const newOrder = new orderModel({
      user: userId, 
      items, 
      address: address._id, 
      subtotal: cart.subtotal, 
      total: cart.total, 
      paymentMethod: paymentMethod, 
      couponCode: cart.couponCode || null, 
      couponDiscountAmountAll: cart.couponDiscount || 0, 
      totalDiscount: items.reduce((acc, item) => acc + item.totalDiscount, 0) 
    });

    // Handle Razorpay Payment
    if (paymentMethod === 'Razorpay') {
      const options = {
        amount: cart.total * 100,
        currency: 'INR',
        receipt: `receipt_${newOrder._id}`,
      };

      const razorpayOrder = await razorpay.orders.create(options);
      console.log("razorpayOrder", razorpayOrder);
     
      await newOrder.save();
      await updateStock(items);
      await clearCart(userId);
      res.status(200).json({ success: true, razorpayOrderId: razorpayOrder.id, OrderId: newOrder._id });
    } else if (paymentMethod === 'Wallet') {
      const wallet = await walletModel.findOne({ user: userId });

      if (!wallet || wallet.balance < cart.total) {
        return res.status(400).json({ success: false, message: "Insufficient balance in wallet" });
      } 

        wallet.balance -= cart.total;
        wallet.transaction.push({
        walletAmount: cart.total,
        transactionType: 'Debited',
        order_id: newOrder._id,
        transactionDate: Date.now()
      });

      await wallet.save();
      newOrder.paymentStatus = 'Completed';
      await newOrder.save();
      await updateStock(items);
      await clearCart(userId);


      // if coupon is applied then update the used count of the coupon
      if(cart.couponCode) {
        const coupon = await couponModel.findOne({couponCode:cart.couponCode})
        if(coupon) {
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
      res.status(200).json({ success: true, message: "Order placed successfully", order: newOrder });

    } else if (paymentMethod === 'COD') {
      await newOrder.save();
      await updateStock(items);
      await clearCart(userId);

      // if coupon is applied then update the used count of the coupon
      if(cart.couponCode) {
        const coupon = await couponModel.findOne({couponCode:cart.couponCode})
        if(coupon) {
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
      res.status(200).json({ success: true, message: "Order placed successfully", order: newOrder });

    } else {
      res.status(400).json({ success: false, message: "Invalid payment method" });
    }

  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).send('Internal server error in post order');
  }
};


//^ //  //  //   //  //         Verify Payment     //  //  //  //  //  //  //
export const verifyPayment = async (req,res) => {
  try {
    const {razorpayOrderId, paymentId, signature,address,paymentMethod,OrderId} = req.body;
    const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpayOrderId}|${paymentId}`).digest('hex');
  const userId = req.session.userID
 

    if(signature === generatedSignature) {
      const newOrder = await orderModel.findById(OrderId);
      if(newOrder) {
        newOrder.paymentStatus = 'Completed';
        await newOrder.save();
      }
      res.status(200).json({success:true, message:"Payment verified successfully"})
    } else {
      res.status(400).json({success:false, message:"Payment verification failed "})
    }
  }  catch (error) {
    console.log("error in verify payment", error);
    res.status(500).send("Internal server error in verify payment");
  }
}

//^ //  //  //   //  //         Add New Address     //  //  //  //  //  //  //
export const addNewAddress = async (req, res) => {
  try {
    const { name, buildingName, street, city, state, country, pincode, mobile } = req.body;

    const newAddress = new addressModel({
        userId: req.session.userID,
      name,
      buildingName,
      street,
      city,
      state,
      country,
      pincode,
      mobile,
    });

    await newAddress.save();
    res.redirect('/checkout');
  } catch (error) {
    console.error('Error adding new address:', error);
    res.status(500).send('Server Error');
  }
};

// //^ //  //  //   //  //         Apply Coupon     //  //  //  //  //  //  //


export const applyCoupon = async (req, res) => {
  const { couponCode } = req.body;
  const userId = req.session.userID;
  try {
    //Finding the coupon in the database
    const coupon = await couponModel.findOne({ couponCode });
    console.log("coupon:", coupon);

    if (!coupon) {
      return res.status(400).json({ message: "Invalid coupon code" });
    }

    //Finding the cart of the user
    const cart = await cartModel.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      return res.status(400).json({ message: "Cart not found" });
    }

    //Checking coupon validity dates
    // const currentDate = new Date("2024-11-10T10:00:00Z"); // Use the current date
    const currentDate = new Date();
    if (currentDate < coupon.startDate || currentDate > coupon.expiryDate) {
      return res.status(400).json({ message: "Coupon is not valid for the current date" });
    }

    //Checking applicability of the coupon based (product/category/all)
    const applicableItems = cart.items.filter(item => 
      coupon.applicableType === 'all' ||
      (coupon.applicableType === 'category' && item.product.category.equals(coupon.applicableCategory)) ||
      (coupon.applicableType === 'product' && item.product._id.equals(coupon.applicableProduct))
    );

    if (applicableItems.length === 0) {
      return res.status(400).json({ message: "Coupon not applicable to the current products" });
    }

    //Calculating the discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = applicableItems.reduce((total, item) => {
        const calculatedDiscount = (item.discountPrice * coupon.discountValue / 100);
        const applicableDiscount = Math.min(calculatedDiscount, item.discountPrice);
        // Store coupon details in the item
        item.couponCode = coupon.couponCode; // Store coupon code
        item.couponDiscountAmount = applicableDiscount * item.quantity; // Store discount amount for this item
        return total + (applicableDiscount * item.quantity);
      }, 0);

      //Prevent applying a 100% discount if it would reduce the total to zero
      if (coupon.discountValue === 100 && discountAmount >= cart.subtotal) {
        return res.status(400).json({ message: "This coupon cannot be applied right now. Please select a different one." });
      }
    } else if (coupon.discountType === 'fixed') {
      discountAmount = applicableItems.reduce((total, item) => {
        const applicableDiscount = Math.min(coupon.discountValue, item.price);
        
        item.couponCode = coupon.couponCode; 
        item.couponDiscountAmount = applicableDiscount * item.quantity; 
        return total + (applicableDiscount * item.quantity);
      }, 0);
    }

    if (coupon.discountValue >= cart.subtotal) {
      return res.status(400).json({ message: "This coupon cannot be applied right now. Please select a different one." });
    }

    //Checking the minimum spend of the coupon
    if (cart.subtotal < coupon.minSpend) {
      return res.json({ success: false, message: `Minimum spend of ₹${coupon.minSpend} required to use this coupon` });
    }

    //Checking the usage limit of the coupon
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.json({ success: false, message: `Coupon limit reached` });
    }

    const newTotal = cart.items.reduce((total,item) => {
      const itemDisount= item.couponDiscountAmount || 0
      return total + (item.discountPrice * item.quantity) - itemDisount
    },0)

    // Updating the cart with the coupon code, discount, and total
    cart.couponCode = coupon.couponCode;
    cart.couponDiscount = discountAmount;
    cart.total= newTotal

    console.log('cart:',cart)

    await cart.save();

    // Sending the response to the client
    res.json({
      success: true, 
      discountAmount: discountAmount, 
      newTotal: (Number(cart.total)),
      message: `Coupon applied successfully`
    });
  } catch (error) {
    console.log("error in apply coupon", error);
    res.status(500).send("Internal server error in apply coupon");
  }
};


//^ //  //  //   //  //         Remove Coupon     //  //  //  //  //  //  //

export const removeCoupon = async (req,res) => {
  const userId = req.session.userID;

  try{
    const cart = await cartModel.findOne({user:userId})
    if(!cart || !cart.couponCode) {
      return res.status(400).json({message:"No coupon applied"})
    }

    const coupon = await couponModel.findOne({couponCode:cart.couponCode})

    if(coupon) {
      coupon.usedCount -= 1;
      await coupon.save();
    }

    // Remove coupon details from items array
    cart.items.forEach(item => {
      item.couponCode = null; 
      item.couponDiscountAmount = 0; 
    });

    const total = cart.items.reduce((total,item) => {
      return total + (item.discountPrice * item.quantity)
    },0)

    cart.couponCode = null;
    cart.couponDiscount = 0;
    cart.total = total;
    await cart.save();

    res.json({
      message:"Coupon removed successfully", 
      success:true,
      newTotal:cart.total,
      couponDiscount:cart.couponDiscount
    })
  }catch(error){
    console.log("error in remove coupon", error);
    res.status(500).send("Internal server error in remove coupon");
  }
}

//^ //  //  //   //  //         Order Confirmation Page     //  //  //  //  //  //  //

export const orderConfirmation = async (req,res) => {
  try {
    const userId = req.session.userID;
    const newOrder = await orderModel.findOne({user:userId}).sort({createdAt:-1}).populate('items.product');

    if(!newOrder) {
      return res.status(400).json({message:"No orders found"})
    }
    res.render('user/orderConfirmation', {order:newOrder,title:"Order Confirmation"})
  }catch (error) {
    console.error('Error loading order confirmation:', error);
    res.status(500).send('Server Error');
  }
}


//^ //  //  //   //  //         Updating selected Address     //  //  //  //  //  //  //

export const updateSelectedAddress = async (req,res) => {
  try {
    const {addressId} = req.body;
    const userId = req.session.userID;

    const address = await addressModel.findOne({_id:addressId, userId:userId});
    if(!address) {
      return res.status(400).json({message:"Invalid address"})
    }
  res.status(200).json({success:true, message:"Address selected successfully"})
  } catch (error) {
    console.log("error in update selected address", error);
    res.status(500).send("Internal server error in update selected address");
  }
}


//^ //  //  //   //  //         Payment Method selection     //  //  //  //  //  //  //

export const updatePaymentMethod = async (req,res) => {
  try {
    const {paymentMethod} = req.body;
    const userId = req.session.userID;

    if(!['COD','Razorpay','Wallet'].includes(paymentMethod)) {
      return res.status(400).json({message:"Invalid payment method"})
    }
   res.status(200).json({success:true, message:"Payment method selected successfully"})
  } catch (error) {
    console.log('error in update payment method', error);
    res.status(500).send('Internal server error in update payment method');
  }
}


//^ //  //  //   //  //         Repay Order     //  //  //  //  //  //  //

export const repayOrder = async (req,res) => {
  try {
    const orderId = req.params.orderId;
    const order = await orderModel.findById(orderId)
    if(!order) {
      return res.status(400).json({success:false, message:"Order not found"})
    }

    const options = {
      amount: order.total * 100,
      currency: 'INR',
      receipt: `repay_${order._id}`,
    }

    const razorpayOrder = await razorpay.orders.create(options);
    console.log("razorpayOrder", razorpayOrder);

   res.status(200).json({success:true, razorpayOrderId:razorpayOrder.id, OrderId:order._id})

  }catch (error) {
    console.log("error in repay order", error);
    res.status(500).send("Internal server error in repay order");
  }
}



//^ //  //  //   //  //         Failed Order Page     //  //  //  //  //  //  //

export const failedOrderPage = async (req,res) => {
  try {
    res.render('user/failedOrder', {title:"Order Failed"})
  } catch (error) {
    console.log("error in failed order page", error);
    res.status(500).send("Internal server error in failed order page");
  }
}


// //  //  //   //  //         Calculate Subtotal     //  //  //  //  //  //  //
const calculateSubtotal = (items) => {
  let subtotal = 0;
  let totalDiscount = 0;

  items.forEach(item => {
    const itemTotal = (item.discountPrice || 0) * (item.quantity || 0);
    subtotal += itemTotal;
    totalDiscount += (item.price - item.discountPrice) * item.quantity; 
  });

  return { subtotal, totalDiscount }; 
}

// //  //  //   //  //         Calculate Total     //  //  //  //  //  //  //
const calculateTotal = (subtotal, discount) => {
  const discountAmount = (subtotal * discount) / 100;
  return subtotal - discountAmount;
}


// //  //  //   //  //         Helper Function Update Stock     //  //  //  //  //  //
const updateStock = async (items) => {
  for (const item of items) {
    const product = await productModel.findById(item.product);
    if(product && product.stock >= item.quantity) {
      product.stock -= item.quantity;
      product.sold += item.quantity;
      await product.save();
    } else {
      throw new Error(`Insufficient stock for product: ${product.name}`);
    }
  }
}

// //  //  //   //  //         Helper Function Clear Cart     //  //  //  //  //  //
const clearCart = async (userId) => {
  await cartModel.findOneAndUpdate({user:userId}, {items:[], total:0, subtotal:0, couponCode:null, couponDiscount:0});
}