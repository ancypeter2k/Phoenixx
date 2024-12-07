import mongoose from 'mongoose'

const offerSchema = mongoose.Schema({
    offerCategory:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Category',
        required:true
    },
    offerName:{
        type:String,
        required:true
    },
    offerDiscount:{
        type: Number,
        required: true, 
        min: 0,
        max: 100
    },
    isActive:{
        type:Boolean,
        default:false
    }
},{timestamps:true})

const Offer=mongoose.model('offer',offerSchema)
export default Offer;