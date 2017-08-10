var mongo = require('mongodb');
var config = require('config');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
    ObjectID = mongo.ObjectID;
var jwt    = require('jsonwebtoken');
var server = new Server(config.get('DBHost'),config.get('DBPort'), {auto_reconnect: true});
var passwordHash = require('password-hash');
var randtoken = require('rand-token');
var crypto = require('crypto');
var sendinblue = require('sendinblue-api'); 
var parameters = config.get('sendinblue_params')//Optional parameter: Timeout in MS 
var sendinObj = new sendinblue(parameters);
var mailgun_params = config.get('mailgun_params');
var mailgun = require('mailgun-js')(mailgun_params);
// var db = new Db(config.get('DBName'), server);

// db.open(function(err, db) {
//     if(!err) {
//         console.log("Connected to database");
// }
// else{
// 	console.log("database connection error");
// }
// });

// Now set up a Mongo Client ====
const MongoClient = mongo.MongoClient
var db;

MongoClient.connect(config.get('poc_mongo'), function(err, database) {
    if (err) return console.log(err);
    db = database;
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

				res.send(404,{ success : false, message : config.get('Msg1') });
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
                                	    var msg_text = "Dear " + name + ", <br><br> Thank you for signing-up at Indorse.io.  Welcome to the Indorse community.  For the purposes of verification, we request you to click on the following link to verify your email address: <br><br> <a href='" + config.get('app_url')   + "verify-email?email=" + email + "&token=" + info['verify_token'] + "'>Verification link</a> <br><br> If you have not signed-up on Indorse.io, we request you to kindly ignore this email.  We apologise for the inconvenience this may have caused you. <br><br> Thank you and regards <br> Team Indorse <br><br> Please let us know if you have any problems or questions at: <br> www.indorse.io";
                                        var sub_text = 'Your email verification link from Indorse';
                                        var to_obj = {};
                                        to_obj[email] = name;
                                        var data = {
                                          from: 'Indorse <info@indorse.io>',
                                          to: email,
                                          subject: sub_text,
                                          html: msg_text
                                        };
                                        mailgun.messages().send(data, function (error, response) {
                                        //sendinObj.send_email({"to" : to_obj,"from" : ["info@indorse.io","Indorse"],"text" : msg_text,"subject" : sub_text}, function(err, response){
                                        res.send({success : true,message : config.get('Msg3')})
                                        /*if(response.code != 'success')
                                        {
                                                res.send(501,{ success : false, message : config.get('Msg2') });
                                        }
                                        else
                                        {
                                                res.send({success : true,message : config.get('Msg3')})
                                        }*/
                                        });
	
						
                		}
                		})
			}
			})
		})	
	}
	else
	{
		res.send(422,{ success : false, message : config.get('Msg4') });
	}
}

