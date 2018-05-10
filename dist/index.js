'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; // Copyright (c) 2016 Uber Technologies, Inc.
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

// Largely a copy of Request's index.js file.
/* globals process */


var _semver = require('semver');

var _semver2 = _interopRequireDefault(_semver);

var _extend = require('extend');

var _extend2 = _interopRequireDefault(_extend);

var _helpers = require('request/lib/helpers');

var _helpers2 = _interopRequireDefault(_helpers);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _addr_validator = require('./addr_validator');

var _addr_validator2 = _interopRequireDefault(_addr_validator);

var _http = require('./http');

var _http2 = _interopRequireDefault(_http);

var _https = require('./https');

var _https2 = _interopRequireDefault(_https);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var isFunction = _helpers2.default.isFunction;
var paramsHaveRequestBody = _helpers2.default.paramsHaveRequestBody;

var canUseKeepAlive = _semver2.default.gte(process.version, '0.11.0');

// organize params for patch, post, put, head, del
function initParams(uri, options, callback) {
  if (typeof options === 'function') {
    callback = options;
  }

  var params = {};
  if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
    (0, _extend2.default)(params, options, { uri: uri });
  } else if (typeof uri === 'string') {
    (0, _extend2.default)(params, { uri: uri });
  } else {
    (0, _extend2.default)(params, uri);
  }

  params.callback = callback || params.callback;
  return params;
}

function paranoid(uri, options, callback) {
  if (typeof uri === 'undefined') {
    throw new Error('undefined is not a valid uri or options object.');
  }

  var params = initParams(uri, options, callback);

  if (params.method === 'HEAD' && paramsHaveRequestBody(params)) {
    throw new Error('HTTP HEAD requests MUST NOT include a request body.');
  }

  return new paranoid.Request(params);
}

paranoid.defaults = function paranoidDefaults(options, requester) {
  var self = this;

  options = options || {};

  if (typeof options === 'function') {
    requester = options;
    options = {};
  }

  var defaults = wrapRequestMethod(self, options, requester);

  var verbs = ['get', 'head', 'post', 'put', 'patch', 'del', 'delete'];
  verbs.forEach(function (verb) {
    defaults[verb] = wrapRequestMethod(self[verb], options, requester, verb);
  });

  defaults.cookie = wrapRequestMethod(self.cookie, options, requester);
  defaults.jar = self.jar;
  defaults.defaults = self.defaults;
  return defaults;
};

paranoid.forever = function paranoidForever(agentOptions, optionsArg) {
  var options = {};

  if (optionsArg) {
    (0, _extend2.default)(options, optionsArg);
  }

  if (agentOptions) {
    options.agentOptions = agentOptions;
  }

  options.forever = true;
  return paranoid.defaults(options);
};

function verbFunc(verb) {
  var method = verb.toUpperCase();
  return function (uri, options, callback) {
    var params = initParams(uri, options, callback);
    params.method = method;
    return paranoid(params, params.callback);
  };
}

// define like this to please codeintel/intellisense IDEs
paranoid.get = verbFunc('get');
paranoid.head = verbFunc('head');
paranoid.post = verbFunc('post');
paranoid.put = verbFunc('put');
paranoid.patch = verbFunc('patch');
paranoid.del = verbFunc('delete');
paranoid.delete = verbFunc('delete');

paranoid.jar = _request2.default.jar;
paranoid.cookie = _request2.default.cookie;

function wrapRequestMethod(method, options, requester, verb) {

  return function (uri, opts, callback) {
    var params = initParams(uri, opts, callback);

    var target = {};
    (0, _extend2.default)(true, target, options, params);

    target.pool = params.pool || options.pool;

    if (verb) {
      target.method = verb.toUpperCase();
    }

    if (isFunction(requester)) {
      method = requester;
    }

    return method(target, target.callback);
  };
}

var PatchedRequest = function (_request$Request) {
  _inherits(PatchedRequest, _request$Request);

  function PatchedRequest(options) {
    _classCallCheck(this, PatchedRequest);

    if (!options) {
      options = {};
    }
    if (options.httpModules) {
      throw new Error('Manually setting httpModules is unsupported');
    }
    options.httpModules = {
      'http:': _http2.default,
      'https:': _https2.default
    };
    return _possibleConstructorReturn(this, (PatchedRequest.__proto__ || Object.getPrototypeOf(PatchedRequest)).call(this, options));
  }

  _createClass(PatchedRequest, [{
    key: 'init',
    value: function init(options) {
      if (!options) {
        options = {};
      }

      if (options.agentClass) {
        // This would allow accidentally bypassing the restrictions. Maybe we
        // should check they're using an agent based on ours instead?
        throw new Error('Manually setting agentClass is unsupported');
      }

      // Keep-Alive has to be disabled on 0.10.x because it will use
      // ForeverAgent instead of our patched Agents.
      if (!canUseKeepAlive && options.forever) {
        options.forever = false;
      }

      // Pass through to the original `Request.init`
      return _get(PatchedRequest.prototype.__proto__ || Object.getPrototypeOf(PatchedRequest.prototype), 'init', this).call(this, options);
    }
  }]);

  return PatchedRequest;
}(_request2.default.Request);

paranoid.AddrValidator = _addr_validator2.default;
paranoid.Request = PatchedRequest;
paranoid.initParams = initParams;
paranoid.httpModule = _http2.default;
paranoid.httpsModule = _https2.default;

module.exports = paranoid;
//# sourceMappingURL=index.js.map