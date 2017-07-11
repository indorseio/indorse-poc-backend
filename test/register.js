process.env.NODE_ENV = 'test';
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();
var sleep = require('sleep');
chai.use(chaiHttp);


/*describe('/GET', () => {
      it('DB Clean up', (done) => {
        chai.request(server)
            .get('/removeAll')
            .end((err, res) => {
                res.should.have.status(200);
	    done();
	});
});

  });*/

describe('/POST', () => {
      it('it should not accept a query without API Key', (done) => {
        let book = {
            email: "telepras@gmail.com",
            string: "AFQRWTEYRUTISHWGWTSNABWQ",
        }
        chai.request(server)
            .post('/register')
            .send(book)
            .end((err, res) => {
                res.should.have.status(401);
                res.body.should.be.a('object');
                res.body.should.have.property('success').eql(false);
		res.body.should.have.property('message').eql('authentication failed');
              done();
            });
      });

  });

describe('/POST', () => {
      it('First time registration ', (done) => {
        let book = {
            email: "telepras@gmail.com",
            string: "AFQRWTEYRUTISHWGWTSNABWQ",
	    api_key : "e5bb08ca-cbce-4336-a239-eba110020341"
        }
        chai.request(server)
            .post('/register')
            .send(book)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('userFound').eql(false);
                res.body.should.have.property('userRegistered').eql(true);
              done();
            });
      });

  });

describe('/POST', () => {
      it('Call server with wrong HEX value for registered user', (done) => {
        let book = {
            email: "telepras@gmail.com",
            string: "AFQRWTEYRUTISHWGWTSAGSJDG",
            api_key : "e5bb08ca-cbce-4336-a239-eba110020341"
        }
        chai.request(server)
            .post('/register')
            .send(book)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('userFound').eql(false);
                res.body.should.have.property('error').eql('Email id and Hex String does not match');
              done();
            });
      });

  });

describe('/POST', () => {
      it('Call server without HEX string value', (done) => {
        let book = {
            email: "telepras@gmail.com",
            api_key : "e5bb08ca-cbce-4336-a239-eba110020341"
        }
        chai.request(server)
            .post('/register')
            .send(book)
            .end((err, res) => {
                res.should.have.status(401);
                res.body.should.be.a('object');
                res.body.should.have.property('error').eql(true);
                res.body.should.have.property('message').eql('Email id or HEX string missing');
              done();
            });
      });

  });

describe('/POST', () => {
      it('Call server without Email', (done) => {
        let book = {
            string: "AFQRWTEYRUTISHWGWTSAGSJDG",
            api_key : "e5bb08ca-cbce-4336-a239-eba110020341"
        }
        chai.request(server)
            .post('/register')
            .send(book)
            .end((err, res) => {
                res.should.have.status(401);
                res.body.should.be.a('object');
                res.body.should.have.property('error').eql(true);
                res.body.should.have.property('message').eql('Email id or HEX string missing');
	    done();
            });
      });

  });

describe('/POST', () => {
      it('Whitelist not yet done', (done) => {
        let book = {
            email: "telepras@gmail.com",
            string: "AFQRWTEYRUTISHWGWTSNABWQ",
            api_key : "e5bb08ca-cbce-4336-a239-eba110020341"
        }
        chai.request(server)
            .post('/register')
            .send(book)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('userFound').eql(true);
                res.body.should.have.property('whitelist').eql(false);
              done();
            });
      });
});


describe( 'Whitelist completion', function() {
  it( 'Email should be whitelisted', function ( done ) {
    setTimeout( function () {
      try {
        console.log('Calling after 3 seconds');

	describe('/POST', () => {
      it('Whitelist should be done', (done) => {
        let book = {
            email: "telepras@gmail.com",
            string: "AFQRWTEYRUTISHWGWTSNABWQ",
            api_key : "e5bb08ca-cbce-4336-a239-eba110020341"
        }
        chai.request(server)
            .post('/register')
            .send(book)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('userFound').eql(true);
                res.body.should.have.property('whitelist').eql(true);
              done();
            });
      });
});




	done(); // success: call done with no parameter to indicate that it() is done()
      } catch( e ) {
        done( e ); // failure: call done with an error Object to indicate that it() failed
      }
    }, 32000 );
    // returns immediately after setting timeout
    // so it() can no longer catch exception happening asynchronously
  })
})



