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
      instance: null,
      builder: builder
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
      result[name] = startModule(modules[name], this.sandbox);
    });

    return parallel(result);
  };

  function startModule(module) {
    if (!module) {
      return Promise.reject(new Error('missing module'));
    }

    if (module.instance) {
      return Promise.resolve(true);
    }

    return Promise.resolve(module.builder(sandbox)).then(function(instance) {
      module.instance = instance || {};

      if (!module.instance.init) {
        return Promise.resolve(true);
      }

      var result = module.instance.init();
      if (result instanceof Promise) {
        return result; 
      }

      return Promise.resolve(result);
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
      var stopped = stopModule(modules[name]); 
      result[name] = stopped;
      if (stopped && modules[name]) {
        modules[name].instance = null;
      }
    });

    return parallel(result);
  };

  function stopModule(module) {
    if (!module) {
      return Promise.reject(new Error('missing module'));
    } else if (!module || !module.instance || !module.instance.destroy) {
      return Promise.resolve(true);
    }

    return Promise.resolve(module.instance.destroy()).then(function() {
      return true;
    });
  }
}