exports.resendVerification = function(req,res){

    var info = req.body;
    if('email' in info && info['email'] != '')
    {
        var email = info['email'];
                    db.collection('users',function(err,collection){
                            info['timestamp'] = Math.floor(Date.now() / 1000);
                            collection.findOne({'email': info['email']}, function(err, item) {
                            if(item)
                            {
                                    if(!('verified' in item) || !item['verified'])
                                    {
                                        if(!('verify_token' in item))
                                        {
                                            //insert if not available. But logically verify token should be present since user is created but verification is not done
                                        }
                                        var msg_text = "Dear " + item['name'] + ", <br><br> Thank you for signing-up at Indorse.io.  Welcome to the Indorse community.  For the purposes of verification, we request you to click on the following link to verify your email address: <br><br> <a href='" + config.get('app_url')   + "verify-email?email=" + item['email'] + "&token=" + item['verify_token'] + "'>Verification link</a> <br><br> If you have not signed-up on Indorse.io, we request you to kindly ignore this email.  We apologise for the inconvenience this may have caused you. <br><br> Thank you and regards <br> Team Indorse <br><br> Please let us know if you have any problems or questions at: <br> www.indorse.io";
                                        var sub_text = 'Your email verification link from Indorse';
                                        var to_obj = {};
                                        to_obj[item['email']] = item['name'];
                                        //sendinObj.send_email({"to" : to_obj,"from" : ["info@indorse.io","Indorse"],"text" : msg_text,"subject" : sub_text}, function(err, response){
                                        var data = {
                                          from: 'Indorse <info@app.indorse.io>',
                                          to: item['email'],
                                          subject: sub_text,
                                          html: msg_text
                                        };
                                        mailgun.messages().send(data, function (error, response) {
                                        res.send({success : true,message : config.get('Msg3')})
                                        /*if(response.code != 'success')
                                        {
                                                res.send(501,{ success : false, message : config.get('Msg2') });
                                        }
                                        else
                                        {
                                                res.send({success : true,message : config.get('Msg3')})
                                        }*/
                                        });
                                    }
                                    else
                                    {
                                        res.send(501,{ success : false, message : config.get('Msg58') });
                                    }
                            }
                            else
                            {
                                res.send(501,{ success : false, message : config.get('Msg26') });
                            }
                        })
                    })
    }
    else
    {
        res.send(501,{ success : false, message : config.get('Msg9') });
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
                                                res.send(501,{success :  false,message : config.get('Msg5')});
                                }
                                else
                                {
					name = item['name']
					email = item['email']
					//var msg_text = "Hello here is the forgot passsword link https://indorse-staging.herokuapp.com/password/reset?email=" + email + "&pass_token=" + pass_verify_token;
					var msg_text = "Dear " + name + ", <br><br> We have received a request to reset your password.  If this request was not made by you, we suggest you ignore this email.  However, if you have made this request, we will require you to visit the following link to reset your password: <br><br> <a href='" + config.get('app_url')  + "password/reset?email=" + email + "&pass_token=" + pass_verify_token + "'>Password reset link</a> <br><br> Thank you and regards <br> Team Indorse <br><br> Please let us know if you have any problems or questions at: <br> www.indorse.io";
                    var sub_text = 'Your forgot password link from Indorse';
					var to_obj = {};
					to_obj[email] = name;
                    var data = {
                            from: 'Indorse <info@app.indorse.io>',
                            to: item['email'],
                            subject: sub_text,
                            html: msg_text
                    };
                    mailgun.messages().send(data, function (error, response) {
    				//sendinObj.send_email({"to" : to_obj,"from" : ["info@indorse.io","Indorse"],"text" : msg_text,"subject" : sub_text}, function(err, response){
					res.send({success : true,message : config.get('Msg7')})
                    /*if(response.code != 'success')
					{
						res.send(501,{ success : false, message : config.get('Msg6') });
					}
					else
					{
						res.send({success : true,message : config.get('Msg7')})
					}*/
    					});

                                }
                                })

                        }
                        else
                        {
				res.send(404,{ success : false, message : config.get('Msg8') });
                        }
                        })
                })
        }
        else
        {
                res.send(422,{ success : false, message : config.get('Msg9') });
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
                        var token = jwt.sign(user_item,config.get('jwtsecret'), {
                            expiresIn : 60*60*24*31 // expires in 31 days
                        });
                        if(!('tokens' in item))
                        {
                            item['tokens'] = [];
                        }
                        item['tokens'].push(token);
				        collection.update({'email' : info['email']},item,{safe:true}, function(err,result){
                            if(err){
                                res.send(501,{success :  false,message : config.get('Msg10')});
                            }
                            else
                            {
                                                
					            res.send({success : true,message : config.get('Msg11')})
                                
                            }
                        })
                        
                    }
                    else
                    {
                        res.send(401,{ success : false, message : config.get('Msg12') });
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
                                                res.send(501, {success: false, message: config.get('Msg10')});
                                            }
                                            else {
                                                res.send(200, {success: true, message: config.get('Msg13')});
                                            }
                                        })
                                    }
                                    else {
                                        res.send(401, {
                                            success: false,
                                            message: config.get('Msg14')
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
                res.send(422,{ success : false, message : config.get('Msg16') });
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
				delete  ['tokens'];
				//var token = jwt.sign(user_item,config.get('jwtsecret'), {
                //                       expiresIn : 60*60*24*31 // expires in 31 days
                //                });
				if(!('tokens' in item))
                {
                    item['tokens'] = [];
                }
                //item['tokens'].push(token);
				collection.update({'email' : info['email']},item,{safe:true}, function(err, result) {
				if (err) {
                                	    res.send(501,{ success : false, message : config.get('Msg17') });
				} else {



                        name = item['name']
                    email = item['email']
                    //var msg_text = "Hello here is the forgot passsword link https://indorse-staging.herokuapp.com/password/reset?email=" + email + "&pass_token=" + pass_verify_token;
                    var msg_text = "Dear " + name + ", <br><br> Thank you for confirming your email address. As next steps, our team will quickly verify your registration request and will attempt to approve your login details at the earliest.  We will send you an email as soon as your login details are approved: <br><br> We look forward to your participation onto our platform.<br><br> Thank you and regards <br> Team Indorse <br><br> Please let us know if you have any problems or questions at: <br> www.indorse.io";
                    var sub_text = 'Your email verified';
                    var to_obj = {};
                    to_obj[email] = name;
                    var data = {
                            from: 'Indorse <info@app.indorse.io>',
                            to: item['email'],
                            subject: sub_text,
                            html: msg_text
                    };
                    mailgun.messages().send(data, function (error, response) {

					res.send(200,{ success : true, message : config.get('Msg18')});	
                                   
                    });

                                   }
                                });
			}
			else
			{
				res.send(401,{ success : false, message : config.get('Msg19') });
			}
		})
	})
		
	}
	else
	{
		res.send(422,{ success : false, message : config.get('Msg20') });
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
                            res.send(501, {success: false, message: config.get('Msg10')});
                        }
                        else {
                            res.send(200, {success: true, message: config.get('Msg21')});
                        }
                    })
                }
                else
                {
                    res.send(501, {success: false, message: config.get('Msg10')});
                }
		});
			})

	}
	else
	{
		res.send(401,{ success : false, message : config.get('Msg22') });
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
            if('approved' in item && item['approved'])
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
			    var token = jwt.sign(user_item,config.get('jwtsecret'), {
                                        expiresIn : 60*60*24*31 // expires in 31 days
                });
                if(!('tokens' in item))
                {
                    item['tokens'] = [];
                }
                item['tokens'].push(token);
                collection.update({'email' : email},item,{safe:true}, function(err, result) {
                    if (err) {
                        res.send(501,{ success : false, message : config.get('Msg22')});
                    } else {
                        res.send(200,{ success : true, message : config.get('Msg23'), token : token});
                    }
                });
			}
			else
			{
				res.send(401,{ success : false, message : config.get('Msg24') });
			}
        }
        else
        {
            res.send(404,{ success : false, message : config.get('Msg25') });
        }
		}
		else
		{
			 res.send(404,{ success : false, message : config.get('Msg26') });
		}
		})
		})
	}
	else
	{
		res.send(422,{ success : false, message : config.get('Msg27') });
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
                                res.send(401,{ success : false, message : config.get('Msg28') });
                        }
                })      
                })
        }
        else
        {       
                res.send(401,{ success : false, message : config.get('Msg28') });
        }
}

