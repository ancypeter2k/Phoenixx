import categoryModel from "../../models/category.models.js";
import fs from 'fs'
import cloudinary from '../../config/cloudinary.js'
import mongoose from 'mongoose'

// //  //  //   //  //          GET CATEGORY PAGE   //  //  //  //  //  //  //

const getCategory = async (req,res) => {                                                //admin category page
  try{
    const categorylist = await categoryModel.find({})                                       //get all category from database
    res.render('admin/category',{categorylist})                                                        //render category page
  }catch(message){
    console.log(message);
    res.status(500)  
  }
}

// //  //  //   //  //          GET ADD CATEGORY PAGE   //  //  //  //  //  //  //

const getAddCategory = async (req,res)=>{                                              //add category page rendering
  try{
   return  res.render("admin/addCategory")
  }catch(error){
    console.log(error);
    res.status(500)
  }
}

// //  //  //   //  //          POST ADD CATEGORY   //  //  //  //  //  //  //

const postAddCategory = async (req, res) => {
const file = req.file
  try{
  const {name} = req.body
  
  const errors = []

  const categoryNameRegex = /^[a-zA-Z][a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]{1,29}$/;
  if (!name || !categoryNameRegex.test(name.trim())) {
    errors.push("Category name must be at least 2 and maximum 30 characters")
  }

  if (!file) {
    errors.push("Please upload atleast one image")
  } else {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push('Invalid file Type.please upload a valid image file');
    }
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      errors.push('File size exceeds the limit of 10 MB');
    }
  }

  const existingCategory = await categoryModel.findOne({name})
  if (existingCategory) {
    errors.push("Category name already exists")
  }

  if (errors.length > 0) {
    req.flash('error',errors)
    return res.redirect('/admin/addCategory')
  }
  
const result=await cloudinary.uploader.upload(req.file.path,{
  folder:'Category',
  use_filename:true
})

 await categoryModel.create({
    name:name.trim(),
    image:result.secure_url
  })
  
  res.redirect('/admin/category')
  }catch(error){
    console.log(error);
    res.status(500).send("Internal server error in add category")

  } finally {
    if(file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path)
    }
  }
  }

// //  //  //   //  //          GET EDIT CATEGORY PAGE    //  //  //  //  //  //  //

const getEditCategory = async(req,res)=>{ 
  try{
    const id = req.params.id              //Extract the category ID from the request parameters

    const category = await categoryModel.findById(id)     //find the category by id
    res.render('admin/editCategory',{category})      //render the edit category page with the  found category
  }catch(error){
    console.log(error);
    res.status(500).send("Internal Server Error"); 
  }
}


// //  //  //   //  //          POST EDIT CATEGORY     //  //  //  //  //  //  //

const postEditCategory = async (req, res) => {
  const file = req.file;
  try {
    const id = req.params.id.trim();
    const { name, existingImage } = req.body;

    // Validation
    const errors = [];

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      errors.push("Invalid category ID format");
    }

    // Validate category name
    const categoryNameRegex = /^[a-zA-Z][a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]{1,29}$/;
    if (!name || !categoryNameRegex.test(name.trim())) {
      errors.push("Category name must be between 2 and 30 characters and can include letters, numbers, spaces, and special characters. It must start with a letter.");
    }

    // Check for existing category with the same name
    const existingCategory = await categoryModel.findOne({ name: name.trim(), _id: { $ne: id } });
    if (existingCategory) {
      errors.push("Category name already exists");
    }

    if(!file && !existingImage) {
      errors.push("Please upload atleast one image");
    } else {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.mimetype)) {
        errors.push('Invalid file Type.please upload a valid image file');
      }
      const maxSize = 10 * 1024 * 1024; // 10 MB
      if (file.size > maxSize) {
        errors.push('File size exceeds the limit of 10 MB');
      }
    }

    if (errors.length > 0) {
      req.flash('error', errors);
      return res.redirect(`/admin/editCategory/${id}`);
    }

    // Prepare the category data to be updated
    const categoryData = {
      name: name.trim()
    };

    // Handle image upload or removal
    if (file) {
      // New image uploaded
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "Category", //^ cloudinary folder for category
        use_filename: true
      });
      categoryData.image = result.secure_url;
    } else if (!existingImage) {
     
      categoryData.image = null;
    }
  
    // Find the category by ID and update it with the new data
    const updatedCategory = await categoryModel.findByIdAndUpdate(id, categoryData, { new: true });

    if (!updatedCategory) {
      req.flash('error', 'Category not found');
      return res.redirect('/admin/category');
    }  
    res.redirect('/admin/category');
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).send("Internal server error in edit category")
  } finally {
    // Clean up the uploaded file if it exists
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
};


// //  //  //   //  //          DELETE CATEGORY    //  //  //  //  //  //  //

const deleteCategory = async(req,res)=>{
  try{
    const id=req.query.id
    const categorydelete = await categoryModel.deleteOne({_id:id})
    res.redirect('/admin/category')
  }catch(error){
    console.log(error);
    
  }
}

// //  //  //   //  //          BLOCK CATEGORY    //  //  //  //  //  //  //

const blockCategory = async(req,res)=>{
  try{
    const categoryId = req.params.id
    const category = await categoryModel.findById(categoryId)
    if(!category){
      return res.status(404).send("Category not found")
    }
    category.isBlocked =! category.isBlocked
    await category.save()
    res.redirect('/admin/category')
  }catch(error){
    console.log(error);
    res.status(500).send("Internal Server Error")
  }
}


// //  //  //   //  //          SEARCH CATEGORY     //  //  //  //  //  //  //

const searchCategory = async(req,res)=>{
  try{
    const {search=""} = req.query
    const categorylist = await categoryModel.find({name:{$regex:"^"+search,$options:"i"}})
    res.render("admin/category",{categorylist})
  }catch(error){
    console.log(error);
    res.status(500).send("Internal Server Error")
  }
}
export default {
  getCategory,
  getAddCategory,
  postAddCategory,
  getEditCategory,
  postEditCategory,
  deleteCategory,
  blockCategory,
  searchCategory,
};
