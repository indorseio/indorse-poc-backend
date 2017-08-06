
var mongo = require('mongodb');
var config = require('config');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
    ObjectID = mongo.ObjectID;
var jwt    = require('jsonwebtoken');
var server = new Server(config.get('DBHost'),config.get('DBPort'), {auto_reconnect: true});
// var db = new Db(config.get('DBName'), server);


// db.open(function(err, db) {
//     if(!err) {
//         console.log("Connected to database");
// }
// else{
//         console.log("database connection error");
// }
// });

// Now set up a Mongo Client ====
const MongoClient = mongo.MongoClient
var db;

MongoClient.connect(process.env.poc_mongo, function(err, database) {
    if (err) return console.log(err);
    db = database;
});

module.exports = function(req,res,next){
    var info = req.body;
    if('token' in req && req['token'] != '')
    {
        var decoded = jwt.decode(req['token'], {complete: true});
        if(decoded && 'payload' in decoded && 'email' in decoded['payload'])
        {
            email = decoded['payload']['email']
            req.body.email = email;
        }
        else
        {
            req.body.login = false;
            next();
            return;
        }
        token = req['token'];
        req.body.token = token
        //console.log('email is ' + email + 'token is ' + token)
        db.collection('users',function(err,collection){
            collection.findOne({'email': email,'approved' : true,'tokens' : {'$in' : [token]}}, function(err, item) {
                if(item)
                {
                    //console.log('Token not found for the user')
                    jwt.verify(token,config.get('jwtsecret'), function(err, decoded) {
                        if (err) {
                            console.log('JWT verification failed')
                            req.body.login = false;
                            next();
                        }
                        else {
                            console.log('returning true for authentication')
                            req.body.login = true;
                            next();
                        }
                    })
                }
                else {
                    req.body.login = false;
                    next();
                }
            })
        })
    }
    else {
        req.body.login = false;
        next();
    }
}

