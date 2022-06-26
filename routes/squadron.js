var express = require("express");
var router = express.Router();
var Squadron = require("../models/Squadron");
var Driver = require("../models/Driver");
var Car = require("../models/Car");
var User = require("../models/User");
const middlewareObj = require("../middleware");

//route to display the page to create a new sqaudron
router.get("/createSquadrons",middlewareObj.isUserSuperManager,function(req,res){
    res.render("squadron/create");
});

//route to create a new sqaudron
router.post("/createSquadron",middlewareObj.isUserSuperManager,function(req,res){
    Squadron.create({name:req.body.squadron.name},function(err,squadron){
        if(err){
            if(err.code === 11000){ //checking for duplicated names
                req.flash("error","הטייסת כבר קיימת במערכת");
                console.log("duplicate name");
            }else{
                req.flash("error",err.message);
                console.log(err.message);
            }
            return res.redirect("/");
        }
        if(req.body.squadron.name == ''){ //checking if the squadron is empty
            req.flash("error","השם של הטייסת  לא יכול להיות ריק");
            return res.redirect("/");
        }
        squadron.save(); //saving the record and redirecting
        res.redirect("/");
    });
});

//checking if the date is the past
var dateInPast = function(currentDate, secondDate) {
    if (currentDate.setHours(0, 0, 0, 0) >= secondDate.setHours(0, 0, 0, 0)) {
      return true;
    }
    return false;
};
  

function datePassed(date,currentDate){
    var stringCurrentDate = currentDate[0]+"-"+currentDate[1]+"-"+currentDate[2]+"";

    var stringDate =  date[0]+"-"+date[1]+"-"+date[2]+"";
    var currentDateDate = new Date(stringCurrentDate);
    var DateDate = new Date(stringDate);
    return dateInPast(currentDateDate,DateDate);

}

function carDatePassed(date,currentDate){
    
    if(Number(currentDate[1]) != 12){
        var stringCurrentDate = currentDate[0]+"-"+String(Number(currentDate[1])+1)+"-"+currentDate[2]+"";

        
    }else{
        var stringCurrentDate = currentDate[0]+"-"+"01"+"-"+currentDate[2]+"";
    }


    var stringDate =  date[0]+"-"+date[1]+"-"+date[2]+"";
    var currentDateDate = new Date(stringCurrentDate);
    var DateDate = new Date(stringDate);
    return dateInPast(currentDateDate,DateDate);

}

function _calculateAge(birthday) { // birthday is a date
    var ageDifMs = Date.now() - birthday.getTime();
    var ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}



function addMonths(date, months) {
    var d = date.getDate();
    date.setMonth(date.getMonth() + +months);
    if (date.getDate() != d) {
      date.setDate(0);
    }
    return date;
}


function diffDays(firstDate,secondDate){
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds

    const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
    return diffDays
}

//route to retrive the requested squadron from DB
router.get("/:id",middlewareObj.isUserFromTheSquadron,function(req,res){

    
    var driverAlerts = [];
    var carAlerts = [];
    var licenseExpirationDate = [];
    var armyLicenseExpirationDate = [];
    var currentDateArr = [];
    var carTestDate = [];
    var currentDate = new Date();
    currentDateArr.push(currentDate.getFullYear());
    currentDateArr.push(currentDate.getMonth()+1);
    currentDateArr.push(currentDate.getDate());

    //getting the squadron from the DB
    Squadron.findById(req.params.id,function(err,foundSquadron){
        if(!foundSquadron){ // if the obj is empty
            req.flash("error","הטייסת לא נמצאה");
            return res.redirect("back");
        }
        if(err){
            console.log(err.message);
            return res.redirect("back");
        }
        //finding the drivers that belong to the squadron
        Driver.find({squadron:foundSquadron.name},function(err,drivers){
            if(!drivers){
                req.flash("error","נהגי הטייסת לא נמצאו");
                return res.redirect("/");
            }
            if(err){
                console.log(err.message);
                return res.redirect("back");
            }
            //calculating expired data 
            drivers.forEach(function(driver){
                driver.ageNum = _calculateAge(driver.age);
                licenseExpirationDate = driver.licenseExpiration.split("-");
                armyLicenseExpirationDate = driver.armyLicenseExpiration.split("-");
    
                if(datePassed(licenseExpirationDate,currentDateArr)){
                    driverAlerts.push("הרישיון האזרחי של" +" "+ driver.name +" "+"פג תוקף!");
                }
                if(datePassed(armyLicenseExpirationDate,currentDateArr)){
                    driverAlerts.push(" הרישיון הצבאי של " +" "+ driver.name +" "+ " פג תוקף! ");
                }
            });
            //finding the cars that belong to this squadorn
            Car.find({squadron:foundSquadron.name},function(err,cars){
                if(err){
                    req.flash("error",err.message);
                    console.log(err.message);
                    return res.redirect("back");
                }
                if(!cars){
                    req.flash("error","רכבי הטייסת לא נמצאו");
                    return res.redirect("/");
                }
                cars.forEach(function(car){
                    //console.log(car);
                    carTestDate = car.annualTest.split("-");
                    //cehcking for expired data of the cars (for each car)
                    if(carDatePassed(carTestDate,currentDateArr)){
                        //console.log("passed");
                        carAlerts.push(" תאריך הטסט של הרכב של " + car.carOwner + " קרוב להיות פג תוקף!");
                    }
                    //checking if the test of the car is by range or time
                    if(car.eachEveryMonths === null){
                        var kilLeft = Math.abs((car.kilometers % car.eachEveryKilometer) - car.eachEveryKilometer);
                        //console.log(kilLeft);
                        if(kilLeft <= 1000 ){
                            carAlerts.push(" לרכב של " + car.carOwner + " נשארו עוד " + kilLeft +" קילומטרים לטיפול הבא!");
                        }
                    }else{

                        var nextDate = new Date(car.monthChecked);
                        nextDate = addMonths(nextDate,car.eachEveryMonths);
                        var days = diffDays(nextDate,currentDate)
                        if(days < 30){
                            carAlerts.push(" לרכב של " + car.carOwner + " נשארו עוד " + days +" ימים לטיפול החודשי הבא!");
                        }
                    }
                    //checking if the did thier winter check
                    if(!car.winterCheck){
                        carAlerts.push(" הרכב של " + car.carOwner + " לא עשה ביקורת חורף! ");
                    }
                });
                //rendering the data to the user
                res.render("squadron/view",{squadron:foundSquadron,drivers:drivers,cars:cars,driverAlerts:driverAlerts,carAlerts:carAlerts});

            });
        });
    });
});

