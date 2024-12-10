
import userModel from '../../models/User.js'

// //  //  //   //  //          GET USER LIST PAGE   //  //  //  //  //  //  //
export const getUserList=async (req,res)=> {
  try{
    const page=parseInt(req.query.page) || 1
    const limit=5
    const skip=(page -1) * limit
    const usersdata=await userModel.find({}).skip(skip).limit(limit)         //get all users from database

    const totalproducts=await userModel.countDocuments({})
    const totalPages=Math.ceil(totalproducts / limit)
    const startIndex = skip + 1;

    res.render('admin/userLists',{
      usersdata,
      currentPage: page,
      totalPages,
      startIndex
    })                                                    //render customers page
  }catch(message){
    console.log(message);
     res.status(500)                                                                           //render message page
  }
}

// //  //  //   //  //          BLOCK USER   //  //  //  //  //  //  //
export const blockUser=async (req,res)=>{                                                     //block user
  try{
    const userId=req.params.id                                                                //get user id from url
    const user=await userModel.findById(userId)                                               //get user from database

    if(!user){
      return res.status(404).send("User not found")
    }
    user.isBlocked = !user.isBlocked;                                                         //block user
    await user.save();
    res.redirect('/admin/users')

  }catch(error){
    console.log(error);
    res.status(500)
  }
}

// //  //  //   //  //          SEARCH USER   //  //  //  //  //  //  //
export const searchUser=async(req,res)=>{
  try{
    const {search=""}=req.query
    const usersdata=await userModel.find({name:{$regex:"^"+search,$options:"i"}})
    res.render('admin/userLists',{usersdata})
  }catch(error){
    console.log(error);
    res.status(500).send("Internal server error")
  }
}
