var mongo = require('mongodb');
var config = require('config');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
    ObjectID = mongo.ObjectID;
var jwt    = require('jsonwebtoken');
var server = new Server('localhost', 27017, {auto_reconnect: true});

if(config.util.getEnv('NODE_ENV') !== 'test') {
    db = new Db('indores_registrations', server);
}
else
{
    db = new Db('indores_test', server);
}

db.open(function(err, db) {
    if(!err) {
        console.log("Connected to database");
}
else{
        console.log("database connection error");
}
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
            collection.findOne({'email': email,'tokens' : {'$in' : [token]}}, function(err, item) {
                if(item)
                {
                    //console.log('Token not found for the user')
                    jwt.verify(token, 'testindorseapp', function(err, decoded) {
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

