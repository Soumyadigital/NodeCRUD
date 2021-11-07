const jwt = require("jsonwebtoken");
const Register = require("../models/registration");

const auth = async(req,res,next)=>{
    try{
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token,process.env.SECRET_KEY);

        const user = await Register.findOne({_id:verifyUser._id});      //to find any data in the database
        //console.log(user);

        req.token=token;
        req.user=user;
        
        next();
    }catch(error){
            res.status(401).send(error);
    }
}
module.exports = auth;

