const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require('validator');
const { stringify } = require("querystring");

//Schema 
const userSchema = new mongoose.Schema({     
    username: {
        type:String,
        required:true,
        minlength:2,
        maxlength:100
    },
    email:{
        type:String,
        required:true,
        unique:true,
        validate(value){
            if(!validator.isEmail(value)){        // Using Installed Validator (To know more go to npm validator page)
                throw new Error('Invalid Email');
            }
        }
    },
   password:{
       type:String,
       required:true,
       //enum :["mamunhai2244","maubhai4466"]     
   },
   passwordRepeat:{
        type:String,
        required:true
    },
    tokens:[{
        token:{
        type:String,
        required:true
    }
    }],
    emailToken:{
        type:String
    },
    isVerified:{
        type:Boolean
    }
});

//generating tokens
userSchema.methods.generateAuthToken = async function(){
    try{
        //console.log(this._id);
        const token = jwt.sign({_id:this._id.toString()},process.env.SECRET_KEY);

       this.tokens = this.tokens.concat({token})
       await this.save();

       return token;    
    }catch(error){
        res.send('error' + error);
        console.log('error' + error);
    }
}
//bcrypting registration password
userSchema.pre("save",async function(next){
    if(this.isModified("password")){
    this.password = await bcrypt.hash(this.password,10);
   // this.passwordRepeat=undefined;
    }
    next();
 })
 
const Register = new mongoose.model("Register",userSchema);

module.exports = Register;

