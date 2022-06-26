var middlewareObj ={}

/*
function to check if the user is logged in
*/
middlewareObj.isLoggedIn = function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","אתה לא מחובר");
    return res.redirect("/userHandle/signIn");
}

/*
function to check if the user is a manager (any kind)
*/
middlewareObj.isUserAndManager = function(req,res,next){
    if( req.user && req.user.manager){
        return next();
    }
    req.flash("error","אין לך הרשאות מנהל");
    res.redirect("/");
}

/*
function to check if the user is a super manager
*/
middlewareObj.isUserSuperManager = function(req,res,next){

    if(!req.user){
        console.log("1");
        req.flash("error","אתה לא מחובר");
        return res.redirect("/userHandle/signIn");
    }

    if( req.user && req.user.accessLvl === 3){
        return next();
    }
    req.flash("error","אין לך הרשאות מנהל מערכת");
    return res.redirect("/squadron/"+req.user.squadronId);
}

/*
function to check if the user is a squadron manager
*/

middlewareObj.isUserSquadronManager = function(req,res,next){
    console.log(req.params.id);
    
    if(!req.user){
        console.log("1");
        req.flash("error","אתה לא מחובר");
        return res.redirect("/userHandle/signIn");
    }

    if(req.user.accessLvl > 2){
        return next();
    }

    if(req.user.accessLvl < 2 ){
        console.log("2");
        req.flash("error","אין לך הרשאות מנהל טייסת");
        return res.redirect("/squadron/"+req.user.squadronId);
    }

    if(req.user.accessLvl > 1 && req.user.squadronId !== req.params.id){
        console.log("3");
        req.flash("error","אתה לא שייך לטייסת זו");
        return res.redirect("/squadron/"+req.user.squadronId);
    }
    
    return next();
}

/*
function to check if the user from the squadron
*/
middlewareObj.isUserFromTheSquadron = function(req,res,next){
    if(!req.user){
        console.log("1 not connected");
        req.flash("error","אתה לא מחובר");
        return res.redirect("/userHandle/signIn");
    }
    if(req.user.squadronId !== req.params.id && req.user.accessLvl < 3){
        console.log("2 no acccess");
        req.flash("error","אין לך גישה לטייסת");
        return res.redirect("/squadron/"+req.user.squadronId);
    }
    next();
}

/*
check if the user own the requested driver license
*/
middlewareObj.isDriverOwned = function(req,res,next){
    if(!req.user){
        console.log("1 not connected");
        req.flash("error","אתה לא מחובר");
        return res.redirect("/userHandle/signIn");
    }
    if(req.params.id !== req.user.driverId && req.user.accessLvl < 2){
        req.flash("error","אתה לא אחראי על הרישיון הזה");
        return res.redirect("/squadron/"+req.user.squadronId);
    }
    if(req.params.squadronId !== req.user.squadronId && req.user.accessLvl < 3){
        req.flash("error","אתה לא חלק מהטייסת הזאת");
        return res.redirect("/squadron/"+req.user.squadronId);
    }
    next();
}

/*
check if the user own the requested car
*/
middlewareObj.isCarOwned = function(req,res,next){
    if(!req.user){
        console.log("1 not connected");
        req.flash("error","אתה לא מחובר");
        return res.redirect("/userHandle/signIn");
    }
    
    if(req.user.accessLvl > 2){
        return next();
    }

    
    if(req.user.carId !== req.params.id && req.user.accessLvl < 2){
        req.flash("error","אתה לא אחראי על רכב זה");
        return res.redirect("/squadron/"+req.user.squadronId);
    }
    
    if(req.params.squadronId !== req.user.squadronId){
        req.flash("error","אתה לא שייך לטייסת זו");
        return res.redirect("/squadron/"+req.user.squadronId);
    }

    next();
}



module.exports = middlewareObj