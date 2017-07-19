var mongo = require('mongodb');
var config = require('config');
var auth = require('./auth.js');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
    ObjectID = mongo.ObjectID;
var jwt    = require('jsonwebtoken');
var server = new Server('localhost', 27017, {auto_reconnect: true});
var passwordHash = require('password-hash');
var randtoken = require('rand-token');
var crypto = require('crypto');
var sendinblue = require('sendinblue-api');
var parameters = { "apiKey": "zBNScm5pPbYZaVUL", "timeout": 5000 };     //Optional parameter: Timeout in MS 
var sendinObj = new sendinblue(parameters);

if(config.util.getEnv('NODE_ENV') !== 'test') {
console.log('dev DB');
db = new Db('indores_registrations', server);
}
else
{
console.log('test DB');
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


exports.claim = function(req,res){
    //var login =
    //console.log('login result is ' + login);
    if(true)
    {
	var info = req.body;
	if('title' in info && info['title'] != '' && 'desc' in info && info['desc'] != '' && 'proof' in info && info['proof'] != '')
	{

            db.collection('users', function (err, collection) {
                collection.findOne({'email': info['email']}, function (err, item) {

                    if (item) {


                        if('claim_id' in info && info['claim_id'] !=  '')
                        {
                            db.collection('claims', function (err, collection1) {

                                collection1.findOne({'_id': new ObjectID(info['claim_id']}, function (err, currclaim) {

                                    if(currclaim)
                                    {
                                        var claim = {};
                                        currclaim['title'] = info['title'];
                                        currclaim['desc'] = info['desc']
                                        currclaim['proof'] = info['proof'];
                                        if('visible' in info && info['visible'] != '')
                                        {
                                            currclaim['visible'] = info['visible'];
                                        }
                                        collection1.update({'_id' : new ObjectID(info['claim_id']},currclaim,{safe:true}, function(err, result) {

                                          if(err)
                                          {
                                              res.send(401, {success: false, message: 'Update claim failed'});
                                          }
                                          else
                                          {
                                              res.send(200, {success: true, message: 'Claim has been updated'});
                                          }

                                        })
                                    }
                                    else
                                    {
                                        res.send(401, {success: false, message: 'Claim not found'});
                                    }
                                })

                            })
                        }
                        else {
                            var claim = {};
                            claim['title'] = info['title'];
                            claim['desc'] = info['desc']
                            claim['proof'] = info['proof']
                            claim['state'] = 'new';
                            claim['visible'] = true
                            claim['ownerid'] = item['_id'].toString();
                            db.collection('claims', function (err, collection1) {
                                console.log(err);
                                console.log(collection1)
                                collection1.insert(claim, {safe: true}, function (err, result) {
                                    if (err) {
                                        res.send(401, {success: false, message: 'Something went wrong'});
                                    }
                                    else {
                                        res.send(200, {success: true, message: 'Claim has been created'});
                                    }

                                })
                            })

                        }



                    }
                    else {
                        res.send(401, {success: false, message: 'User not found'});
                    }

                })
            })


	}
	else
	{
		res.send(401,{ success : false, message : 'Mandatory fields info missing' });
	}
    }
else
{
	res.send(401,{ success : false, message : 'Authentication is failed' });
}
}

exports.getclaims = function(req,res){
    //var login =
    //console.log('login result is ' + login);
    if(true)
    {
        var info = req.body;
        if('user_id' in info && info['user_id'] != '')
        {
            db.collection('users',function(err,collection){
                collection.findOne({'_id': new ObjectID(info['user_id'])}, function(err, item) {
                    if(item)
                    {
                        db.collection('claims',function(err,collection1) {
                            if(err){
                                res.send(401,{ success : false, message : 'Something went wrong' });
                            }
                            else {
                                collection1.find({'ownerid': info['user_id']}).toArray(function (err, results) {
                                    res.send(200, {success: true, 'claims': results});
                                }, function (err) {
                                    // done or error
                                });
                            }
                        })
                    }
                    else
                    {
                        res.send(401,{ success : false, message : 'User not found' });
                    }

                })
            })

        }
        else if('claim_id' in info && info['claim_id'] != '')
        {
            db.collection('claims',function(err,collection){

                if(!err)
                {
                    collection.findOne({'_id': new ObjectID(info['claim_id'])}, function(err, item) {
                        if (item) {

                            res.send(200, {success: true, 'claim': item});

                        }
                        else
                        {
                            res.send(401, {success: false, 'message': 'Claim not found'});
                        }
                    })
                }
            })
        }
        else
        {
            res.send(401,{ success : false, message : 'User id or claim id is missing' });
        }
    }
    else
    {
        res.send(401,{ success : false, message : 'Authentication failed' });
    }
}


exports.passwordReset = function(req,res){

        var info = req.body;
        if('email' in info && info['email'] != '' && 'pass_token' in info && info['pass_token'] != '' && 'password' in info && info['password'] != '')
        {
                var email = info['email'];
                var pass_token = info['pass_token'];
                var password = info['password'];
                var curr_time = Math.floor(Date.now() / 1000);
                db.collection('users',function(err,collection){
                collection.findOne({'email': info['email'],'pass_verify_token' : info['pass_token']}, function(err, item) {
               if(item && 'pass_verify_timestamp' in item && (curr_time - item['pass_verify_timestamp']) <= 86400)
               {
                                delete item['pass_verify_timestamp'];
                                delete item['pass_verify_token'];
                                var passwordData = sha512(password, item['salt']);
                                item['pass'] = passwordData.passwordHash;
                                var token = jwt.sign(item, req.app.get('indorseSecret'), {
                                        expiresIn : 60*60*24*31 // expires in 31 days
                                });
                                item['token'] = token;
                                collection.update({'email' : info['email']},item,{safe:true}, function(err,result){
                                if(err){
                                                console.log(err);
                                                res.send({success :  false,message : 'Something went wrong'});
                                }
                                else
                                {

                                        res.send({success : true,message : 'Password updated succesfully'})

                                }
                                })

                        }
                        else
                        {
                                res.send(401,{ success : false, message : 'Token authorization failed for given user' });
                        }
                        })
                })
        }
        else
        {
                res.send(401,{ success : false, message : 'Email missing' });
        }
}
