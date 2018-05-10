'use strict';

var _index = require('../index');

var _index2 = _interopRequireDefault(_index);

var _testUtils = require('./test-utils');

var _testParams = require('./test-params');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var badDomain = _testParams.params.badDomain,
    connectionRefused = _testParams.params.connectionRefused,
    withOriginalRequest = _testParams.params.withOriginalRequest; // Copyright (c) 2016 Uber Technologies, Inc.
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

var badTest = (0, _testParams.setupBadTest)();

var badDomainTest = (0, _testParams.setupBadTest)(badDomain);
var badUnixSocketTest = (0, _testParams.setupBadTest)({
  errorMessage: 'UNIX domain sockets are not allowed'
});
var badPortTest = (0, _testParams.setupBadTest)({
  errorMessage: 'Disallowed port detected'
});

var goodTest = (0, _testParams.setupGoodTest)();

var originalRequestSuccess = (0, _testParams.setupGoodTest)(withOriginalRequest);

var failToConnectToLocalhost = (0, _testParams.setupBadTest)(withOriginalRequest, connectionRefused);

var originalRequestMessage = 'Original requests module is untouched';

var tests = [goodTest('Normal hostname HTTP connection', 'http://example.com/'), goodTest('Normal hostname HTTPS connection', 'https://example.com/'), badTest('Blacklisted hostname HTTP connection', 'http://localhost/'), badTest('Blacklisted hostname HTTPS connection', 'https://localhost/'),

// This is the reason you can't use `options.lookup`, even with the HTTP module.
badTest('Blacklisted IP HTTP connection', 'http://127.0.0.1/'), badTest('Blacklisted IP HTTPS connection', 'https://127.0.0.1/'), badUnixSocketTest('Domain sockets disallowed', 'http://unix:/absolute/path/to/unix.socket:/request/path'), badUnixSocketTest('Domain sockets disallowed HTTPS', 'https://unix:/absolute/path/to/unix.socket:/request/path'), badUnixSocketTest('Domain sockets after redirect disallowed', 'https://httpbin.org/redirect-to?url=http://unix:/absolute/path/to/unix.socket:/request/path'), badTest('Blacklisted hostname after redirect disallowed', 'https://httpbin.org/redirect-to?url=http://localhost/'), badPortTest('Use safe port whitelist by default', 'http://example.com:9999/'), badPortTest('Use safe port whitelist by default HTTPS', 'https://example.com:9999/'), badDomainTest('Non-existent domain != UnacceptableAddress', 'https://foozybarbaz.example.com/'), goodTest('Module-as-function call works', 'http://example.com/', { requester: _index2.default }), failToConnectToLocalhost(originalRequestMessage + ' (https)', 'https://127.0.0.1:1/'), failToConnectToLocalhost(originalRequestMessage + ' (http)', 'http://127.0.0.1:1/'), originalRequestSuccess(originalRequestMessage + ' (example.com)', 'http://example.com/')];

tests.forEach(_testUtils.runTest);

// TODO: how do we test that we didn't subtly mess up HTTPS?
// Are there well-known sites for testing CommonName mismatches and self-signed certs?
//# sourceMappingURL=integration.js.map