"use strict";

var EventEmitter = require("events").EventEmitter;

function createSymbol(name) {
  if (typeof global.Symbol == "function") {
    return Symbol(name);
  } else {
    return "__bind-anything-" + name;
  }
}

var emitterSymbol = createSymbol("emitter");
var keysSymbol = createSymbol("keys");
var bindingsSymbol = createSymbol("bindings");

function emitterFor(obj) {
  return obj[emitterSymbol] || (obj[emitterSymbol] = new EventEmitter());
}
function keysFor(obj) {
  return obj[keysSymbol] || (obj[keysSymbol] = {});
}
function bindingsFor(obj) {
  return obj[bindingsSymbol] || (obj[bindingsSymbol] = {});
}

var emptyDisposable = {dispose: function(){}};

function has(obj, key) {
  return obj[keysSymbol] && obj[keysSymbol].hasOwnProperty(key);
}

function add(obj, key, value) {
  keysFor(obj)[key] = true;
  var emitter = emitterFor(obj);

  Object.defineProperty(obj, key, {
    enumerable: true,
    get: function() {
      return value;
    },
    set: function(val) {
      if (value != val) {
        var old = value;
        value = val;
        emitter.emit(key, value, old);
      }
    }
  });
}

function bind(dest, destKey, src, srcPath) {
  var bindings = bindingsFor(dest);
  if (bindings[destKey]) {
    bindings[destKey].dispose();
  }
  bindings[destKey] = watch(src, srcPath)(function (newValue) {
    dest[destKey] = newValue;
  });
}

function watch(obj, path) {
  if (path.length == 0) {
    throw new Error("path must not be empty");
  }
  return function (listener) {
    var key = path[0];
    if (path.length == 1) {
      if (has(obj, key)) {
        return watchKey(obj, key)(listener);
      } else {
        return emptyDisposable;
      }
    } else {
      if (has(obj, key)) {
        var child = emptyDisposable;
        var parent = watchKey(obj, key)(function (newVal, oldVal) {
          child.dispose();
          child = watch(obj[key], path.slice(1))(listener);
        });
        return {
          dispose: function () {
            child.dispose();
            parent.dispose();
          }
        };
      } else {
        return watch(obj[key], path.slice(1))(listener);
      }
    }
  }
}

function watchKey(obj, key) {
  if (!has(obj, key)) {
    throw new Error("key '" + key + "' is not observable");
  }
  var emitter = emitterFor(obj);
  return function (listener) {
    listener(obj[key]);
    emitter.on(key, listener);
    return {
      dispose: function() {
        emitter.removeListener(key, listener);
      }
    };
  };
}

function dispose(obj) {
  var bindings = bindingsFor(obj);
  for (var key in bindings) {
    if (bindings.hasOwnProperty(key)) {
      bindings[key].dispose();
    }
  }
}

bind.has = has;
bind.add = add;
bind.watch = watch;
bind.dispose = dispose;

module.exports = bind;
