import cartModel from '../../models/cart.js';
import productModel from '../../models/product.models.js';
import Offer from '../../models/offer.js';
import category from '../../models/category.models.js';

//^ //  //  //   //  //         GET CART PAGE   //  //  //  //  //  //  //

export const getCartPage = async (req,res) => {
  try{
    const userId = req.session.userID
    const cart = await cartModel.findOne({user: userId}).populate({
      path: 'items.product',
      populate: {path: 'category', select: 'name'}
    })
    if (!cart) {
      return res.render('user/cart',{cart: null})
    }
    const { subtotal, totalDiscount } = calculateSubtotal(cart.items);
    cart.subtotal = subtotal;
    cart.total = subtotal + cart.discount;
    res.render('user/cart', {cart,
      totalDiscount,
      originalPrice: subtotal
    })
  } catch (error) {
    console.log("Error in getCartPage:", error)
    res.status(500).json({error: "Internal server error"})
  }
}

function calculateSubtotal(items) {
  let subtotal = 0;
  let totalDiscount = 0;

  items.forEach(item => {
    const itemTotal = item.price * item.quantity;
    const itemDiscount = (item.price - item.product.discountedPrice) * item.quantity;

    subtotal += itemTotal;
    totalDiscount += itemDiscount;
  });

  return { subtotal, totalDiscount };
}

//^ //  //  //   //  //         ADD TO CART   //  //  //  //  //  //  //

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.session.userID;
    console.log('productId is achu',productId)

    // Validation
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please login to continue' 
      });
    }

    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID  is required' 
      });
    }
    
    // Find product and verify stock
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Requested quantity exceeds available stock' 
      });
    }

    // Find or create cart
    let cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      cart = new cartModel({ user: userId, items: [], subtotal: 0, discount: 0, total: 0 });
    }

    // Check if product already exists in cart
    const existingItem = cart.items.find(item => 
      item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: product._id,
        quantity,
        price: product.price,
        discountPrice: product.discountedPrice || product.price
      });
    }

    // Update cart totals
    cart.subtotal = cart.items.reduce(
      (total, item) => total + (item.price * item.quantity), 
      0
    );

    cart.total = cart.items.reduce(
      (total, item) => total + (item.discountPrice * item.quantity),
      0
    );

    cart.discount = cart.subtotal - cart.total;

    await cart.save();

    res.json({ 
      success: true, 
      message: 'Product added to cart',
      cart: {
        totalItems: cart.items.length,
        subtotal: cart.subtotal,
        total: cart.total,
        discount: cart.discount
      }
    });

  } catch (error) {
    console.error('Error in addToCart:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

//^ //  //  //   //  //         UPDATE CART ITEM QUANTITY AJAX  //  //  //  //  //  //  //

export const updateCartItemQuantity = async (req, res) => {
  try {
    const userId = req.session.userID;
    const productId = req.params.productId;
    const newQuantity = parseInt(req.body.quantity, 10);

    // Validate input
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Please login to continue" 
      });
    }

    if (!newQuantity || newQuantity < 1 || newQuantity > 5) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid quantity. Quantity must be between 1 and 5." 
      });
    }

    const cart = await cartModel.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: "Cart not found" 
      });
    }

    const itemIndex = cart.items.findIndex(item => item.product._id.equals(productId));
    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found in cart" 
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    if (newQuantity > product.stock) {
      return res.status(400).json({ 
        success: false, 
        message: "Requested quantity exceeds available stock" 
      });
    }

    // Update the item's quantity
    cart.items[itemIndex].quantity = newQuantity;

    // Recalculate cart totals
    cart.subtotal = cart.items.reduce(
      (total, item) => total + (item.product.price * item.quantity),
      0
    );

    cart.total = cart.items.reduce(
      (total, item) => total + ((item.product.discountedPrice || item.product.price) * item.quantity),
      0
    );

    cart.discount = cart.subtotal - cart.total;

    // Save the updated cart
    await cart.save();

    res.json({
      success: true,
      message: "Cart updated successfully",
      cart: {
        itemCount: cart.items.length,
        subtotal: cart.subtotal,
        total: cart.total,
        discount: cart.discount,
        items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
        discountPrice: item.product.discountedPrice
        }))
      }
    });
  } catch (error) {
    console.error("Error in updateCartItemQuantity:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating cart item quantity" 
    });
  }
};

//^ // //  //  //   //  //         REMOVE CART ITEM   //  //  //  //  //  //  //

export const deleteFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.session.userID;

    // Validation
    if (!userId) {
      return res.status(401).json({
        error: 'Please login to continue'
      });
    }

    if (!productId) {
      return res.status(400).json({
        error: 'Product ID is required'
      });
    }

    // Find cart
    let cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        error: 'Cart not found'
      });
    }

    // Find item index in cart
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        error: 'Product not found in cart'
      });
    }

    // Remove item from cart
    cart.items.splice(itemIndex, 1);

    // Recalculate cart totals
    cart.subtotal = cart.items.reduce(
      (total, item) => total + (item.price * item.quantity),
      0
    );

    cart.total = cart.subtotal - cart.discount;

    cart.discount = cart.subtotal - cart.total;

    // Save updated cart
    await cart.save();

    // Prepare items data for frontend
    const itemsData = await Promise.all(cart.items.map(async (item) => {
      return {
        productId: item.product.toString(),
        quantity: item.quantity,
        total: item.quantity * item.discountPrice
      };
    }));

    // Send response matching frontend expectations
    res.json({
      itemCount: cart.items.length,
      originalPrice: cart.subtotal,
      totalDiscount: cart.discount,
      total: cart.total,
      items: itemsData
    });

  } catch (error) {
    console.error('Error in deleteFromCart:', error);
    res.status(500).json({
      error: 'An error occurred. Please try again.'
    });
  }
};
