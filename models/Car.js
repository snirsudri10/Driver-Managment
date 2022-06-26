var mongoose = require("mongoose");

var CarSchema = new mongoose.Schema({
    carType: String,
    numberPlate: String,
    annualTest: String,
    kilometers: Number,
    monthChecked:Date,
    eachEveryMonths:Number,
    winterCheck:Boolean,
    eachEveryKilometer: Number,
    squadron: String,
    notes: String,
    carOwner:String,
    doneCheck: Boolean
});

module.exports = mongoose.model("Car",CarSchema);