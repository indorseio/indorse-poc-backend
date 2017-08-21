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

// Mock sandbox
var sandbox = Sinon.sandbox.create()
  , test_user = {
      verify_token: null
    }
  , genRandomString = (length) => {
      return crypto.randomBytes(Math.ceil(length/2))
        .toString('hex') /** convert to hexadecimal format */
        .slice(0,length)   /** return required number of characters */
    }
  , sha512 = (password, salt) => {
      var hash = crypto.createHmac('sha512', salt) /** Hashing algorithm sha512 */
      hash.update(password)
      var value = hash.digest('hex')
      return {
        salt:salt,
        passwordHash:value
      }
    }
  , saltHashPassword = (userpassword) => {
      var salt = genRandomString(16) /** Gives us salt of length 16 */
      var passwordData = sha512(userpassword, salt)
      return passwordData
    }

mailgunSendSpy = sandbox.stub().yields(null, { bo: 'dy' })
sandbox.stub(Mailgun({ apiKey: 'foo', domain: 'bar' }).Mailgun.prototype, 'messages').returns({
  send: mailgunSendSpy
})

describe('Users', () => {
  before((done) => {
    DB.connect(done)
  })

  afterEach((done) => {
    DB.drop(done)
  })
  // app.post('/signup',user.signup)
  describe('/POST signup', () => {

    before((done) => {
      let user = {
        email: "p@example.com"
      }
      users = DB.getDB().collection('users')
      users.insertOne(user)
        .then(() => done())
    })

    it('should return 404 if user exists', (done) => {
      let user = {
        name: 'Person',
        email: 'p@example.com',
        password: 'password'
      }

      chai.request(server)
        .post('/signup')
        .send(user)
        .end((err, res) => {
          res.should.have.status(404)
          res.body.should.be.a('object')
          res.body.message.should.equal('User with this email exists')
          done()
        })
    })

    it('should throw error if email or password is missing', (done) => {
      let user = {
        email: 'p@example.com'
      }

      chai.request(server)
        .post('/signup')
        .send(user)
        .end((err, res) => {
          res.should.have.status(422)
          res.body.should.be.a('object')
          res.body.message.should.equal('Email or password missing')
          done()
        })
    })

    it('should create a new user in database if user is created successfully', (done) => {
      let user = {
        name: 'Another Person',
        email: 'person@another.com',
        password: 'password'
      }

      chai.request(server)
        .post('/signup')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.message.should.equal('Verification email sent successfully')
          users = DB.getDB().collection('users')
          users.findOne({email: user.email})
            .then((item) => {
              item.name.should.equal(user.name)
              item.email.should.equal(user.email)
            })
            .then(() => {
              done()
            })
        })
    })

  })

  // app.post('/resendverification',user.resendVerification)
  describe('POST /resendverification', () => {
    let user = {
      name: "Name",
      email: "person@example.com",
      verified: false
    }

    before('sending verification email', (done) => {
      DB.getDB().collection('users').insert(user, (err, res) => { done() })
    })

    it('should send a verification email', (done) => {
      chai.request(server)
        .post('/resendverification')
        .send({ email: user.email })
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.message.should.equal('Verification email sent successfully')
          done()
        })
    })

    it('should give an error without email', (done) => {
      let nothing = {}
      chai.request(server)
        .post('/resendverification')
        .send(nothing)
        .end((err, res) => {
          res.should.have.status(501)
          res.body.should.be.a('object')
          res.body.message.should.equal('Email missing')
          done()
        })
    })
  })

  // app.post('/verify-email',user.verify)
  describe('POST /verify-email', () => {
    let user = {
      email: "person@example.com",
      verify_token: "verificationtoken"
    }
    before('verifying email', (done) => {
      DB.connect(done)
      DB.getDB().collection('users').insert(user)
    })

    it('should confirm the verification of a user', (done) => {
      chai.request(server)
        .post('/verify-email')
        .send(user)
        .end( (err, res) => {
          res.should.have.status(200)
          res.body.message.should.equal('user verified successfully')
          done()
        })
    })
  })

  describe('Authenticated test cases', () => {
    var password = 'testpass123'
    var passwordData = saltHashPassword(password)
    let user = {
      email: 'person@example.com',
      approved: true,
      pass: passwordData.passwordHash,
      salt: passwordData.salt
    }

    beforeEach('login the user', (done) => {
      DB.getDB().collection('users').insert(user)
        .then(() => {
          chai.request(server)
            .post('/login')
            .send({ email: user.email, password: password })
            .end( (err, res) => {
              res.should.have.status(200)
              done()
            })
        })
    })

    // app.post('/login',user.login)
    describe('POST /login', () => {
      it('should log the user in', (done) => {
        chai.request(server)
          .post('/login')
          .send({ email: user.email, password: password })
          .end( (err, res) => {
            res.should.have.status(200)
            done()
          })
      })
    })

    // app.post('/me',user.profile)
    describe('POST /me', () => {
      let user = { email: "person@example.com" }
      before('getting profile, create a user', (done) => {
        DB.getDB().collection('users').insertOne(user, (err, res) => {
          user.user_id = res.insertedId
          done()
        })
      })

      it('should retrieve profile details', (done) => {
        user.login = true // mock login
        chai.request(server)
          .post('/me')
          .send(user)
          .end( (err, res) => {
            res.should.have.status(200)
            done()
          })
      })
    })

    // app.get('/users/:pageNo/:perPage',user.getUsers)
    describe('POST /users/1/10', () => {
      it('should paginate the users', (done) => {
        done()
      })
    })

    // app.post('/users/approve',user.approve)
    describe('POST /users/approve', () => {
      let approve_payload = {
        login: true,
        approve_user_id: 1,
        email: 'admin@example.com'
      }
      it('should approve the user', (done) => {
        chai.request(server)
          .post('/users/approve')
          .send(approve_payload)
          .end( (err, res) => {
            res.should.have.status(200)
            done()
          })
      })
    })

    // app.post('/users/disapprove',user.disapprove)
    describe('POST /users/disapprove', () => {
      let disapprove_payload = {
        login: true,
        approve_user_id: 1,
        email: 'admin@example.com'
      }
      it('should disapprove the user', (done) => {
        chai.request(server)
          .post('/users/approve')
          .send(disapprove_payload)
          .end( (err, res) => {
            res.should.have.status(200)
            done()
          })
      })
    })

    // app.post('/password/forgot',user.passwordForgot)
    describe('POST /password/forgot', () => {
      let user = {
        email: 'person@example.com'
      }
      before('sending email, create a user', (done) => {
        DB.connect(done)
        DB.getDB().collection('users').insertOne(user)
      })
      it('should take the email', (done) => {
        chai.request(server)
          .post('/password/forgot')
          .send(user)
          .end( (err, res) => {
            res.should.have.status(200)
            done()
          })
      })
    })

    // app.post('/password/reset',user.passwordReset)
    describe('POST /password/reset', () => {
      let user = {
        email: 'person@example.com',
        pass_verify_timestamp: Math.floor(Date.now() / 1000),
        pass_verify_token: "verifytoken"
      }
      before('resetting password, create a user', (done) => {
        DB.connect(done)
        DB.getDB().collection('users').insertOne(user)
      })
      it('should request a new password from the user', (done) => {
        let reset_user = {
          email: 'person@example.com',
          pass_token: 'verifytoken'
        }
        chai.request(server)
          .post('/password/reset')
          .send(user)
          .end( (err, res) => {
            res.should.have.status(200)
            done()
          })
      })
    })

  })

  // app.post('/logout',user.logout)
  describe('POST /logout', () => {
    let user = { email: "person@example.com" }
    before('logging out, create a user', (done) => {
      DB.getDB().collection('users').insertOne(user).then(() => done())
    })
    it('should log the user out', (done) => {
      chai.request(server)
        .post('/logout')
        .send({login: true, email: user.email})
        .end( (err, res) => {
          res.should.have.status(200)
          done()
        })
    })
  })

  // app.post('/password/change',user.passwordChange)
  describe('POST /password/change', () => {
    it('should change password of the user', (done) => {
      done()
    })
  })
})