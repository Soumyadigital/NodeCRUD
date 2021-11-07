// const path = require("path");
// const hbs = require("hbs");
const Register = require("../models/registration");
// const template_path = path.join(__dirname, "../templates/views");
// app.set("view engine", "hbs");
// app.set("views",template_path);

const verifyEmail = async(req,res,next)=>{
    try {
        const dologin = await Register.findOne({email : req.body.email});
        if(dologin.isVerified){
            next();
        }else{
            console.log("Please check")
            res.render("register")
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = verifyEmail;
