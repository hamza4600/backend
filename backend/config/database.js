const mongoosee=require("mongoose");
//WE CAN ASLO DEFINE URL OF LIVE SERVER 
// const dotenv=require("dotenv");
// dotenv.config({path:"./config.env"})

const urls="mongodb://localhost:27017/xcommerx"
const ConnectDatabase=async ()=>{
await mongoosee.connect(urls
    //     ,{       // are used in previous versions nop need innnew versiosn
    //     useNewUrlParser:true,
    //     useUnifiedTopology:true,
    //     useCreateIndex:true,
    // }
    )
    .then((data)=>{
        console.log(`connected to ${data.connection.host}`)
    })

}
module.exports=ConnectDatabase
