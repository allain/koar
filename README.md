# koar

**Early Days, do not use in production!!!**

Application framework built with decoupling and asynchrony in mind.

Based on [core.js](https://github.com/mauriciosoares/core.js) but with a strong emphasis on asynchrony.

I'm not sure how useful this library will be, but it thought I'd learn something through the process of writing it.

[![build status](https://secure.travis-ci.org/allain/koar.png)](http://travis-ci.org/allain/koar)

## Installation

This module is installed via npm:

``` bash
$ npm install koar
```

## Example Usage

``` js
var Koar = require('koar');

var app = new Koar();

app.register('testing', function(sandbox) {
  var testingHtml;
  return {
    // Supports asynchronous initialization through returning promises
    init: function() {
      return Http.get('http://www.testing.com').then(function(html) {
        testingHtml = html;
        return true;
      })
    },

    destroy: function() {
      // Assuming destruction requires some asynchronous operations
      return new Promise(function(resolve) {
        setTimeout(function() {
          resolve();
        }, 100);
      });
    }
  };
});

app.start().then(function(result) {
  console.log(result);
});

//-> { testing: true }
```
