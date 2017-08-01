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

function create_votes(users,voting_round_id,claim_id)
{
    users.forEach(function(user) {
        vote = {};
        vote['claim_id'] = claim_id;
        vote['voter_id'] = user['_id'].toString();
        vote['voting_round_id'] = voting_round_id;
        db.collection('votes', function (err, votes_collection) {
            votes_collection.insert(vote, {safe: true}, function (err, result) {
            })
        })
    });
}

function create_votinground(claim_id)
{
    console.log('calling voting round creationg function for claim id ' + claim_id);
    db.collection('votingrounds', function (err, votinground_collection) {
        if(!err) {
            voting_round = {};
            voting_round['claim_id'] = claim_id;
            voting_round['end_registration'] = Math.floor(Date.now() / 1000) + 300;
            voting_round['end_voting'] = Math.floor(Date.now() / 1000) + 300;
            voting_round['status'] = 'in_progress';
            console.log(voting_round)
            votinground_collection.insert(voting_round, {safe: true}, function (err, result) {
                if (!err) {
                    voting_round_id = result['ops'][0]['_id'].toString();
                    console.log(voting_round_id);
                    db.collection('users', function (err, users_collection) {
                        users_collection.find({'email': {'$exists': true}}).toArray(function (err, results) {

                            create_votes(results, voting_round_id,claim_id)

                        })
                    })
                }

            })
        }
        else
        {
            console.log(err)
        }
    })
}

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
                            res.send(501, {success: false, message: 'Claim id should not be sent'});
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
                                        res.send(501, {success: false, message: 'Something went wrong'});
                                    }
                                    else {
                                        if('result' in result && 'ok' in result['result'] && result['result']['ok'] == 1)
                                        {
                                            create_votinground(result['ops'][0]['_id'].toString());
                                            res.send(200, {success: true, claim:result['ops'], message: 'Claim has been created'});
                                        }
                                        else
                                        {
                                            res.send(501, {success: false, message: 'Something went wrong'});
                                        }

                                    }

                                })
                            })

                        }



                    }
                    else {
                        res.send(404, {success: false, message: 'User not found'});
                    }

                })
            })


	}
	else
	{
		res.send(422,{ success : false, message : 'Mandatory fields info missing' });
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
                                        if('archive' in info && info['archive'] != '')
                                        {
                                            currclaim['archive'] = info['archive'];
                                        }
                                        collection1.update({'_id' : new ObjectID(info['claim_id'])},currclaim,{safe:true}, function(err, result) {

                                            if(err)
                                            {
                                                res.send(501, {success: false, message: 'Update claim failed'});
                                            }
                                            else
                                            {
                                                res.send(200, {success: true, message: 'Claim has been updated'});
                                            }

                                        })
                                    }
                                    else
                                    {
                                        res.send(404, {success: false, message: 'Claim not found'});
                                    }
                                })

                            })
                        }
                        else {
                            res.send(422, {success: false, message: 'Claim id is not found'});
                        }



                    }
                    else {
                        res.send(404, {success: false, message: 'User not found'});
                    }

                })
            })


        }
        else
        {
            res.send(422,{ success : false, message : 'Claim info is missing' });
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
                                res.send(501,{ success : false, message : 'Something went wrong' });
                            }
                            else {
                                collection1.find({'ownerid': info['user_id']}).toArray(function (err, results) {
                                   	
					var claim_ids = [];
					results.forEach(function(claim){
						claim_ids.push(claim['_id'].toString());
					})

				db.collection('votingrounds', function (err, votinground_collection) {
                        votinground_collection.find({'claim_id': {'$in' : claim_ids}}).toArray(function (err,votingrounds) {
					var results_final = [];
						votingrounds.forEach(function(votinground){
						
					for(var i=0,len = results.length;i< len;i++){
							if(votinground['claim_id'] == results[i]._id.toString())
							{		
							var result_item = {};
							result_item.votinground = votinground;
							result_item.claim = results[i];
							results_final.push(result_item)
							}
						}
					})
				res.send(200, {success: true, 'claims': results_final});
				})
				})
				})
                                }
                            })
                    }
                    else
                    {
                        res.send(404,{ success : false, message : 'User not found' });
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
			db.collection('votingrounds', function (err, votinground_collection) {
                        votinground_collection.find({'claim_id': info['claim_id']}).toArray(function (err,votingrounds) {
                                        if(!err)
                                        {
                                                res.send(200,{ success : true,claim : item,votingrounds : votingrounds });
                                        }
                                        else
                                        {
                                                res.send(501, {success: false, message: 'Something went wrong'});
                                        }
                                })
                            })
                        }
                        else
                        {
                            res.send(404, {success: false, 'message': 'Claim not found'});
                        }
                    })
                }
            })
        }
        else
        {
            res.send(422,{ success : false, message : 'User id or claim id is missing' });
        }
    }
    else
    {
        res.send(401,{ success : false, message : 'Authentication failed' });
    }
}

