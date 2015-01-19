var assert = require('assert');
var Koar = require('..');
var Promise = require('bluebird');

describe('koar', function() {
  var koar;

  beforeEach(function() {
    koar = new Koar();
  });

  describe('registration', function() {
    it('should support module registration', function(done) {
      koar.register('a', function(sandbox) {
        return {}; 
      }).then(done);
    });

    it('should fail when registering the same module twice', function(done) {
      koar.register('a', function(sandbox) {
        return {}; 
      }).then(function() {
        return koar.register('a', function(sandbox) {
          return {};
        });
      }).catch(function(err) {
        assert(err instanceof Error);
        done();
      });
    });
  });

  describe('startup', function() { 
    var initialized;

    beforeEach(function(done) {
      initialized = {};

      Promise.all([
        koar.register('a', function(sandbox) { 
          return { 
            init: function() {
              initialized.a = true;
              return true;
            } 
          };
        }),
        koar.register('b', function(sandbox) { 
          return { 
            init: function() {
              initialized.b = true;
              return true;
            } 
          };
        })
      ]).then(function() {
        done();
      });
    });

    it('supports starting a single module', function(done) {
      koar.start('a').then(function() {
        assert.deepEqual(initialized, {a: true});
        done();
      });
    });
    
    it('supports starting multiple modules', function(done) {
      koar.start(['a', 'b']).then(function() {
        assert.deepEqual(initialized, {a: true, b: true});
        done();
      });
    });
    
    it('supports starting all modules', function(done) {
      koar.start().then(function() {
        assert.deepEqual(initialized, {a: true, b: true});
        done();
      });
    });

    it('starting missing module fails', function(done) {
      koar.start('missing').catch(function(err) {
        assert(err instanceof Error);
        done();
      });
    });
    
    it('starting missing module starts the other ones', function(done) {
      koar.start(['a', 'b', 'missing']).catch(function(result) {
        assert(result.a === true);
        assert(result.b === true);
        assert(result.missing instanceof Error);
        done();
      });
    });

    it('supports "true" promises in init', function(done) {
      koar.register('slow', function(sandbox) {
        return {
          init: function() {
            return new Promise(function(resolve) {
              setTimeout(function() {
                initialized.slow = true;
                resolve('slowly resolved');
              }, 10);
            });
          }
        };
      }).then(function() {
        koar.start('slow').then(function() {
          assert.deepEqual(initialized, {slow: true});
          done();
        });
      }); 
    });
 
    it('a failing builder should initialize all but the failing one', function(done) {
      Promise.all([
        koar.register('fail1', function(sandbox) {
          return Promise.reject(new Error('build failing'));
        }),
        koar.register('fail2', function(sandbox) {
          return {
            init: function() {
              return Promise.reject(new Error('init failing'));
            }
          };
        })
      ]).then(function() {
        koar.start().catch(function(result) {
          assert(result.a === true);
          assert(result.b === true);
          assert(result.fail1 instanceof Error);
          assert(result.fail2 instanceof Error);
          done();
        });
      }); 
    });
  });
  
  describe('teardown', function() { 
    var destroyed;

    beforeEach(function(done) {
      destroyed= {};

      Promise.all([
        koar.register('a', function(sandbox) { 
          return { 
            destroy: function() {
              destroyed.a = true;
            } 
          };
        }),
        koar.register('b', function(sandbox) { 
          return { 
            destroy: function() {
              destroyed.b = true;
              return true;
            } 
          };
        }),
      ]).then(Promise.all([
        koar.start('a'),
        koar.start('b')
      ])).then(function() {
        done();
      });
    });

    it('supports stopping a single module', function(done) {
      koar.stop('a').then(function() {
        assert.deepEqual(destroyed, {a: true});
        done();
      });
    });
    
    it('supports stopping multiple modules', function(done) {
      koar.stop(['a', 'b']).then(function() {
        assert.deepEqual(destroyed, {a: true, b: true});
        done();
      });
    });
    
    it('supports stopping all modules', function(done) {
      koar.stop().then(function() {
        assert.deepEqual(destroyed, {a: true, b: true});
        done();
      });
    });

    it('stopping missing module fails', function(done) {
      koar.stop('missing').catch(function(err) {
        assert(err instanceof Error);
        done();
      });
    });
    
    it('stopping missing module still stops all others', function(done) {
      koar.stop(['a', 'b', 'missing']).catch(function(result) {
        assert(result.a === true);
        assert(result.b === true);
        assert(result.missing instanceof Error);
        done();
      });
    });

    it('supports "true" promises in destroy', function(done) {
      koar.register('slow', function(sandbox) {
        return {
          destroy: function() {
            return new Promise(function(resolve) {
              setTimeout(function() {
                destroyed.slow = true;
                resolve('slowly resolved');
              }, 10);
            });
          }
        };
      }).then(function() {
        return koar.start('slow');
      }).then(function() {
        koar.stop('slow').then(function() {
          assert.deepEqual(destroyed, {slow: true});
          done();
        });
      }); 
    });
  });
});
