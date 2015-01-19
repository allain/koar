var assert = require('assert');
var map = require('amp-map');
var each = require('amp-each');
var values = require('amp-values');
var Promise = require('bluebird');
var parallel = require('promise-parallel');

var Sandbox = require('./src/sandbox.js');

module.exports = Koar;

function Koar() {
  var self = this;
  var modules = {};

  var sandbox = this.sandbox = new Sandbox();

  this.register = function(name, builder) {
    if (typeof name === 'object') {
      return Promise.all(map(name, function(builder, name) {
        return self.register(name, builder);
      }));
    }

    if (modules[name]) return Promise.reject(new Error('module already registered: ' + name));

    modules[name] = {
      builder: builder,
      instance: null
    };

    return Promise.resolve();
  };

  this.start = function(target) {
    if (target === void 0) {
      target = Object.keys(modules);
    } else if (typeof target === 'string') {
      return startModule(modules[target]);
    }

    var result = {};

    each(target, function(name) {
      result[name] = startModule(modules[name]);
    });

    return parallel(result);
  };

  function startModule(module) {
    if (!module) {
      return Promise.reject(new Error('missing module'));
    } else if (module.instance) {
      return Promise.resolve(true);
    }

    var built = module.builder(sandbox) || {};

    return Promise.resolve(built).then(function(instance) {
      if (!instance.init) {
        module.instance = instance;
        return true;
      }

      return Promise.resolve(instance.init()).then(function() {
        module.instance = instance;
        return true;
      });
    });
  }

  this.stop = function(target) {
    if (target === void 0) {
      target = Object.keys(modules);
    } else if (typeof target === 'string') {
      return stopModule(modules[target]);
    }

    var result = {};

    each(target, function(name) {
      result[name] = stopModule(modules[name]);
    });

    return parallel(result);
  };

  function stopModule(module) {
    if (!module) {
      return Promise.reject(new Error('missing module'));
    } else if (!module.instance || !module.instance.destroy) {
      return Promise.resolve(true);
    }


    return Promise.resolve(module.instance.destroy()).then(function() {
      module.instance = null;
      return true;
    });
  }
}
