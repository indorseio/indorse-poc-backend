var mongo = require('mongodb');
var config = require('config');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
    ObjectID = mongo.ObjectID;
var jwt    = require('jsonwebtoken');
var server = new Server('localhost', 27017, {auto_reconnect: true});

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


function login_auth(info) {
        if('email' in info && info['email'] != ''  && 'token' in info && info['token'] != '')
        {
                email = info['email'];
                token = info['token'];
                //console.log('email is ' + email + 'token is ' + token)
                  db.collection('users',function(err,collection){
                        collection.findOne({'email': email,'token' : token}, function(err, item) {
                        if(item)
                        {

                            //console.log('Token not found for the user')
                  jwt.verify(token, 'testindorseapp', function(err, decoded) {
                  if (err) {
                      console.log('JWT verification failed')
                	return false;
		  }
		 else {
		    console.log('returning true for authentication')
			return true;

		}

		})

	}
	else return false;
	})
	})
	}
	else return false;


}

