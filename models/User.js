var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: {type:String,unique:true},
    password: String,
    manager: Boolean,
    squadronId: String,
    accessLvl: Number,
    carId:String,
    driverId:String
});

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User",UserSchema);