'use strict';

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

var _dns = require('dns');

var _dns2 = _interopRequireDefault(_dns);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _tape = require('tape');

var _tape2 = _interopRequireDefault(_tape);

var _index = require('../index');

var _index2 = _interopRequireDefault(_index);

var _semver = require('semver');

var _semver2 = _interopRequireDefault(_semver);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Copyright (c) 2016 Uber Technologies, Inc.
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

(0, _tape2.default)('HTTP doesn\'t hit net.createConnection', function (t) {
  var mock = _sinon2.default.mock(_net2.default);
  mock.expects('createConnection').never();
  _index2.default.get('http://example.com/', {}, function (ignoredErr, res, body) {
    mock.verify();
    t.end();
  });
});

// If `dns.lookup()` is called more than once, it's likely that
// we're not using the resolved address for the actual connection
// creating a TOCTOU vuln.
(0, _tape2.default)('dns.lookup() only called once', function assert(t) {
  var lookupSpy = _sinon2.default.spy(_dns2.default, 'lookup');
  var options = { uri: 'http://example.com/' };
  _index2.default.get(options, function onFirstGet() {
    _dns2.default.lookup.restore();
    if (_semver2.default.gte(process.version, '2.0.0')) {
      t.true(lookupSpy.calledOnce, 'dns.lookup() called once');
    } else {
      // Annoyingly, our manual `socket.connect()` will internally
      // call `dns.lookup()` on Node < 2.0, but it should be a no-op
      // with our sanitized IP address.
      t.true(lookupSpy.calledTwice, 'dns.lookup() called twice');
      // Make sure the last lookup (for `Socket.connect`) was made with the IP)
      t.true(_net2.default.isIP(lookupSpy.lastCall.args[0]), 'second dns.lookup() called with IP');
    }

    t.end();
  });
});

if (_semver2.default.gte(process.version, '0.11.0')) {
  (0, _tape2.default)('Paranoid agents can pool connections', function assert(t) {
    var sockConnSpy = _sinon2.default.spy(_net2.default.Socket.prototype, 'connect');
    var options = { uri: 'http://example.com/', forever: true };
    _index2.default.get(options, function onFirstGet() {
      _index2.default.get(options, function onSecondGet() {
        _net2.default.Socket.prototype.connect.restore();
        t.true(sockConnSpy.calledOnce, 'Socket.connect called once');
        t.end();
      });
    });
  });

  (0, _tape2.default)('Paranoid connection pool splits on validator rules', function assert(t) {
    var addrValidator = new _index2.default.AddrValidator({ portWhitelist: [80, 8001] });
    var sockConnSpy = _sinon2.default.spy(_net2.default.Socket.prototype, 'connect');
    var options = { uri: 'http://example.com/', forever: true, addrValidator: addrValidator };
    _index2.default.get(options, function onFirstGet() {
      addrValidator.portWhitelist.push(9001);
      _index2.default.get(options, function onSecondGet() {
        _net2.default.Socket.prototype.connect.restore();
        t.true(sockConnSpy.calledTwice, 'Socket.connect called twice');
        t.end();
      });
    });
  });
} else {
  // Node 0.10 won't use our safe agent if `forever: true` is
  // used, make sure we don't pool connections there.
  (0, _tape2.default)('Paranoid agents don\'t pool connections', function assert(t) {
    var sockConnSpy = _sinon2.default.spy(_net2.default.Socket.prototype, 'connect');
    var options = { uri: 'http://example.com/', forever: true };
    _index2.default.get(options, function onFirstGet() {
      _index2.default.get(options, function onSecondGet() {
        _net2.default.Socket.prototype.connect.restore();
        t.true(sockConnSpy.calledTwice, 'Socket.connect called twice');
        t.end();
      });
    });
  });
}

// //////
// HTTP module wrapper tests
// //////

(0, _tape2.default)('Normal hostname HTTP module', function (t) {
  var client = _index2.default.httpModule.get('http://example.com/', function (res) {
    t.equal(res.statusCode, 200);
    // Necessary or Node 0.10.x will keep the connections open forever
    // and hang the tests. neat.
    client.destroy();
    t.end();
  });
});

(0, _tape2.default)('Normal hostname HTTPS module', function (t) {
  var client = _index2.default.httpsModule.get('https://example.com/', function (res) {
    t.equal(res.statusCode, 200);
    client.destroy();
    t.end();
  });
});

function assertUnacceptableAddressError(t, err) {
  t.equal(err.message, 'All addresses were blacklisted!', 'Has blacklisted error.');
  t.equal(err.name, 'UnacceptableAddressError', 'Has UnacceptableAddressError error name.');
}

(0, _tape2.default)('Blacklisted hostname HTTP module', function (t) {
  t.plan(2);
  var client = _index2.default.httpModule.get('http://localhost/', function (res) {
    t.fail('Got a response');
    client.destroy();
  }).on('error', function (err) {
    assertUnacceptableAddressError(t, err);
    client.destroy();
  });
});

(0, _tape2.default)('Blacklisted hostname HTTPS module', function (t) {
  t.plan(2);
  var client = _index2.default.httpsModule.get('https://localhost/', function (res) {
    t.fail('Got a response');
    client.destroy();
  }).on('error', function (err) {
    assertUnacceptableAddressError(t, err);
    client.destroy();
  });
});
//# sourceMappingURL=legacy-tests.js.map