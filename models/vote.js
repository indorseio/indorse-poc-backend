var mongo = require('mongodb');
var config = require('config');
var auth = require('./auth.js');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
ObjectID = mongo.ObjectID;
var jwt    = require('jsonwebtoken');
var server = new Server(config.get('DBHost'),config.get('DBPort'), {auto_reconnect: true});
var db = new Db(config.get('DBName'), server);
db.open(function(err, db) {
    if(!err) {
        console.log("Connected to database");
    }
    else{
        console.log("database connection error");
    }
});

function find_claim(claim_id)
{
        db.collection('claims', function (err, claims_collection) {
            claims_collection.findOne({'_id' : new ObjectID(claim_id)},function (err, claim) {
                if(!err)
                    return claim;
                else
                    return null;
            })
        })
}

function find_votinground(votinground_id)
{
    db.collection('votingrounds', function (err, votingrounds_collection) {
        votingrounds_collection.findOne({'_id' : new ObjectID(votinground_id)},function (err, votinground) {
            if(!err)
                return votinground;
            else
                return null;
        })
    })
}

exports.getVotes = function(req,res){
    if('login' in req.body && req.body.login) {
        var info = req.body;
	var results_final = [];
        db.collection('users', function (err, collection) {
            collection.findOne({'email': info['email']}, function (err, item) {
                if(item)
                {
                    db.collection('votes', function (err, collection1) {
                        collection1.find({'voter_id': item['_id'].toString()}).toArray(function(err, votes) {
                            if(!err)
                            {
                                var claim_ids = [];
                                var voting_round_ids = [];
                                var counter = 0;
                                var limit = votes.length;
                                votes.forEach(function(vote) {
                                    counter++;
                                    result_item = {};
                                    result_item.vote = vote;
                                    claim_ids.push(new ObjectID(vote['claim_id']));
                                    voting_round_ids.push(new ObjectID(vote['voting_round_id']));
                                    results_final.push(result_item);
                                })
                                db.collection('claims', function (err, claims_collection) {
                                    claims_collection.find({'_id': {'$in' : claim_ids}}).toArray(function(err, claims) {

                                    claims.forEach(function(claim){
                                        for(var i=0,len = results_final.length;i< len;i++){
                                            
                                            if(claim['_id'].toString() == results_final[i].vote.claim_id)
                                            {
                                                results_final[i].claim = claim;
                                            }
                                            
                                        }

                                    })

				db.collection('votingrounds', function (err, votingrounds_collection) {
                                    votingrounds_collection.find({'_id': {'$in' : voting_round_ids}}).toArray(function(err, votingrounds) {

                                    votingrounds.forEach(function(votinground){
                                        for(var i=0,len = results_final.length;i< len;i++){

                                            if(votinground['_id'].toString() == results_final[i].vote.voting_round_id)
                                            {
                                                results_final[i].votinground = votinground;
                                            }

                                        }

                                    })


				console.log(results_final);
				res.send(200, {success: true, results: results_final});
                                    })
                                })
			
				})
				})
					
		
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
                    res.send(404, {success: false, message: 'Current user not found'});
                }
            })
        })
    }
    else
    {
        res.send(401,{ success : false, message : 'Authentication failed' });
    }
}
exports.getVote = function(req,res){

    if('login' in req.body && req.body.login) {

        var vote_id = req.params.vote_id;
        var info = req.body;
        db.collection('votes', function (err, collection) {

            collection.findOne({'_id': new ObjectID(vote_id)}, function (err, item) {
                if(item)
                {
                        db.collection('claims', function (err, collection1) {

                        collection1.findOne({'_id': new ObjectID(item['claim_id'])},function (err, item1) {

                            if(!err)
                            {	

				var voting_rounds = [];
				db.collection('votingrounds', function (err, votinground_collection) {

                        votinground_collection.find({'claim_id': item['claim_id']}).toArray(function (err,votingrounds) {
					

					if(!err)
					{
						res.send(200,{ success : true,vote : item,claim : item1,voting_rounds : votingrounds });
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
                                res.send(501, {success: false, message: 'Something went wrong'});
                            }


                        })

                    })
                }
                else
                {
                    res.send(404, {success: false, message: 'Vote not found'});
                }

            })

        })

    }
    else
    {
        res.send(401,{ success : false, message : 'Authentication failed' });
    }


}

exports.register = function(req,res){
    if('login' in req.body && req.body.login) {
        var claim_id = req.params.claim_id;
        var info = req.body;
        db.collection('users', function (err, users_collection) {
            users_collection.findOne({'email': info['email']}, function (err, user) {
                if (user) {
                    db.collection('votingrounds', function (err, votinground_collection) {

                        votinground_collection.findOne({'claim_id': claim_id, 'status': 'in_progress'}, function (err, voting_round) {
                            if (voting_round) {
                                if('end_registration' in  voting_round && (voting_round['end_registration'] - Math.floor(Date.now() / 1000) >= 0)) {
                                    db.collection('votes', function (err, votes_collection) {
                                        votes_collection.findOne({
                                            'voter_id': user['_id'].toString(),
                                            'voting_round_id': voting_round['_id'].toString()
                                        }, function (err, vote) {

                                            if (!err) {

                                                vote['registered'] = 'true';
                                                vote['registered_at'] = Math.floor(Date.now() / 1000);
                                                console.log(vote);
                                                votes_collection.update({'_id': vote['_id']}, vote, {safe: true}, function (err, result) {

                                                    if (!err) {
                                                        res.send(200, {
                                                            success: true,
                                                            message: 'Registered for claim succesfully'
                                                        });
                                                    }
                                                    else {
                                                        res.send(501, {
                                                            success: false,
                                                            message: 'Something went wrong'
                                                        });
                                                    }

                                                })

                                            }
                                            else {
                                                res.send(501, {
                                                    success: false,
                                                    message: 'Could not find the vote for this claim'
                                                });
                                            }
                                        })
                                    })
                                }
                                else
                                {
                                    res.send(404, {success: false, message: 'Vote registration period has ended'});
                                }
                            }
                            else {
                                res.send(404, {success: false, message: 'Active Voting round not found'});
                            }
                        })
                    })
                }
                else {
                    res.send(404, {success: false, message: 'User not found'});
                }
            })
        })
    }
    else
    {
        res.send(401,{ success : false, message : 'Authentication failed' });
    }


}

exports.endorse = function(req,res){
    if('login' in req.body && req.body.login) {
        var claim_id = req.params.claim_id;
        var info = req.body;
        db.collection('users', function (err, users_collection) {
            users_collection.findOne({'email': info['email']}, function (err, user) {
                if (user) {
                    db.collection('votingrounds', function (err, votinground_collection) {
                        votinground_collection.findOne({'claim_id': claim_id, 'status': 'in_progress'}, function (err, voting_round) {
                            if (voting_round) {
                                if('end_voting' in  voting_round && (voting_round['end_voting'] - Math.floor(Date.now() / 1000) >= 0)) {
                                db.collection('votes', function (err, votes_collection) {
                                    votes_collection.findOne({
                                        'voter_id': user['_id'].toString(),
                                        'voting_round_id': voting_round['_id'].toString()
                                    }, function (err, vote) {
                                        if (!err) {

                                            if (!('endorsed' in vote))
                                            {
                                                vote['endorsed'] = 'true';
                                            vote['voted_at'] = Math.floor(Date.now() / 1000);
                                            votes_collection.update({'_id': vote['_id']}, vote, {safe: true}, function (err, result) {
                                                if (!err) {
                                                    db.collection('claims', function (err, claims_collection) {

                                                        claims_collection.update({'_id': new ObjectID(claim_id)}, {$inc: {'endorse_count': 1}}, {safe: true}, function (err, result) {

                                                            if (!err) {
                                                                res.send(200, {
                                                                    success: true,
                                                                    message: 'Endorsed claim succesfully'
                                                                });
                                                            }
                                                            else {
                                                                res.send(501, {
                                                                    success: false,
                                                                    message: 'Claim endorsed. Endorse count incremenet error'
                                                                });
                                                            }

                                                        })

                                                    })
                                                }
                                                else {
                                                    res.send(501, {success: false, message: 'Something went wrong'});
                                                }
                                            })
                                        }
                                        else
                                            {
                                                res.send(501, {success: false, message: 'User has already voted for this claim'});
                                            }
                                        }
                                        else {
                                            res.send(501, {
                                                success: false,
                                                message: 'Could not find the vote for this claim'
                                            });
                                        }
                                    })
                                })
                            }
                            else
                                {
                                    res.send(404, {success: false, message: 'Vote period has ended'});
                                }
                            }
                            else {
                                res.send(404, {success: false, message: 'Active Voting round not found'});
                            }
                        })
                    })
                }
                else {
                    res.send(404, {success: false, message: 'User not found'});
                }
            })
        })
    }
    else
    {
        res.send(401,{ success : false, message : 'Authentication failed' });
    }
}

exports.flag = function(req,res){
    if('login' in req.body && req.body.login) {
        var claim_id = req.params.claim_id;
        var info = req.body;
        db.collection('users', function (err, users_collection) {
            users_collection.findOne({'email': info['email']}, function (err, user) {
                if (user) {
                    db.collection('votingrounds', function (err, votinground_collection) {
                        votinground_collection.findOne({'claim_id': claim_id, 'status': 'in_progress'}, function (err, voting_round) {
                            if (voting_round) {
                                if('end_voting' in  voting_round && (voting_round['end_voting'] - Math.floor(Date.now() / 1000) >= 0)) {
                                    db.collection('votes', function (err, votes_collection) {
                                        votes_collection.findOne({
                                            'voter_id': user['_id'].toString(),
                                            'voting_round_id': voting_round['_id'].toString()
                                        }, function (err, vote) {
                                            if (!err) {
                                                if (!('endorsed' in vote)) {
                                                    vote['endorsed'] = 'false';
                                                    vote['voted_at'] = Math.floor(Date.now() / 1000);
                                                    votes_collection.update({'_id': vote['_id']}, vote, {safe: true}, function (err, result) {
                                                        if (!err) {
                                                            db.collection('claims', function (err, claims_collection) {

                                                                claims_collection.update({'_id': new ObjectID(claim_id)}, {$inc: {'flag_count': 1}}, {safe: true}, function (err, result) {

                                                                    if (!err) {
                                                                        res.send(200, {
                                                                            success: true,
                                                                            message: 'Flagged claim succesfully'
                                                                        });
                                                                    }
                                                                    else {
                                                                        res.send(501, {
                                                                            success: false,
                                                                            message: 'Claim flagged. Flag count incremenet error'
                                                                        });
                                                                    }
                                                                })
                                                            })
                                                        }
                                                        else {
                                                            res.send(501, {
                                                                success: false,
                                                                message: 'Something went wrong'
                                                            });
                                                        }
                                                    })
                                                }
                                                else
                                                {
                                                    res.send(501, {success: false, message: 'User has already voted for this claim'});
                                                }
                                            }
                                            else {
                                                res.send(501, {
                                                    success: false,
                                                    message: 'Could not find the vote for this claim'
                                                });
                                            }
                                        })
                                    })
                                }
                                else
                                {
                                    res.send(404, {success: false, message: 'Vote period has ended'});
                                }
                            }
                            else {
                                res.send(404, {success: false, message: 'Active Voting round not found'});
                            }
                        })
                    })
                }
                else {
                    res.send(404, {success: false, message: 'User not found'});
                }
            })
        })
    }
    else
    {
        res.send(401,{ success : false, message : 'Authentication failed' });
    }
}
