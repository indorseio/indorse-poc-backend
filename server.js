var express = require('express');
var app = express();
user = require('./models/users');
claim = require('./models/claims');
auth = require('./models/auth');
vote = require('./models/vote');
bearerToken = require('express-bearer-token');
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
    app.use(bearerToken());
    app.use(auth);
});



app.use(function(req, res, next) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    //res.header('Access-Control-Expose-Headers', 'Authorization');
    next();
});

app.post('/signup',user.signup)
app.post('/verify-email',user.verify)
app.post('/login',user.login)
app.post('/logout',user.logout)
app.post('/me',user.profile)
app.get('/users/:pageNo/:perPage',user.getUsers)
app.post('/users/approve',user.approve)
app.post('/users/disapprove',user.disapprove)
app.post('/password/reset',user.passwordReset)
app.post('/password/forgot',user.passwordForgot)
app.post('/password/change',user.passwordChange)
app.post('/claims',claim.claim)
app.post('/getClaims',claim.getclaims)
app.post('/updateClaim',claim.updateClaims)

app.get('/votes',vote.getVotes)
app.get('/votes/:vote_id',vote.getVote)
app.post('/votes/:claim_id/register',vote.register)
//app.post('votes/:/claim_id/archive',vote.archive)
app.post('/votes/:claim_id/endorse',vote.endorse)
app.post('/votes/:claim_id/flag',vote.flag)
app.listen(config.get('port'));
console.log('server running on port ' + config.get('port'));
module.exports = app;
