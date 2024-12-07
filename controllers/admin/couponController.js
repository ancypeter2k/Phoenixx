import couponModel from '../../models/coupon.js'
import categoryModel from '../../models/category.models.js'
import productModel from '../../models/product.models.js'

// //  //  //   //  //          GET COUPON LIST     //  //  //  //  //  //  //

export const getCouponListPage = async (req,res) => {
  try{
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    const couponList = await couponModel.find()
                                        .populate('applicableProduct applicableCategory')
                                        .sort({createdAt: -1})
                                        .skip(skip)
                                        .limit(limit)

    const totalCoupons =await couponModel.countDocuments({})
    const totalPages = Math.ceil(totalCoupons / limit)
    const startIndex = skip + 1
    res.render('admin/coupons',{
      couponList,
      currentPage: page,
      totalPages,
      startIndex,
      title:"Coupons"
    })
  } catch (error) {
    console.log("error in coupon list",error);
    res.status(500).json({message:"Internal server error"})
  }
}

// //  //  //  //  //         Get Add coupon page     //  //  //  //  //  //  

export const addCouponPage =async (req,res) => {
  try{
    const categories = await categoryModel.find({isBlocked:false})
    const products = await productModel.find({isDeleted:false})
    res.render('admin/addCoupon',{categories,products,title:"Add Coupon"})

  } catch (error) {
    console.log("error in add coupon page",error);
    res.status(500).json({message:"Internal server error"})
  }
}

// //  //  //   //  //          Post add Coupon     //  //  //  //  //  //  //

export const postAddCoupon = async (req,res) => {
  try {
    const {couponCode,discountType,discountValue,minSpend,usageLimit,startDate,expiryDate,applicableType,product,category} = req.body

    const errors = []

    const couponCodes = /^[A-Z][A-Z0-9 ]{4,9}$/; 
    if(!couponCodes.test(couponCode)){
      errors.push('Coupon code must be uppercase letters.')
    }

    const discountValues = parseFloat(discountValue);
    if (discountType === 'fixed') {
        if (isNaN(discountValues) || discountValues <= 0 || !Number.isInteger(discountValues)) {
            errors.push('Discount value for fixed type must be a whole number greater than zero.');
        }
    } else if (discountType === 'percentage') {
        if (isNaN(discountValues) || discountValues < 1 || discountValues > 100 || !Number.isInteger(discountValues)) {
            errors.push('Discount value for percentage type must be a whole number between 1 and 100.');
        }
    }

    const minSpends = parseInt(minSpend);
    if(isNaN(minSpends) || minSpends <= 0 || !Number.isInteger(minSpends)) {
      errors.push('Minimum spend must be a whole number greater than zero.')
    }

    const usageLimits = parseInt(usageLimit);
    if(isNaN(usageLimits) || usageLimits <= 0 || !Number.isInteger(usageLimits)) {
      errors.push('Usage limit must be a whole number greater than zero.')
    }

    const startDates = new Date(startDate);
    const currentDate = new Date()

    if(isNaN(startDates) || startDates < currentDate.setHours(0,0,0,0) ) {
      errors.push('Start date must be today or a future date.')
    }

    const expiryDates = new Date(expiryDate);
    if(isNaN(expiryDates) || expiryDates <= 0) {
      errors.push('Expiry date must be a date.')
    }

    if(expiryDates < startDates){
      errors.push('Expiry date must same or after start date.')
    }

    if(applicableType === ''){
      errors.push('Applicable type is required.')
    }

    // if (applicableType === 'product' && product) {
    //   const existingProductCoupon = await couponModel.findOne({
    //     applicableType: 'product',
    //     applicableProduct: product
    //   });

    //   if (existingProductCoupon) {
    //     errors.push('A coupon already exists for this product.');
    //   }
    // }

    // if (applicableType === 'category' && category) {
    //   const existingCategoryCoupon = await couponModel.findOne({
    //     applicableType: 'category',
    //     applicableCategory: category
    //   });

    //   if (existingCategoryCoupon) {
    //     errors.push('A coupon already exists for this category.');
    //   }
    // }

    // if (applicableType === 'all'){
    //   const existingAllCoupon = await couponModel.findOne({
    //     applicableType: 'all'
    //   })

    //   if (existingAllCoupon) {
    //     errors.push('A coupon already exists for All');
    //   }
    // }

    const existingCoupon = await couponModel.findOne({
      $or: [{couponCode:couponCode}]
    })

    if(existingCoupon){
      errors.push('Another coupon already exists with this coupon code.')
    }

    if(errors.length > 0){
      req.flash('error',errors)
      return res.status(400).redirect('/admin/addCoupon')
    }

    const newCoupon = new couponModel({
      couponCode,
      discountType,
      discountValue:discountValues,
      minSpend,
      usageLimit,
      startDate,
      expiryDate,
      applicableType,
      applicableProduct:applicableType === 'product' ? product : null,
      applicableCategory:applicableType === 'category' ? category : null,
    })

    console.log('newCoupon:',newCoupon)
    if (applicableType === 'all') {
      newCoupon.applicableType = 'all',
      newCoupon.applicableProduct = null,
      newCoupon.applicableCategory = null
    }

    await newCoupon.save()

    res.redirect("/admin/coupons")

  }catch (error) {
    console.log("error in post add coupon",error);
    res.status(500).json({message:"Internal server error"})
  }
}

