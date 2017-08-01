var mongo = require('mongodb');
var config = require('config');
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
var parameters = { "apiKey": "zBNScm5pPbYZaVUL", "timeout": 5000 };	//Optional parameter: Timeout in MS 
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


var genRandomString = function(length){
    return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */
};

var sha512 = function(password, salt){
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt:salt,
        passwordHash:value
    };
};

function saltHashPassword(userpassword) {
    var salt = genRandomString(16); /** Gives us salt of length 16 */
    var passwordData = sha512(userpassword, salt);
    return passwordData;
}


exports.signup = function(req,res){

	var info = req.body;
	if('password' in info && info['password'] != '' && 'name' in info && info['name'] != '')
	{
		var email = info['email'];
		var name = info['name'];
		var password = info['password'];
		var passwordData = saltHashPassword(password);
		var salt =  passwordData.salt;
		var hashedPassword = passwordData.passwordHash;

		db.collection('users',function(err,collection){
        		info['timestamp'] = Math.floor(Date.now() / 1000);
		        collection.findOne({'email': info['email']}, function(err, item) {
        		if(item)
        		{
				res.send(404,{ success : false, message : 'User with email exists' });
			}
			else
			{
				info['pass'] =  hashedPassword;
				info['salt'] = salt;
				info['verify_token'] = randtoken.generate(16);
				delete info['password'];
				collection.insert(info, {safe:true}, function(err,result){
                		if(err){
                		}
                		else
                		{	
                                	var msg_text = "Hello here is the verify link https://indorse-staging.herokuapp.com/verify-email?email=" + email + "&token=" + info['verify_token'];
                                        var sub_text = 'Your email verification link from Indorse';
                                        var to_obj = {};
                                        to_obj[email] = name;
                                        sendinObj.send_email({"to" : to_obj,"from" : ["info@indorse.io","Indorse"],"text" : msg_text,"subject" : sub_text}, function(err, response){
                                        if(response.code != 'success')
                                        {
                                                res.send(501,{ success : false, message : 'Error sending verification email' });
                                        }
                                        else
                                        {
                                                res.send({success : true,message : 'Verification email sent succesfully'})
                                        }
                                        });
	
						
                		}
                		})
			}
			})
		})	
	}
	else
	{
		res.send(422,{ success : false, message : 'Email or password missing' });
	}
}

