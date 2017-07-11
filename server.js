var express = require('express');
var app = express();
    user = require('./models/users');    
var jwt    = require('jsonwebtoken'); 
var config = require('config');
app.set('indorseSecret','testindorseapp');

let options = { 
                server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }, 
                replset: { socketOptions: { keepAlive: 1, connectTimeoutMS : 30000 } } 
              };

app.configure(function () {
    app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/signup',user.signup)
app.post('/verify-email',user.verify)
app.post('/login',user.login)
app.post('/logout',user.logout)
app.post('/me',user.profile)
//app.post('/users',user.getUsers)
/*app.post('/password/reset',user.passwordReset)
app.post('password/forgot/',user.passwordForgot)
app.post('password/change/',user.passwordChange)
app.post('/me',user.profile)
app.post('/users/approve',user.approve)
app.post('/users/disapprove',user.disapprove)
app.post('/users',user.getUsers)
*/

app.post('/register',user.register);
app.get('/removeAll',user.removeall)
app.listen(80);
console.log('server running on port 3000');
module.exports = app;
