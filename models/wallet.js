import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true,
    unique:true
  },
  balance:{
    type:Number,
    default:0
  },
  transaction:[{
    walletAmount:{
      type: Number,
      default:0
    },
    order_id:{
      type: String
    },
    transactionType:{
      type: String,
      enum:['Credited','Debited']
    },
    transactionDate:{
      type: Date,
      required:true,
      default: Date.now()
    }
  }]
},{timestamps:true})

const wallet = mongoose.model('wallet',walletSchema)

export default wallet