exports.getUsers = function(req,res){
        var info = req.body;
    var pageNo = req.params.pageNo;
    var perPage = req.params.perPage;
    if(!pageNo)pageNo = 1;
    if(!perPage)perPage = 10;
    if('login' in req.body && req.body.login)
        {
                email = info['email'];
                db.collection('users',function(err,collection){
                collection.findOne({'email': email,'role' : 'admin'}, function(err, item) {
                if(item)
                {

                        
                    var users = [];
                    //Log the person out and return success
                    var skip = (parseInt(pageNo) - 1) * parseInt(perPage);
                    var limit = parseInt(perPage);
                    collection.find({'email' : {'$exists' : true}},{'salt' : 0,'pass' : 0,'tokens' : 0}).skip(skip).limit(limit).toArray(function(err, results) {
                    res.send(200,{ success : true, 'users' : results });
                    }, function(err) {
                    // done or error
                    });



                }
                else
                {
                    res.send(403,{ success : false, message : config.get('Msg28') });
                }
                })
                })
        }
        else
        {
                res.send(401,{ success : false, message : config.get('Msg28') });
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
                                                        res.send(501,{ success : false, message : config.get('Msg10')});
                                                }
                                                else
                                                {
                                                        name = item['name']
                                                        email = item['email']
                                                        //var msg_text = "Hello here is the forgot passsword link https://indorse-staging.herokuapp.com/password/reset?email=" + email + "&pass_token=" + pass_verify_token;
                                                        var msg_text = "Dear " + name + ", <br><br> Our team has reviewed and approved your login details. <br><br>You may now visit our website: Indorse.io and login with your email address and password that you set, while creating your account at Indose.io: <br><br> The Indorse Community looks forward to your positive participation.<br><br> Thank you and regards <br> Team Indorse <br><br> Please let us know if you have any problems or questions at: <br> www.indorse.io";
                                                        var sub_text = 'Your account has been approved';
                                                        var to_obj = {};
                                                        to_obj[email] = name;
                                                        var data = {
                                                                from: 'Indorse <info@app.indorse.io>',
                                                                to: item['email'],
                                                                subject: sub_text,
                                                                html: msg_text
                                                        };
                                                        mailgun.messages().send(data, function (error, response) {
                                                        res.send(200,{ success : true, message : config.get('Msg29')});
                                                    });
                                                }
                                                })
                                    }
                                    else
                                    {
                                        res.send(422,{ success : false, message : config.get('Msg30')});
                                    }
                                }
                                else
                                {
                                    res.send(404,{ success : false, message : config.get('Msg31')});
                                }
                            })

                        }
                        else
                        {
                                res.send(403,{ success : false, message : config.get('Msg28') });
                        }
                })
                })
        }
        else
        {
                res.send(401,{ success : false, message : config.get('Msg28') });
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
                                                                res.send(501,{ success : false, message : config.get('Msg10')});
                                                        }
                                                        else
                                                        {
                                                                res.send(200,{ success : true, message : config.get('Msg32')});
                                                        }
                                                        })
                                                        }
                                            else
                                            {
                                                res.send(422,{ success : false, message : config.get('Msg30')});
                                            }
                                         }
                                        else
                                        {
                                                res.send(404,{ success : false, message : config.get('Msg31')});
                                        }
                                })

                        }
                        else
                        {
                                res.send(403,{ success : false, message : config.get('Msg28') });
                        }       
                })      
                })      
        }       
        else    
        {
                res.send(401,{ success : false, message : config.get('Msg33') });
        }

}
