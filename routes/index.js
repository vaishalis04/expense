var express = require('express');
var router = express.Router();

const nodemailer = require('nodemailer')
const userLogin = require('../models/userLogin');
const Posts = require('../models/postModel')
const passport = require('passport');
const localStratrgy = require('passport-local');
const { render } = require('ejs');
const postModel = require('../models/postModel');
// const localStratrgy = require('passport-local').Strategy;

passport.use(new localStratrgy(userLogin.authenticate()));
// passport.use(new userLogin.createStrategy())



let checkUser;
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index',{loginUser:req.user});
});
router.get('/signup', function(req, res, next) {
  const isUser = req.user
  if(isUser){
    res.redirect('/profile')
  } else {
    res.render('signup',{loginUser:req.user});
  }
});
router.post('/signup', async function(req, res, next) {
  try{
    await userLogin.register({
      username:req.body.username,
      email:req.body.email
    }, req.body.password);
    res.redirect('/login')
  }catch(err){
    console.log(err)
    res.send(err);
  }
  // res.json(req.body);
});
router.get('/login', function(req, res, next) {
  const isUser = req.user
  if(isUser){
    res.redirect('/profile')
  } else {
    res.render('login',{loginUser:req.user});
  }
});
router.post('/login',passport.authenticate('local',{
  successRedirect:'/profile',
  failureRedirect:'/login'
}), function(req, res, next){})


router.get('/about', function(req, res, next) {
  res.render('about',{loginUser:req.user});
});
router.get('/contact', function(req, res, next) {
  res.render('contact',{loginUser:req.user});
});
router.get('/logout', isLoggedIn, function(req, res, next) {
  req.logOut(()=>{
    res.redirect('/login');
  })
  // res.render('about',);
});
router.get('/profile', isLoggedIn,async function(req, res, next) {
  try {
    let user = await req.user.populate('posts');
    // console.log(user)
    res.render('profile',{loginUser:req.user, posts:user.posts});
  } catch (error) {
    console.log(error)
    res.send(error)
  }
});
router.get('/forgot', function(req, res, next) {
  res.render('forgotPass',{loginUser:req.user, checkUser:checkUser});
  checkUser = null;
});


// 
router.post('/forgot',async function(req, res, next) {
  checkUser = null
  try {
    const userF = await userLogin.findOne({email:req.body.email});
    if(!userF){
      checkUser = 'username not found'
      res.redirect('/forgot')
    } else {
      const otp = Math.floor(1000 + Math.random()*9000);
      userF.genratedOtp = otp;
      userF.save();
      sendmailhandler(userF.email, otp, res, checkUser)
      .then(()=>
        res.render(`enterOtp`,{userMail:userF.email,loginUser:req.user,checkUser:checkUser}))
        .catch((err)=>res.send(err))
      
    }
  } catch (error) {
    console.log(error)
    res.json(error)
  }
  // res.render('forgotPass',{loginUser:req.user});
});


router.post('/enterOtp/:email',async function(req, res, next){
  try {
    const userF1 = await userLogin.findOne({email:req.params.email});
    if(!userF1){
      res.send('user not found')
    } else{
      if(userF1.genratedOtp === +req.body.genratedOtp){
        userF1.genratedOtp = -1;
        userF1.save();
        res.render('resetPassword',{loginUser:req.user,userMail:userF1.email,checkUser:checkUser});
      } else{
        checkUser='enter correct otp'
        res.render(`enterOtp`,{userMail:userF1.email,loginUser:req.user,checkUser:checkUser});
        checkUser = null;
      }
    }
  } catch (error) {
    
  }
})


// asking for new password
router.post('/updatePassword/:email', async function(req, res, next){
  try {
    const userF = await userLogin.findOne({email:req.params.email});
    await userF.setPassword(req.body.password, function(err, user){
      if(err){
        console.log(err)
        res.send(err)
      } else{
        console.log(user)
        res.redirect('/login')
      }
    });
    await userF.save();
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})

// send opt in mail function 
async function sendmailhandler(email, otp, res,checkUser){
  // admin mail address, which is going to be the sender
  const transport = nodemailer.createTransport({
    service:'gmail',
    host:'smpt.gmail.com',
    port:465,
    auth:{
      user: "vaishalisingh00q@gmail.com",
      pass: "joom iymx cbfh mclg",
    },
    // tls:{
    //   rejectUnauthorized:false
    // }
  })
  // receiver mail info 
  const mailOptions = {
    from:'vaishali Pvt. Ltd.<vaishalisingh00q@gmail.com>',
    to:email,
    subject:"for reset password otp",
    html:`<h1>your otp is:- ${otp}</h1>`
  };
  // actual object which intregrate all info and send mail
 await transport.sendMail(mailOptions, (err,info)=>{
    if(err){
      res.send(err)
      console.log(err)
    } else {
      console.log(info)
      // res.render(`enterOtp`,{userMail:email,loginUser:req.user,checkUser:checkUser})
      return;
    }
  })
}



// reset new password get route
router.get('/resetPassword',isLoggedIn,(req, res)=>{
  res.render('newPassword',{loginUser:req.user, checkUser:checkUser});
  checkUser = null;
})
// reset new password post route
router.post('/resetPassword', isLoggedIn,async (req, res)=>{
  try {
    await req.user.changePassword(req.body.oldpassword, req.body.newpassword)
    await req.user.save();
    // alert('password updated successfully');
    res.redirect('/profile')
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});


// create post get route

router.get('/post/create', isLoggedIn,  (req, res)=>{
  res.render('createPost',{loginUser:req.user})
})
// create post post route
router.post('/post/create', isLoggedIn, async (req, res)=>{
  try {
    const post = await Posts(req.body);
    req.user.posts.push(post._id);
    post.user = req.user._id
    await post.save();
    await req.user.save();
    res.redirect('/profile')
  } catch (error) {
    res.send(error)
  }
})


// post delete route
router.get('/post-delete/:id',isLoggedIn, async (req, res)=>{
  
  try {
    const postIndex = await req.user.posts.findIndex((postI)=>postI._id.toString() === req.params.id);
    console.log(postIndex);
    req.user.posts.splice(postIndex, 1);
    await req.user.save();


    // here we delete the post in the post Schema

    await Posts.findByIdAndDelete(req.params.id);
    res.redirect('/profile')
  } catch (error) {
    
  }
})

router.get("/search", isLoggedIn, async function (req, res, next) {
  try {
      // const user = await postModel.findOne({ title: req.body.title });
      // res.json(user);
      let { posts } = await req.user.populate("posts");
      posts = posts.filter((e) => e[req.query.key] == req.query.value);
      res.render("profile",{loginUser:req.user,posts})

      // res.render("profile",{loginUser:req.user,posts:user.posts})
  } catch (error) {
    console.log(error)
      res.send(error);
  }
});

router.get('/post-update/:id',isLoggedIn, async (req, res)=>{
  try {
    const postData = await Posts.findById(req.params.id)
    res.render('postUpdate',{loginUser:req.user, postData:postData});
  } catch (error) {
    console.log(error);
    res.send(error,"error")
  }
})
router.post('/post-update/:id',isLoggedIn, async (req, res)=>{
  try {
    const updatePost = await Posts.findByIdAndUpdate(req.params.id,{title:req.body.title,amount:req.body.amount,date:req.body.date,category:req.body.category, description:req.body.description});
    await updatePost.save();
    res.redirect('/profile')
  } catch (error) {
   console.log(error);
   res.send(error) 
  }
})

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    next()
  } else{
    res.redirect('/login')
  }
}

module.exports = router;
