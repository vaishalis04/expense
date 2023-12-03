const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

const userLogin = new mongoose.Schema({
    username:{
        type:String,
      
    },
    email:{
        type:String,
        unique:true,
        required:[true, 'email address not found']
    },
    password:{
        type:String,
        
    },
    genratedOtp:{
        type:Number,
        default:-1
    },
    posts:[{type:mongoose.Schema.Types.ObjectId, ref:'posts'}]
})

userLogin.plugin(plm)

module.exports = mongoose.model('userLogins', userLogin);