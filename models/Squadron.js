var mongoose = require("mongoose");

var SquadronSchema = new mongoose.Schema({
    name:{type:String, unique: true}
});

module.exports = mongoose.model("Squadron",SquadronSchema);