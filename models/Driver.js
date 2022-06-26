var mongoose = require("mongoose");

var DriverSchema = new mongoose.Schema({
    name: String,
    age: Date,
    licenseExpiration:String,
    armyLicenseExpiration:String,
    manualAuto:[String],
    driverRanks:[String],
    squadron: String,
    ageNum:String
});

module.exports = mongoose.model("Driver",DriverSchema);