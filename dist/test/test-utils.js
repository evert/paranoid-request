'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.testForErrors = testForErrors;
exports.assertResponse = assertResponse;
exports.runRequestWithParams = runRequestWithParams;
exports.runTest = runTest;

var _tape = require('tape');

var _tape2 = _interopRequireDefault(_tape);

var _index = require('../index');

var _index2 = _interopRequireDefault(_index);

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

function testForErrors(t, err, params) {
  var shouldError = params.shouldError,
      errorMessage = params.errorMessage,
      errorName = params.errorName,
      errorAssertions = params.errorAssertions;


  if (!shouldError) {
    t.equal(err, null, 'Has no request errors');
    return;
  }

  var assertErrorName = errorName || 'UnacceptableAddressError';
  t.equal(err.name, assertErrorName, 'Error name is "' + assertErrorName + '"');

  var assertMessage = errorMessage || 'All addresses were blacklisted!';
  var assertMessageOutput = 'Error message matches "' + assertMessage + '"';
  if (assertMessage instanceof RegExp) {
    t.true(assertMessage.test(err.message), assertMessageOutput);
  } else {
    t.equal(err.message, assertMessage, assertMessageOutput);
  }

  if (errorAssertions) {
    Object.keys(errorAssertions).forEach(function (key) {
      var val = errorAssertions[key];

      t.equal(err[key], val, 'Error property ' + key + ' is ' + val + '.');
    });
  }
}

function assertResponse(params, t, _ref) {
  var err = _ref.err,
      res = _ref.res;

  testForErrors(t, err, params);

  var statusCode = params.statusCode;


  if (statusCode) {
    t.equal(res.statusCode, statusCode, 'Has expected status code');
  }
}

function runRequestWithParams(params, options, cb) {
  if (typeof options === 'function') {
    cb = options;
  }

  var requester = options.requester;


  var testRequester = requester || _index2.default.get;

  testRequester(params, {}, function (err, res, body) {
    cb(null, { err: err, res: res, body: body });
  });
}

function runTest(config) {
  var name = config.name,
      requestParams = config.requestParams,
      params = config.params;


  (0, _tape2.default)(name, function (t) {
    runRequestWithParams(requestParams, params, function (ignoredErr, response) {
      assertResponse(params, t, response);

      t.end();
    });
  });
}
//# sourceMappingURL=test-utils.js.map