//function to validate the new driver's detail
function checkDetails(driver,req){
    var d = new Date(driver.age);
    if(driver.name === NaN || driver.name === null || driver.name.length < 1){
        req.flash("error","שם הנהג אינו יכול להיות ריק");
        return false;
    }
    if(driver.age === NaN || driver.age === null || _calculateAge(d) < 18){
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


//route to add new driver to the squadron
router.post("/addDriver/:squadronName/:id",middlewareObj.isUserSquadronManager,function(req,res){
    if(!checkDetails(req.body.driver,req)){
        return res.redirect("back");
    }
    //first we are if the squadron is valid and no has changed the URL
    Squadron.findById(req.params.id,function(err,foundSquadron){
        if(err){
            req.flash("error",err.message);
            console.log(err.message);
            return res.redirect("back");
        }
        if(foundSquadron.name == req.params.squadronName){
            console.log("matched squadron and name")
        }else{
            req.flash("error","הפרטים אינם תואמים!");
            res.redirect("back");
        }
    });
    // creating the driver and assigning it to the squadton
    req.body.driver.squadron = req.params.squadronName;
    Driver.create(req.body.driver,function(err,driver){
        if(err){
            req.flash("error",err.message);
            console.log(err.message);
            return res.redirect("back");
        }
        driver.save();
        console.log(driver);
        return res.redirect("back");
    });
});

//route to delete the squadron
router.delete("/delete/:squadronId",middlewareObj.isUserSuperManager,function(req,res){
    //first finding the squadron
    Squadron.findById(req.params.squadronId,function(err,foundSquadron){
        if(err){
            req.flash("error",err.message);
            console.log(err.message);
            return res.redirect("back");
        }
        //then deleteing all the drivers that belong to the squadron
        Driver.deleteMany({squadron:foundSquadron.name},function(err){
            if(err){
                req.flash("error",err.message);
                console.log(err.message);
                return res.redirect("back");
            }
        });
        //then doing the same for the cars
        Car.deleteMany({squadron:foundSquadron.name},function(err){
            if(err){
                req.flash("error",err.message);
                console.log(err.message);
                return res.redirect("back");
            }
        });
    });
    //then deleteing the requested squadron
    Squadron.findByIdAndDelete(req.params.squadronId,function(err){
        if(err){
            req.flash("error",err.message);
            console.log(err.message);
            return res.redirect("back");
        }
    });
    //and then deleteing all the users of the squadron
    User.deleteMany({squadronId:req.params.squadronId},function(err){
        if(err){
            req.flash("error",err.message);
            console.log(err.message);
            return res.redirect("back");
        }
    })
    res.redirect("/");
});

//check for the new car's detail
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

//adding a new car to the squadron
router.post("/addCar/:squadronName/:id",middlewareObj.isUserSquadronManager,function(req,res){

    if(!checkCarDetails(req)){
        return res.redirect("back");
    }
    
    Squadron.findById(req.params.id,function(err,foundSquadron){
        if(err){
            req.flash("error",err.message);
            console.log(err.message);
            return res.redirect("back");
        }
        if(foundSquadron.name == req.params.squadronName){
            console.log("matched squadron and name");
            console.log(req.body.car);

        }else{
            req.flash("error","הפרטים אינם תואמים!");
            res.redirect("back");
        }
    });
    //creatring the car and assigning it to the squadron
    req.body.car.squadron = req.params.squadronName;
    console.log(req.body.car);
    Car.create(req.body.car,function(err,car){
        if(err){
            req.flash("error",err.message);
            console.log(err.message);
            return res.redirect("back");
        }
        console.log(car);
        car.save();
        res.redirect("back");
    })

});

//route to display the manger mode of the suqadron
router.get("/:id/managerMode",middlewareObj.isUserSquadronManager,function(req,res){
    res.render("squadron/manager",{squadronId:req.params.id});
});

//error route
router.get("*",function(req,res){
    res.render("error");
});


module.exports = router;