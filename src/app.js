require('dotenv').config();
const express = require('express');
const path = require("path");
const app = express();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieparser = require("cookie-parser");
const hbs = require("hbs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

require("./db/conn");
const Register = require("./models/registration");
const auth = require("./middleware/auth");
const verifyEmail = require("./middleware/emailverify");
const {json} = require("express");
const port = process.env.PORT || 3000;

const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");


app.use(express.json());
app.use(cookieparser());
app.use(express.urlencoded({extended:false}));

app.use(express.static(static_path));
app.set("view engine", "hbs");
app.set("views",template_path);
hbs.registerPartials( partials_path);

const transport = nodemailer.createTransport(             //sender address
    {
        service:"gmail",
        auth:{
            user:"digitaldeveloper1234@gmail.com", //HERE YOU WILL PASTE YOUR EMAIL ID
            pass:digital1234             //here is your email pass
        },
        tls:{
            rejectUnauthorized:false
        }
        
    }
);

app.get("/",(req,res)=>{
    res.render("register");
})

app.get("/secret",auth,(req,res)=>{
    res.render("secret");
})

app.get("/verifyemail",async(req,res)=>{
    try {
        const token = req.query.token;
        const user = await Register.findOne({emailToken : token});
        if(user){
            user.emailToken=null
            user.isVerified=true
            await user.save()
            res.render("login")
        }else{
            res.render("register");
            console.log("email is not verified");
        }       
    } catch (error) {
        console.log(error);
    }
})

app.get("/logout",auth,async(req,res)=>{
    try {
                //For Single user Logout [delete unwanted extra token from database]
                req.user.tokens = req.user.tokens.filter((currentElement)=>{       //filter method 
                    return currentElement.token !== req.token;
                    })
                //For Logout from all devices [all token delete from database] 
                    // req.user.tokens=[];  
       res.clearCookie("jwt"); 
        await req.user.save();
        res.render("login");
    }catch (error){
        res.status(500).send(error);
    }
})

app.get("/login",(req,res)=>{
    res.render("login");
})

app.get("/forgotpassword",(req,res,next)=>{
    res.render("forgotpassword");
})

app.get("/resetpassword/:id/:token",async(req,res,next)=>{
        const {id,token} = req.params;
    //  res.send(req.params);
         const user = await Register.findOne({_id:id});
         if(id!==user.id){
             res.send("Invalid id.......");
             return;
         }

        const secret = process.env.SECRET_KEY + user.password;
        try {
           const payload = jwt.verify(token,secret);
           res.render("resetpassword",{id:id,token:token});
            
        } catch (error) {
            res.send(error);
        }
});

app.post("/register",async(req,res)=>{
    try {  const password= req.body.password;
           const passwordr=req.body.passwordRepeat;
           if(password===passwordr)
           {
            const registerUser = new Register({
                username : req.body.username,
                email : req.body.email,
                password : password,
                passwordRepeat : passwordr,
                emailToken : crypto.randomBytes(64).toString("hex"),
                isVerified:false
            })
            const token =await registerUser.generateAuthToken();
            
            res.cookie("jwt",token,{httpOnly:true});   // token  store into cookies [res.cookie() function is used to set the cookie name to value]

            const registered = await registerUser.save();
            res.status(201).render("index"); 

    //sending verification email
    const mailOptions ={
        from :'"verify your email" <digitaldeveloper1234@gmail.com>',             
        subject :"Verify your email",
        to :registerUser.email,
        subject :"Verify your Email",
        html:`<h2> ${registerUser.username}Thanks for registering on our site</h2>
            <h4>Please verify your email</h4>
            <a href="http://${req.headers.host}/verifyemail?token=${registerUser.emailToken}">Verify Your Email</a>`
    };

    transport.sendMail(mailOptions,function(error,info){
        if(error){
            console.log(error);
        }else{
            console.log("verification Email sent" + info.response);
        }
    });

        }else{
                    res.send("password are not matching");
                }
          
        } catch (error) {
    res.status(400).send(error);
    }
})             

app.post("/login",verifyEmail,async(req,res,next)=>{
    try { const email= req.body.email;  
        const password= req.body.password;
        
        const dologin = await Register.findOne({email:email});
          
        const isMatch = bcrypt.compare(password,dologin.password); //login form with bcryptjs

        const token =await dologin.generateAuthToken();
        res.cookie("jwt",token,{httpOnly:true});   // token store into cookies

       //[ if(dologin.password===password)]  
        if(isMatch)
        {
        res.status(201).render("secret"); 

        }else{
            res.send("Invalid login details");
        }
     } catch (error) {
 res.status(400).send(error);
 }
})


app.post("/forgotpassword",async(req,res,next)=>{
    const email = req.body.email;
    const dologin = await Register.findOne({email:email});
    
     if(dologin.email != email){
          res.send("User is not registered");
          return;
      }

    //one time link valid for 15 min
    const secret = process.env.SECRET_KEY + dologin.password;
    const payload = {
        email: dologin.email,
        id: dologin.id
    };

    const token = jwt.sign(payload,secret,{expiresIn:"15m"});
    const link = `http://${req.headers.host}/resetpassword/${dologin.id}/${token}`; 
    console.log(link);
    res.send("see link");
    //sending verification email
         const mailOptions ={
             from :'"Forgot password link" <digitaldeveloper1234@gmail.com>',               //here you can add multiple email address
             subject :"Reset your password",
             to :dologin.email,
             subject :"Verify your Email",
             html:`<h2> ${dologin.username} This is your reset password link</h2>
                 <h4>Reset password link</h4>
                 <a href="http://${req.headers.host}/resetpassword/${dologin.id}/${token}">Reset password</a>`
         };

         transport.sendMail(mailOptions,function(error,info){
             if(error){
                 console.log(error);
             }else{
                 console.log("Reset password Email sent" + info.response);
             }
         });
    
    });

app.post("/resetpassword/:id/:token",async(req,res,next)=>{
    const password= req.body.password;
    const passwordr=req.body.passwordr;
    const {id,token}=req.params;
    const user = await Register.findOne({_id:id});
     try {
         const password= req.body.password;
         const passwordr=req.body.passwordr;
        if(password===passwordr){
            const passUpdate = await Register.updateOne({_id:id},{$set:{password:password}}); 
            res.send("Password Updated");
        }else{
            res.send("password are not matching");
        }
    } catch (error) {
        res.send("error");
    }

});

app.listen(port,() =>{
    console.log(`server is running at port ${port}`);
})

