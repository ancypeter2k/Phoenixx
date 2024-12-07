import orderModel from '../../models/order.js'
import addressModel from '../../models/address.js'
import walletModel from '../../models/wallet.js'

//^ //  //   //  //          GET ORDER LIST PAGE   //  //  //  //  //  //  //

export const getOrderListPage = async (req,res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = 10
    const skip = (page - 1) * limit

    

    const orderlist = await orderModel.find({})
    .populate({
      path: 'items.product',
      select: 'name image'
    })
    .populate('user', 'name')
    .populate('address')
    .skip(skip)
    .limit(limit)
    .sort({createdAt: -1})

    const totalorders = await orderModel.countDocuments({})
    const totalPages = Math.ceil(totalorders / limit)
    const startIndex = skip + 1;

    

    res.render('admin/orderList', {
      orderlist,
      currentPage: page,
      totalPages,
      startIndex,
      title:"Orders"
    })

  }catch (error) {
    console.log("get order list page error :",error);
    res.status(500).send('Internal Server Error');
  }
 }

//*  //  //   //  //         ORDER  Cancel   //  //  //  //  //  //  //


export const orderCancel = async (req,res) => {
  try {

    const userId = req.session.userID
    // get the order ID, item ID, product ID from the request parameters
    const orderId = req.params.orderID
    const itemId = req.params.itemId
    const productId = req.params.productId

    // find the order associated with the user
    const order = await orderModel.findOne({ _id: orderId, user: userId})
    console.log("order in cancel",order);

    if(!order){
      return res.status(404).json({message: 'Order not found'})
    }
   
    //update the order document to set the item status to cancelled
    const updatedOrder= await orderModel.findOneAndUpdate(
      { _id: orderId, user: userId, 'items._id': itemId, 'items.product': productId },
      { $set: { 'items.$.itemStatus': 'Cancelled' } },
      {new: true}
    );

    if(!updatedOrder){
      return res.status(404).json({message: 'Item not found in the order'})
    }
  

    // finding the cancelled item from the updated order
    const cancelledItem = updatedOrder.items.id(itemId)

 
    const product = await productModel.findById(cancelledItem.product._id)

// updating stock
    if(product) {
      product.stock += cancelledItem.quantity;
      product.sold -= cancelledItem.quantity;
      await product.save()
    } else {
      console.log('Product not found for item :', cancelledItem.product._id);
    }


    // find the wallet associated with the user
    let wallet = await walletModel.findOne({ user:userId });
    // finding the refund amount by using the itemTotal of the cancelled item
    const refundAmount =cancelledItem.itemTotal

 
    if (order.paymentMethod === 'Razorpay' || order.paymentMethod === 'Wallet') {
      // if the wallet is not found then create a new wallet for the user with the refund amount
      if (!wallet) {
        wallet = new walletModel({
          user: userId,
          balance: refundAmount,
          transaction: [{
            walletAmount: refundAmount,
            transactionType: 'Credited',
            orderId: orderId,
            transactionDate: Date.now()
          }]
        });
      } else {        
        // if the wallet is found then update the balance of the wallet by adding the refund amount
        wallet.balance += refundAmount;
        wallet.transaction.push({
          walletAmount: refundAmount,
          transactionType: 'Credited',
          orderId: orderId,
          transactionDate: Date.now()
        });
      }
    }
    await wallet.save();
    res.status(200).json({message: 'Order cancelled successfully'})
  } catch (error) {
    console.log("order cancel error :",error);
    res.status(500).send('Internal Server Error');
  }
}


//^ //  //  //   //  //          CHANGE ITEM STATUS   //  //  //  //  //  //  //

