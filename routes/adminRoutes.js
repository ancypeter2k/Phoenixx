// // Import dependencies
import express from 'express';
import adminController from '../controllers/admin/adminAuthController.js';
import dashboardController from '../controllers/admin/dashboardController.js';
import categoryController from '../controllers/admin/categoryController.js';
import productController from '../controllers/admin/productController.js';
import * as userController from '../controllers/admin/userController.js';  
import upload from '../middleware/multerMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import * as orderController from '../controllers/admin/orderController.js';
import * as offerController from '../controllers/admin/offerController.js';
import * as couponController from '../controllers/admin/couponController.js';
import * as salesReportController from '../controllers/admin/salesReportController.js'

const router = express.Router();

//^  //  //  //  //  //  //                 Admin Auth routes             //  //  //  //  //  //  //

router.get('/login', adminController.getAdminLogin);
router.post('/login', adminController.postAdminLogin);                                             
router.get('/logout', adminController.getLogout);

//^  //  //  //  //  //  //                 Dashboard routes             //  //  //  //  //  //  //

router.get('/dashboard', adminMiddleware.isAdmin, dashboardController.getDashboard);

//^  //  //  //  //  //  //                Category routes                //  //  //  //  //  //  //

router.get('/category',adminMiddleware.isAdmin,categoryController.getCategory)                                            
router.get('/addCategory',adminMiddleware.isAdmin,categoryController.getAddCategory)
router.post('/addCategory',upload.single('image'),adminMiddleware.isAdmin,categoryController.postAddCategory)
router.get('/editCategory/:id',adminMiddleware.isAdmin,categoryController.getEditCategory)
router.post('/editCategory/:id',upload.single('image'),adminMiddleware.isAdmin,categoryController.postEditCategory)
router.post('/blockcategory/:id',adminMiddleware.isAdmin,categoryController.blockCategory)
router.get('/searchCategory',adminMiddleware.isAdmin,categoryController.searchCategory)

//^  //  //  //  //  //  //                Productroutes                //  //  //  //  //  //  //

router.get('/products',adminMiddleware.isAdmin,productController.getProduct)
router.get('/addProducts',adminMiddleware.isAdmin,productController.getAddProduct)
router.post('/addProducts', upload.array('image', 5), adminMiddleware.isAdmin,productController.postAddProduct);
router.post("/softDeleteProduct/:id",adminMiddleware.isAdmin,productController.softDeleteProduct)
router.get('/editProducts/:id', adminMiddleware.isAdmin, productController.getEditProduct)
router.post('/editProducts/:id', upload.array('image',5), adminMiddleware.isAdmin, productController.postEditProduct)

//^  //  //  //  //  //  //                  User routes                //  //  //  //  //  //  //

router.get('/users',adminMiddleware.isAdmin,userController.getUserList)                        
router.post("/block/:id",adminMiddleware.isAdmin,userController.blockUser)
router.get('/searchUser',adminMiddleware.isAdmin,userController.searchUser)

//^  //  //  //  //  //  //                 Order routes                    //  //  //  //  //  //  //

router.get('/orders',adminMiddleware.isAdmin,orderController.getOrderListPage)
router.post('/orders/:orderId/:itemId/change-status',adminMiddleware.isAdmin,orderController.changeItemStatus)
router.get('/orders/:orderId/details',adminMiddleware.isAdmin,orderController.getOrderDetails)
router.get('/orders/:orderId/:itemId/return-details',adminMiddleware.isAdmin,orderController.getReturnRequestDetails)
router.post('/orders/:orderId/:itemId/change-return-status',adminMiddleware.isAdmin,orderController.changeReturnStatus)

//^  //  //  //  //  //  //                 Offer routes                    //  //  //  //  //  //  //

router.get('/offers',adminMiddleware.isAdmin,offerController.getOfferList)
router.get('/addOffers', adminMiddleware.isAdmin, offerController.getAddOffer);
router.post('/addOffers',adminMiddleware.isAdmin,offerController.postAddOffer);
router.get('/editOffers/:id', adminMiddleware.isAdmin, offerController.getEditOffer);
router.post('/editOffers/:id', adminMiddleware.isAdmin, offerController.postEditOffer);
// router.post("/deleteOffer/:id",adminMiddleware.isAdmin,offerController.removeOffer)

//^  //  //  //  //  //  //                 Coupon routes                    //  //  //  //  //  //  //

router.get('/coupons',adminMiddleware.isAdmin,couponController.getCouponListPage);
router.get('/addCoupon',adminMiddleware.isAdmin,couponController.addCouponPage);
router.post('/addCoupon',adminMiddleware.isAdmin,couponController.postAddCoupon);
router.get('/editCoupon/:id',adminMiddleware.isAdmin,couponController.getEditCouponPage);
router.post('/editCoupon/:id',adminMiddleware.isAdmin,couponController.postEditCoupon);
router.post('/deleteCoupon/:id',adminMiddleware.isAdmin,couponController.deleteCoupon);

//^  //  //  //  //  //  //                Sales Report routes                //  //  //  //  //  //  //

router.get('/salesReport',adminMiddleware.isAdmin,salesReportController.getSalesReportPage)
router.get('/salesReport/generate-pdf',adminMiddleware.isAdmin,salesReportController.generatePDFReport);
router.get('/salesReport/generate-excel',adminMiddleware.isAdmin,salesReportController.generateExcelReport)

export default router;