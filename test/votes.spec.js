process.env.NODE_ENV = 'test'

let mongo = require('mongodb')
  , chai = require('chai')
  , chaiHttp = require('chai-http')
  , server = require('../server')
  , should = chai.should()
  , Sinon = require('sinon')
  , DB = require('./db')
  , Mailgun = require('mailgun-js')
  , crypto = require('crypto')
chai.use(chaiHttp)

describe('Votes', () => {
  var token, claim_id, vote_id
  var another_user = {
    email: "another@example.com",
    password: "testpass123"
  }
  var user = {
    email: "person@example.com",
    password: "testpass123"
  }

  before('connect to the database', (done) => {
    DB.connect(done)
  })

  before('clear db just in case', (done) => {
    DB.drop(done)
  })

  before('sign up a user', (done) => {
    item = Object.assign({}, user, {
      name: "Dummy"
    })
    another_item = Object.assign({}, another_user, {
      name: "Dummy"
    })
    chai.request(server)
      .post('/signup')
      .send(item)
      .end((err, res) => {
        res.should.have.status(200)
        done()
      })
    chai.request(server)
      .post('/signup')
      .send(another_item)
      .end((err, res) => {
        res.should.have.status(200)
        done()
      })
  })

  before('approve and verify the user', (done) => {
    users = DB.getDB().collection('users')
    users.updateMany({},
      { $set: { approved: true, verified: true } },
      { safe: true },
      (err, res) => {
        done()
      })
  })

  before('try to login the user', (done) => {
    chai.request(server)
      .post('/login')
      .send(user)
      .end((err, res) => {
        res.should.have.status(200)
        token = res.body.token
        done()
      })
  })

  before('getting votes, create a claim', (done) => {
    let claim = {
      title: 'This is claim',
      desc: 'A description',
      proof: 'Proof of the claim',
    }

    chai.request(server)
      .post('/claims')
      .set('Authorization', 'Bearer ' + token)
      .send(claim)
      .end((err, res) => {
        res.body.should.be.a('object')
        res.should.have.status(200)
        claim_id = res.body.claim[0]._id
        DB.getDB().collection('votes').findOne({ claim_id: claim_id }, (err, vote) => {
          console.log(vote)
          done()
        })
      })
  })

  describe('GET /getVotes for user who created claim', () => {
    it('should return 401 if user is not logged in')
    it('should return 200 if everything is ok', (done) => {
      chai.request(server)
        .get('/getVotes')
        .set('Authorization', 'Bearer ' + token)
        .send(claim)
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(200)
          done()
        })
    })
    it('should return 404 if something is wrong', (done) => {
      chai.request(server)
        .get('/getVotes')
        .set('Authorization', 'Bearer ' + 'notoken')
        .send(claim)
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(404)
          done()
        })
    })
  })

  before('getting votes, logout the current user', (done) => {
    chai.request(server)
      .get('/logout')
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        res.should.have.status(200)
        done()
      })
  })

  describe('GET /getVotes for user who created claim', () => {
    it('should return 401 if user is not logged in')
    it('should return 200 if everything is ok', (done) => {
      chai.request(server)
        .get('/getVotes')
        .set('Authorization', 'Bearer ' + token)
        .send(claim)
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(200)
          done()
        })
    })
    it('should return 404 if something is wrong', (done) => {
      chai.request(server)
        .get('/getVotes')
        .set('Authorization', 'Bearer ' + 'notoken')
        .send(claim)
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(404)
          done()
        })
    })
  })

  describe('GET /getVote/vote_id', () => {
    it('should return 401 if user is not logged in', (done) => {
      chai.request(server)
        .get('/getVotes')
        .send(claim)
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(404)
          done()
        })
    })
    it('should return 200 if everything is ok', (done) => {
      chai.request(server)
        .get('/getVote/vote_id')
        .set('Authorization', 'Bearer ' + token)
        .send(claim)
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(404)
          done()
        })
    })
  })

  describe('POST /votes/claim_id/register', () => {
    it('should return 401 if user is not logged in', (done) => {
      chai.request(server)
        .get('/votes/' + claim_id + '/register')
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(401)
          done()
        })
    })
    it('should return 200 if everything is ok', (done) => {
      chai.request(server)
        .get('/votes/' + claim_id + '/register')
        .set('Authorization', 'Bearer ' + token)
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(401)
          done()
        })
    })
    it('should return 404 or 501 if something goes wrong', (done) => {
      chai.request(server)
        .get('/votes/' + claim_id + '/register')
        .set('Authorization', 'Bearer ' + 'something is wrong token')
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(401)
          done()
        })
    })
  })

  describe('POST /votes/claim_id/endorse', () => {
    it('should return 401 if user is not logged in', (done) => {
      chai.request(server)
        .get('/votes/' + claim_id + '/endorse')
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(401)
          done()
        })
    })
    it('should return 200 if everything is ok', (done) => {
      chai.request(server)
        .get('/votes/' + claim_id + '/endorse')
        .set('Authorization', 'Bearer ' + token)
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(200)
          done()
        })
    })
    it('should return 404 or 501 if something goes wrong', (done) => {
      chai.request(server)
        .get('/votes/' + claim_id + '/endorse')
        .set('Authorization', 'Bearer ' + 'something is wrong token')
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(404)
          done()
        })
    })
  })

  describe('POST /votes/claim_id/flag', () => {
    it('should return 401 if user is not logged in', (done) => {
      chai.request(server)
        .get('/votes/' + claim_id + '/flag')
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(401)
          done()
        })
    })
    it('should return 200 if everything is ok', (done) => {
      chai.request(server)
        .get('/votes/' + claim_id + '/flag')
        .set('Authorization', 'Bearer ' + token)
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(200)
          done()
        })
    })
    it('should return 404 or 501 if something goes wrong', (done) => {
      chai.request(server)
        .get('/votes/' + claim_id + '/flag')
        .set('Authorization', 'Bearer ' + 'something is wrong token')
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(404)
          done()
        })
    })
  })

  after('all tests, clear everything', (done) => {
    DB.drop(done)
  })

})