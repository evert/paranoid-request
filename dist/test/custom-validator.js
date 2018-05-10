'use strict';

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _xtend = require('xtend');

var _xtend2 = _interopRequireDefault(_xtend);

var _tape = require('tape');

var _tape2 = _interopRequireDefault(_tape);

var _index = require('../index');

var _index2 = _interopRequireDefault(_index);

var _testUtils = require('./test-utils');

var _testParams = require('./test-params');

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

var baseBadParams = _testParams.params.baseBadParams,
    baseGoodParams = _testParams.params.baseGoodParams,
    badUri = _testParams.params.badUri,
    notFound = _testParams.params.notFound;

// example.com's IP

var exampleComIp = '93.184.216.34';
var exampleComCIDR = exampleComIp + '/32';
var exampleComIpURL = 'http://' + exampleComIp + '/';

function runCustomValidatorTest(testParams) {
  var name = testParams.name;


  (0, _tape2.default)(name, function runTest(t) {
    t.plan(5);

    _async2.default.series({
      goodResults: _testUtils.runRequestWithParams.bind(null, exampleComIpURL),
      badResults: _testUtils.runRequestWithParams.bind(null, (0, _xtend2.default)({ uri: exampleComIpURL }, testParams))
    }, function endTest(err, _ref) {
      var goodResults = _ref.goodResults,
          badResults = _ref.badResults;


      t.notOk(err, 'does not have error');

      (0, _testUtils.assertResponse)((0, _xtend2.default)(baseGoodParams, notFound), t, goodResults);

      (0, _testUtils.assertResponse)((0, _xtend2.default)(baseBadParams, badUri), t, badResults);

      t.end();
    });
  });
}

var addrValidator = new _index2.default.AddrValidator({ ipBlacklist: [exampleComCIDR] });

runCustomValidatorTest({
  name: 'Custom AddrValidator works with request',
  addrValidator: addrValidator
});

// Same as above, but with a wrapper instead of explicitly passing `addrValidator`
runCustomValidatorTest({
  name: 'Custom AddrValidator wrapper for request',
  requester: _index2.default.defaults({ addrValidator: addrValidator }).get
});
//# sourceMappingURL=custom-validator.js.map