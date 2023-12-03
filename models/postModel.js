const mongoose = require('mongoose');

const postModel = new mongoose.Schema({
    title:String,
    amount:String,
    date:String,
    category:String,
    description:String,
    user:{
        type:mongoose.Schema.Types.ObjectId, ref:'userLogins'
    }
},{
    timestamps:true
})

module.exports = mongoose.model('posts', postModel);