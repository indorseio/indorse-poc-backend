var mongo = require('mongodb');
var config = require('config');
var auth = require('./auth.js');
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

exports.getVotes = function(req,res){
    if('login' in req.body && req.body.login) {
        var info = req.body;
        db.collection('users', function (err, collection) {
            collection.findOne({'email': info['email']}, function (err, item) {
                if(item)
                {
                    console.log(item['_id'])
                    db.collection('votes', function (err, collection1) {
                        collection1.find({'voter_id': item['_id'].toString()}).toArray(function(err, results) {
                            if(!err)
                            {
                                res.send(200,{ success : true, 'votes' : results });
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
                                res.send(200,{ success : true,vote : item,claim : item1 });
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

                                if('end_registration' in  voting_round && (voting_round['end_registration'] - Math.floor(Date.now() / 1000) >= -500)) {
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
                                if('end_voting' in  voting_round && (voting_round['end_voting'] - Math.floor(Date.now() / 1000) >= -5000)) {
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
                                if('end_voting' in  voting_round && (voting_round['end_voting'] - Math.floor(Date.now() / 1000) >= -5000)) {
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