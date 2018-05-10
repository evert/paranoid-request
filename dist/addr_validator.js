'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Copyright (c) 2016 Uber Technologies, Inc.
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

var _ip = require('ip');

var _ip2 = _interopRequireDefault(_ip);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// `ip.isPrivate()` is pretty jank, let's use our own list of "private" CIDRs
// Mix of addresses from ipaddress.py and SafeCurl, thank ya @fin1te!
var privateCIDRs = ['0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10', '127.0.0.0/8', '169.254.0.0/16', '172.16.0.0/12', '192.0.0.0/29', '192.0.0.170/31', '192.0.2.0/24', '192.88.99.0/24', '192.168.0.0/16', '198.18.0.0/15', '198.51.100.0/24', '203.0.113.0/24', '224.0.0.0/4', '240.0.0.0/4', '255.255.255.255/32'].map(_ip2.default.cidrSubnet);

var AddrValidator = function () {
  function AddrValidator() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, AddrValidator);

    if (options.portBlacklist && options.portBlacklist.length && options.portWhitelist && options.portWhitelist.length) {
      throw new Error('Only support port whitelist or blacklist, not both!');
    }

    if (options.portWhitelist === undefined) {
      options.portWhitelist = this.DEFAULT_PORT_WHITELIST.slice();
    }

    this.ipBlacklist = (options.ipBlacklist || []).map(maybeParseCIDR);
    this.ipWhitelist = (options.ipWhitelist || []).map(maybeParseCIDR);
    this.portBlacklist = options.portBlacklist || [];
    this.portWhitelist = options.portWhitelist || [];
    // Maybe later.
    // if (options.autodetectLocalAddresses === undefined) {
    //   this.autodetectLocalAddresses = true;
    // } else {
    //   this.autodetectLocalAddresses = options.autodetectLocalAddresses;
    // }
  }

  _createClass(AddrValidator, [{
    key: 'isSafeIP',
    value: function isSafeIP(address) {
      // IPv6 get out.
      if (!address || !_ip2.default.isV4Format(address)) {
        return false;
      }

      // The whitelist can be used to punch holes in the blacklist
      var whitelisted = this.ipWhitelist.some(function (cidr) {
        return cidr.contains(address);
      });
      if (whitelisted) {
        return true;
      }

      // Return any private or specifically blacklisted IPs
      return !privateCIDRs.concat(this.ipBlacklist).some(function (cidr) {
        return cidr.contains(address);
      });
    }
  }, {
    key: 'isSafePort',
    value: function isSafePort(port) {
      if (typeof port !== 'number') {
        return false;
      } else if (port > 65535 || port < 1) {
        return false;
      } else if (this.portWhitelist.length) {
        return this.portWhitelist.indexOf(port) !== -1;
      } else if (this.portBlacklist.length) {
        return this.portBlacklist.indexOf(port) === -1;
      }
      return true;
    }
  }]);

  return AddrValidator;
}();

function maybeParseCIDR(ipAddr) {
  if (typeof ipAddr === 'string') {
    return _ip2.default.cidrSubnet(ipAddr);
  }

  return ipAddr;
}

// An assortment of common HTTPS? ports.
AddrValidator.prototype.DEFAULT_PORT_WHITELIST = [80, 8080, 443, 8443, 8000];

module.exports = AddrValidator;
//# sourceMappingURL=addr_validator.js.map