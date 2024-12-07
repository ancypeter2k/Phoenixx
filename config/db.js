import mongoose from 'mongoose';

// // // // database connection // // // // 
const connectDB=async()=>{
  try{
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB connected successfully ${mongoose.connection.host}`);
  }catch(error){
    console.log(`MongoDB connection failed: ${error}`);
  }
  
  }

export default connectDB;