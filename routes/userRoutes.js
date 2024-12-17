import express from "express";

import isUser  from "../middleware/userMiddleware.js";                                      
import * as userControl from '../controllers/user/authController.js'
import * as productControl from '../controllers/user/productController.js'
import * as passwordControl from '../controllers/user/passwordController.js'  
import * as profileControl from '../controllers/user/profileController.js'
import * as cartControl from '../controllers/user/cartController.js'
import * as checkOutControl from '../controllers/user/checkoutController.js'
import * as orderControl from '../controllers/user/orderController.js'
import * as wishlistControl from '../controllers/user/wishlistController.js'
import * as walletControl from '../controllers/user/walletController.js'           
import checkUserSession from "../middleware/checkUserSession.js";

const router=express.Router()

router.use(checkUserSession)

//^  //  //  //  //  //  //                User Auth routes                //  //  //  //  //  //  //

router.route('/login') 
    .get(userControl.getLogin) 
    .post(userControl.postLogin); 
router.route('/signup') 
    .get(userControl.getSignup) 
    .post(userControl.postSignup); 
router.get('/home',isUser,userControl.getHome)      //get user home                                           
router.post('/logout',userControl.postLogout)                                                 

//^  //  //  //  //  //  //               OtP verifying Routes             //  //  //  //  //  //  //

router.route('/verify-otp')
    .get(userControl.getverifyOTP)
    .post(userControl.postverifyOTP)
router.post('/resend-otp',userControl.resendOTP)                                               

// //^  //  //  //  //  //  //               Forgot Password Routes             //  //  //  //  //  //  //

router.route('/forgotPassword')
    .get(passwordControl.getForgotPassword)
    .post(passwordControl.postForgotPassword)
router.route('/verifyPasswordOtp')
    .get(passwordControl.getVerifyPasswordOTP)
    .post(passwordControl.postVerifyPasswordOTP)                                               
router.post('/resendOTP',passwordControl.postresendOTP)                                        
router.route('/resetPassword')
    .get(passwordControl.getResetPassword)
    .post(passwordControl.postResetPassword)

router.get("/resetPassword",passwordControl.getResetPassword)
router.post("/resetPassword",passwordControl.postResetPassword)

//^  //  //  //  //  //  //               Landing page Routes              //  //  //  //  //  //  //

router.get('/',userControl.getlandingPage)
router.get('/Category/:id',productControl.getProductsByCategory)
router.get('/product/:id',productControl.getProductDetail)
router.get('/shop/allProducts',productControl.getAllProductPage)

//^  //  //  //  //  //  //             Product  review Adding Route         //  //  //  //  //  //  //

router.post('/product/:id/review',isUser,productControl.addReview)

//^  //  //  //  //  //  //               Profile  Routes                    //  //  //  //  //  //  //

router.route('/profile/personal-info')
    .get(isUser,profileControl.getProfilePage)
    .post(isUser,profileControl.editProfile)

router.get('/profile/address',isUser,profileControl.getAddressPage)

router.route('/profile/add-address')
    .get(isUser,profileControl.getAddAddressPage)
    .post(isUser,profileControl.postAddAddress)

router.route("/profile/edit-address/:id")
    .get(isUser,profileControl.getEditAddressPage)
    .post(isUser,profileControl.postEditAddress)

router.post("/profile/delete-address/:id",isUser,profileControl.deleteAddress)

router.route('/profile/change-password')
    .get(isUser,profileControl.getChangePasswordPage)
    .post(isUser,profileControl.postChangePassword)

//^  //  //  //  //  //  //               Cart Routes               //  //  //  //  //  //  //

router.get('/cart',isUser,cartControl.getCartPage)
router.post('/cart/:productId/add',isUser,cartControl.addToCart)
router.post('/cart/:productId/update',isUser,cartControl.updateCartItemQuantity)
router.post('/cart/delete/:productId', isUser,cartControl.deleteFromCart);

//^  //  //  //  //  //  //               Wishlist Routes             //^  //  //  //  //  //  //              

router.get('/wishlist',isUser,wishlistControl.getWishlistPage)
router.post('/wishlist/:productId/add',isUser,wishlistControl.addToWishlist)
router.post('/wishlist/delete/:productId', isUser,wishlistControl.removeFromWishlist);

//^  //  //  //  //  //  //               Wallet Routes               //  //  //  //  //  //  //

router.get('/profile/wallet',isUser,walletControl.getWalletPage)

//^  //  //  //  //  //  //               Checkout Routes              //  //  //  //  //  //  //

router.get('/checkout',isUser,checkOutControl.getCheckoutPage)
router.post('/checkout/add-address',isUser,checkOutControl.addNewAddress)
router.post('/checkout/place-order',isUser,checkOutControl.postOrder)
router.get('/checkout/order-confirmation',isUser,checkOutControl.orderConfirmation)
router.post('/checkout/address/update',isUser,checkOutControl.updateSelectedAddress)
router.post('/checkout/payment-methods/update',isUser,checkOutControl.updatePaymentMethod)
router.post('/checkout/payment/verify',isUser,checkOutControl.verifyPayment)
router.post('/checkout/payment/repay/:orderId',isUser,checkOutControl.repayOrder)
router.get('/checkout/order-failed',isUser,checkOutControl.failedOrderPage)
router.post('/checkout/coupons/apply',isUser,checkOutControl.applyCoupon)
router.post('/checkout/coupons/remove',isUser,checkOutControl.removeCoupon)

//^  //  //  //  //  //  //               Order History Routes         //  //  //  //  //  //  //

router.get('/profile/orders',isUser,orderControl.getOrderHistoryPage)
router.get('/order/:orderID/details/:itemId',isUser,orderControl.getOrderDetailPage)
router.post('/order/:orderID/item/:itemId/product/:productId/cancel',isUser,orderControl.orderCancel)
router.post('/order/:orderID/item/:itemId/return',orderControl.requestReturn);
router.get('/order/:orderID/invoice',isUser,orderControl.downloadInvoice)

export default router