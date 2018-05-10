'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _dns = require('dns');

var _dns2 = _interopRequireDefault(_dns);

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _deepcopy = require('deepcopy');

var _deepcopy2 = _interopRequireDefault(_deepcopy);

var _ip = require('ip');

var _ip2 = _interopRequireDefault(_ip);

var _semver = require('semver');

var _semver2 = _interopRequireDefault(_semver);

var _errors = require('./errors');

var _errors2 = _interopRequireDefault(_errors);

var _addr_validator = require('./addr_validator');

var _addr_validator2 = _interopRequireDefault(_addr_validator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Copyright (c) 2016 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/* globals process */

// Wraps one of the stdlib's HTTP(S)? modules to do paranoid checks on connect.
var safeModuleWrapper = function safeModuleWrapper(oldModule, connectionFunc) {
  // Copy the inner modules props to us
  // TODO: create properties that read from the inner module until mutation?
  var newModule = {};

  Object.getOwnPropertyNames(oldModule).forEach(function (name) {
    newModule[name] = oldModule[name];
  });

  var Agent = function (_oldModule$Agent) {
    _inherits(Agent, _oldModule$Agent);

    function Agent(options) {
      _classCallCheck(this, Agent);

      // In Node 0.10 `createConnection` is set on the instance in the constructor
      // only add it here if we really need to.
      var _this = _possibleConstructorReturn(this, (Agent.__proto__ || Object.getPrototypeOf(Agent)).call(this, options));

      if (!oldModule.Agent.prototype.createConnection) {
        _this.createConnection = connectionFunc || safeConnectionWrapper(_this.createConnection);
      }
      return _this;
    }

    _createClass(Agent, [{
      key: 'getName',
      value: function getName(options) {
        // Give our instances a unique name to make sure we don't share a pool
        // with non-paranoid connections
        var name = _get(Agent.prototype.__proto__ || Object.getPrototypeOf(Agent.prototype), 'getName', this).call(this, options);
        name += ':paranoid!';
        if (options.addrValidator) {
          name += ':';
          name += JSON.stringify(options.addrValidator);
        }
        return name;
      }
    }]);

    return Agent;
  }(oldModule.Agent);

  if (Agent.prototype.createConnection) {
    Agent.prototype.createConnection = connectionFunc || safeConnectionWrapper(Agent.prototype.createConnection);
  }

  newModule.Agent = Agent;
  newModule.request = safeRequestWrapper(newModule, oldModule.request);
  newModule.get = function (options, cb) {
    var req = newModule.request(options, cb);
    req.end();
    return req;
  };

  newModule.globalAgent = new Agent();
  newModule.isParanoid = true;
  return newModule;
};

var needLocalAddressHack = _semver2.default.lt(process.version, '0.11.0');

// Wraps around <module>.request to make sure our agent gets used
function safeRequestWrapper(newModule, fn) {
  return function safeRequestWrappedFn(options, cb) {
    // eslint-disable-line max-statements
    if (typeof options === 'string') {
      options = _url2.default.parse(options);
    } else {
      options = _util2.default._extend({}, options);
    }

    if (!options.addrValidator) {
      options.addrValidator = new _addr_validator2.default();
    } else {
      // This is included in the conn pool key, so we need to be
      // safe against idiots like me mutating it after the original
      // request!
      options.addrValidator = new _addr_validator2.default((0, _deepcopy2.default)(options.addrValidator));
    }
    // No connection pooling, create an agent just for this
    // request.
    if (options.agent === false) {
      options.agent = new newModule.Agent();
      // otherwise falsy agent, use the global one for the module
    } else if (!options.agent) {
      options.agent = newModule.globalAgent;
    }

    if (!options._defaultAgent) {
      options._defaultAgent = new newModule.Agent();
    }

    if (options.socketPath) {
      // Node < 0.12 won't use the agent's `createConnection` and has
      // wonky behaviour if you set `options.createConnection`. Try to
      // catch this here instead.
      return stubSocketError(new _errors2.default.UnacceptableAddressError('UNIX domain sockets are not allowed'));
    }

    // Great, Node 0.10 won't let us pass arbitrary options down to
    // `createConnection()`. Hack around that by smuggling it through
    // the `localAddress` option (which an HTTP client won't use)
    if (needLocalAddressHack && options.addrValidator) {
      if (options.localAddress !== undefined) {
        throw new Error('Can\'t use validator param hack with defined localAddress!');
      }
      options.localAddress = options.addrValidator;
    }
    return fn.call(this, options, cb); // eslint-disable-line no-invalid-this
  };
}

// A stupid hack around request not being able to handle
// errors thrown during the synchronous part of socket setup.
// return a socket whose only purpose is to give async errors
// see https://github.com/request/request/issues/1946
function stubSocketError(err) {
  var sock = new _net2.default.Socket();
  sock.connect = null;
  // Give the caller time to register their error listeners.
  process.nextTick(function () {
    sock.destroy(err);
  });
  return sock;
}

// Wraps around net.createConnection()
function safeConnectionWrapper(fn, wrappingSafeConnect) {
  // Does the function that we're wrapping handle its own DNS lookups? If so, we don't
  // need to do our always-safe blocking lookup.
  wrappingSafeConnect = wrappingSafeConnect || false;

  return function safeConnectionWrappedFn() {
    // eslint-disable-line max-statements

    var normalizeArgs = _net2.default._normalizeArgs ? _net2.default._normalizeArgs : _net2.default._normalizeConnectArgs;

    var args = normalizeArgs(arguments);
    var options = args[0];

    // We smuggled our validator through localAddress
    if (options.localAddress instanceof _addr_validator2.default) {
      options.addrValidator = options.localAddress;
      options.localAddress = undefined;
    }
    if (!options.addrValidator) {
      options.addrValidator = new _addr_validator2.default();
    }

    // It won't use TCP/IP, It's a unix domain socket. Exterminate.
    if (options.socketPath) {
      return stubSocketError(new _errors2.default.UnacceptableAddressError('UNIX domain sockets are not allowed'));
    }

    if (!options.addrValidator.isSafePort(options.port)) {
      return stubSocketError(new _errors2.default.UnacceptableAddressError('Disallowed port detected'));
    }
    // So here's the skinny. Normally `.createConnection()` and co create the socket,
    // then return the created socket while the hostname lookup and connection attempt
    // happen in the background. No problem, `net.Socket.connect` accepts a `lookup` option
    // with a function to use instead of `dns.lookup` so we can filter records!
    //
    // Unfortunately, it never calls it if the address looks like an IP, and
    // `tls.connect` doesn't honor it at all. The `http` module basically just calls out to
    // the super-simple and stable `net.createConnection` function, so we can just rewrite that
    // entirely.
    //
    // The `https` module, however, has a very unstable implementation as does the underlying `tls`
    // module. Neither gives us an easy way to either use our own socket, or make a lookup happen
    // before the `connect()` call.
    //
    // Rather than detect node versions and use a different hacked up version of the tls module
    // based on Node version, let's just do a synchronous DNS lookup
    // if we can't easily do it asynchronously.
    if (!wrappingSafeConnect) {
      var resolved = false;
      var dnsErr = null;
      var newOptions = _util2.default._extend({}, options);
      var lookupOpts = { addrValidator: options.addrValidator };
      safeLookup(options.host, lookupOpts, function (err, address, family) {
        // Connect to the resolved IP when we call `sock.connect()` to avoid TOCTOU vulns
        // via DNS rebinding.
        newOptions.host = address;
        args[0] = newOptions;
        dnsErr = err;
        resolved = true;
      });
      // Sit around while we wait for the lookup to complete
      require('deasync').loopWhile(function () {
        return !resolved;
      });
      if (dnsErr) {
        return stubSocketError(dnsErr);
      }
    }
    // Call our wrapped `createConnection()`
    return fn.apply(this, args); // eslint-disable-line no-invalid-this
  };
}

function sanitizeAddresses(addresses, addrValidator) {
  return addresses.map(function (address) {
    return _ip2.default.toString(_ip2.default.toBuffer(address.address));
  }).filter(addrValidator.isSafeIP.bind(addrValidator));
}

function safeLookup(host, options, cb) {
  var defaults = {
    // No love for RFC1918 in IPv6-land == no safety via this lib.
    family: 4,
    all: true
  };

  options = _util2.default._extend(defaults, options);

  var optionsArg = options;
  // Looks like we have an older version of the DNS API, it expects a plain
  // 'ol family number for the second arg.
  if (!_dns2.default.lookupService) {
    optionsArg = options.family;
  }
  _dns2.default.lookup(host, optionsArg, function (err, addresses, family) {
    if (err || !addresses || !addresses.length) {
      return cb(err, null, family);
    }

    // Some versions of node don't care that we want _all_ addresses.
    if (typeof addresses === 'string') {
      addresses = [{ address: addresses, family: family }];
    }

    var sanitizedAddresses = sanitizeAddresses(addresses, options.addrValidator);

    var address = { address: null, family: options.family };

    if (sanitizedAddresses.length) {
      address = addresses[0];
    } else {
      err = new _errors2.default.UnacceptableAddressError('All addresses were blacklisted!');
    }

    return cb(err, address.address, address.family);
  });
}

exports.default = {
  safeLookup: safeLookup,
  safeConnectionWrapper: safeConnectionWrapper,
  safeModuleWrapper: safeModuleWrapper,
  sanitizeAddresses: sanitizeAddresses
};
//# sourceMappingURL=_wrapper_shared.js.map