// //  //  //  //  //         Get Edit coupon page     //  //  //  //  //  //  

export const getEditCouponPage = async (req,res) => {
  try {
    const couponId = req.params.id
    const coupon = await couponModel.findById(couponId)
    const categories = await categoryModel.find({isBlocked:false})
    const products = await productModel.find({isDeleted:false})

    const startDate =coupon.startDate.toISOString().split('T')[0]
    const expiryDate = coupon.expiryDate.toISOString().split('T')[0]
    
    
    res.render('admin/editCoupon',{coupon: {...coupon.toObject(),startDate,expiryDate},categories,products,title:"Edit Coupon"})
  }catch (error) {
    console.log("Error in edit coupon page",error);
res.status(500).send('Internal server error')    
  }
}

// //  //  //  //  //         Post Edit coupon      //  //  //  //  //  //  

export const postEditCoupon = async (req,res) => {
  try {
    const couponId = req.params.id
    const {couponCode,discountType,discountValue,minSpend,usageLimit,startDate,expiryDate,applicableType,product,category} = req.body

    //~ validation
    const errors = []
    
    const couponCodes = /^[A-Z][A-Z0-9 ]{4,9}$/; 
    if(!couponCodes.test(couponCode)){
      errors.push('Coupon code must be uppercase letters .')
    }

    const discountValues = parseFloat(discountValue);
    if (discountType === 'fixed') {
        if (isNaN(discountValues) || discountValues <= 0 || !Number.isInteger(discountValues)) {
            errors.push('Discount value for fixed type must be a whole number greater than zero.');
        }
    } else if (discountType === 'percentage') {
        if (isNaN(discountValues) || discountValues < 1 || discountValues > 100 || !Number.isInteger(discountValues)) {
            errors.push('Discount value for percentage type must be a whole number between 1 and 100.');
        }
    }

    const minSpends = parseInt(minSpend);
    if(isNaN(minSpends) || minSpends <= 0 || !Number.isInteger(minSpends)) {
      errors.push('Minimum spend must be a whole number greater than zero.')
    }

    const usageLimits = parseInt(usageLimit);
    if(isNaN(usageLimits) || usageLimits <= 0 || !Number.isInteger(usageLimits)) {
      errors.push('Usage limit must be a whole number greater than zero.')
    }

    const startDates = new Date(startDate);
    const currentDate = new Date()

    if(isNaN(startDates) || startDates < currentDate.setHours(0,0,0,0) ) {
      errors.push('Start date must be today or a future date.')
    }

    const expiryDates = new Date(expiryDate);
    if(isNaN(expiryDates) || expiryDates <= 0) {
      errors.push('Expiry date must be a date.')
    }

    if(expiryDates < startDates){
      errors.push('Expiry date must same or after start date.')
    }

    if(applicableType === ''){
      errors.push('Applicable type is required.')
    }

    if (applicableType === 'product' && product) {
      const existingProductCoupon = await couponModel.findOne({
        applicableType: 'product',
        applicableProduct: product,
        _id: {$ne: couponId}
      });

      if (existingProductCoupon) {
        errors.push('A coupon already exists for this product.');
      }
    }

    if (applicableType === 'category' && category) {
      const existingCategoryCoupon = await couponModel.findOne({
        applicableType: 'category',
        applicableCategory: category,
        _id: {$ne: couponId}
      });

      if (existingCategoryCoupon) {
        errors.push('A coupon already exists for this category.');
      }
    }

    if (applicableType === 'all'){
      const existingAllCoupon = await couponModel.findOne({
        applicableType: 'all',
        _id: {$ne: couponId}
      })

      if (existingAllCoupon) {
        errors.push('A coupon already exists for All.');
      }
    }

    const existingCoupon = await couponModel.findOne({
      $or: [{couponCode:couponCode}],
      _id: {$ne: couponId}
    })

    if(existingCoupon){
      errors.push('Another coupon already exists with this coupon code.')
    }


    if(errors.length > 0){
      req.flash('error',errors)
      return res.status(400).redirect(`/admin/editCoupon/${couponId}`)
    }

    const updatedCoupon = await couponModel.findByIdAndUpdate(couponId,{
      couponCode,
      discountType,
      discountValue:discountValues,
      minSpend,
      usageLimit,
      startDate,
      expiryDate,
      applicableType,
      applicableProduct:applicableType === 'product' ? product : null,
      applicableCategory:applicableType === 'category' ? category : null,
    })

    if (applicableType === 'all') {
      updatedCoupon.applicableType = 'all',
      updatedCoupon.applicableProduct = null,
      updatedCoupon.applicableCategory = null
    }

    await updatedCoupon.save()

    res.redirect("/admin/coupons")

  }catch (error) {
    console.log("Error in post edit coupon",error);
    res.status(500).json({message:"Internal server error"})
  }
}

// //  //  //  //  //         Delete Coupon     //  //  //  //  //  //  

export const deleteCoupon = async (req,res) => {
  try {
    const couponId = req.params.id
    await couponModel.deleteOne({_id:couponId})
    res.redirect("/admin/coupons")
  } catch (error) {
      console.log("Error in delete coupon",error);
      res.status(500).json({message:"Internal server error"})
  }
}