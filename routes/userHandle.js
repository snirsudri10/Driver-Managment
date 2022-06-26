var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/User");
var Car = require("../models/Car");
var Driver = require("../models/Driver");

const Squadron = require("../models/Squadron");
const middleware = require("../middleware/index");


router.get("/signIn",function(req,res){
   res.render("userHandle/signnIn");
});

router.post("/signIn",passport.authenticate("local",
   {successRedirect:"/",failureRedirect:"/userHandle/signIn",failureFlash:true})
   ,function(req,res){}
);

router.get("/register/registerSuperManager",middleware.isUserSuperManager,function(req,res) {
   res.render("userHandle/register"); //register show page
});

//router to add supermanager

router.post("/register/registerSuperManager",middleware.isUserSuperManager,function(req,res){
   var user = new User({username:req.body.user.username,accessLvl:3});
   User.register(user,req.body.user.password,function(err,user){
      if(err){
         console.log(err.message);
         req.flash("error",err.message);
         return res.redirect("/userHandle/register/registerSuperManager");
      }
      req.flash("success","בבקשה התחבר");
      return res.redirect("/userHandle/signIn");
   });
});

//register user inside the squadron (only for the squadron)
//id of the squadron
router.get("/register/registerUserSquad/:id",middleware.isUserSquadronManager,function(req,res){
   Squadron.findById(req.params.id,function(err,foundSqaud){
      if(err){
         req.flash("error",err.message);
         console.log(err.message);
         return res.redirect("back");
      }
      if(!foundSqaud){
         req.flash("error","הטייסת לא נמצאה");
         return res.redirect("back");
      }
      Car.find({squadron:foundSqaud.name},function(err,foundCars){
         if(err){
            req.flash("error",err.message);
            console.log(err.message);
            return res.redirect("back");
         }
         if(foundCars === []){
            req.flash("error","מכוניות הטייסת לא נמצאו");
            return res.redirect("back");
         }
         Driver.find({squadron:foundSqaud.name},function(err,foundDrivers){
            if(err){
               req.flash("error",err.message);
               console.log(err.message);
               return res.redirect("back");
            }
            if(foundDrivers === []){
               req.flash("error","נהגי הטייסת לא נמצאו");
               return res.redirect("back");
            }
            res.render("userHandle/registerUserSquad",{squadron:foundSqaud,cars:foundCars,drivers:foundDrivers});
         });
      });
   });
});



router.post("/register/registerUserSquad/:id",middleware.isUserSquadronManager,function(req,res){

   //add that only squadronManager can add users or squadronManagers
   var squadronId = req.params.id;
   var newUser = new User({username:req.body.user.username,
                           squadronId:req.params.id,
                           accessLvl:req.body.user.accessLvl,
                           driverId:req.body.user.driverId,
                           carId:req.body.user.carId}); //creating the user

   User.register(newUser,req.body.user.password,function(err,user){ //registering the user
      if(err){
         console.log(err.message);
         req.flash("error",err.message);
         return res.redirect("/userHandle/register/registerUserSquad/" + req.params.id);
      }
      user.save();
      req.flash("success","המשתמש נוצר בהצלחה");
      res.redirect("/squadron/"+squadronId);
   });
});


//signin
router.get("/logout",middleware.isLoggedIn,function(req,res){
   req.logOut(); //logging out
   res.redirect("/userHandle/signIn");
});




//manage squadron's Users
router.get("/squadronUser/:id",middleware.isUserSquadronManager,function(req,res){
   User.find({squadronId:req.params.id},function(err,users){
      if(err){
         req.flash("error",err.message);
         console.log(err.message);
         return res.redirect("back");
      }
      if(!users){
         req.flash("error","המשתמשים לא נמצאו");
         return res.redirect("back");
      }
      res.render("squadron/users",{users:users,squadronId:req.params.id});
   });
});

//route to edit user details
router.get("/editUser/:userId/:id",middleware.isUserSquadronManager,function(req,res){
   User.findById(req.params.userId,function(err,foundUser){
      if(err){
         req.flash("error",err.message);
         console.log(err.message);
         return res.redirect("back");
      }
      console.log(foundUser);
      //validating that there is a user the user
      if(!foundUser){
         req.flash("error","השמתמש לא נמצא");
         return res.redirect("back");
      }
      //validating that the user can edit only his details and not others
      if(req.user.accessLvl <= 2){
         if(foundUser.accessLvl === 2 && req.user.id !== foundUser.id){
            req.flash("error","אתה לא יכול לערוך מנהל שהוא לא אתה");
            return res.redirect("back");
         }
      }
      Squadron.findById(req.params.id,function(err,foundSqaud){
         if(err){
            req.flash("error",err.message);
            console.log(err.message);
            return res.redirect("back");
         }
         if(!foundSqaud){
            req.flash("error","הטייסת לא נמצאה");
            return res.redirect("back");
         }
         Car.find({squadron:foundSqaud.name},function(err,foundCars){
            if(err){
               req.flash("error",err.message);
               console.log(err.message);
               return res.redirect("back");
            }
            if(foundCars === []){
               req.flash("error","אין מכוניות לטייסת");
            }
            Driver.find({squadron:foundSqaud.name},function(err,foundDrivers){
               if(err){
                  req.flash("error",err.message);
                  console.log(err.message);
                  return res.redirect("back");
               }
               if(foundDrivers === []){
                  req.flash("error","אין נהגי טייסת");
               }
               //after gathering all the data, rendering it to the user
               res.render("userHandle/edit",{user:foundUser,squadron:foundSqaud,cars:foundCars,drivers:foundDrivers});
            });
         });
      });
   });
});

//route to update the user details
router.put("/edit/:userId/:id",middleware.isUserSquadronManager,function(req,res){
   User.findByIdAndUpdate(req.params.userId,req.body.user,function(err,user){
      if(err){
         req.flash("error",err.message);
         console.log(err.message);
         return res.redirect("back");
      }
      user.save();
      req.flash("success","המשתמש עודכן בהצלחה");
      return res.redirect("/userHandle/squadronUser/"+req.params.id);
   });
});

//route to delete user
router.delete("/deleteUser/:userId/:id",middleware.isUserSquadronManager,function(req,res){
   var occoured = false;
   if(req.user.id === req.params.userId){ //user cannot delete himself
      req.flash("error","משתמש לא יכול למחוק את עצמו");
      occoured=true;
      return res.redirect("back");
   }
   User.findById(req.params.userId,function(err,foundUser){
      if(err){
         req.flash("error",err.message);
         console.log(err.message);
         occoured = true;
         return res.redirect("back");
      }
       //manager cannot delete other managers that have the same access level
      if(foundUser.accessLvl === 2 && req.user.accessLvl === 2){
         console.log("delete other manager");
         req.flash("error","מנהל לא יוכל למחוק מנהלים אחרים");
         occoured = true;
         return res.redirect("/userHandle/squadronUser/"+req.params.id);
      }else{
         //otherwise deleting the requasted user
         User.findByIdAndDelete(req.params.userId,function(err,user){
            if(err){
               console.log(err.message);
               req.flash("error",err.message);
               return res.redirect("back");
           }
           req.flash("success","המשתמש נמחק בהצלחה");
           return res.redirect("back");
         });
      }
   });
});

module.exports = router;