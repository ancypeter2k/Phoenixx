// import productModel from "../../models/product.models.js";
// import categoryModel from "../../models/category.models.js";
// import offerModel from "../../models/offer.js";

// //^ //  //  //   //  //          GET OFFER LIST PAGE  //  //  //  //  //  //  //

// export const getOfferList = async (req, res) => {
//   try {
//     // Fetch all categories from the database
//     const categorylist = await categoryModel.find({ isBlocked: false });

//     // Fetch active offers and populate offer category
//     const offers = await offerModel.find().populate("offerCategory");

    

//     const pageSize = 10;
//     const totalOffers = offers.length;
//     const totalPages = Math.ceil(totalOffers / pageSize);
//     const currentPage = parseInt(req.query.page) || 1;

//     // Render the admin offers page
//     res.render("admin/offers", {
//       categorylist,
//       title: "Offers",
//       offers: offers.slice((currentPage - 1) * pageSize, currentPage * pageSize),
//       totalPages,
//       currentPage
//     });
//   } catch (error) {
//     console.error("Get offers error:", error);
//     res.status(500).send("An error occurred while fetching offers.");
//   }
// };

// //^ //  //  //   //  //       GET ADD OFFER PAGE  //  //  //  //  //  //  //

// export const getAddOffer = async (req, res) => {
//   try {
//     // Fetch all categories from the database
//     const categorylist = await categoryModel.find({ isBlocked: false });

//     // Check if categories are found
//     if (!categorylist || categorylist.length === 0) {
//       return res.status(404).render('admin/addOffers', {
//         categorylist: [],
//         message: 'No categories found.',
//       });
//     }

//     // Render the add offer page with the categories
//     res.render('admin/addOffers', {
//       offerCategory: categorylist,
//       message: null,
//     });
//   } catch (error) {
//     console.error('Error fetching categories:', error);
//     res.status(500).send('Internal Server Error');
//   }
// };

// //^ //  //  //   //  //       POST ADD OFFER PAGE  //  //  //  //  //  //  //

// export const postAddOffer = async (req, res) => {
//   try {
//     const { offerName, category, offerDiscount, status } = req.body;
//    console.log(`req.body = ${req.body}`)
//     // Validate input
//     console.log(`status = ${status}`)
//     if (!offerName || !category || !offerDiscount) {
//       req.flash("error", "All fields are required!");
//       return res.redirect("/admin/addOffers");
//     }

//     if (offerDiscount < 0 || offerDiscount > 100) {
//       req.flash("error", "Discount percentage must be between 0 and 100!");
//       return res.redirect("/admin/addOffers");
//     }

//     // Validate category exists
//     const isCategory = await categoryModel.findById(category);
//     if (!isCategory) {
//       req.flash("error", "Selected category does not exist!");
//       return res.redirect("/admin/addOffers");
//     }

//     // Retrieve products belonging to the selected category
//     const products = await productModel.find({ category :isCategory});



//     // Create new offer
//     const newOffer = new offerModel({
//       offerCategory: category,
//       offerName: offerName,
//       offerDiscount: parseInt(offerDiscount),
//       isActive: status==='active'?true:false,
//     });

//     console.log(`newOffer = ${newOffer}`)

//     // Save the offer
//     await newOffer.save();

//     // Success response
//     req.flash("success", "Offer added successfully!");
//     return res.redirect("/admin/offers");
//   } catch (error) {
//     console.error("Error adding offer:", error);
//     req.flash("error", "An error occurred while adding the offer.");
//     res.redirect("/admin/addOffers");
//   }
// };

// //^ //  //  //   //  //       GET EDIT OFFER PAGE  //  //  //  //  //  //  //

// export const getEditOffer = async (req, res) => {
//   try {
//     // Fetch the offer using the ID from the request parameters
//     const offer = await offerModel.findById(req.params.id);

//     // Check if the offer exists
//     if (!offer) {
//       req.flash("error", "Offer not found!");
//       return res.redirect("/admin/offers");
//     }

//     // Fetch all categories from the database
//     const categorylist = await categoryModel.find({ isBlocked: false });

//     // Render the edit offer page with the offer and category list
//     res.render("admin/editOffers", {
//       offer, // Pass the offer object
//       offerCategory: categorylist,
//       message: null, // Adjust message as needed
//     });
//   } catch (error) {
//     console.error("Error fetching offer or categories:", error);
//     res.status(500).send("Internal Server Error");
//   }
// };


