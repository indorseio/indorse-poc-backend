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


exports.claim = function(req,res){

    if('login' in req.body && req.body.login)
    {
	var info = req.body;
	if('title' in info && info['title'] != '' && 'desc' in info && info['desc'] != '' && 'proof' in info && info['proof'] != '')
	{

            db.collection('users', function (err, collection) {
                collection.findOne({'email': info['email']}, function (err, item) {

                    if (item) {


                        if('claim_id' in info && info['claim_id'] !=  '')
                        {
                            res.send(401, {success: false, message: 'Claim id should not be sent'});
                            /*db.collection('claims', function (err, collection1) {

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

                            })*/
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
	    res.send(401,{ success : false, message : 'Authentication failed' });
    }
}

exports.updateClaims = function(req,res){

    if('login' in req.body && req.body.login)
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

                                collection1.findOne({'_id': new ObjectID(info['claim_id'])}, function (err, currclaim) {

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
                                        collection1.update({'_id' : new ObjectID(info['claim_id'])},currclaim,{safe:true}, function(err, result) {

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
                            res.send(401, {success: false, message: 'Claim id is not found'});
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
            res.send(401,{ success : false, message : 'Claim info is missing' });
        }
    }
    else
    {
        res.send(401,{ success : false, message : 'Authentication failed' });
    }
}

exports.getclaims = function(req,res){

    if('login' in req.body && req.body.login)
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

