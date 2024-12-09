import orderModel from '../../models/order.js'
import productModel from '../../models/product.models.js'
import mongoose from 'mongoose'
import PDFDocument from 'pdfkit'

import walletModel from '../../models/wallet.js'


//^ //  //   //  //          GET ORDER  HistoryPAGE   //  //  //  //  //  //  //

export const getOrderHistoryPage = async (req,res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 2;
    const skip = (page - 1) * limit;


    const userId = req.session.userID 
    const orders = await orderModel.find( {user:userId} )
    .populate({
      path:'items.product',
      select:'name image category',
      populate:{path:'category',select:'name'}
    })
    .sort({createdAt:-1}).skip(skip).limit(limit).exec()

    const totalOrders = await orderModel.countDocuments({user:userId})
    const totalPages = Math.ceil(totalOrders / limit)

    res.render('profile/orderHistory',{
      orders,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      currentPage: page,
      totalPages,
      title:"Orders"
    })
  } catch (error) {
    console.log("get order history page error :",error);
    res.status(500).send('Internal Server Error');
  }
}


//^ //  //   //  //          GET ORDER Detail Page   //  //  //  //  //  //  //

export const getOrderDetailPage = async (req,res) => {
  try {

    const userId = req.session.userID
    const orderId = req.params.orderID
    const itemId = req.params.itemId
    
    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).send('Invalid Order ID or Item ID');
    }

    const order = await orderModel.findOne({ _id:orderId, user:userId})
    .populate({
      path: 'items.product',
      select: 'name image category',
      populate: {path: 'category', select: 'name'}
    }).populate('address')

    if(!order){
      return res.status(404).send('Order not found')
    }
   

    const item = order.items.id(itemId)
    if(!item){
      return res.status(404).send('Item not found')
    }
   

    res.render('profile/orderDetail',{ order, item,title:"Order Detail" })    
  } catch (error) {
    console.log("get order detail page error :",error);
    res.status(500).send('Internal Server Error');
  }
}


//^  //  //   //  //         ORDER  Cancel   //  //  //  //  //  //  //


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
            order_id: orderId,
            transactionDate: Date.now()
          }]
        });
      } else {        
        // if the wallet is found then update the balance of the wallet by adding the refund amount
          wallet.balance += refundAmount;
          wallet.transaction.push({
          walletAmount: refundAmount,
          transactionType: 'Credited',
          order_id: orderId,
          transactionDate: Date.now()
        });
      }
    }
  console.log('orderId:',orderId)
  console.log("Wallet:",wallet)
    await wallet.save();
    res.status(200).json({message: 'Order cancelled successfully'})
    } catch (error) {
    console.log("order cancel error :",error);
    res.status(500).send('Internal Server Error');
    }
  }


//^  //  //   //  //         RETURN ORDER   //  //  //  //  //  //  //
export const requestReturn = async (req, res) => {
  try {
    const userId = req.session.userID;
    const orderId = req.params.orderID;
    const itemId = req.params.itemId;
    const { returnReason } = req.body;

    const order = await orderModel.findOne({ _id: orderId, user: userId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Update the item with return request details
    item.returnRequested = true;
    item.itemStatus = 'Return Requested';
    item.returnReason = returnReason;
    item.returnDate = new Date();
    await order.save();

    

    res.status(200).json({ message: 'Return request submitted successfully' });
  } catch (error) {
    console.log("Error in requesting return:", error);
    res.status(500).send('Internal Server Error');
  }
};



//^ //  //   //  //         DOWNLOAD INVOICE   //  //  //  //  //  //  //

export const downloadInvoice = async (req,res) => {
  try {
    const orderId = req.params.orderID;
    console.log('req.params.orderID',req.params.orderID);
    const order = await orderModel.findById(orderId)
    .populate({
      path:'items.product',
      select:'name image category',
      populate:{path:'category',select:'name'}
    }).populate('address')
    .populate('user')

    if(!order){
      return res.status(404).send('Order not found')
    }

  const docInvoice = new PDFDocument({ margin: 50 })

    let fileName = `Phoenix_Invoice_${order._id}.pdf`
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename='+fileName + '"');

    docInvoice.pipe(res)

    // Add logo and company info
    docInvoice.image('public/images/mylogo1.png', 50, 30, { width: 100 })
       .fillColor('#444444')
       .fontSize(30)
       .text('Phoenix watch Store', 100, 70,{color:'#444444', align: 'center'})
       .moveDown(2);


       // Add customer information
       docInvoice.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' }).moveDown(3);
    
 docInvoice.fontSize(10)
    .text(`Invoice Number: ${order._id}`, 50, 200)
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 215)
    .text(`Payment Method: ${order.paymentMethod}`, 50, 230)
    .text(`Payment Status: ${order.paymentStatus}`, 50, 245)
    .moveDown();

 // Add shipping address
 docInvoice.text('Shipping Address:', 50, 270)
    .text(`${order.address.name}`, 50, 285)
    .text(`${order.address.street}`, 50, 300)
    .text(`${order.address.city}, ${order.address.state}`, 50, 315)
    .text(`${order.address.pincode}`, 50, 330)
    .moveDown();

   // Create table headers with borders
   let y = 400;
   docInvoice.fontSize(10)
     .text('Item', 50, y)
     .text('Quantity', 280, y)
     .text('Price', 350, y)
     .text('Discount', 400, y)
     .text('Coupon', 460, y)
     .text('Total', 520, y)
     .moveDown();

   // Draw a line under the headers
   docInvoice.moveTo(50, y + 10).lineTo(600, y + 10).stroke();

   // Add items with borders
   y += 20;
   order.items.forEach(item => {
     docInvoice.fontSize(10)
       .text(item.product.name, 50, y, { width: 180 })
       .text(item.quantity.toString(), 280, y)
       .text(`₹${item.price.toFixed(2)}`, 350, y)
       .text(`₹${item.discountPrice.toFixed(2)}`, 400, y)
       .text(item.couponDiscountAmount ? `-₹${item.couponDiscountAmount.toFixed(2)}` : 'N/A', 460, y)
       .text(`₹${item.itemTotal.toFixed(2)}`, 520, y);
     y += 30;

     // Draw a line after each item
     docInvoice.moveTo(50, y - 10).lineTo(600, y - 10).stroke();
   });

   // Add totals
   const summaryY = y + 20;
   docInvoice.fontSize(10)
     .text('Subtotal:', 350, summaryY)
     .text(`₹${order.subtotal.toFixed(2)}`, 450, summaryY);

   if (order.couponDiscountAmountAll > 0) {
     docInvoice.text('Coupon Discount:', 350, summaryY + 20)
       .text(`-₹${order.couponDiscountAmountAll.toFixed(2)}`, 450, summaryY + 20);
   }

   docInvoice.fontSize(12).font('Helvetica-Bold')
     .text('Total:', 350, summaryY + 40)
     .text(`₹${order.total.toFixed(2)}`, 450, summaryY + 40);

   // Add footer
   docInvoice.fontSize(10)
     .text('Thank you for shopping with Phoenix!', 50, 700, { align: 'center' })
     .text('For any queries, please contact support@phoenix.com', 50, 715, { align: 'center' });

   // Finalize the PDF and send
   docInvoice.end();
  }catch (error) {
    console.log("download invoice error :",error);
    res.status(500).send('Internal Server Error');
  }
}