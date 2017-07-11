var mongo = require('mongodb');
var config = require('config');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
var jwt    = require('jsonwebtoken');
var server = new Server('localhost', 27017, {auto_reconnect: true});
var passwordHash = require('password-hash');
var randtoken = require('rand-token');


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


exports.signup = function(req,res){

	var info = req.body;
	if('email' in info && info['email'] != ''  && 'password' in info && info['password'] != '')	
	{
		var email = info['email'];
		var password = info['password'];
		var hashedPassword = passwordHash.generate(password);
		console.log('email is' + email + ' password is ' + password + ' hash is ' + hashedPassword); 
		
		db.collection('users',function(err,collection){
        		info['timestamp'] = Math.floor(Date.now() / 1000);
		        collection.findOne({'email': info['email']}, function(err, item) {
        		if(item)
        		{
				
				res.send(401,{ success : false, message : 'User with email exists' });

			}
			else
			{
				info['pass'] =  hashedPassword;
				info['verify_token'] = randtoken.generate(16);
				delete info['password'];
				collection.insert(info, {safe:true}, function(err,result){
                		if(err){
                        			console.log(err);
                        			res.send({success :  false,message : 'User registration failed'});
                		}
                		else
                		{	
						//Email send function. Has to be done in a different model
                                		res.send({success : true,message : 'User registered succesfully'})
						
                		}
                		})
			}
			})
		})	
	}
	else
	{
		res.send(401,{ success : false, message : 'Email or password missing' });
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
				var token = jwt.sign(item, req.app.get('indorseSecret'), {
                                        expiresIn : 60*60*24*31 // expires in 31 days
                                });
                                item['token'] = token;
				collection.update({'email' : info['email']},item,{safe:true}, function(err, result) {
				if (err) {
                                           console.log('Error updating' + err);
                                	    res.send(401,{ success : false, message : 'Error verifying the user' });  
				} else {
					res.send(401,{ success : true, message : 'user verified succesfully', token : token});	
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
		res.send(401,{ success : false, message : 'Email or token missing' });
	}

}


exports.logout = function(req,res){

        var info = req.body;
	if('email' in info && info['email'] != ''  && 'token' in info && info['token'] != '')
        {	
		email = info['email'];
		token = info['token'];
	          db.collection('users',function(err,collection){
                        collection.findOne({'email': email,'token' : token}, function(err, item) {
                        if(item)
                        {       
		
				
		  jwt.verify(token, req.app.get('indorseSecret'), function(err, decoded) {
	          if (err) {
        			console.log('token error ' + err);
				res.send(401,{ success : false, message : 'Auhentication failed'});
      		  } else {
			//Log the person out and return success
			delete item['token']
			collection.update({'email' : email},item,{safe:true}, function(err, result) {
			if(err)
			{
				res.send(500,{ success : false, message : 'Something went wrong'});
			}
			else
			{
				res.send(200,{ success : true, message : 'Logged out succesfully'});
			}
			})
						
      		}

		});
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
		res.send(401,{ success : false, message : 'Email or token missing' });
	}
}

exports.login = function(req,res){

        var info = req.body;
	if('email' in info && info['email'] != ''  && 'password' in info && info['password'] != '')
        {
                email = info['email'];
                password = info['password'];
		var hashedPassword = passwordHash.generate(password);
		console.log(hashedPassword)
		db.collection('users',function(err,collection){
                collection.findOne({'email': email,'pass' : hashedPassword}, function(err, item) {
                if(item)
                {
			var token = jwt.sign(item, req.app.get('indorseSecret'), {
                                        expiresIn : 60*60*24*31 // expires in 31 days
                                });
                                item['token'] = token;
                                collection.update({'email' : email},item,{safe:true}, function(err, result) {
                                if (err) { 
                                            res.send(401,{ success : false, message : 'Error logging in the user' });
                                } else {
                                        res.send(401,{ success : true, message : 'user logged in succesfully', token : token});
                                   }
                                });

		}
		else
		{
			 res.send(401,{ success : false, message : 'Email and password dont match' });
		}
		})
		})
	}
	else
	{
		res.send(401,{ success : false, message : 'Email or password missing' });
	}
}

exports.profile = function(req,res){
        var info = req.body;
        if('email' in info && info['email'] != ''  && 'token' in info && info['token'] != '')
        {       
                email = info['email'];
                token = info['token'];
                db.collection('users',function(err,collection){
                        collection.findOne({'email': email,'token' : token}, function(err, item) {
                        if(item)
                        {
                        
                                
                  jwt.verify(token, req.app.get('indorseSecret'), function(err, decoded) {
                  if (err) {    
                                console.log('token error ' + err);
                                res.send(401,{ success : false, message : 'Auhentication failed'});
                  } else {
                        //Log the person out and return success
                         
			delete item['pass']
			delete item['token']
			 res.send(200,{ success : true, profile : item });
                }
                
                });     
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
                res.send(401,{ success : false, message : 'Email or token missing' });
        }
}




exports.removeall = function(req,res){

db.collection('users',function(err,collection){
	collection.remove({'email' : {'$exists' : true}}, function(err){
	if(err)
	{
		console.log('Error cleaning up DB');
	}
});
	collection.remove({'string' : {'$exists' : true}}, function(err){
        if(err)
        {
                console.log('Error cleaning up DB');
        }
});
});

};

exports.register = function(req,res){
      var info = req.body;
      if('api_key' in info && info['api_key'] == 'e5bb08ca-cbce-4336-a239-eba110020341')
      {
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
                if(token)
                {
                        jwt.verify(token, req.app.get('indorseSecret'), function(err, decoded) {
      if (err) {
		
	console.log('token error ' + err);
		
      } else {
        // if everything is good, save to request for use in other routes
	console.log('Token verified')
        req.decoded = decoded;
	console.log(decoded);
      }
})
}
	var info = req.body;
	console.log(info);
	delete info['api_key']
	time  = Math.floor(new Date() / 1000);
	db.collection('users',function(err,collection){
        info['timestamp'] = time;
	//console.log(info);
	if('email' in info && info['email'] != '' && 'string' in info && info['string']  != '')
	{
	collection.findOne({'email': info['email']}, function(err, item) {
	if(item)
	{
		if('string' in info && info.string == item['string'])	
		{
		time1 = item['timestamp']
		if((time - time1)  >= 30)
		{
			if('decoded' in req)
                	{
			if(('terms' in info && info.terms == 'true'))
			{
			if(!('terms' in item && item['terms'] == 'true'))
			{	
				item['terms'] = 'true'
				collection.update({'email' : info['email']},item,{safe:true}, function(err, result) {
				if (err) {
             				   console.log('Error updating' + err);
                			   res.send({'error':'An error has occurred'});
          			  } else {
         			   }
				});
			}	
			res.send({'userFound' : true,'whitelist' : true,'address' : '0x738FbaE13b0212989034272aA7BD227Bc6671084'})
			}
			else if('terms' in item && item['terms'] == 'true')
			{
				res.send({'userFound' : true,'whitelist' : true,'address' : '0x738FbaE13b0212989034272aA7BD227Bc6671084'})
			}
			else
			{
				res.send({'error' : 'Terms not accepted'})
			}
			}
			else
			{
				var token = jwt.sign(item, req.app.get('indorseSecret'), {
                                        expiresIn : 60*60*24 // expires in 24 hours
                                });
				if('terms' in item && item['terms'] == 'true')
				{
					 res.send({'userFound' : true,'whitelist' : true,'terms' : true,'token' : token})
				}
				else
				{
				res.send({'userFound' : true,'whitelist' : true,'token' : token})
				}
			}
		
		}
		else
		{
			res.send({'userFound' : true,'whitelist' : false})
		}
		}
		else
		{

			res.send({'userFound' : false,'error' : 'Email id and Hex String does not match'})
		}
	}    
        else
	{
		collection.insert(info, {safe:true}, function(err,result){
		if(err){
			console.log(err);
			res.send({'userFound' :  false,'userRegistered' : false});
		}
		else
		{
                                res.send({'userFound' : false,'userRegistered' : true})
		}
		})
	}
	})
	}
	else
	{
		res.send(401,{error : true,message : 'Email id or HEX string missing'});
	}
})
	}
	else
	{
	return res.send(401,{ success : false, message : 'authentication failed' });	
	}
}