// //^ //  //  //   //  //       POST EDIT OFFER PAGE  //  //  //  //  //  //  //
// export const postEditOffer = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { offerName, category, offerDiscount, status } = req.body;
//     console.log(status)
//     console.log(req.body)

//     // Validate input fields
//     if (!offerName || !category || offerDiscount === undefined) {
//       req.flash("error", "All fields are required!");
//       return res.redirect(`/admin/editOffers/${id}`);
//     }

//     const parsedDiscount = parseFloat(offerDiscount);

//     if (isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100) {
//       req.flash("error", "Discount percentage must be a number between 0 and 100!");
//       return res.redirect(`/admin/editOffers/${id}`);
//     }

//     // Check if category exists
//     const isCategory = await categoryModel.findById(category);
//     if (!isCategory) {
//       req.flash("error", "Selected category does not exist!");
//       return res.redirect(`/admin/editOffers/${id}`);
//     }

//     // Check if offer exists
//     const existingOffer = await offerModel.findById(id);
//     if (!existingOffer) {
//       req.flash("error", "Offer not found!");
//       return res.redirect("/admin/offers");
//     }

//     // Revert old discounts if the category changes
//     if (existingOffer.offerCategory !== category) {
//       await revertDiscounts(existingOffer.offerCategory, existingOffer.offerDiscount);
//     }

//     // Apply new discounts to the updated category
//     await applyDiscounts(category, parsedDiscount);

//     // Update offer details
//     existingOffer.offerName = offerName;
//     existingOffer.offerCategory = category;
//     existingOffer.offerDiscount = parsedDiscount;

//     // Correctly parse status to determine isActive
//     existingOffer.isActive = status === 'active';

//     // Log for debugging
//     console.log("Received status:", status);
//     console.log("Parsed isActive:", existingOffer.isActive);

//     await existingOffer.save();
//     console.log("Updated offer details:", existingOffer);

//     console.log("Updated offer status:", existingOffer.isActive);

//     // Success response
//     req.flash("success", "Offer updated successfully!");
//     res.redirect("/admin/offers");
//   } catch (error) {
//     console.error("Error editing offer:", error);

//     if (error.kind === "ObjectId" || error.name === "CastError") {
//       req.flash("error", "Invalid offer ID or category ID!");
//     } else {
//       req.flash("error", "An unexpected error occurred while updating the offer.");
//     }

//     res.redirect(`/admin/editOffers/${req.params.id || ""}`);
//   }
// };

// // Helper function to revert discounts
// const revertDiscounts = async (categoryId, offerDiscount) => {
//   const products = await productModel.find({ category: categoryId });

//   const updates = products.map((product) => ({
//     updateOne: {
//       filter: { _id: product._id },
//       update: { $inc: { discount: -offerDiscount } },
//     },
//   }));

//   if (updates.length > 0) {
//     await productModel.bulkWrite(updates);
//   }
// };

// // Helper function to apply discounts
// const applyDiscounts = async (categoryId, offerDiscount) => {
//   const products = await productModel.find({ category: categoryId });

//   const updates = products.map((product) => ({
//     updateOne: {
//       filter: { _id: product._id },
//       update: { $inc: { discount: offerDiscount } },
//     },
//   }));

//   if (updates.length > 0) {
//     await productModel.bulkWrite(updates);
//   }
// };


import productModel from "../../models/product.models.js";
import categoryModel from "../../models/category.models.js";
import offerModel from "../../models/offer.js";

// Helper function to revert discounts
const revertDiscounts = async (categoryId, offerDiscount) => {
  if (!offerDiscount || isNaN(offerDiscount)) return;

  const products = await productModel.find({ category: categoryId });

  const updates = products.map(product => ({
    updateOne: {
      filter: { _id: product._id },
      update: { $inc: { discount: -offerDiscount } },
    },
  }));

  if (updates.length > 0) await productModel.bulkWrite(updates);
};

// Helper function to apply discounts
const applyDiscounts = async (categoryId, offerDiscount) => {
  if (!offerDiscount || isNaN(offerDiscount)) return;

  const products = await productModel.find({ category: categoryId });

  const updates = products.map(product => ({
    updateOne: {
      filter: { _id: product._id },
      update: { $inc: { discount: offerDiscount } },
    },
  }));

  if (updates.length > 0) await productModel.bulkWrite(updates);
};

