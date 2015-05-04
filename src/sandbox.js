var Promise = require('bluebird');

module.exports = Sandbox;

function Sandbox() {
  this._registrations = {};
}

Sandbox.prototype.register = function(methodName, module) {
  var self = this;

  if (typeof(module.instance) !== 'object') {
    return Promise.reject(new Error('module is not an object'));
  }

  if (typeof(module.instance[methodName]) !== 'function') {
    return Promise.reject(new Error('module does not have method ' + methodName));
  }


  var registrations = this._registrations[methodName] || [];
  registrations.push(module);
  this._registrations[methodName] = registrations;
  
  if (!this[methodName]) {
    this[methodName] = invoker(methodName).bind(this);
  }

  function invoker(methodName) {
    return function() {
      var args = [].splice(arguments);
      var results = {};
      self._registrations[methodName].forEach(function(module) {
        results[module.name] = module.instance[methodName].apply(module.instance, args);
      });

      return results;
    };
  }
}

