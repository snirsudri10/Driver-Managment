const { Router, response } = require("express");
var express = require("express");
var passport = require("passport")
    ,mongoose = require("mongoose")
    ,bodyParser = require("body-parser")
    ,localStrategy = require("passport-local")
    ,methodOverride = require("method-override")
    ,flash = require("connect-flash")
    ,User = require("./models/User")
    ,Squadron = require("./models/Squadron");
const middlewareObj = require("./middleware");


var userHandle = require("./routes/userHandle"),
    squadron = require("./routes/squadron"),
    driver = require("./routes/driver"),
    car = require("./routes/car");

var app = express();



var url = process.env.DATABASEURL || "mongodb://localhost:27017/driverMngmnt"
mongoose.connect(url ,{useNewUrlParser:true, useUnifiedTopology: true});
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");


app.use(methodOverride("_method"));
app.use(flash());
app.use(express.static("public"));


//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "*****",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});


app.get("/",middlewareObj.isLoggedIn,function(req,res){

    if(req.user && req.user.accessLvl < 3){ // checking if the user is a super manager
        return res.redirect("squadron/"+req.user.squadronId);
    }
    Squadron.find({},function(err,foundSquadrons){
        if(err){
            console.log(err.message);
            req.flash("error",err.message);
            return res.send("אירעה תקלה פנה למנהל");
        }
        res.render("home",{squadrons:foundSquadrons});
    });
});


app.use("/userHandle",userHandle);
app.use("/squadron",squadron);
app.use("/driver",driver);
app.use("/car",car);

app.get("*",function(req,res){
    res.render("error");
});

var port = process.env.PORT || 3000;
app.listen(port,function(){
    console.log("server has started at port "+port);
});