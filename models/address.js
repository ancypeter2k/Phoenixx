import mongoose from "mongoose";


const addressSchema=mongoose.Schema({
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  name:{
    type:String,
    required:true
  },
  buildingName:{
    type:String,
    required:true
  },
  street:{
    type:String,
    required:true
  },
  city:{
    type:String,
    required:true
  },
  state:{
    type:String,
    required:true
  },
  country:{
    type:String,
    required:true
  },
  pincode:{
    type:String,
    required:true
  },
  mobile:{
    type:String,
    required:true
  },
  isDefault:{
    type:Boolean,
    default:false
  },

},{timestamps:true})

const address = mongoose.model('address',addressSchema)

export default address
