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


describe('Claims', () => {
  var token, claim_id, update_claim_id, updated_claim
  var user = {
    email: "person@example.com",
    password: "testpass123"
  }

  before('connect to the database', (done) => {
    DB.connect(done)
  })

  before('sign up a user', (done) => {
    item = Object.assign({}, user, {
      name: "Dummy"
    })
    chai.request(server)
      .post('/signup')
      .send(item)
      .end((err, res) => {
        res.should.have.status(200)
        token = res.body.token
        done()
      })
  })

  before('approve and verify the user', (done) => {
    users = DB.getDB().collection('users')
    users.update({email: user.email},
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

  describe('/POST claims', () => {

    it('should add to database and return 200', (done) => {
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
        })
    })


    it('should return 401 if not logged in', (done) => {
      let claim = {
        title: 'This is claim',
        desc: 'A description',
        proof: 'Proof of the claim'
      }

      chai.request(server)
        .post('/claims')
        .send(claim)
        .end((err, res) => {
          res.should.have.status(401)
          res.body.should.be.a('object')
          res.body.message.should.equal('Authentication failed')
          res.body.success.should.equal(false)
          done()
        })
    })

    it('should return 422 if any of the arguments is missing', (done) => {
      let claim = {
        title: 'This is claim',
        desc: 'A description',
      }
      chai.request(server)
        .post('/claims')
        .send(claim)
        .end((err, res) => {
          res.should.have.status(422)
          done()
        })
    })
  })

  after('posting claims, remove it', (done) => {
    claims = DB.getDB().collection('claims')
    claims.remove({_id: mongo.ObjectID(claim_id)},
      (err, res) => {
        done()
      })
  })

  before('updating claim, create a new one', (done) => {
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
        update_claim_id = res.body.claim[0]._id
        done()
      })
  })

  describe('POST /updateclaim', () => {
    it('should return 200 if all goes fine', (done) => {
      updated_claim = {
        title: 'An updated title',
        desc: 'An updated description',
        proof: 'We are changing the proof to update it',
        claim_id: update_claim_id
      }
      chai.request(server)
        .post('/updateclaim')
        .set('Authorization', 'Bearer ' + token)
        .send(claim)
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(200)
          res.body.claim[0].proof.should.equal(updated_claim.proof)
          done()
        })
    })

    it('should return 422 if any of the arguments is missing', (done) => {
      updated_claim = {
        title: 'An updated title',
        desc: 'An updated description',
        proof: 'We are changing the proof to update it',
        claim_id: update_claim_id
      }
      chai.request(server)
        .post('/updateclaim')
        .set('Authorization', 'Bearer ' + token)
        .send(claim)
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(422)
          done()
        })
    })

    it('should return 401 if user is not logged in')
  })

  describe('GET /getclaims', () => {
    it('should return 200 along with claim data', (done) => {
      chai.request(server)
        .get('/getclaims')
        .set('Authorization', 'Bearer ' + token)
        .send({claim_id: update_claim_id})
        .end((err, res) => {
          res.body.should.be.a('object')
          res.should.have.status(200)
          res.body.claim[0].proof.should.equal(updated_claim.proof)
          done()
        })
    })

    it('should return 404 no claim is found', (done) => {

      chai.request(server)
        .get('/getclaims')
        .set('Authorization', 'Bearer ' + token)
        .send({claim_id: '59a6ad282e7e26a8b402junk'})
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