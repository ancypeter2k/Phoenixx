import productModel from "../../models/product.models.js";
import categoryModel from "../../models/category.models.js";
import Offer from "../../models/offer.js";

//^ //  //  //   //  //         GET PRODUCTS BY CATEGORY   //  //  //  //  //  //  //
export const getProductsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortOption = req.query.sort || "createdAt";

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Define sort criteria based on sortOption
    let sortCriteria = {};
    switch (sortOption) {
      case "price_asc":
        sortCriteria = { price: 1 };
        break;
      case "price_desc":
        sortCriteria = { price: -1 };
        break;
      default:
        sortCriteria = { createdAt: -1 };
    }

    // Find the category first
    const category = await categoryModel.findById(categoryId);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Get total count for pagination
    const totalProducts = await productModel.countDocuments({
      category: categoryId,
      isDeleted: false,
    });

    const totalPages = Math.ceil(totalProducts / limit);

    // Find products
    const products = await productModel
      .find({ category: categoryId, isDeleted: false })
      .populate("category", "name")
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .lean();

    res.render("user/categoryProducts", {
      products, // Note: Changed from product to products for clarity
      category,
      currentPage: page,
      totalPages,
      sortOption,
    });
  } catch (error) {
    console.error("Error in getProductsByCategory:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};

//^ //  //  //   //  //         GET PRODUCT DETAIL   //  //  //  //  //  //  //
export const getProductDetail = async (req, res) => {
  try {
    //get the product id from the request parameters
    const productId = req.params.id;

    //find the product by its id and populate the category details
    const product = await productModel
      .findById(productId)
      .populate("category", "name")
      .populate("reviews.userId", "name");

    //if the product is not found, return a 404 error
    if (!product) {
      return res.status(404).send("Product not found");
    }

    //find related products by category and limit the results to 4 and also not showing the current product card on the list
    const relatedProducts = await productModel
      .find({ category: product.category, _id: { $ne: productId } })
      .populate("category", "name")
      .limit(3);
    //render the product detail page with the product and related products
    res.render("user/productDetail", {
      product,
      relatedProducts,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
};

//^ // All products // //

export const getAllProductPage = async (req, res) => {
  try {
    // Fetch query parameters with defaults
    const categoryFilter = req.query.category || "all";
    const sortOption = req.query.sort || "latest";
    const searchQuery = req.query.search || "";

    // Pagination settings
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    // Initialize filter options
    let filterOption = { isDeleted: false };

    // Category filter handling
    if (categoryFilter !== "all") {
      const category = await categoryModel.findOne({ name: categoryFilter });
      if (!category) {
        return res.status(400).send("Category not found");
      }
      filterOption.category = category._id;
    }

    // Search query handling
    if (searchQuery) {
      filterOption.name = { $regex: searchQuery, $options: 'i' };
    }

    // Determine sort options based on sortOption value
    let sortCriteria = {};
    switch (sortOption) {
      case 'latest':
        sortCriteria = { createdAt: -1 };
        break;
      case 'discount':
        sortCriteria = { discountedPrice: 1 }; // Low to High
        break;
      case 'discount-desc':
        sortCriteria = { discountedPrice: -1 }; // High to Low
        break;
      case 'a-z':
        sortCriteria = { name: 1 };
        break;
      case 'z-a':
        sortCriteria = { name: -1 };
        break;
      default:
        sortCriteria = { createdAt: -1 }; // Default to latest
    }

    // Fetch total count of products for pagination
    const totalProducts = await productModel.countDocuments(filterOption);

    // Fetch paginated products based on the filter and sort
    const products = await productModel
      .find(filterOption)
      .populate("category", "name")
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalProducts / limit);

    // Fetch all categories for the filter dropdown
    const categories = await categoryModel.find().lean();

    // Render the page with the fetched data
    res.render('user/allProducts', {
      products,
      categories,
      categoryFilter,
      currentPage: page,
      totalPages,
      sortOption,
      searchQuery
    });
  } catch (error) {
    console.log("Error in all products page", error);
    res.status(500).send("Internal server error");
  }
};

//^ //  //  //   //  //         ADD REVIEW   //  //  //  //  //  //  //

export const addReview = async (req, res) => {
  try {
    const productId = req.params.id;
    const { rating, comment } = req.body;
    const userId = req.session.userID;

    // Check if the rating is valid
    if (rating < 1 || rating > 5) {
      return res.status(400).send("Invalid rating. Please provide a number between 1 and 5.");
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Check if user has already reviewed the product
    const existingReview = product.reviews.find(review => review.userId === userId);
    if (existingReview) {
      return res.status(400).send("You have already reviewed this product.");
    }

    // Add the new review
    const review = { rating, comment, userId };
    product.reviews.push(review);

    // Update the average rating
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / product.reviews.length;
    product.rating = averageRating;

    // Save the updated product
    await product.save();
    res.redirect(`/product/${productId}`);

  } catch (error) {
    console.log("Error adding review:", error);
    res.status(500).send("Internal server error");
  }
};

