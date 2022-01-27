//Define User
const mongoose=require("mongoose");
const validator=require("validator");
const bcrypr=require("bcryptjs")
const jwt=require("jsonwebtoken")

let userSchema= new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Plese enter Name"],
        maxLenght:[25,"Name can,t be more than 25 words"],
        minLength:[5,"Name can be smaller Than 5 words"]
    },
    email:{
        type:String,
        required:[true,"Please enter Email"],
         unique:true,
         validate:[validator.isEmail,"Plase enter a Valid email"]
    },
    password:{
        type:String,
        required:[true,"Please Enter a passsword"],
        select:false
    },
    avtar:{  
            public_Id:{
                type:String,
                required:true
            },
            url:{
                type:String,
                required:true
            }
    },
    role:{
        type:String,
        default:"user"
    },
    resePasswordToken:String,
    resetPasswordExpire:Date,
    createdAt:{
        type:Date,
        default:Date.now()
    }
});
userSchema.pre("save",async function(next){
    //condition for paswrd   is hashed then move on
    if(!this.isModified("password")){
        next()
    }

    this.password=await bcrypr.hash(this.password,10)     //encriypt password
})
//JWT TOKEN     give access to Data  TOEKN      
userSchema.methods.getJWTToken=function getJWTToken (){
    return jwt.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRE,
    })
}

//compare password hash
userSchema.methods.comparePassword= async  function comparePassword  (password){
        return await bcrypr.compare(password, this.password )
}
module.exports=mongoose.model("User",userSchema)