// GET OFFER LIST PAGE
export const getOfferList = async (req, res) => {
  try {
    const categorylist = await categoryModel.find({ isBlocked: false });
    const offers = await offerModel.find().populate("offerCategory");

    const pageSize = 10;
    const totalOffers = offers.length;
    const totalPages = Math.ceil(totalOffers / pageSize);
    const currentPage = parseInt(req.query.page, 10) || 1;

    res.render("admin/offers", {
      categorylist,
      title: "Offers",
      offers: offers.slice((currentPage - 1) * pageSize, currentPage * pageSize),
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.error("Get offers error:", error);
    res.status(500).send("An error occurred while fetching offers.");
  }
};

// GET ADD OFFER PAGE
export const getAddOffer = async (req, res) => {
  try {
    const categorylist = await categoryModel.find({ isBlocked: false });

    if (!categorylist.length) {
      return res.status(404).render('admin/addOffers', {
        categorylist: [],
        message: 'No categories found.',
      });
    }

    res.render('admin/addOffers', {
      offerCategory: categorylist,
      message: null,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).send('Internal Server Error');
  }
};

// POST ADD OFFER PAGE
export const postAddOffer = async (req, res) => {
  try {
    const { offerName, category, offerDiscount, status } = req.body;
    console.log(`req.body = ${JSON.stringify(req.body)}`);

    if (!offerName || !category || !offerDiscount || isNaN(offerDiscount) || offerDiscount < 0 || offerDiscount > 100) {
      req.flash("error", "All fields are required and discount must be a number between 0 and 100!");
      return res.redirect("/admin/addOffers");
    }

    const isCategory = await categoryModel.findById(category);
    if (!isCategory) {
      req.flash("error", "Selected category does not exist!");
      return res.redirect("/admin/addOffers");
    }

    const newOffer = new offerModel({
      offerCategory: category,
      offerName,
      offerDiscount: parseFloat(offerDiscount),
      isActive: status === 'active',
    });

    console.log(`newOffer = ${newOffer}`);
    await newOffer.save();

    req.flash("success", "Offer added successfully!");
    res.redirect("/admin/offers");
  } catch (error) {
    console.error("Error adding offer:", error);
    req.flash("error", "An error occurred while adding the offer.");
    res.redirect("/admin/addOffers");
  }
};

// GET EDIT OFFER PAGE
export const getEditOffer = async (req, res) => {
  try {
    const offer = await offerModel.findById(req.params.id);

    if (!offer) {
      req.flash("error", "Offer not found!");
      return res.redirect("/admin/offers");
    }

    const categorylist = await categoryModel.find({ isBlocked: false });

    res.render("admin/editOffers", {
      offer,
      offerCategory: categorylist,
      message: null,
    });
  } catch (error) {
    console.error("Error fetching offer or categories:", error);
    res.status(500).send("Internal Server Error");
  }
};

// POST EDIT OFFER PAGE
export const postEditOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { offerName, category, offerDiscount, status } = req.body;
    console.log(status, req.body);

    if (!offerName || !category || offerDiscount === undefined || isNaN(parseFloat(offerDiscount)) || offerDiscount < 0 || offerDiscount > 100) {
      req.flash("error", "All fields are required and discount must be a number between 0 and 100!");
      return res.redirect(`/admin/editOffers/${id}`);
    }

    const isCategory = await categoryModel.findById(category);
    if (!isCategory) {
      req.flash("error", "Selected category does not exist!");
      return res.redirect(`/admin/editOffers/${id}`);
    }

    const existingOffer = await offerModel.findById(id);
    if (!existingOffer) {
      req.flash("error", "Offer not found!");
      return res.redirect("/admin/offers");
    }

    if (existingOffer.offerCategory.toString() !== category) {
      await revertDiscounts(existingOffer.offerCategory, existingOffer.offerDiscount);
      await applyDiscounts(category, parseFloat(offerDiscount));
    }

    existingOffer.offerName = offerName;
    existingOffer.offerCategory = category;
    existingOffer.offerDiscount = parseFloat(offerDiscount);
    existingOffer.isActive = status === 'active';

    console.log("Updated offer details:", existingOffer);
    await existingOffer.save();

    req.flash("success", "Offer updated successfully!");
    res.redirect("/admin/offers");
  } catch (error) {
    console.error("Error editing offer:", error);

    if (error.kind === "ObjectId" || error.name === "CastError") {
      req.flash("error", "Invalid offer ID or category ID!");
    } else {
      req.flash("error", "An unexpected error occurred while updating the offer.");
    }

    res.redirect(`/admin/editOffers/${req.params.id || ""}`);
  }
};
