'use strict';

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _wrapper_shared = require('./_wrapper_shared');

var _wrapper_shared2 = _interopRequireDefault(_wrapper_shared);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Use our custom connection function that won't need a synchronous DNS lookup
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

function safeConnectionFunc() {
  var args = _net2.default._normalizeConnectArgs(arguments);
  var options = args[0];
  var s = new _net2.default.Socket(args[0]);
  var newOptions = _util2.default._extend({}, options);
  var lookupOpts = { addrValidator: options.addrValidator };
  // do a non-blocking lookup to check if this is a safe host to connect to.
  _wrapper_shared2.default.safeLookup(options.host, lookupOpts, function (err, address, family) {
    // Connect to the resolved IP when we call `sock.connect()` to avoid TOCTOU vulns
    // via DNS rebinding.
    newOptions.host = address;
    // No-op, since we should already be dealing with an IP.
    newOptions.lookup = function (x) {
      return x;
    };
    args[0] = newOptions;
    if (err) {
      s.destroy(err);
      return;
    }
    // looks like everything's kosher, we can really connect now.
    _net2.default.Socket.prototype.connect.apply(s, args);
  });
  return s;
}

var connectionFunc = _wrapper_shared2.default.safeConnectionWrapper(safeConnectionFunc, true);
module.exports = _wrapper_shared2.default.safeModuleWrapper(_http2.default, connectionFunc);
//# sourceMappingURL=http.js.map