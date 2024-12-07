import wishlistModel from '../../models/wishlist.js';
import productModel from '../../models/product.models.js';

//^ //  //  //   //  //         GET WISHLIST PAGE   //  //  //  //  //  //  //

export const getWishlistPage = async (req, res) => {
  try {
    const userId = req.session.userID;
    const wishlist = await wishlistModel.findOne({ user: userId }).populate({
      path: 'items.product',
      populate: { path: 'category', select: 'name' }
    });

    if (!wishlist) {
      return res.render('user/wishlist', { wishlist: null });
    }

    res.render('user/wishlist', { wishlist });
  } catch (error) {
    console.error("Error in getWishlistPage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//^ //  //  //   //  //         ADD TO WISHLIST   //  //  //  //  //  //  //

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.userID;

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
        message: 'Product ID is required'
      });
    }

    // Find product
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find or create wishlist
    let wishlist = await wishlistModel.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new wishlistModel({ user: userId, items: [] });
    }

    // Check if product already exists in wishlist
    const existingItem = wishlist.items.find(item => item.product.toString() === productId);
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Product is already in your wishlist'
      });
    }

    // Add product to wishlist
    wishlist.items.push({ product: product._id });

    await wishlist.save();

    res.json({
      success: true,
      message: 'Product added to wishlist',
      wishlist: {
        totalItems: wishlist.items.length
      }
    });

  } catch (error) {
    console.error('Error in addToWishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

//^ //  //  //   //  //         REMOVE WISHLIST ITEM   //  //  //  //  //  //  //

export const removeFromWishlist = async (req, res) => {
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

    // Find wishlist
    let wishlist = await wishlistModel.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({
        error: 'Wishlist not found'
      });
    }

    // Find item index in wishlist
    const itemIndex = wishlist.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        error: 'Product not found in wishlist'
      });
    }

    // Remove item from wishlist
    wishlist.items.splice(itemIndex, 1);

    // Save updated wishlist
    await wishlist.save();

    res.json({
      success: true,
      message: 'Product removed from wishlist',
      totalItems: wishlist.items.length
    });

  } catch (error) {
    console.error('Error in removeFromWishlist:', error);
    res.status(500).json({
      error: 'An error occurred. Please try again.'
    });
  }
};