exports.passwordForgot = function(req,res){
        var info = req.body;
        if('email' in info && info['email'] != '')
        {
                var email = info['email'];
                db.collection('users',function(err,collection){
                        info['timestamp'] = Math.floor(Date.now() / 1000);
                        collection.findOne({'email': info['email']}, function(err, item) {
                        if(item)
                        {
				item['pass_verify_timestamp'] = Math.floor(Date.now() / 1000);
				var pass_verify_token = randtoken.generate(16);
				item['pass_verify_token'] = pass_verify_token;
				collection.update({'email' : info['email']},item,{safe:true}, function(err,result){
                                if(err){
                                                res.send(501,{success :  false,message : 'Forgot password action failed'});
                                }
                                else
                                {
					name = item['name']
					email = item['email']
					var msg_text = "Hello here is the forgot passsword link https://indorse-staging.herokuapp.com/password/reset?email=" + email + "&pass_token=" + pass_verify_token;
					var sub_text = 'Your forgot password link from Indorse';
					var to_obj = {};
					to_obj[email] = name;
    					sendinObj.send_email({"to" : to_obj,"from" : ["info@indorse.io","Indorse"],"text" : msg_text,"subject" : sub_text}, function(err, response){
					if(response.code != 'success')
					{
						res.send(501,{ success : false, message : 'Error sending forgot password email' });
					}
					else
					{
						res.send({success : true,message : 'Forgot password email sent succesfully'})
					}
    					});

                                }
                                })

                        }
                        else
                        {
				res.send(404,{ success : false, message : 'User with email does not exists' });
                        }
                        })
                })
        }
        else
        {
                res.send(422,{ success : false, message : 'Email missing' });
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
                        var user_item = Object.assign({},item);
                        delete user_item['pass'];
                        delete user_item['salt'];
                        delete user_item['tokens'];
                        var token = jwt.sign(user_item, req.app.get('indorseSecret'), {
                            expiresIn : 60*60*24*31 // expires in 31 days
                        });
                        if(!('tokens' in item))
                        {
                            item['tokens'] = [];
                        }
                        item['tokens'].push(token);
				        collection.update({'email' : info['email']},item,{safe:true}, function(err,result){
                            if(err){
                                res.send(501,{success :  false,message : 'Something went wrong'});
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
                res.send(422,{ success : false, message : 'Email missing' });
        }
}

exports.passwordChange = function(req,res){

        var info = req.body;
        if('login' in req.body && req.body.login) {
            if('email' in info && info['email'] != '' && 'old_password' in info && info['old_password'] != '' && 'new_password' in info && info['new_password'] != '') {
                email = info['email'];
                old_password = info['old_password'];
                new_password = info['new_password'];
                db.collection('users', function (err, collection) {
                    collection.findOne({'email': email}, function (err, item) {
                        if (item) {
                            //Check if the old password is correct. And then create a new hash for new password and replace new password with salt
                                    salt = item['salt'];
                                    storedpass = item['pass'];
                                    var passwordData = sha512(old_password, salt);
                                    if (passwordData.passwordHash == storedpass) {
                                        var passwordData = sha512(new_password, salt);
                                        item['pass'] = passwordData.passwordHash;
                                        collection.update({'email': email}, item, {safe: true}, function (err, result) {
                                            if (err) {
                                                res.send(501, {success: false, message: 'Something went wrong'});
                                            }
                                            else {
                                                res.send(200, {success: true, message: 'Password changed succesfully'});
                                            }
                                        })
                                    }
                                    else {
                                        res.send(401, {
                                            success: false,
                                            message: 'Email does not match with current password'
                                        });
                                    }

                        }
                        else {
                            res.send(401, {success: false, message: 'Auhentication failed'});
                        }
                    })
                })
            }
        }
        else
        {
                res.send(422,{ success : false, message : 'Email or token missing' });
        }
}

exports.verify = function(req,res){

	var info = req.body;
    if('email' in info && info['email'] != ''  && 'verify_token' in info && info['verify_token'] != '')
    {
        var email = info['email'];
		var verify_token = info['verify_token'];
		db.collection('users',function(err,collection){
		    collection.findOne({'email': email,'verify_token' : verify_token}, function(err, item) {
                        if(item)
                        {	
				delete item['verify_token'];
				item['verified'] = true;
				var user_item = Object.assign({},item);
				delete user_item['pass'];
				delete user_item['salt'];
				delete user_item['tokens'];
				var token = jwt.sign(user_item, req.app.get('indorseSecret'), {
                                        expiresIn : 60*60*24*31 // expires in 31 days
                                });
				if(!('tokens' in item))
                {
                    item['tokens'] = [];
                }
                item['tokens'].push(token);
				collection.update({'email' : info['email']},item,{safe:true}, function(err, result) {
				if (err) {
                                	    res.send(501,{ success : false, message : 'Error verifying the user' });
				} else {
					res.send(200,{ success : true, message : 'user verified succesfully', token : token});	
                                   }
                                });
			}
			else
			{
				res.send(401,{ success : false, message : 'Email and token dont match' });
			}
		})
	})
		
	}
	else
	{
		res.send(422,{ success : false, message : 'Email or token missing' });
	}

}


exports.logout = function(req,res){

    var info = req.body;
    if('login' in info && info.login)
    {
        token = info['token'];
        db.collection('users',function(err,collection){
            collection.findOne({'email': email}, function(err, item) {
                if(item) {

                    //Log the person out and return success

                    collection.update({'email': email}, { "$pull": { "tokens": token } }, {safe: true}, function (err, result) {
                        if (err) {
                            res.send(501, {success: false, message: 'Something went wrong'});
                        }
                        else {
                            res.send(200, {success: true, message: 'Logged out succesfully'});
                        }
                    })
                }
                else
                {
                    res.send(501, {success: false, message: 'Something went wrong'});
                }
		});
			})

	}
	else
	{
		res.send(401,{ success : false, message : 'Auth Failed' });
	}
}

exports.login = function(req,res){

    var info = req.body;
	if('email' in info && info['email'] != ''  && 'password' in info && info['password'] != '')
    {
        email = info['email'];
        password = info['password'];
		db.collection('users',function(err,collection){
		    collection.findOne({'email': email}, function(err, item) {
                if(item)
                {
			salt = item['salt'];
			storedpass = item['pass'];
			var passwordData = sha512(password, salt);
			if(passwordData.passwordHash == storedpass)
			{
                var user_item = Object.assign({},item);
                delete user_item['pass'];
                delete user_item['salt'];
                delete user_item['tokens'];
			    var token = jwt.sign(user_item, req.app.get('indorseSecret'), {
                                        expiresIn : 60*60*24*31 // expires in 31 days
                });
                if(!('tokens' in item))
                {
                    item['tokens'] = [];
                }
                item['tokens'].push(token);
                collection.update({'email' : email},item,{safe:true}, function(err, result) {
                    if (err) {
                        res.send(501,{ success : false, message : 'Error logging in the user' });
                    } else {
                        res.send(200,{ success : true, message : 'user logged in succesfully', token : token});
                    }
                });
			}
			else
			{
				res.send(401,{ success : false, message : 'Email and password do not match' });
			}
		}
		else
		{
			 res.send(404,{ success : false, message : 'User with email not found' });
		}
		})
		})
	}
	else
	{
		res.send(422,{ success : false, message : 'Email or password missing' });
	}
}

exports.profile = function(req,res){
        var info = req.body;
        if('login' in req.body && req.body.login)
        {       
                email = info['email'];
                db.collection('users',function(err,collection){
                collection.findOne({'email': email}, function(err, item) {
                if(item)
                {
                      if('user_id' in info && info['user_id'] != '')
                      {
                          collection.findOne({'_id': new ObjectId(info['user_id'])}, function(err, item1) {

                              if(item1)
                              {
                                  delete item1['pass']
                                  delete item1['tokens']
                                  delete item1['salt']
                                  res.send(200, {success: true, profile: item1});
                              }
                              else
                              {
                                  res.send(404,{ success : false, message : 'user not found'});
                              }

                          })
                      }
                      else {
                          delete item['pass']
                          delete item['tokens']
                          delete item['salt']
                          res.send(200, {success: true, profile: item});
                      }
                }
                        else
                        {       
                                res.send(401,{ success : false, message : 'Auhentication failed' });
                        }
                })      
                })
        }
        else
        {       
                res.send(401,{ success : false, message : 'Auhentication failed' });
        }
}

exports.getUsers = function(req,res){
        var info = req.body;
    var pageNo = req.params.pageNo;
    if(!pageNo)pageNo = 1;
    if('login' in req.body && req.body.login)
        {
                email = info['email'];
                db.collection('users',function(err,collection){
                collection.findOne({'email': email,'role' : 'admin'}, function(err, item) {
                if(item)
                {

                        
                    var users = [];
                    //Log the person out and return success
                    var skip = (pageNo - 1) * 10;
                    var limit = 10;
                    collection.find({'email' : {'$exists' : true}},{'salt' : 0,'pass' : 0,'tokens' : 0}).skip(skip).limit(limit).toArray(function(err, results) {
                    res.send(200,{ success : true, 'users' : results });
                    }, function(err) {
                    // done or error
                    });



                }
                else
                {
                    res.send(403,{ success : false, message : 'Auhentication failed' });
                }
                })
                })
        }
        else
        {
                res.send(401,{ success : false, message : 'Auhentication failed' });
        }
}

exports.approve = function(req,res){
        var info = req.body;
        if('login' in req.body && req.body.login)
        {
                email = info['email'];
                db.collection('users',function(err,collection){
                        collection.findOne({'email': email,'role' : 'admin'}, function(err, item) {
                        if(item)
                        {
                                approve_user_id = info['approve_user_id'];
                                collection.findOne({'_id': new ObjectID(approve_user_id)}, function(err, item) {
                                if(item)
                                {
                                    if('verified' in item && item['verified'])
                                    {
                                                item['approved'] = true
                                                collection.update({'_id' : ObjectID(approve_user_id)},item,{safe:true}, function(err, result) {
                                                if(err)
                                                {
                                                        res.send(501,{ success : false, message : 'Something went wrong'});
                                                }
                                                else
                                                {
                                                        res.send(200,{ success : true, message : 'User approved succesfully'});
                                                }
                                                })
                                    }
                                    else
                                    {
                                        res.send(422,{ success : false, message : 'User has not verified their email address'});
                                    }
                                }
                                else
                                {
                                    res.send(404,{ success : false, message : 'Unable to find user'});
                                }
                            })

                        }
                        else
                        {
                                res.send(403,{ success : false, message : 'Auhentication failed' });
                        }
                })
                })
        }
        else
        {
                res.send(401,{ success : false, message : 'Auhentication failed' });
        }
}

exports.disapprove = function(req,res){
        var info = req.body;
        if('login' in req.body && req.body.login)
        {
                email = info['email'];
                db.collection('users',function(err,collection){
                        collection.findOne({'email': email,'role' : 'admin'}, function(err, item) {
                        if(item)
                        {

                        //Log the person out and return success
                                        approve_user_id = info['approve_user_id'];
                                        collection.findOne({'_id': ObjectID(approve_user_id)}, function(err, item) {
                                        if(item)
                                        {
                                            if('verified' in item && item['verified'])
                                                        {
                                                        item['approved'] = false
                                                        collection.update({'_id' : ObjectID(approve_user_id)},item,{safe:true}, function(err, result) {
                                                        if(err)
                                                        {
                                                                res.send(501,{ success : false, message : 'Something went wrong'});
                                                        }
                                                        else
                                                        {
                                                                res.send(200,{ success : true, message : 'User disapproved succesfully'});
                                                        }
                                                        })
                                                        }
                                            else
                                            {
                                                res.send(422,{ success : false, message : 'User has not verified their email address'});
                                            }
                                         }
                                        else
                                        {
                                                res.send(404,{ success : false, message : 'Unable to find user'});
                                        }
                                })

                        }
                        else
                        {
                                res.send(403,{ success : false, message : 'Auhentication failed' });
                        }       
                })      
                })      
        }       
        else    
        {
                res.send(401,{ success : false, message : 'Email or token missing' });
        }

}
