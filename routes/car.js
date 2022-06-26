var express = require("express");
var router = express.Router();
var Driver = require("../models/Driver");
var Squadron = require("../models/Squadron");
var Car = require("../models/Car");
const middlewareObj = require("../middleware");

router.get("/editCar/:id/:squadronId",middlewareObj.isCarOwned,function(req,res){
    Car.findById(req.params.id,function(err,foundCar){
        if(err){
            req.flash("error",err.message);
            console.log(err.message);
            return res.redirect("back");

        }
        res.render("car/edit",{car:foundCar,squadronId:req.params.squadronId});
    });
});

function checkCarDetails(req){
    var car = req.body.car
    if(car.carOwner == null || car.carOwner == NaN || car.carOwner == ""){
        req.flash("error","בעל הרכב אינו יכול להיות ריק");
        return false;
    }
    if(car.carType == null || car.carType == NaN || car.carType == ""){
        req.flash("error","סוג הרכב אינו יכול להיות ריק");
        return false;
    }
    if(car.numberPlate == null || car.numberPlate == NaN || car.numberPlate == "" || car.numberPlate.length < 6 || car.numberPlate.length > 8 ){
        req.flash("error","מספר הרכב אינו יכול להיות ריק או קטן מ6 ספרות או גדול מ8 ספרות");
        return false;
    }
}

router.put("/update/:id/:squadronId",middlewareObj.isCarOwned,function(req,res){
    if(!checkCarDetails(req)){
        return res.redirect("back");
    }
    Car.findByIdAndUpdate(req.params.id,req.body.car,function(err,foundCar){
        if(err){
            req.flash("error",err.message);
            console.log(err.message);
            return res.redirect("back");
        }
        res.redirect("/squadron/"+req.params.squadronId);
    })
});

router.delete("/deleteCar/:carId/:id",middlewareObj.isUserSquadronManager,function(req,res){
    Car.findByIdAndDelete(req.params.carId,function(err,car){
        if(err){
            console.log(err.message);
            req.flash("error",err.message);
            return res.redirect("back");
        }
        res.redirect("back");
    });
});

module.exports = router;