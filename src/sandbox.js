var Emitter = require('wildemitter');

module.exports = Sandbox;


function Sandbox() {
  Emitter.call(this);
}

Sandbox.prototype = new Emitter;