export const changeItemStatus = async (req,res) => {
  try{
    const orderId = req.params.orderId
    const itemId = req.params.itemId

    const status = ['Pending', 'Confirmed', 'Shipped', 'Delivered']

    const order = await orderModel.findOne({
      _id: orderId,
     'items._id': itemId
    });

    if(!order) {
      return res.status(404).json({success:false, message:"Order or item not found"})
    }

    const item = order.items.id(itemId)

   
    const currentStatusIndex = status.indexOf(item.itemStatus)
    

    if(currentStatusIndex === -1 || currentStatusIndex >= status.length - 1) {
      return res.status(400).json({success:false, message:"Cannot change item status no more"})
    }

    const newStatus = status[currentStatusIndex + 1]

    const updateFields= { "items.$.itemStatus": newStatus };
    if (newStatus === 'Delivered') {
      updateFields.paymentStatus = 'Completed'
    }

    const updatedOrder = await orderModel.findOneAndUpdate(
      { _id: orderId, 'items._id': itemId },
      { $set: updateFields},{new: true}
    );

    res.status(200).json({success:true, newStatus})

  } catch (error) {
    console.log("Error changing item status :",error);
    res.status(500).json({success:false, message:"Internal Server Error"})
  }
}

//^ //  //  //   //  //        get Order Details   //  //  //  //  //  //  //

export const getOrderDetails = async (req,res) => {
  try{
    const orderId = req.params.orderId

    const order = await orderModel.findById(orderId)
    .populate('user', 'name email')
    .populate('address')
    .populate({
      path: 'items.product',
      select: 'name image price'
    })
    

    if(!order) {
      return res.status(404).send("Order not found")
    }

   console.log(order.items[0].product.image); 
    res.render('admin/orderDetailsModal', {order , layout :false})
    
  } catch (error) {
    console.log("Error getting order details :",error);
    res.status(500).send('Internal Server Error');
  }
}


//^ //  //  //   //  //       return request details   //  //  //  //  //  //  //
export const getReturnRequestDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const itemId = req.params.itemId;

    const order = await orderModel.findOne({ _id: orderId, 'items._id': itemId })
      .populate('user', 'name')
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ message: 'Order or item not found' });
    }

    const item = order.items.id(itemId);
    res.json({
      user: order.user,
      product: item.product,
      returnReason: item.returnReason,
      returnStatus: item.returnStatus,
    });
  } catch (error) {
    console.log("Error fetching return request details:", error);
    res.status(500).send('Internal Server Error');
  }
};


//^ //  //  //   //  //      CHANGE RETURN STATUS   //  //  //  //  //  //  //

export const changeReturnStatus = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const itemId = req.params.itemId;
    const { returnStatus } = req.body;

    console.log('req.body', req.body);

    const order = await orderModel.findOne({
      _id: orderId,
      'items._id': itemId
    }).populate('items.product');

    if (!order) {
      return res.status(404).json({ success: false, message: "Order or item not found" });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    item.returnStatus = returnStatus;
    let refundAmount = 0; // Declare refundAmount here

    if (returnStatus === 'Approved') {
      item.itemStatus = 'Returned';
      item.returnRequested = false;

      const product = item.product;
      if (product) {
        product.stock += item.quantity;
        product.sold -= item.quantity;
        await product.save();
      }

      refundAmount = item.itemTotal;
      let wallet = await walletModel.findOne({ user: order.user });
      if (!wallet) {
        wallet = new walletModel({
          user: order.user,
          balance: refundAmount,
          transaction: [{
            walletAmount: refundAmount,
            transactionType: 'Credited',
            order_id: orderId,
            transactionDate: Date.now()
          }]
        });
      } else {
        wallet.balance += refundAmount;
        wallet.transaction.push({
          walletAmount: refundAmount,
          transactionType: 'Credited',
          order_id: orderId,
          transactionDate: Date.now()
        });
      }
      await wallet.save();
    } else if (returnStatus === 'Rejected') {
      item.itemStatus = 'Rejected';
    } else if (returnStatus === 'Refunded') {
      item.itemStatus = 'Refunded';
    } else {
      item.itemStatus = 'Return Requested';
    }

    await order.save();

    console.log('refundAmount:', refundAmount);
    console.log('item.returnStatus:', item.returnStatus);

    res.status(200).json({ success: true, newStatus: returnStatus });
  } catch (error) {
    console.log("Error changing return status:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


