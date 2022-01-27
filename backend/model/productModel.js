// descrie a product Schema
const mongoose=require("mongoose");
const { stringify } = require("nodemon/lib/utils");
const ObjectId=mongoose.Types.ObjectId
// creat a function for new string id
const UniqueId=new mongoose.Schema({
    _id:{
        type:String,
        default:function(){
            return new ObjectId.toString()
        }
    }
})// add innlst of schema
const Product=new mongoose.Schema({
    name:{
        type:String,
        require:[true,"Please Enter Product name "],
        trim:true
    },
    description:{
        type:String,
        require:[true,"Please enter description of Product"]
    },
    price:{
        type:String,
        require:[true,"Plesase enter Price of Product"]
    },
    rating:{
        type:Number,
        default:0
    },
    image:[
    {
        publie_Id:{
            type:String,
            require:true
        },
        url:{
            type:String,
            require:true
        }
    }],
    catergory:{
        type:String,
        require:[true,"Please Enter Product category "],
    },
    stock:{
        type:Number,
        require:[true,"Please Enter Product Stock "],
        maxLenghtL:[4,"Stock can,t be more than  10000"],
        default:1
    },
    numOfReviews:{
        type:Number,
        default:0
    },
    reviews:[
        {
            name:{
                type:String,
                require:true
            },
            rating:{
                type:String,
                require:true
            },
            comments:{
                type:String,
                required:true
            }
        }
    ],
    createdAt:{
        type:Date,
        default:Date.now,
    }
})
// Product.add(UniqueId)
// creating a model of schema 
module.exports=mongoose.model("ProductX",Product)
