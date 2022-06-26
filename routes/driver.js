var express = require("express");
const middlewareObj = require("../middleware");
var router = express.Router();
var Driver = require("../models/Driver");
var Squadron = require("../models/Squadron");

//rouote to render the form for editing driver details
router.get("/editDriver/:id/:squadronId",middlewareObj.isDriverOwned,function(req,res){
    Driver.findById(req.params.id,function(err,foundDriver){
        if(err){
            req.flash("error",err.message);
            return res.redirect("back");
        }
        res.render("driver/edit",{driver:foundDriver,squadronId:req.params.squadronId});
    });
});

//route to edit the driver details
router.put("/editDriver/:id/:squadronId",middlewareObj.isDriverOwned,function(req,res){
    if(!checkDetails(req.body.driver,req)){
        return res.redirect("back");
    }
    Driver.findByIdAndUpdate(req.params.id,req.body.driver,function(err,foundDriver){
        if(err){
            console.log(err.message);
            req.flash("error",err.message);
            return res.redirect("back");
        }
        if(!foundDriver){
            console.log("cannot edit driver: not found");
            req.flash("error","הנהג לא נמצא במערכת");
            return res.redirect("back");
        }
        res.redirect("/squadron/"+req.params.squadronId);
    });
});



function checkDetails(driver,req){
    if(driver.name === NaN || driver.name === null || driver.name.length < 1){
        req.flash("error","שם הנהג אינו יכול להיות ריק");
        return false;
    }
    if(driver.age === NaN || driver.age === null || driver.age < 18){
        req.flash("error","גיל הנהג אינו יכול להיות קטן מ18 או ריק");
        return false;
    }
    if(driver.licenseExpiration === NaN || driver.licenseExpiration === null || driver.licenseExpiration===''){
        req.flash("error","חייב למלא פג תוקף של הרישיון האזרחי");
        return false;
    }
    if(driver.armyLicenseExpiration === NaN || driver.armyLicenseExpiration === null || driver.armyLicenseExpiration===''){
        req.flash("error","חייב למלא פג תוקף של הרישיון הצבאי");
        return false;
    }
    return true;
}

//route to delete the driver
router.delete("/deleteDriver/:driverId/:id",middlewareObj.isUserSquadronManager,function(req,res){
    Driver.findByIdAndDelete(req.params.driverId,function(err,driver){
        if(err){
            console.log(err.message);
            req.flash("error",err.message);
            return res.redirect("back");
        }
        res.redirect("back");
    });
});

router.get("*",function(req,res){
    res.render("error");
});

module.exports = router
