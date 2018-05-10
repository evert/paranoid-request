'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.params = undefined;
exports.setupMakeTestParams = setupMakeTestParams;
exports.setupBadTest = setupBadTest;
exports.setupGoodTest = setupGoodTest;

var _xtend = require('xtend');

var _xtend2 = _interopRequireDefault(_xtend);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

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

function setupMakeTestParams(baseParams) {
  return function makeTestParams(name, url) {
    var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    return {
      name: name,
      requestParams: url,
      params: (0, _xtend2.default)(baseParams, params)
    };
  };
}

var baseBadParams = {
  shouldError: true
};

var badUri = {
  errorMessage: 'Invalid URI "/"',
  errorName: 'Error'
};
var badDomain = {
  errorMessage: /^getaddrinfo ENOTFOUND\b/,
  errorName: 'Error',
  errorAssertions: {
    code: 'ENOTFOUND',
    errno: 'ENOTFOUND',
    syscall: 'getaddrinfo'
  }
};
var connectionRefused = {
  errorMessage: /^connect ECONNREFUSED\b/,
  errorName: 'Error',
  errorAssertions: {
    code: 'ECONNREFUSED',
    errno: 'ECONNREFUSED',
    syscall: 'connect'
  }
};
var notFound = {
  statusCode: 404
};

var withOriginalRequest = {
  requester: _request2.default
};

var baseGoodParams = {
  statusCode: 200
};

var params = exports.params = {
  baseBadParams: baseBadParams,
  baseGoodParams: baseGoodParams,

  badDomain: badDomain,
  badUri: badUri,
  connectionRefused: connectionRefused,
  notFound: notFound,
  withOriginalRequest: withOriginalRequest
};

function setupBadTest() {
  return setupMakeTestParams(_xtend2.default.apply(undefined, [baseBadParams].concat(Array.prototype.slice.call(arguments))));
}

function setupGoodTest() {
  return setupMakeTestParams(_xtend2.default.apply(undefined, [baseGoodParams].concat(Array.prototype.slice.call(arguments))));
}
//# sourceMappingURL=test-params.js.map