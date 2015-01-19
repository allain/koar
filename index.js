var assert = require('assert');
var map = require('amp-map');
var each = require('amp-map');
var values = require('amp-values');

var Promise = require('bluebird');

module.exports = Koar;

function Koar() {
  var modules = {};  

  this.register = function(name, builder) {
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

    return doAllProps(result);
  };

  function startModule(module) {
    if (!module) {
      return Promise.reject(new Error('missing module'));
    } else if (module.instance) {
      return Promise.resolve(true);
    }
    
    var built = new module.builder({});

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

    return doAllProps(result);
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
  
  function doAllProps(obj) {
    var result = {};

    each(obj, function(val, name) {
      result[name] = hopeful(val);
    });

    return Promise.props(result).then(function(result) {
      var hasFailures = values(result).some(function(x) { 
        return x instanceof Error;
      });
      
      if (hasFailures) {
        throw result;
      } else {
        return result;
      }
    });
  }
}

function hopeful(promise) {
  return new Promise(function(resolve) {
    promise.then(resolve, function(err) {
      if (err instanceof Error) {
        resolve(err);        
      } else {
        resolve(new Error(err));
      }
    });
  });
}

