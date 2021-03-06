/**
 *
 * Copyright (C) 2011 by crac <![[dawid.kraczkowski[at]gmail[dot]com]]>
 * Thanks for Hardy Keppler<![[Keppler.H[at]online.de]]> for shortened version
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 **/
var JSClass=function(){function t(t,e){for(var n in e)if("extend"!==n&&"static"!==n&&"typeOf"!==n&&"mixin"!==n){if("object"==typeof e[n]||"function"==typeof e[n])return void(t[n]=e[n]);n===n.toUpperCase()?(Object.defineProperty(t,n,{writable:!1,configurable:!1,enumerable:!0,value:e[n]}),Object.defineProperty(t.prototype,n,{writable:!1,configurable:!1,enumerable:!0,value:e[n]})):(Object.defineProperty(t,n,{get:function(){return e[n]},set:function(t){e[n]=t}}),Object.defineProperty(t.prototype,n,{get:function(){return e[n]},set:function(t){e[n]=t}}))}}function e(t,e,n){n=n||!1;for(var r in e)"create"===r&&!n||"typeOf"===r||"mixin"===r||"static"===r||"extend"===r||(t[r]=e[r])}return function(n){var r=!1;return function i(n,o){var f,c=[],u=o.hasOwnProperty("singleton")&&o.singleton,a=function(){if("function"==typeof this.create&&r===!1&&this.create.apply(this,arguments),o.hasOwnProperty("get"))for(var t in o.get){var e="set"in o&&t in o.set?o.set[t]:null;null===e&&Object.defineProperty(this,t,{get:o.get[t]})}if(o.hasOwnProperty("set"))for(var t in o.set){var n="get"in o&&t in o.get?o.get[t]:null;null!==n?Object.defineProperty(this,t,{set:o.set[t],get:o.get[t]}):Object.defineProperty(this,t,{set:o.set[t]})}if(u&&"undefined"!=typeof this)throw new Error("Singleton object cannot have more than one instance, call instance method instead");this.constructor=a};null!==n&&(r=!0,a.prototype=new n,r=!1);var s=a.prototype;return s.typeOf=function(t){if("object"==typeof t)return c.indexOf(t)>=0;if("function"==typeof t){if(this instanceof t)return!0;if(c.indexOf(t)>=0)return!0}return!1},"function"==typeof o&&(o=o()),e(s,o,!0),a["static"]=function(e){return t(a,e),a},a.mixin=function(){for(var t=0,n=arguments.length;n>t;t++){var r=arguments[t];if("function"==typeof r)var i=r.prototype;else{if("object"!=typeof r)throw new Error("js.class mixin method accepts only types: object, function - `"+typeof r+"` type given");var i=r}e(s,i,!1),c.push(r)}return a},u?(a.extend=function(){throw new Error("Singleton class cannot be extended")},a.instance=function(){return f||(u=!1,f=new a,u=!0),f}):a.extend=function(t){return i(this,t)},a}(null,n)}}();