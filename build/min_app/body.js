'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 *
 */

(function (window, document) {
    'use strict';

    // Exits early if all IntersectionObserver and IntersectionObserverEntry
    // features are natively supported.

    if ('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype) {

        // Minimal polyfill for Edge 15's lack of `isIntersecting`
        // See: https://github.com/w3c/IntersectionObserver/issues/211
        if (!('isIntersecting' in window.IntersectionObserverEntry.prototype)) {
            Object.defineProperty(window.IntersectionObserverEntry.prototype, 'isIntersecting', {
                get: function get() {
                    return this.intersectionRatio > 0;
                }
            });
        }
        return;
    }

    /**
     * An IntersectionObserver registry. This registry exists to hold a strong
     * reference to IntersectionObserver instances currently observering a target
     * element. Without this registry, instances without another reference may be
     * garbage collected.
     */
    var registry = [];

    /**
     * Creates the global IntersectionObserverEntry constructor.
     * https://w3c.github.io/IntersectionObserver/#intersection-observer-entry
     * @param {Object} entry A dictionary of instance properties.
     * @constructor
     */
    function IntersectionObserverEntry(entry) {
        this.time = entry.time;
        this.target = entry.target;
        this.rootBounds = entry.rootBounds;
        this.boundingClientRect = entry.boundingClientRect;
        this.intersectionRect = entry.intersectionRect || getEmptyRect();
        this.isIntersecting = !!entry.intersectionRect;

        // Calculates the intersection ratio.
        var targetRect = this.boundingClientRect;
        var targetArea = targetRect.width * targetRect.height;
        var intersectionRect = this.intersectionRect;
        var intersectionArea = intersectionRect.width * intersectionRect.height;

        // Sets intersection ratio.
        if (targetArea) {
            this.intersectionRatio = intersectionArea / targetArea;
        } else {
            // If area is zero and is intersecting, sets to 1, otherwise to 0
            this.intersectionRatio = this.isIntersecting ? 1 : 0;
        }
    }

    /**
     * Creates the global IntersectionObserver constructor.
     * https://w3c.github.io/IntersectionObserver/#intersection-observer-interface
     * @param {Function} callback The function to be invoked after intersection
     *     changes have queued. The function is not invoked if the queue has
     *     been emptied by calling the `takeRecords` method.
     * @param {Object=} opt_options Optional configuration options.
     * @constructor
     */
    function IntersectionObserver(callback, opt_options) {

        var options = opt_options || {};

        if (typeof callback != 'function') {
            throw new Error('callback must be a function');
        }

        if (options.root && options.root.nodeType != 1) {
            throw new Error('root must be an Element');
        }

        // Binds and throttles `this._checkForIntersections`.
        this._checkForIntersections = throttle(this._checkForIntersections.bind(this), this.THROTTLE_TIMEOUT);

        // Private properties.
        this._callback = callback;
        this._observationTargets = [];
        this._queuedEntries = [];
        this._rootMarginValues = this._parseRootMargin(options.rootMargin);

        // Public properties.
        this.thresholds = this._initThresholds(options.threshold);
        this.root = options.root || null;
        this.rootMargin = this._rootMarginValues.map(function (margin) {
            return margin.value + margin.unit;
        }).join(' ');
    }

    /**
     * The minimum interval within which the document will be checked for
     * intersection changes.
     */
    IntersectionObserver.prototype.THROTTLE_TIMEOUT = 100;

    /**
     * The frequency in which the polyfill polls for intersection changes.
     * this can be updated on a per instance basis and must be set prior to
     * calling `observe` on the first target.
     */
    IntersectionObserver.prototype.POLL_INTERVAL = null;

    /**
     * Use a mutation observer on the root element
     * to detect intersection changes.
     */
    IntersectionObserver.prototype.USE_MUTATION_OBSERVER = true;

    /**
     * Starts observing a target element for intersection changes based on
     * the thresholds values.
     * @param {Element} target The DOM element to observe.
     */
    IntersectionObserver.prototype.observe = function (target) {
        var isTargetAlreadyObserved = this._observationTargets.some(function (item) {
            return item.element == target;
        });

        if (isTargetAlreadyObserved) {
            return;
        }

        if (!(target && target.nodeType == 1)) {
            throw new Error('target must be an Element');
        }

        this._registerInstance();
        this._observationTargets.push({ element: target, entry: null });
        this._monitorIntersections();
        this._checkForIntersections();
    };

    /**
     * Stops observing a target element for intersection changes.
     * @param {Element} target The DOM element to observe.
     */
    IntersectionObserver.prototype.unobserve = function (target) {
        this._observationTargets = this._observationTargets.filter(function (item) {

            return item.element != target;
        });
        if (!this._observationTargets.length) {
            this._unmonitorIntersections();
            this._unregisterInstance();
        }
    };

    /**
     * Stops observing all target elements for intersection changes.
     */
    IntersectionObserver.prototype.disconnect = function () {
        this._observationTargets = [];
        this._unmonitorIntersections();
        this._unregisterInstance();
    };

    /**
     * Returns any queue entries that have not yet been reported to the
     * callback and clears the queue. This can be used in conjunction with the
     * callback to obtain the absolute most up-to-date intersection information.
     * @return {Array} The currently queued entries.
     */
    IntersectionObserver.prototype.takeRecords = function () {
        var records = this._queuedEntries.slice();
        this._queuedEntries = [];
        return records;
    };

    /**
     * Accepts the threshold value from the user configuration object and
     * returns a sorted array of unique threshold values. If a value is not
     * between 0 and 1 and error is thrown.
     * @private
     * @param {Array|number=} opt_threshold An optional threshold value or
     *     a list of threshold values, defaulting to [0].
     * @return {Array} A sorted list of unique and valid threshold values.
     */
    IntersectionObserver.prototype._initThresholds = function (opt_threshold) {
        var threshold = opt_threshold || [0];
        if (!Array.isArray(threshold)) threshold = [threshold];

        return threshold.sort().filter(function (t, i, a) {
            if (typeof t != 'number' || isNaN(t) || t < 0 || t > 1) {
                throw new Error('threshold must be a number between 0 and 1 inclusively');
            }
            return t !== a[i - 1];
        });
    };

    /**
     * Accepts the rootMargin value from the user configuration object
     * and returns an array of the four margin values as an object containing
     * the value and unit properties. If any of the values are not properly
     * formatted or use a unit other than px or %, and error is thrown.
     * @private
     * @param {string=} opt_rootMargin An optional rootMargin value,
     *     defaulting to '0px'.
     * @return {Array<Object>} An array of margin objects with the keys
     *     value and unit.
     */
    IntersectionObserver.prototype._parseRootMargin = function (opt_rootMargin) {
        var marginString = opt_rootMargin || '0px';
        var margins = marginString.split(/\s+/).map(function (margin) {
            var parts = /^(-?\d*\.?\d+)(px|%)$/.exec(margin);
            if (!parts) {
                throw new Error('rootMargin must be specified in pixels or percent');
            }
            return { value: parseFloat(parts[1]), unit: parts[2] };
        });

        // Handles shorthand.
        margins[1] = margins[1] || margins[0];
        margins[2] = margins[2] || margins[0];
        margins[3] = margins[3] || margins[1];

        return margins;
    };

    /**
     * Starts polling for intersection changes if the polling is not already
     * happening, and if the page's visibilty state is visible.
     * @private
     */
    IntersectionObserver.prototype._monitorIntersections = function () {
        if (!this._monitoringIntersections) {
            this._monitoringIntersections = true;

            // If a poll interval is set, use polling instead of listening to
            // resize and scroll events or DOM mutations.
            if (this.POLL_INTERVAL) {
                this._monitoringInterval = setInterval(this._checkForIntersections, this.POLL_INTERVAL);
            } else {
                addEvent(window, 'resize', this._checkForIntersections, true);
                addEvent(document, 'scroll', this._checkForIntersections, true);

                if (this.USE_MUTATION_OBSERVER && 'MutationObserver' in window) {
                    this._domObserver = new MutationObserver(this._checkForIntersections);
                    this._domObserver.observe(document, {
                        attributes: true,
                        childList: true,
                        characterData: true,
                        subtree: true
                    });
                }
            }
        }
    };

    /**
     * Stops polling for intersection changes.
     * @private
     */
    IntersectionObserver.prototype._unmonitorIntersections = function () {
        if (this._monitoringIntersections) {
            this._monitoringIntersections = false;

            clearInterval(this._monitoringInterval);
            this._monitoringInterval = null;

            removeEvent(window, 'resize', this._checkForIntersections, true);
            removeEvent(document, 'scroll', this._checkForIntersections, true);

            if (this._domObserver) {
                this._domObserver.disconnect();
                this._domObserver = null;
            }
        }
    };

    /**
     * Scans each observation target for intersection changes and adds them
     * to the internal entries queue. If new entries are found, it
     * schedules the callback to be invoked.
     * @private
     */
    IntersectionObserver.prototype._checkForIntersections = function () {
        var rootIsInDom = this._rootIsInDom();
        var rootRect = rootIsInDom ? this._getRootRect() : getEmptyRect();

        this._observationTargets.forEach(function (item) {
            var target = item.element;
            var targetRect = getBoundingClientRect(target);
            var rootContainsTarget = this._rootContainsTarget(target);
            var oldEntry = item.entry;
            var intersectionRect = rootIsInDom && rootContainsTarget && this._computeTargetAndRootIntersection(target, rootRect);

            var newEntry = item.entry = new IntersectionObserverEntry({
                time: now(),
                target: target,
                boundingClientRect: targetRect,
                rootBounds: rootRect,
                intersectionRect: intersectionRect
            });

            if (!oldEntry) {
                this._queuedEntries.push(newEntry);
            } else if (rootIsInDom && rootContainsTarget) {
                // If the new entry intersection ratio has crossed any of the
                // thresholds, add a new entry.
                if (this._hasCrossedThreshold(oldEntry, newEntry)) {
                    this._queuedEntries.push(newEntry);
                }
            } else {
                // If the root is not in the DOM or target is not contained within
                // root but the previous entry for this target had an intersection,
                // add a new record indicating removal.
                if (oldEntry && oldEntry.isIntersecting) {
                    this._queuedEntries.push(newEntry);
                }
            }
        }, this);

        if (this._queuedEntries.length) {
            this._callback(this.takeRecords(), this);
        }
    };

    /**
     * Accepts a target and root rect computes the intersection between then
     * following the algorithm in the spec.
     * TODO(philipwalton): at this time clip-path is not considered.
     * https://w3c.github.io/IntersectionObserver/#calculate-intersection-rect-algo
     * @param {Element} target The target DOM element
     * @param {Object} rootRect The bounding rect of the root after being
     *     expanded by the rootMargin value.
     * @return {?Object} The final intersection rect object or undefined if no
     *     intersection is found.
     * @private
     */
    IntersectionObserver.prototype._computeTargetAndRootIntersection = function (target, rootRect) {

        // If the element isn't displayed, an intersection can't happen.
        if (window.getComputedStyle(target).display == 'none') return;

        var targetRect = getBoundingClientRect(target);
        var intersectionRect = targetRect;
        var parent = getParentNode(target);
        var atRoot = false;

        while (!atRoot) {
            var parentRect = null;
            var parentComputedStyle = parent.nodeType == 1 ? window.getComputedStyle(parent) : {};

            // If the parent isn't displayed, an intersection can't happen.
            if (parentComputedStyle.display == 'none') return;

            if (parent == this.root || parent == document) {
                atRoot = true;
                parentRect = rootRect;
            } else {
                // If the element has a non-visible overflow, and it's not the <body>
                // or <html> element, update the intersection rect.
                // Note: <body> and <html> cannot be clipped to a rect that's not also
                // the document rect, so no need to compute a new intersection.
                if (parent != document.body && parent != document.documentElement && parentComputedStyle.overflow != 'visible') {
                    parentRect = getBoundingClientRect(parent);
                }
            }

            // If either of the above conditionals set a new parentRect,
            // calculate new intersection data.
            if (parentRect) {
                intersectionRect = computeRectIntersection(parentRect, intersectionRect);

                if (!intersectionRect) break;
            }
            parent = getParentNode(parent);
        }
        return intersectionRect;
    };

    /**
     * Returns the root rect after being expanded by the rootMargin value.
     * @return {Object} The expanded root rect.
     * @private
     */
    IntersectionObserver.prototype._getRootRect = function () {
        var rootRect;
        if (this.root) {
            rootRect = getBoundingClientRect(this.root);
        } else {
            // Use <html>/<body> instead of window since scroll bars affect size.
            var html = document.documentElement;
            var body = document.body;
            rootRect = {
                top: 0,
                left: 0,
                right: html.clientWidth || body.clientWidth,
                width: html.clientWidth || body.clientWidth,
                bottom: html.clientHeight || body.clientHeight,
                height: html.clientHeight || body.clientHeight
            };
        }
        return this._expandRectByRootMargin(rootRect);
    };

    /**
     * Accepts a rect and expands it by the rootMargin value.
     * @param {Object} rect The rect object to expand.
     * @return {Object} The expanded rect.
     * @private
     */
    IntersectionObserver.prototype._expandRectByRootMargin = function (rect) {
        var margins = this._rootMarginValues.map(function (margin, i) {
            return margin.unit == 'px' ? margin.value : margin.value * (i % 2 ? rect.width : rect.height) / 100;
        });
        var newRect = {
            top: rect.top - margins[0],
            right: rect.right + margins[1],
            bottom: rect.bottom + margins[2],
            left: rect.left - margins[3]
        };
        newRect.width = newRect.right - newRect.left;
        newRect.height = newRect.bottom - newRect.top;

        return newRect;
    };

    /**
     * Accepts an old and new entry and returns true if at least one of the
     * threshold values has been crossed.
     * @param {?IntersectionObserverEntry} oldEntry The previous entry for a
     *    particular target element or null if no previous entry exists.
     * @param {IntersectionObserverEntry} newEntry The current entry for a
     *    particular target element.
     * @return {boolean} Returns true if a any threshold has been crossed.
     * @private
     */
    IntersectionObserver.prototype._hasCrossedThreshold = function (oldEntry, newEntry) {

        // To make comparing easier, an entry that has a ratio of 0
        // but does not actually intersect is given a value of -1
        var oldRatio = oldEntry && oldEntry.isIntersecting ? oldEntry.intersectionRatio || 0 : -1;
        var newRatio = newEntry.isIntersecting ? newEntry.intersectionRatio || 0 : -1;

        // Ignore unchanged ratios
        if (oldRatio === newRatio) return;

        for (var i = 0; i < this.thresholds.length; i++) {
            var threshold = this.thresholds[i];

            // Return true if an entry matches a threshold or if the new ratio
            // and the old ratio are on the opposite sides of a threshold.
            if (threshold == oldRatio || threshold == newRatio || threshold < oldRatio !== threshold < newRatio) {
                return true;
            }
        }
    };

    /**
     * Returns whether or not the root element is an element and is in the DOM.
     * @return {boolean} True if the root element is an element and is in the DOM.
     * @private
     */
    IntersectionObserver.prototype._rootIsInDom = function () {
        return !this.root || containsDeep(document, this.root);
    };

    /**
     * Returns whether or not the target element is a child of root.
     * @param {Element} target The target element to check.
     * @return {boolean} True if the target element is a child of root.
     * @private
     */
    IntersectionObserver.prototype._rootContainsTarget = function (target) {
        return containsDeep(this.root || document, target);
    };

    /**
     * Adds the instance to the global IntersectionObserver registry if it isn't
     * already present.
     * @private
     */
    IntersectionObserver.prototype._registerInstance = function () {
        if (registry.indexOf(this) < 0) {
            registry.push(this);
        }
    };

    /**
     * Removes the instance from the global IntersectionObserver registry.
     * @private
     */
    IntersectionObserver.prototype._unregisterInstance = function () {
        var index = registry.indexOf(this);
        if (index != -1) registry.splice(index, 1);
    };

    /**
     * Returns the result of the performance.now() method or null in browsers
     * that don't support the API.
     * @return {number} The elapsed time since the page was requested.
     */
    function now() {
        return window.performance && performance.now && performance.now();
    }

    /**
     * Throttles a function and delays its executiong, so it's only called at most
     * once within a given time period.
     * @param {Function} fn The function to throttle.
     * @param {number} timeout The amount of time that must pass before the
     *     function can be called again.
     * @return {Function} The throttled function.
     */
    function throttle(fn, timeout) {
        var timer = null;
        return function () {
            if (!timer) {
                timer = setTimeout(function () {
                    fn();
                    timer = null;
                }, timeout);
            }
        };
    }

    /**
     * Adds an event handler to a DOM node ensuring cross-browser compatibility.
     * @param {Node} node The DOM node to add the event handler to.
     * @param {string} event The event name.
     * @param {Function} fn The event handler to add.
     * @param {boolean} opt_useCapture Optionally adds the even to the capture
     *     phase. Note: this only works in modern browsers.
     */
    function addEvent(node, event, fn, opt_useCapture) {
        if (typeof node.addEventListener == 'function') {
            node.addEventListener(event, fn, opt_useCapture || false);
        } else if (typeof node.attachEvent == 'function') {
            node.attachEvent('on' + event, fn);
        }
    }

    /**
     * Removes a previously added event handler from a DOM node.
     * @param {Node} node The DOM node to remove the event handler from.
     * @param {string} event The event name.
     * @param {Function} fn The event handler to remove.
     * @param {boolean} opt_useCapture If the event handler was added with this
     *     flag set to true, it should be set to true here in order to remove it.
     */
    function removeEvent(node, event, fn, opt_useCapture) {
        if (typeof node.removeEventListener == 'function') {
            node.removeEventListener(event, fn, opt_useCapture || false);
        } else if (typeof node.detatchEvent == 'function') {
            node.detatchEvent('on' + event, fn);
        }
    }

    /**
     * Returns the intersection between two rect objects.
     * @param {Object} rect1 The first rect.
     * @param {Object} rect2 The second rect.
     * @return {?Object} The intersection rect or undefined if no intersection
     *     is found.
     */
    function computeRectIntersection(rect1, rect2) {
        var top = Math.max(rect1.top, rect2.top);
        var bottom = Math.min(rect1.bottom, rect2.bottom);
        var left = Math.max(rect1.left, rect2.left);
        var right = Math.min(rect1.right, rect2.right);
        var width = right - left;
        var height = bottom - top;

        return width >= 0 && height >= 0 && {
            top: top,
            bottom: bottom,
            left: left,
            right: right,
            width: width,
            height: height
        };
    }

    /**
     * Shims the native getBoundingClientRect for compatibility with older IE.
     * @param {Element} el The element whose bounding rect to get.
     * @return {Object} The (possibly shimmed) rect of the element.
     */
    function getBoundingClientRect(el) {
        var rect;

        try {
            rect = el.getBoundingClientRect();
        } catch (err) {
            // Ignore Windows 7 IE11 "Unspecified error"
            // https://github.com/w3c/IntersectionObserver/pull/205
        }

        if (!rect) return getEmptyRect();

        // Older IE
        if (!(rect.width && rect.height)) {
            rect = {
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                left: rect.left,
                width: rect.right - rect.left,
                height: rect.bottom - rect.top
            };
        }
        return rect;
    }

    /**
     * Returns an empty rect object. An empty rect is returned when an element
     * is not in the DOM.
     * @return {Object} The empty rect.
     */
    function getEmptyRect() {
        return {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            width: 0,
            height: 0
        };
    }

    /**
     * Checks to see if a parent element contains a child elemnt (including inside
     * shadow DOM).
     * @param {Node} parent The parent element.
     * @param {Node} child The child element.
     * @return {boolean} True if the parent node contains the child node.
     */
    function containsDeep(parent, child) {
        var node = child;
        while (node) {
            if (node == parent) return true;

            node = getParentNode(node);
        }
        return false;
    }

    /**
     * Gets the parent node of an element or its host element if the parent node
     * is a shadow root.
     * @param {Node} node The node whose parent to get.
     * @return {Node|null} The parent node or null if no parent exists.
     */
    function getParentNode(node) {
        var parent = node.parentNode;

        if (parent && parent.nodeType == 11 && parent.host) {
            // If the parent is a shadow root, return the host element.
            return parent.host;
        }
        return parent;
    }

    // Exposes the constructors globally.
    window.IntersectionObserver = IntersectionObserver;
    window.IntersectionObserverEntry = IntersectionObserverEntry;
})(window, document);

var app = angular.module('paladinApp', ['ui.router', 'ngMeta', 'zendeskWidget', 'pascalprecht.translate', 'paladinPopups', 'angularReverseGeocode', 'ngLocationUpdate', 'ngMaterial', 'ngMessages', 'material.svgAssetsCache', 'ngCookies', 'uiGmapgoogle-maps', 'ngMap', 'base64', 'ngRoute', 'angularMoment', 'ngMaterialDateRangePicker', 'credit-cards', 'jkAngularRatingStars']);
app.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', '$locationProvider', 'ZendeskWidgetProvider', '$mdThemingProvider', 'enums', function ($stateProvider, $urlRouterProvider, $httpProvider, $locationProvider, ZendeskWidgetProvider, $mdThemingProvider, enums) {

    var paladinTheme = $mdThemingProvider.extendPalette('green', {
        '500': '#69C187',
        '200': '#01b3eb',
        'A200': 'rgba(255,255,255,0.05)',
        'A300': '#484848',
        'A400': 'rgba(72,72,72,0.5)',
        'A500': '#ffffff',
        'A600': '#f6f6f6',
        'A700': '#000'
    });
    var rentOrderStatusTheme = $mdThemingProvider.definePalette('rentOrderStatusTheme', {
        '50': '#69C187', //available,
        '100': '#fb814a', // requested
        '200': '#ee4e4a', // timeout / canceled (pre accept) / canceled by lender / canceled by borrower / declined
        '300': '#4ec07e', // accepted
        '400': '#0d87f6', // started
        '500': '#8d72f4', // ended
        '600': '#fff', // not in use (must have for palette definition)
        '700': '#fff', // not in use (must have for palette definition)
        '800': '#fff', // not in use (must have for palette definition)
        '900': '#fff', // not in use (must have for palette definition)
        'A100': '#fff', // not in use (must have for palette definition)
        'A200': '#fff', // not in use (must have for palette definition)
        'A400': '#fff', // not in use (must have for palette definition)
        'A700': '#000000' // not in use (must have for palette definition)
    });
    $mdThemingProvider.definePalette('paladinTheme', paladinTheme);

    $mdThemingProvider.theme('default').primaryPalette('paladinTheme').accentPalette('paladinTheme');

    $mdThemingProvider.theme('rentOrderStatus').primaryPalette('rentOrderStatusTheme').accentPalette('rentOrderStatusTheme');

    ZendeskWidgetProvider.init({
        accountUrl: 'paladintrue.zendesk.com',
        beforePageLoad: function beforePageLoad(zE) {
            zE.hide();
        }
        // See below for more settings
    });
    //in URL patterns this ocde will disable # and ! before path name
    $locationProvider.html5Mode(true);
    /*
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
    */
    delete $httpProvider.defaults.headers.common['X-Requested-With'];

    $stateProvider.state('app', {
        url: '/:languageCode',
        templateUrl: './views/routes/app.html',
        controller: 'appController',
        isPublic: true,
        abstract: true,
        params: {
            languageCode: localStorage.getItem(enums.localStorageKeys.preferredLanguage) || 'it'
        }
    }).state('app.home', {
        url: '/',
        templateUrl: './views/routes/homeV2.html',
        controller: 'homeV2Controller',
        isPublic: true,
        data: {
            isCollapsingHeader: true
        },
        resolve: {
            validReferralCode: function validReferralCode() {
                return false;
            }
        }
    }).state('app.emailVerification', {
        url: '/email-validation',
        templateUrl: './views/routes/homeV2.html',
        controller: 'homeV2Controller',
        isPublic: true,
        data: {
            isCollapsingHeader: true
        }
    }).state('app.referredRegistration', {
        url: '/r/:referralNameCode',
        templateUrl: './views/routes/homeV2.html',
        controller: 'homeV2Controller',
        isPublic: true,
        resolve: {
            validReferralCode: ['$stateParams', 'appStateManager', 'referralsService', function ($stateParams, appStateManager, referralsService) {
                // console.log('###### ', $stateParams.referralNameCode, ' .. ', appStateManager, ' .. ' , referralsService)
                return referralsService.validateReferralCode($stateParams.referralNameCode);
            }]
        }
    }).state('app.browse', {
        url: '/categorie/:category/:subCategory/:city?search&sortBy&pageIndex',
        templateUrl: './views/routes/home.html',
        controller: 'homeController',
        reloadOnSearch: false,
        isPublic: true,
        isCustomSEO: true,
        params: {
            category: { squash: true, value: null },
            subCategory: { squash: true, value: null },
            city: { squash: true, value: null },
            search: { squash: true, value: null },
            sortBy: { squash: true, value: null },
            pageIndex: { squash: true, value: null },
            isTryAndBuy: true,
            isResetSearch: false
        }
    }).state('app.browsePrivate', {
        url: '/categorie/privato/:category/:subCategory/:city?search&sortBy&pageIndex',
        templateUrl: './views/routes/home.html',
        controller: 'homeController',
        reloadOnSearch: false,
        isPublic: true,
        isCustomSEO: true,
        params: {
            category: { squash: true, value: null },
            subCategory: { squash: true, value: null },
            city: { squash: true, value: null },
            search: { squash: true, value: null },
            sortBy: { squash: true, value: null },
            pageIndex: { squash: true, value: null },
            isTryAndBuy: false,
            isResetSearch: false
        }
    }).state('app.products', {
        url: '/product',
        abstract: true
    })
    // .state('app.blog', {
    //     url: '/blog',
    // })
    .state('app.products.selectedProduct', {
        url: '/:productNameAndId',
        templateUrl: './views/routes/productDetailed.html',
        controller: 'productDetailedController',
        isPublic: true,
        params: {
            productNameAndId: undefined,
            productId: 0
        }
    }).state('app.products.newProduct', {
        url: '/new',
        templateUrl: './views/routes/newProduct.html',
        controller: 'newProductController'
    }).state('app.products.productReview', {
        url: '/review/:bookingId',
        templateUrl: './views/routes/productReview.html',
        controller: 'productReviewController',
        isPublic: true,
        resolve: {
            prereqData: ['$stateParams', 'appStateManager', function ($stateParams, appStateManager) {
                // collect and validate transaction details
                console.log('$state productReview params', $stateParams);

                return {
                    userId: $stateParams.Borrower_Id,
                    productId: null,
                    currentLang: appStateManager.getCurrentLang()
                };
            }]
        }
    })

    // .state('app.products.selectedProduct', {
    //         url: '/:productId',
    //         templateUrl:'./views/routes/productPreview.html',
    //         controller:'PreviewController'
    //     });
    .state('app.profiles', {
        url: '/profiles',
        abstract: true
    }).state('app.profiles.myProfile', {
        url: '/myProfile',
        templateUrl: './views/routes/userProfile.html',
        controller: 'userProfileController',
        params: {
            userId: null
        }
    }).state('app.profiles.publicProfile', {
        url: '/:userId',
        templateUrl: './views/routes/userProfile.html',
        controller: 'userProfileController',
        isPublic: true,
        params: {
            userId: null
        }
    }).state('app.myListings', {
        url: '/myListings',
        templateUrl: './views/routes/myListings.html',
        controller: 'myListingsController',
        isPublic: true
    }).state('app.bookings', {
        url: '/my-rentals',
        abstract: true
    }).state('app.bookings.userBookings', {
        url: '',
        templateUrl: './views/routes/userBookings.html',
        controller: 'userBookingsController'
    }).state('app.bookings.bookingDetailed', {
        url: '/:bookingId',
        templateUrl: './views/routes/bookingDetailed.html',
        controller: 'bookingDetailedController',
        params: {
            bookingId: null
        }
    }).state('app.bookings.paymentDetailed', {
        url: '/payment',
        templateUrl: './views/routes/paymentDetailed.html',
        controller: 'paymentDetailedController',
        params: {
            productId: { squash: true, value: null },
            startDate: { squash: true, value: null },
            endDate: { squash: true, value: null },
            purchase: { squash: true, value: null },
            bookingId: { squash: true, value: null }
        }
    }).state('verification', {
        url: '/:languageCode/verification',
        params: {
            languageCode: localStorage.getItem(enums.localStorageKeys.preferredLanguage) || 'it'
        },
        template: '<div ui-view flex="100" layout="row" layout-align="start center" layout-fill></div>'
    }).state('verification.user', {
        url: '/verifyMe/:bookingId',
        templateUrl: './views/routes/userVerification.html',
        controller: 'userVerificationController',
        params: {
            bookingId: null
        }
    }).state('app.chat', {
        url: '/messaging/:chatId',
        params: {
            languageCode: localStorage.getItem(enums.localStorageKeys.preferredLanguage) || 'it',
            chatId: null
        },
        templateUrl: './views/routes/chat.html',
        controller: 'chatController',
        data: {
            isHeaderHidden: true
        }
    });

    // Force urls with lang code
    $urlRouterProvider.rule(function ($injector, $location) {
        //what this function returns will be set as the $location.url
        var path = $location.path(),
            langCode = path.split('/')[1],
            // 0 is "" cuz path begins with /
        lang = window.globals.SUPPORTED_LANGS.find(function (lang) {
            return lang.code === langCode.toLowerCase();
        });
        if (!lang) {
            // Return url appended by lang code
            return '/' + (localStorage.getItem(enums.localStorageKeys.preferredLanguage) || 'it') + path;
        } else {
            if (lang.code != localStorage.getItem(enums.localStorageKeys.preferredLanguage)) {
                // $rootScope.$emit(enums.busEvents.preferredLanguageChange,{currentLang: lang});
                // return
                localStorage.setItem(enums.localStorageKeys.preferredLanguage, lang.code);
                location.reload();
                return path.replace(langCode, lang.code);
            }
        }
    });
    // Default route case doesn't exit
    $urlRouterProvider.otherwise(function ($injector, $location) {
        if ($location.path().includes('/blog')) return;
        var path = $location.path(),
            langCode = path.split('/')[1],
            // 0 is "" cuz path begins with /
        lang = window.globals.SUPPORTED_LANGS.find(function (lang) {
            return lang.code === langCode.toLowerCase();
        });
        return '/' + (localStorage.getItem(enums.localStorageKeys.preferredLanguage) || lang || 'it') + '/';
    });
}]).run(['ngMeta', '$window', '$rootScope', '$location', 'facebook', 'enums', '$trace', '$transitions', '$state', 'navigationService', 'dataService', 'chatService', 'appStateManager', function (ngMeta, $window, $rootScope, $location, facebook, enums, $trace, $transitions, $state, navigationService, dataService, chatService, appStateManager) {
    ngMeta.init();
    dataService.init();
    chatService.init();

    $rootScope.facebook_user = {};
    $rootScope.facebookApiLoaded = false;
    $rootScope.$emit(enums.busEvents.facebookApiLoad, { isLoaded: false });
    $window.fbAsyncInit = function () {
        FB.init({
            appId: '1156274361103964',
            channelUrl: 'app/channel.html',
            status: true,
            cookie: true,
            xfbml: true,
            version: 'v2.12'
        });

        FB.Event.subscribe('auth.authResponseChange', function (res) {
            if (res.status === 'connected') {
                FB.api('/me', {
                    fields: ['first_name', 'last_name', 'email', 'id', 'address', 'location', 'name']
                }, function (res) {
                    $rootScope.$emit(enums.busEvents.facebookApiLoad, { isLoaded: true });
                    $rootScope.$apply(function () {
                        $rootScope.facebook_user = res;
                        $rootScope.facebookApiLoaded = true;
                    });
                });
            }
        });
    };

    $rootScope.stateData = {
        isCollapsingHeader: true,
        isHeaderHidden: false
    };

    if (!window.globals.isProd()) {
        $trace.enable('TRANSITION');
        $transitions.onStart({}, function (trans) {
            console.log('$transitions.onStart', trans);
        });
        $rootScope.$on('$stateChangeStart', function () {
            console.log('$stateChangeStart', arguments);
        });
    }

    // Redirect for non public routes
    $transitions.onBefore({}, function (trans) {
        var nextState = trans.to();
        if (!nextState.isPublic && !appStateManager.getUserId()) {
            dataService.forceLogin(trans);
            return trans.router.stateService.target('app.home');
        }
    });

    $transitions.onSuccess({}, function (trans) {
        var nextState = trans.to();
        $rootScope.isMenuOpen = { value: false };
        $rootScope.currentState = { value: $state.current.name };

        if ($state.current.data) {
            $rootScope.stateData.isCollapsingHeader = $state.current.data.isCollapsingHeader || false;
            $rootScope.stateData.isHeaderHidden = $state.current.data.isHeaderHidden || false;
        }

        // Update update SEO if controller doesn't override it
        if (!nextState.isCustomSEO) dataService.updateGeneralSEO();
    });
}]);

angular.module('paladinApp').factory('facebook', function () {
    var facebookService = {};

    facebookService.GetFacebook = function () {
        var _self = this;

        FB.Event.subscribe('auth.statuschange', function (res) {
            if (res.status === 'connected') {
                FB.api('/me', function (res) {
                    $rootScope.$apply(function () {
                        $rootScope.user = _self.user = res;
                        console.log(res);
                    });
                });
            }
        });
        return 'success';
    };
    return 'done';
});

angular.module('paladinApp').directive("fbButton", function () {
    return {
        restrict: 'A',
        link: function link(scope, iElement, iAttrs) {

            var languageCodeFacebook = 'en_EN';
            if (scope.currentLang == 'it') {
                languageCodeFacebook = 'it_IT';
            } else if (scope.currentLang == 'de') {
                languageCodeFacebook = 'de_DE';
            }
            (function (d) {
                var js,
                    id = 'facebook-jssdk',
                    ref = d.getElementsByTagName('script')[0];

                js = d.createElement('script');
                js.id = id;
                js.async = true;
                js.src = "//connect.facebook.net/" + languageCodeFacebook + "/sdk.js";

                if (d.getElementById(id)) {
                    ref.parentNode.replaceChild(js, d.getElementById(id));
                    var head = document.getElementsByTagName('head')[0];
                    head.appendChild(js);
                    //  ref.parentNode.insertBefore(js, ref);
                } else {
                    ref.parentNode.insertBefore(js, ref);
                }
                if (typeof FB != "undefined") {
                    if (FB) {
                        FB.XFBML.parse(iElement[0].parent);
                    }
                }
            })(document);
        }
    };
});

angular.module('paladinApp').run(['$route', '$rootScope', '$location', function ($route, $rootScope, $location) {
    var original = $location.path;
    $location.path = function (path, reload) {
        if (reload === false) {
            var lastRoute = $route.current;
            var un = $rootScope.$on('$locationChangeSuccess', function () {
                $route.current = lastRoute;
                un();
            });
        }
        return original.apply($location, [path]);
    };
}]);

(function (window) {
    var glObj = {};

    //glObj.ENV = 'prod';
    glObj.ENV = 'test';
    //promotion
    glObj.IS_PROMO = true;
    glObj.START_DATE = "7";
    glObj.END_DATE = "8 Novembre";
    glObj.COUPON_VALUE = "25";
    glObj.COUPON_CODE = "SWEETHOME25";

    glObj.isProd = function () {
        return glObj.ENV === 'prod';
    };

    glObj.SUPPORTED_LANGS = [{ code: 'en', name: 'English', defaultLocation: 'milan italy', tryAndBuyWordPressPath: 'try-our-brands' }, { code: 'it', name: 'Italiano', defaultLocation: 'milan italy', tryAndBuyWordPressPath: 'prova-i-nostri-brand' }];

    glObj.RENT_NOW_URL = 'https://qx87h.app.goo.gl/?link=https://paladintrue.com/{0}/?product-detail?{1}&apn=com.a2l.paladin&isi=1129780407&ibi=com.a2l.paladin&efr=1';
    glObj.RENT_URL = 'https://qx87h.app.goo.gl/?link=https://paladintrue.com/it&apn=com.a2l.paladin&isi=1129780407&ibi=com.a2l.paladin';

    if (glObj.ENV === 'prod') {
        glObj.ROOT_PATH = 'https://rent.paladintrue.com/';
        glObj.BASE_URL = 'https://live.v1.paladintrue.com/';
        glObj.PROFILE_IMAGE_URL = 'https://s3.eu-central-1.amazonaws.com/livepaladinimages/ProfileImage/'; // no suffix slash
        glObj.PRODUCT_IMAGE_URL = 'https://s3.eu-central-1.amazonaws.com/livepaladinimages/ProductImage/'; // no suffix slash
        glObj.CATEGORY_IMAGE_URL = 'https://s3.eu-central-1.amazonaws.com/livepaladinimages/CategoryImage/'; // no suffix slash
        glObj.LOG_LEVEL = 'none';
        glObj.STRIPE_SK = 'sk_live_n1ODuFHO82iZulfbRIBQ0WUa';
    } else {
        glObj.ROOT_PATH = 'https://webtest.paladintrue.com/';
        glObj.BASE_URL = 'https://staging.paladintrue.com/';
        glObj.PROFILE_IMAGE_URL = 'https://s3.eu-central-1.amazonaws.com/staggingimages/ProfileImage/'; // no suffix slash
        glObj.PRODUCT_IMAGE_URL = 'https://s3.eu-central-1.amazonaws.com/staggingimages/ProductImage/'; // no suffix slash
        glObj.CATEGORY_IMAGE_URL = 'https://s3.eu-central-1.amazonaws.com/staggingimages/CategoryImage/'; // no suffix slash
        glObj.LOG_LEVEL = 'verbose';
        glObj.STRIPE_SK = 'sk_test_Qxfl7rPTVALyVnrMRUkb2l3F';
    }

    glObj.API_URL = glObj.BASE_URL + 'api/Paladin/'; // no suffix slash
    glObj.TOKEN_URL = glObj.BASE_URL + 'Token'; // no suffix slash
    glObj.STRIPE_URL = 'https://api.stripe.com/v1';
    glObj.PROMO_SIGNUP_TIMER = 10000;
    window.globals = glObj;
})(window);

angular.module('paladinApp').constant('enums', {
    busEvents: {
        onAppOnlineState: 'PT_BE_onAppOnlineState',
        $routeChangeError: '$routeChangeError',
        userLogin: 'PT_BE_userLogin',
        userSignup: 'PT_BE_userSignup',
        userLogout: 'PT_BE_userLogout',
        preferredLanguageChange: 'PT_BE_preferredLanguageChange',
        updatedUser: 'PT_BE_updatedUser',
        facebookApiLoad: 'PT_BE_facebookApiLoad',
        tokenRefresh: 'PT_BE_tokenRefresh',
        triggerEmailValidation: 'PT_BE_triggerEmailValidation',
        locationUpdate: 'PT_BE_locationUpdate',
        categoriesUpdate: 'PT_BE_categoriesUpdate',
        googlePlacesAutocompletePlaceChanged: 'PT_BE_googlePlacesAutocompletePlaceChanged',
        reloadDetailedBooking: 'PT_BE_reloadDetailedBooking',
        footerExtraHeight: 'PT_BE_footerExtraHeight',
        scrollMainScrollerToTop: 'PT_BE_scrollMainScrollerToTop',
        rentalRequestPickerUpdateDates: 'PT_BE_rentalRequestPicker'
    },
    busNavigation: {
        homePage: 'PT_BN_homePage',
        productDetailed: 'PT_BN_productDetailed',
        browseCategory: 'PT_BN_browseCategory',
        browseKeyword: 'PT_BN_browseKeyword',
        browseSort: 'PT_BN_browseSort',
        switchBrowseMode: 'PT_BN_browseModeSwitch',
        userProfile: 'PT_BN_userProfile',
        userListings: 'PT_BN_userListings',
        newProduct: 'PT_BN_newProduct',
        rentals: 'PT_BN_rentals',
        transactionDetailed: 'PT_BN_transactionDetailed',
        idVerification: 'PT_BN_idVerification',
        userReview: 'PT_BN_userReview',
        paymentDetailed: 'PT_BN_paymentDetailed',
        chat: 'PT_BN_chat'
    },
    busChatEvents: {
        updateUnreadCount: 'PT_BCE_updateUnreadCount',
        newMessage: 'PT_BCE_newMessage',
        detailedChatSelected: 'PT_BCE_detailedChatSelected',
        startNewMessagesPoller: 'PT_BCE_startNewMessagesPoller',
        selectPendingChat: 'PT_BCE_selectPendingChat'
    },
    ngMetaValues: {
        currentUrl: function currentUrl(langCode) {
            return 'currentUrl_' + langCode;
        } // APPEND LANG
    },
    categoriesBannersPaths: {
        all: {
            en: '/assets/banner-try-and-buy-en.jpg',
            it: '/assets/banner-try-and-buy-it.jpg'
        },
        promo: '/assets/promo-banner.jpg',
        addProduct: '/assets/all-categories-banner-3.png',
        allP2P: '/assets/all-categories-banner-3.png'

    },
    localStorageKeys: {
        jwtToken: 'PT_LSK_jwt_token',
        refreshToken: 'PT_LSK_refreshToken',
        preferredLanguage: 'PT_LSK_preferredLanguage',
        userId: 'PT_persistAuth',
        locationLatLong: 'PT_LSK_locationLatLong',
        pendingPrivateState: 'PT_LSK_pendingPrivateState'
    },
    allCategories: {
        'en': 'All Categories',
        'it': 'Tutte le Categorie',
        'de': 'Alle Kategorien'
    },
    secret: 'd05ac55661e27663c025aca7047c825908ae1562',
    inAppSideNavsIds: {
        mainMobileNav: 'main-mobile-side-nav',
        chatSideNav: 'chat-list-side-nav'
    },
    categoriesIds: {
        tryAndBuy: window.globals.isProd() ? 11 : 15,
        outdoor: window.globals.isProd() ? 20 : 12,
        homeAppliance: window.globals.isProd() ? 18 : 8,
        hiTech: window.globals.isProd() ? 17 : 2,
        smartMobility: window.globals.isProd() ? 19 : 4
    },
    productsSortOptions: {
        geoLocation: 'SortByGeoLocation',
        popularity: 'SortByPopularity',
        bestProduct: 'SortByBestProduct',
        review: 'SortByReview',
        lowPrice: 'SortByLowPrice',
        highPrice: 'SortByHighPrice',
        recent: 'SortByRecent'
    },
    productsSortByTextCode: {
        SortByPopularity: 'POPULARITY',
        SortByRecent: 'MREC',
        SortByGeoLocation: 'NEAREST',
        SortByBestProduct: 'RELEVANCE',
        SortByLowPrice: 'LP',
        SortByHighPrice: 'HP'
    },
    userProductsFilter: {
        borrowedProducts: 'BorrowedProduct',
        lentProduct: 'LentProduct',
        allProducts: 'AllProduct',
        myProductsToBorrow: 'MyProductsToBorrow'
    },
    productRentalStatus: {
        available: -1,
        requested: 1,
        notVerified: 2,
        verified: 3,
        timeout: 4,
        denied: 5,
        canceled: 6,
        accepted: 7,
        started: 8,
        ended: 9,
        criticalCancel: 10,
        moderateCancel: 11,
        canceledByLender: 12,
        timeoutByBorrower: 13,
        verifying: 14,
        booked: 15

    },
    productRentalStatusNames: {
        requested: 'requested',
        notVerified: 'notverified',
        verified: 'verified',
        timeout: 'timeout',
        denied: 'denied',
        cancelled: 'cancelled',
        criticalCancel: 'cancellation-Critical',
        moderateCancel: 'cancellation-Moderate',
        accepted: 'accepted',
        started: 'started',
        ended: 'ended',
        canceledByLender: 'cancelled-By-Lender',
        timeoutByBorrower: 'card_not_verified_timeout'
    },
    trackingStep: {
        pending: 0,
        success: 1,
        failure: 2
    },
    bookingReviewStatus: {
        noReview: 0, // booking_ReviewStatus 0 // no-review
        reviewByBorrower: 1, // booking_ReviewStatus 1 // review by lender
        reviewByLender: 2,
        reviewByBoth: 3 // booking_ReviewStatus 2 // review by borrower
    },
    idVerificationMethod: {
        passport: 'passport',
        driverLicense: 'driverLicense',
        id: 'id'
    },
    acuantImageSource: {
        mobileCropped: 101,
        scanShellTwain: 102,
        SnapShell: 103,
        Other: 105
    },
    acuantRegions: {
        USA: 0,
        Canada: 1,
        SouthAmerica: 2,
        Europe: 3,
        Australia: 4,
        Asia: 5,
        GeneralDocs: 6,
        Africa: 7.
    }
});

/*
Prod
"Category_Id": 11,"Category_Name": "Try the brands",
"Category_Id": 2,"Category_Name": "Hi-Tech",
"Category_Id": 4,"Category_Name": "Music",
"Category_Id": 9,"Category_Name": "Outdoor",
"Category_Id": 7,"Category_Name": "Home & Garden",
"Category_Id": 1,"Category_Name": "Sports",
"Category_Id": 8,"Category_Name": "Clothes",
"Category_Id": 13,"Category_Name": "Events",
"Category_Id": 12,"Category_Name": "Props",
"Category_Id": 10,"Category_Name": "Other",

Test
"Category_Id": 12,"Category_Name": "Sports",
"Category_Id": 15,"Category_Name": "Try & Buy",
"Category_Id": 8,"Category_Name": "Clothes",
"Category_Id": 2,"Category_Name": "Hi-Tech",
"Category_Id": 7,"Category_Name": "Home & Garden",
"Category_Id": 4,"Category_Name": "Music",
 */
angular.module('paladinApp').filter('capitalize', function () {
    return function (input) {
        //console.log('capitalize : '+input)
        if (input) {
            if (input.indexOf(' ') !== -1) {
                var inputPieces, i;

                input = input.toLowerCase();
                inputPieces = input.split(' ');

                for (i = 0; i < inputPieces.length; i++) {
                    inputPieces[i] = capitalizeString(inputPieces[i].trim());
                }

                return inputPieces.toString().replace(/,/g, ' ');
            } else {
                input = input.toLowerCase();
                return capitalizeString(input);
            }
        }
        function capitalizeString(inputString) {
            return inputString.substring(0, 1).toUpperCase() + inputString.substring(1);
        }

        return input;
    };
});
angular.module('paladinApp').filter('ptCurrency', function () {
    return function (input) {
        return '€ ' + input;
    };
});
angular.module('paladinApp').filter('ptTruncate', function () {
    return function (input, maxChars) {

        if (input) {
            if (input.length > maxChars) {
                return input.slice(0, maxChars - 3) + '...';
            }
        }
        return input;
    };
});
angular.module('paladinApp').filter('ptHtmlToPlainText', function () {
    return function (input) {
        return input ? String(input).replace(/<[^>]+>/gm, '') : input;
    };
});
'use strict';

angular.module('paladinApp').service('chatService', ['$rootScope', 'appStateManager', 'apiService', 'enums', '$base64', 'toastService', function ($rootScope, appStateManager, apiService, enums, $base64, toastService) {

    var self = this;
    self.CHAT_HASH = 'ZDA1YWM1NTY2MWUyNzY2M2MwMjVhY2E3MDQ3YzgyNTkwOGFlMTU2MjpQYWxhZGluXzEyMzEyMzEyMw==';
    self.userDialogs = {};
    if (window.globals.isProd()) {
        self.kApplicationID = 48979;
        self.kAuthKey = "s64NxQBAMrmGYXz";
        self.kAuthSecret = "wxqqXZAfdYpsEvd";
        self.kAccountKey = "7awzEayyEjqP2LQuppJj";
    } else {
        self.kApplicationID = 58169;
        self.kAuthKey = "u3n3guWwktMpCsU";
        self.kAuthSecret = "yV26WrfkrBMZC2n";
        self.kAccountKey = "7awzEayyEjqP2LQuppJj";
    }

    var onMessage = function onMessage(userId, message) {
        // This is a notification about dialog creation
        if (message && message.body) {
            var msg = message;
            msg.isMe = userId == self.chatUser.id;
            msg.message = message.body;
            msg._id = message.id;
            if (msg.message === 'attachment' && msg.extension && msg.extension.attachments && msg.extension.attachments.length > 0) {
                msg.message = '';
                msg.img = QB.content.privateUrl(msg.extension.attachments[0].uid);
            }
            $rootScope.$emit(enums.busChatEvents.newMessage, msg);
        }
    };

    var onDisconnectedListener = function onDisconnectedListener() {
        console.warn('onDisconnectedListener');
    };

    var onReconnectListener = function onReconnectListener() {
        console.warn('onReconnectListener');
    };

    var init = function init() {
        QB.init(self.kApplicationID, self.kAuthKey, self.kAuthSecret, {
            debug: { mode: window.globals.isProd() ? 0 : 1 },
            chatProtocol: {
                active: 2 // set 1 to use BOSH, set 2 to use WebSockets (default)
            }
        });
        QB.chat.onDisconnectedListener = onDisconnectedListener;
        QB.chat.onReconnectListener = onReconnectListener;
        QB.chat.onMessageListener = onMessage;
        getAppSession();
    };

    var getAppSession = function getAppSession() {
        return new Promise(function (resolve, reject) {
            if (self.chatAppSession) {
                resolve(self.chatAppSession);
            } else {
                QB.createSession(function (err, result) {
                    // callback function
                    console.log(err, result);
                    if (result && result.token) {
                        self.chatAppSession = result;
                        resolve(result);
                    } else {
                        reject('could not create app session');
                    }
                });
            }
        });
    };

    var getUserParams = function getUserParams() {
        var password = $base64.decode(self.CHAT_HASH).split(':')[1];
        var user = appStateManager.user;
        var User_Email = user.User_Email,
            User_FacebookId = user.User_FacebookId,
            User_UserName = user.User_UserName;

        if (User_FacebookId != undefined && User_FacebookId != '') {
            // facebook user
            return {
                login: User_FacebookId,
                password: password
            };
        } else {
            // manual user
            return {
                login: User_UserName,
                password: password
            };
        }
    };

    var loginToChat = function loginToChat() {
        // Probably open a socket?
        return new Promise(function (resolve, reject) {
            getAppSession().then(function (session) {
                var params = _extends({}, getUserParams(), {
                    token: session.token
                });
                QB.login(params, function (err, user) {
                    if (err) {
                        if (err.code === 401) {
                            // user doesn't exist in QB, create instead
                            signupToChat().then(resolve).catch(reject);
                        } else {
                            reject(err);
                        }
                    } else {
                        self.chatUser = user;
                        resolve(user);
                        syncQbUserId();
                    }
                });
            }).catch(reject);
        });
    };

    var signupToChat = function signupToChat() {
        return new Promise(function (resolve, reject) {
            getAppSession().then(function (session) {
                var params = _extends({}, getUserParams(), {
                    token: session.token
                });

                QB.users.create(params, function (err, user) {
                    console.log(err, user);
                    if (user) {
                        // success
                        self.chatUser = user;
                        resolve(user);
                        syncQbUserId();
                    } else {
                        // error
                        reject(err);
                    }
                });
            }).catch(reject);
        });
    };

    var connectToChat = function connectToChat() {
        // socket
        return new Promise(function (resolve, reject) {
            getAppSession().then(function (session) {
                var params = _extends({}, getUserParams(), {
                    token: session.token
                });
                QB.createSession(params, function (err, result) {
                    if (result) {
                        self.userToken = result.token;
                        QB.chat.connect({
                            userId: self.chatUser.id,
                            password: params.password
                        }, function (err2, res) {
                            if (!err2) {
                                //   Connected to socket
                                resolve(res);
                                if (self.pendingChatToJoin) {
                                    $rootScope.$emit(enums.busChatEvents.selectPendingChat, { chatId: self.pendingChatToJoin });
                                    self.pendingChatToJoin = undefined;
                                }
                            } else {
                                reject(err2);
                            }
                        });
                    } else {
                        reject(err);
                    }
                });
            }).catch(reject);
        });
    };

    var syncDialogList = function syncDialogList() {
        return new Promise(function (resolve, reject) {
            QB.chat.dialog.list(null, function (err, result) {
                if (result) {
                    result.items.forEach(function (item) {
                        self.userDialogs[item._id] = self.userDialogs[item._id] || 0;
                    });
                    getUnreadMessage().then(resolve).catch(reject);
                } else {
                    reject(err);
                }
            });
        });
    };

    var syncQbUserId = function syncQbUserId() {
        apiService.users.editProfile({
            User_QBId: self.chatUser.id,
            User_Id: appStateManager.getUserId()
        }).then(function (res) {
            return console.log('SUCCESSFULLY UPDATED PROFILE');
        }).catch(function (err) {
            return console.error('ERROR UPDATING PROFILE');
        });
    };

    var disconnectChat = function disconnectChat() {
        QB.chat.disconnect();
    };

    var createOrStartChat = function createOrStartChat(_ref) {
        var lenderId = _ref.lenderId,
            borrowerId = _ref.borrowerId,
            lenderQBId = _ref.lenderQBId,
            borrowerQBId = _ref.borrowerQBId,
            productId = _ref.productId,
            productName = _ref.productName,
            _ref$chatRoomId = _ref.chatRoomId,
            chatRoomId = _ref$chatRoomId === undefined ? null : _ref$chatRoomId,
            _ref$bookingId = _ref.bookingId,
            bookingId = _ref$bookingId === undefined ? null : _ref$bookingId;

        /**
         * lenderQbId: '=',
         lenderId: '=',
         borrowerQbId: '=',
         borrowerId: '=?',
         productId: '=',
         bookingId: '=?',
         */

        /**
         *  {
              "User_UDID": "sample string 1",
              "User_UDIDType": 2,
              "Borrower_Id": 3,
              "Lender_Id": 4,
              "Product_Id": 5,
              "MeetingTime": "sample string 6",
              "Chat_QBRoomId": "sample string 7",
              "LanguageCode": "sample string 8",
              "BookingId": 9
            }
         */
        return new Promise(function (resolve, reject) {
            if (chatRoomId) {
                // chat exists, fetch from server
                apiService.chats.startBookingChat({
                    lenderId: lenderId,
                    borrowerId: borrowerId,
                    productId: productId,
                    chatRoomId: chatRoomId,
                    bookingId: bookingId
                }).then(function (res) {
                    resolve(res.Data);
                }).catch(function (err) {
                    reject(err);
                });
            } else {
                // chat doesn't exist, create in QB and link with server
                var params = {
                    name: productName,
                    type: 2, //group chat,
                    occupants_ids: [lenderQBId, borrowerQBId]
                };
                QB.chat.dialog.create(params, function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        var dialogId = result._id;
                        apiService.chats.startBookingChat({
                            lenderId: lenderId,
                            borrowerId: borrowerId,
                            productId: productId,
                            chatRoomId: dialogId,
                            bookingId: bookingId
                        }).then(function (res) {
                            resolve(res.Data);
                        }).catch(function (err) {
                            result(err);
                        });
                    }
                });
            }
        });
    };

    var setUserTyping = function setUserTyping(userId, isTyping) {
        return new Promise(function (resolve) {
            resolve(userId + ' is now ' + (isTyping ? 'Typing..' : 'Idle'));
        });
    };

    var uploadMedia = function uploadMedia(inputElement) {
        return new Promise(function (resolve) {
            resolve('Media file uploaded!');
        });
    };

    var getDialogsList = function getDialogsList() {
        return new Promise(function (resolve, reject) {});
    };

    var getChatList = function getChatList(userId) {
        var pageIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        return new Promise(function (resolve, reject) {
            // let arr = [];
            // let index = 0;
            // while (arr.length < 30 && pageIndex < 40) {
            //     arr.push({
            //         Chat_Id: new Date().getTime() + index++,
            //         Product_Title: 'My Product',
            //
            //         recipient: 'John Smith',
            //         borrowerName: 'Samer Murad',
            //         thumbnail: 'tofyk5Tv55ghu7pacsjz5a4stKjQj',
            //     })
            // }
            // setTimeout(() => resolve(arr),500);
            // return;
            apiService.chats.getChatsList({
                userId: userId,
                pageIndex: pageIndex
            }).then(function (res) {
                if (res.Data) {
                    // resolve(res.Data);
                    var lists = res.Data.Chat_Borrow.concat(res.Data.Chat_Lent).map(function (item) {
                        item.thumbnail = item.Lender_UserId == appStateManager.user.User_Id ? item.Borrower_ProfileImage : item.Lender_ProfileImage;
                        item.recipient = item.Lender_UserId == appStateManager.user.User_Id ? item.Borrower_FullName : item.Lender_FullName;
                        item.initialBadge = (self.userDialogs || {})[item.Chat_QBRoomId] || 0;
                        item.lastUpdatedDate = new Date(item.ChatLastUpdated);
                        item.isLent = item.Lender_UserId == appStateManager.user.User_Id;
                        return item;
                    });
                    lists = lists.sort(function (a, b) {
                        return a.lastUpdatedDate - b.lastUpdatedDate;
                    });
                    resolve(lists);
                    if (self.pendingChatToJoin) {
                        $rootScope.$emit(enums.busChatEvents.selectPendingChat, { chatId: self.pendingChatToJoin });
                        self.pendingChatToJoin = undefined;
                    }
                } else reject(Error('No data'));
            }).catch(reject);
        });
    };

    var getChatDetailed = function getChatDetailed(chatQbId) {
        return new Promise(function (resolve, reject) {
            apiService.chats.getChatByQBId({ chatQbId: chatQbId }).then(function (res) {
                return resolve(res.Data);
            }).catch(reject);
        });
    };

    var getChatHistory = function getChatHistory(dialogId) {
        var skip = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        return new Promise(function (resolve, reject) {
            // let arr = [];
            // let index = 0;
            // while (arr.length < 4) {
            //     arr.push({
            //         message: 'This is test message',
            //         isMe: index % 3 == 0,
            //         thumbnail: 'tofyk5Tv55ghu7pacsjz5a4stKjQj',
            //         img: index == 3 ? 'https://picsum.photos/800/1300/?random' : undefined,
            //         isSent: true,
            //         _id: new Date().getTime() + index++
            //     })
            // }
            // setTimeout(() => {
            //     resolve(arr)
            // },500)
            QB.chat.message.list({ chat_dialog_id: dialogId, skip: skip, limit: 10, sort_desc: 'date_sent' }, function (err, result) {
                if (err) reject(err);else {
                    var msgs = result.items.map(function (item) {
                        item.isMe = item.sender_id == self.chatUser.id;
                        item.thumbnail = 'tofyk5Tv55ghu7pacsjz5a4stKjQj';
                        item.dateSent = new Date(item.date_sent * 1000);
                        if (item.message === 'attachment' && item.attachments && item.attachments.length > 0) {
                            item.message = '';
                            item.img = QB.content.privateUrl(item.attachments[0].uid);
                        }
                        return item;
                    });
                    resolve(msgs.reverse());
                }
            });
        });
    };

    var joinChat = function joinChat(dialogId) {
        var chatDialog = QB.chat.helpers.getRoomJidFromDialogId(dialogId);
        return new Promise(function (resolve, reject) {
            QB.chat.muc.join(chatDialog, function (presence) {
                resolve();
            });
        });
    };

    var leaveChat = function leaveChat(dialogId) {
        var chatDialog = QB.chat.helpers.getRoomJidFromDialogId(dialogId);
        return new Promise(function (resolve, reject) {
            QB.chat.muc.leave(chatDialog, function (presence) {
                resolve();
            });
        });
    };

    var sendMessage = function sendMessage(_ref2) {
        var dialogId = _ref2.dialogId,
            text = _ref2.text,
            productId = _ref2.productId,
            input = _ref2.input;

        return new Promise(function (resolve, reject) {
            var chatDialog = QB.chat.helpers.getRoomJidFromDialogId(dialogId);
            if (input && input.files.length > 0) {
                // is File
                var inputFile = input.files[0];
                var params = { name: inputFile.name, file: inputFile, type: inputFile.type, size: inputFile.size, 'public': false };
                QB.content.createAndUpload(params, function (err, res) {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        var fileUID = res.uid;
                        // prepare a message
                        var msg = {
                            type: 'groupchat',
                            body: "attachment",
                            ProductId: productId,
                            extension: {
                                save_to_history: 1,
                                attachments: [{ uid: fileUID, type: 'photo' }],
                                ProductId: productId,
                                dialogID: dialogId,
                                isBot: '0'
                            },
                            markable: 1
                        };
                        QB.chat.send(chatDialog, msg);
                        resolve();
                    }
                });
            } else {

                QB.chat.send(chatDialog, {
                    type: 'groupchat',
                    body: text,
                    extension: {
                        save_to_history: 1,
                        ProductId: productId,
                        dialogID: dialogId,
                        isBot: '0'
                    },
                    markable: 1
                });
                resolve();
            }
        });
    };

    var notifyUser = function notifyUser(_ref3) {
        var userId = _ref3.userId,
            dialogId = _ref3.dialogId,
            _ref3$isNewChat = _ref3.isNewChat,
            isNewChat = _ref3$isNewChat === undefined ? false : _ref3$isNewChat;

        return new Promise(function (resolve, reject) {
            var msg = {
                type: 'chat',
                extension: {
                    notification_type: isNewChat ? 1 : 2,
                    _id: dialogId
                }
            };

            QB.chat.send(userId, msg);
            resolve();
        });
    };

    var getUnreadMessage = function getUnreadMessage() {
        return new Promise(function (resolve, reject) {
            var dialogIds = Object.keys(self.userDialogs);
            Promise.all(dialogIds.map(function (key) {
                return getUnreadMessagesForDialogId(key);
            })).then(function (results) {
                results.forEach(function (item) {
                    self.userDialogs[item.dialogId] = item.count || 0;
                });
                resolve(self.userDialogs);
            }).catch(function (err) {
                reject(err);
            });
        });
    };

    var getUnreadMessagesForDialogId = function getUnreadMessagesForDialogId(dialogId) {
        return new Promise(function (resolve) {
            QB.chat.message.unreadCount({ chat_dialog_ids: dialogId }, function (err, res) {
                if (err) resolve(0);else {
                    resolve({
                        dialogId: dialogId,
                        count: (res || {})[dialogId] || 0
                    });
                }
            });
        });
    };
    var getTotalUnreadCount = function getTotalUnreadCount() {
        return new Promise(function (resolve) {
            QB.chat.message.unreadCount(null, function (err, res) {
                if (err) resolve(0);else {
                    resolve(res);
                }
            });
        });
    };

    var clearUnreadBadgesForDialog = function clearUnreadBadgesForDialog(dialogId) {
        self.userDialogs[dialogId] = 0;
        var numberOfUnreadMessages = 0;
        Object.keys(self.userDialogs).forEach(function (dialog) {
            numberOfUnreadMessages += self.userDialogs[dialog];
        });
        $rootScope.$emit(enums.busChatEvents.updateUnreadCount, {
            total: numberOfUnreadMessages,
            detailedDict: self.userDialogs
        });
    };

    var activateChatWhenReady = function activateChatWhenReady(dialogId) {
        self.pendingChatToJoin = dialogId;
    };

    return {
        init: init,
        loginToChat: loginToChat,
        createOrStartChat: createOrStartChat,
        setUserTyping: setUserTyping,
        uploadMedia: uploadMedia,
        getChatList: getChatList,
        getChatDetailed: getChatDetailed,
        getChatHistory: getChatHistory,
        signupToChat: signupToChat,
        connectToChat: connectToChat,
        disconnectChat: disconnectChat,
        syncDialogList: syncDialogList,
        sendMessage: sendMessage,
        joinChat: joinChat,
        leaveChat: leaveChat,
        notifyUser: notifyUser,
        getUnreadMessage: getUnreadMessage,
        clearUnreadBadgesForDialog: clearUnreadBadgesForDialog,
        activateChatWhenReady: activateChatWhenReady
    };
}]);
angular.module('paladinPopups', ['ngMaterial', 'ngMessages', 'ngMaterialDateRangePicker', 'angularMoment', '720kb.socialshare']).config(['$mdDialogProvider', function ($mdDialogProvider) {
    $mdDialogProvider.addPreset('confirmPreset', {
        options: function options() {
            return {
                templateUrl: './views/popups/confirm.popup.html',
                controller: 'confirmPopup',
                bindToController: true,
                controllerAs: 'confirmCtrl',
                clickOutsideToClose: true,
                escapeToClose: true
            };
        }
    });

    $mdDialogProvider.addPreset('loginSignup', {
        options: function options() {
            return {
                templateUrl: './views/popups/loginSignup.popup.html',
                controller: 'loginSignUpPopup',
                bindToController: true,
                controllerAs: 'loginSignupCtrl',
                clickOutsideToClose: true,
                escapeToClose: true
            };
        }
    });

    $mdDialogProvider.addPreset('forgotPassword', {
        options: function options() {
            return {
                templateUrl: './views/popups/forgotPassword.popup.html',
                controller: 'forgotPasswordPopup',
                controllerAs: 'forgotPasswordCtrl',
                clickOutsideToClose: true,
                escapeToClose: true
            };
        }
    });

    $mdDialogProvider.addPreset('idVerificationFailureHandler', {
        options: function options() {
            return {
                templateUrl: './views/popups/idVerificationFailureHandler.popup.html',
                controller: 'idVerificationFailureHandlerPopup',
                controllerAs: 'idVerificationFailureHandlerPopup',
                clickOutsideToClose: false,
                escapeToClose: false
            };
        }
    });

    $mdDialogProvider.addPreset('emailVerification', {
        options: function options() {
            return {
                templateUrl: './views/popups/emailVerification.popup.html',
                controller: 'emailVerificationPopup',
                controllerAs: 'emailVerificationCtrl',
                clickOutsideToClose: false,
                escapeToClose: false

            };
        }
    });

    $mdDialogProvider.addPreset('shareReferralLink', {
        options: function options() {
            return {
                templateUrl: './views/popups/shareToSocialMedia.popup.html',
                controller: 'shareToSocialMediaPopup',
                controllerAs: 'shareToSocialMediaCtrl',
                clickOutsideToClose: true,
                escapeToClose: true
            };
        }
    });

    $mdDialogProvider.addPreset('changePassword', {
        options: function options() {
            return {
                templateUrl: './views/popups/changePassword.popup.html',
                controller: 'changePasswordPopup',
                controllerAs: 'changePasswordCtrl',
                clickOutsideToClose: true,
                escapeToClose: true
            };
        }
    });

    $mdDialogProvider.addPreset('transactionStatusChange', {
        options: function options() {
            return {
                templateUrl: './views/popups/transactionStatusChange.popup.html',
                controller: 'transactionStatusChangePopup',
                controllerAs: 'transactionStatusChangeCtrl',
                clickOutsideToClose: false,
                escapeToClose: false
            };
        }
    });

    $mdDialogProvider.addPreset('inputField', {
        options: function options() {
            return {
                templateUrl: './views/popups/inputField.popup.html',
                controller: 'inputFieldPopup',
                controllerAs: 'inputFieldCtrl',
                clickOutsideToClose: false,
                escapeToClose: false
            };
        }
    });

    $mdDialogProvider.addPreset('loader', {
        options: function options() {
            return {
                templateUrl: './views/popups/loader.popup.html',
                controller: 'loaderPopup',
                controllerAs: 'loaderCtrl',
                panelClass: 'loaderOverlay',
                clickOutsideToClose: false,
                escapeToClose: false
            };
        }
    });

    $mdDialogProvider.addPreset('bookingTrackerInfoMobile', {
        options: function options() {
            return {
                templateUrl: './views/popups/bookingTrackerInfoMobile.popup.html',
                controller: 'bookingTrackerInfoMobilePopup',
                controllerAs: 'bookingTrackerInfoMobilePopupCtrl',
                clickOutsideToClose: false,
                escapeToClose: false
            };
        }
    });
}]).service('popupService', ['$mdDialog', '$mdDateRangePicker', 'moment', 'ptUtils', function ($mdDialog, $mdDateRangePicker, moment, ptUtils) {

    this.showAlert = function (title, message) {
        var okBtn = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'POPUP_OK';

        return new Promise(function (resolve, reject) {
            var confirm2 = $mdDialog.confirmPreset({
                locals: {
                    title: title,
                    message: message,
                    isConfirm: false,
                    okBtn: okBtn
                }
            });

            $mdDialog.show(confirm2).then(resolve).catch(reject);
        });
    };

    this.showConfirm = function (title, message) {
        var yesButton = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'POPUP_YES';
        var noButton = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'POPUP_NO';

        return new Promise(function (resolve, reject) {
            var confirm2 = $mdDialog.confirmPreset({
                locals: {
                    title: title,
                    message: message,
                    yesButton: yesButton,
                    noButton: noButton,
                    isConfirm: true
                }
            });

            $mdDialog.show(confirm2).then(resolve).catch(reject);
        });
    };

    this.showLoginSignupPopup = function () {
        var isSignUp = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

        return new Promise(function (resolve, reject) {
            var loginSignup = $mdDialog.loginSignup({
                locals: {
                    selectedTab: isSignUp ? 1 : 0
                }
            });
            $mdDialog.show(loginSignup).then(resolve).catch(reject);
        });
    };

    this.showForgotPassword = function () {
        return new Promise(function (resolve, reject) {
            $mdDialog.show($mdDialog.forgotPassword()).then(resolve).catch(reject);
        });
    };

    this.showIdVerificationFailureHandler = function (data) {
        console.log('idVerificationFailureHandler locals ', data);
        return new Promise(function (resolve, reject) {
            var idVerificationHandler = $mdDialog.idVerificationFailureHandler({
                locals: data
            });
            $mdDialog.show(idVerificationHandler).then(resolve).catch(reject);
        });
    };

    this.showEmailVerification = function (userId /* Must be provided for verification*/) {
        return new Promise(function (resolve, reject) {
            var emailVerification = $mdDialog.emailVerification({
                locals: {
                    userId: userId
                }
            });
            $mdDialog.show(emailVerification).then(resolve).catch(reject);
        });
    };

    this.showShareReferralLink = function (referralLink) {
        return new Promise(function (resolve, reject) {
            var shareReferralLink = $mdDialog.shareReferralLink({
                locals: {
                    referralLink: referralLink
                }
            });
            $mdDialog.show(shareReferralLink).then(resolve).catch(function (err) {
                // closing the modal on click-outside will reject so catch it here
                console.log('close modal err ', err);
            });
        });
    };

    this.showDateRangePicker = function (productBookingDetails, product) {
        return new Promise(function (resolve, reject) {
            var dateRanges = ptUtils.getBookedDateRanges(productBookingDetails);

            $mdDateRangePicker.show({
                onePanel: true,
                autoConfirm: true,
                model: {},
                localizationMap: ptUtils.getTranslationDictForDatePicker(),
                maxRange: product.MaxRentalPeriod || undefined,
                isDisabledDate: function isDisabledDate($date) {
                    var momentDate = moment($date);
                    for (var i = 0; i < dateRanges.length; i++) {
                        if (momentDate.isBetween(dateRanges[i].startDate, dateRanges[i].endDate) || momentDate.isSame(dateRanges[i].startDate) || momentDate.isSame(dateRanges[i].endDate)) return true;
                    }if (moment().isBefore($date)) return false; // TODO: - Check if product available for rent at dates

                    return true;
                }
            }).then(function (result) {
                resolve(result);
            }).catch(function () {
                reject();
            });
        });
    };

    this.showChangePassword = function () {
        return new Promise(function (resolve, reject) {
            var changePass = $mdDialog.changePassword({
                locals: {
                    wot: 'no'
                }
            });
            $mdDialog.show(changePass).then(resolve).catch(reject);
        });
    };

    this.showTransactionStatusChange = function (_ref4) {
        var booking = _ref4.booking,
            apiMethod = _ref4.apiMethod,
            title = _ref4.title;

        return new Promise(function (resolve, reject) {
            var statusChange = $mdDialog.transactionStatusChange({
                locals: {
                    booking: booking,
                    apiMethod: apiMethod,
                    title: title
                }
            });

            $mdDialog.show(statusChange).then(resolve).catch(reject);
        });
    };

    this.showInputField = function (_ref5) {
        var title = _ref5.title,
            message = _ref5.message,
            initialValue = _ref5.initialValue,
            _ref5$inputRegexValid = _ref5.inputRegexValidation,
            inputRegexValidation = _ref5$inputRegexValid === undefined ? undefined : _ref5$inputRegexValid,
            _ref5$validationError = _ref5.validationErrorMessage,
            validationErrorMessage = _ref5$validationError === undefined ? 'PLEASE_ENTER_A_VALID_INPUT' : _ref5$validationError;

        return new Promise(function (resolve, reject) {
            var inputField = $mdDialog.inputField({
                locals: {
                    title: title,
                    message: message,
                    value: initialValue,
                    inputRegexValidation: inputRegexValidation,
                    validationErrorMessage: validationErrorMessage
                }
            });

            $mdDialog.show(inputField).then(resolve).catch(reject);
        });
    };
    this.showLoader = function () {
        $mdDialog.show($mdDialog.loader());
    };
    this.hideLoader = function () {
        $mdDialog.hide();
    };

    this.showBookingTrackerInfoMobilePopup = function (booking) {
        return new Promise(function (resolve) {
            var bookingTracker = $mdDialog.bookingTrackerInfoMobile({
                locals: {
                    booking: booking
                }
            });
            $mdDialog.show(bookingTracker).then(resolve).catch(resolve);
        });
    };
}]);

angular.module('paladinApp').service('ptLog', [function () {
    this.log = function () {
        if (window.globals.LOG_LEVEL === 'verbose') {
            console.log.apply(this, ['PALADIN LOG:'].concat(Array.prototype.slice.call(arguments)));
        }
    };

    this.warn = function () {
        if (window.globals.LOG_LEVEL === 'verbose') {
            console.warn.apply(this, ['PALADIN WARN:'].concat(Array.prototype.slice.call(arguments)));
        }
    };

    this.error = function () {
        console.error.apply(this, ['PALADIN ERROR:'].concat(Array.prototype.slice.call(arguments)));
    };
}]);
angular.module('paladinApp').service('apiService', ['$rootScope', '$q', '$http', '$base64', 'enums', 'ptLog', 'appStateManager', function ($rootScope, $q, $http, $base64, enums, ptLog, appStateManager) {

    var self = this;

    self.ENV = window.globals.API_URL.slice(0, -1);
    self.timeoutCounter = 0;
    self.maxTimeouts = 5;
    self.raiseTimeout = function () {
        if (self.timeoutCounter <= self.maxTimeouts) self.timeoutCounter += 1;
        if (self.timeoutCounter > self.maxTimeouts && $rootScope.isAppOnline) $rootScope.$emit(enums.busEvents.onAppOnlineState, false);
    };
    self.loweTimeout = function () {
        if (self.timeoutCounter > 0) self.timeoutCounter -= 1;
        if (self.timeoutCounter < self.maxTimeouts && !$rootScope.isAppOnline) $rootScope.$emit(enums.busEvents.onAppOnlineState, true);
    };

    self.getHttpConfig = function (params, headers) {
        var config = {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'X-Requested': null,
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token'
            }
        };
        if (localStorage.getItem(enums.localStorageKeys.jwtToken)) {
            config.headers['Authorization'] = localStorage.getItem(enums.localStorageKeys.jwtToken);
        }

        if (headers) {
            Object.keys(headers).forEach(function (headerKey) {
                config.headers[headerKey] = headers[headerKey];
            });
        }

        if (params) {
            config.params = params;
        }

        return config;
    };

    self.getDefaultParams = function () {
        return {
            LanguageCode: appStateManager.getCurrentLang()
        };
    };

    var maxRetries = 5;
    self.getRequest = function getData(path, params, headers, curRetryCounter) {
        var deferred = $q.defer();
        $http.get(self.ENV + path, self.getHttpConfig(params, headers)).then(function (response) {
            self.loweTimeout();
            if (!response || !response.data || response.data.Status == 'error') {
                deferred.reject(response);
            } else {
                deferred.resolve(response.data);
            }
            // if (response.status === 204) {
            //     deferred.reject(response);
            // } else {
            //     deferred.resolve(response.data);
            // }
        }, function (response) {
            if (!response) {
                console.warn('R_U');
                deferred.reject();
                return;
            }

            if (response.status === 401 && localStorage.getItem(enums.localStorageKeys.refreshToken)) {
                ptLog.log('Refreshing Token');
                self.apiMethods.users.refreshToken(localStorage.getItem(enums.localStorageKeys.refreshToken)).then(function (response) {
                    ptLog.log('Refreshing Token success');
                    $rootScope.$emit(enums.busEvents.tokenRefresh, response.data);
                    setTimeout(function () {
                        self.getRequest(path, params, headers, curRetryCounter).then(deferred.resolve).catch(deferred.reject);
                    }, 500);
                }).catch(deferred.reject);
            } else if (response.status === 423) {
                /** RETRY HANDLER */
                if (!curRetryCounter) curRetryCounter = 0;

                if (curRetryCounter < maxRetries) {
                    curRetryCounter++;
                    var waitingBackoffTime_ms = curRetryCounter * 500; //ms
                    setTimeout(function () {
                        self.getRequest(path, params, headers, curRetryCounter).then(function (response) {
                            return deferred.resolve(response.data);
                        }).catch(deferred.reject);
                    }, waitingBackoffTime_ms);
                } else {
                    deferred.reject(response);
                }
            } else {
                if (response.status === 0 || response.status === -1) {
                    /** TIMEOUT */
                    self.raiseTimeout();
                }
                deferred.reject(response);
            }
        });
        return deferred.promise;
    };

    self.postRequest = function (path, data, headers, curRetryCounter) {
        var deferred = $q.defer();

        $http.post(self.ENV + path, data, self.getHttpConfig(null, headers)).then(function (response) {
            self.loweTimeout();
            if (!response || !response.data || response.data.Status == 'error') {
                deferred.reject(response);
            } else {
                deferred.resolve(response.data);
            }
            // if (response.status === 204) {
            //     deferred.reject(response);
            // } else {
            //     deferred.resolve(response.data);
            // }
        }, function (response) {

            if (!response) {
                console.warn('R_U');
                deferred.reject();
                return;
            }
            if (response.status === 401 && localStorage.getItem(enums.localStorageKeys.refreshToken)) {
                ptLog.log('Refreshing Token');
                self.apiMethods.users.refreshToken(localStorage.getItem(enums.localStorageKeys.refreshToken)).then(function (response) {
                    ptLog.log('Refreshing Token success');
                    $rootScope.$emit(enums.busEvents.tokenRefresh, response.data);
                    setTimeout(function () {
                        self.postRequest(path, data, headers, curRetryCounter).then(deferred.resolve).catch(deferred.reject);
                    }, 500);
                }).catch(deferred.reject);
            } else if (response.status === 423) {
                /** RETRY HANDLER */
                if (!curRetryCounter) curRetryCounter = 0;

                if (curRetryCounter < maxRetries) {
                    curRetryCounter++;
                    var waitingBackoffTime_ms = curRetryCounter * 500; //ms
                    setTimeout(function () {
                        self.postRequest(path, data, headers, curRetryCounter).then(function (response) {
                            return deferred.resolve(response.data);
                        }).catch(deferred.reject);
                    }, waitingBackoffTime_ms);
                } else {
                    deferred.reject(response);
                }
            } else {
                if (response.status === 0 || response.status === -1) {
                    /** TIMEOUT */
                    self.raiseTimeout();
                }
                deferred.reject(response);
            }
        });

        return deferred.promise;
    };

    self.putRequest = function (path, data, headers, curRetryCounter) {
        var deferred = $q.defer();

        $http.put(self.ENV + path, data, self.getHttpConfig(null, headers)).then(function (response) {
            self.loweTimeout();
            if (!response || !response.data || response.data.Status == 'error') {
                deferred.reject(response);
            } else {
                deferred.resolve(response.data);
            }
            // if (response.status === 204) {
            //     deferred.reject(response);
            // } else {
            //     deferred.resolve(response.data);
            // }
        }, function (response) {

            if (!response) {
                console.warn('R_U');
                deferred.reject();
                return;
            }
            if (response.status === 401 && localStorage.getItem(enums.localStorageKeys.refreshToken)) {
                ptLog.log('Refreshing Token');
                self.apiMethods.users.refreshToken(localStorage.getItem(enums.localStorageKeys.refreshToken)).then(function (response) {
                    ptLog.log('Refreshing Token success');
                    $rootScope.$emit(enums.busEvents.tokenRefresh, response.data);
                    setTimeout(function () {
                        self.postRequest(path, data, headers, curRetryCounter).then(deferred.resolve).catch(deferred.reject);
                    }, 500);
                }).catch(deferred.reject);
            } else if (response.status === 423) {
                /** RETRY HANDLER */
                if (!curRetryCounter) curRetryCounter = 0;

                if (curRetryCounter < maxRetries) {
                    curRetryCounter++;
                    var waitingBackoffTime_ms = curRetryCounter * 500; //ms
                    setTimeout(function () {
                        self.putRequest(path, data, headers, curRetryCounter).then(function (response) {
                            return deferred.resolve(response.data);
                        }).catch(deferred.reject);
                    }, waitingBackoffTime_ms);
                } else {
                    deferred.reject(response);
                }
            } else {
                if (response.status === 0 || response.status === -1) {
                    /** TIMEOUT */
                    self.raiseTimeout();
                }
                deferred.reject(response);
            }
        });

        return deferred.promise;
    };

    self.apiMethods = {
        categories: {
            getCategories: function getCategories() {
                return self.getRequest('/GetCategories?LanguageCode=' + appStateManager.getCurrentLang());
            }

        },
        pages: {
            getHomePageData: function getHomePageData(categories) {
                var params = {};
                params.LanguageCode = appStateManager.getCurrentLang();
                params.Categories = categories;
                return self.getRequest("/GetHomePageData", params);
            },
            getProductDetailData: function getProductDetailData(id) {
                var params = {};
                params.LanguageCode = appStateManager.getCurrentLang();
                params.Product_Id = id;
                return self.getRequest("/GetProductDetailData", params);
            }
        },
        products: {
            getSearchedProducts: function getSearchedProducts(_ref6) {
                var keyword = _ref6.keyword,
                    isShop = _ref6.isShop,
                    categoryId = _ref6.categoryId,
                    subCategoryId = _ref6.subCategoryId,
                    sortBy = _ref6.sortBy,
                    minPriceRange = _ref6.minPriceRange,
                    maxPriceRange = _ref6.maxPriceRange,
                    city = _ref6.city,
                    lat = _ref6.lat,
                    lng = _ref6.lng,
                    range = _ref6.range,
                    page = _ref6.page,
                    productPerPage = _ref6.productPerPage,
                    isWeb = _ref6.isWeb,
                    productIDs = _ref6.productIDs,
                    isTryAndBuy = _ref6.isTryAndBuy;


                var LanguageCode = appStateManager.getCurrentLang();
                var params = {
                    LanguageCode: LanguageCode
                };

                if (keyword) params.KeywordProduct = encodeURIComponent(keyword);
                var userId = appStateManager.getUserId();
                if (appStateManager.user != null && userId != null) params.User_Id = userId;

                if (categoryId) params.Category_Id = categoryId;

                if (subCategoryId) params.SubCategory_Id = subCategoryId;

                if (isShop) params.IsShop = isShop;

                if (sortBy) params[sortBy] = true;

                if (minPriceRange) params.MinPriceRange = minPriceRange;

                if (maxPriceRange) params.MaxPriceRange = maxPriceRange;

                if (lat && lng) {
                    params.Latitude = lat;
                    params.Longitude = lng;
                }

                if (city) params.Product_City = city;

                if (range) params.Range = range;

                if (isWeb) params.IsWeb = isWeb;

                if (page) params.PageIndex = page;

                if (productPerPage) params.productPerPage = productPerPage;

                if (productIDs) params.productIDs = productIDs;
                if (isTryAndBuy) params.isTryAndBuy = isTryAndBuy;

                return self.getRequest('/GetSearchedProduct', params);
            },

            getPopularTryAndBuy: function getPopularTryAndBuy() {

                return self.apiMethods.products.getSearchedProducts({
                    productPerPage: 20,
                    sortBy: enums.productsSortOptions.bestProduct,
                    isTryAndBuy: true
                });
            },

            getSuggestions: function getSuggestions(keyword) {
                var params = self.getDefaultParams();
                params.Keyword = encodeURIComponent(keyword);

                return self.getRequest('/Suggestion', params);
            },

            getDetailedProduct: function getDetailedProduct(productId) {
                var obj = self.getDefaultParams();
                var params = _extends({ Product_Id: productId }, obj);
                var User_Id = appStateManager.getUserId();
                if (User_Id) params.User_Id = User_Id;
                return self.getRequest('/GetProductDetail', params);
            },
            getUserProducts: function getUserProducts(_ref7) {
                var userId = _ref7.userId,
                    productsFilter = _ref7.productsFilter,
                    _ref7$pageIndex = _ref7.pageIndex,
                    pageIndex = _ref7$pageIndex === undefined ? 0 : _ref7$pageIndex;

                var obj = self.getDefaultParams();
                var params = _extends({}, obj, {
                    User_Id: userId,
                    PageIndex: pageIndex
                });
                params[productsFilter] = true;

                return self.getRequest('/GetMyProducts', params);
            },
            getProductBookingDetails: function getProductBookingDetails(_ref8) {
                var productId = _ref8.productId,
                    userId = _ref8.userId;

                var obj = self.getDefaultParams();
                var params = _extends({}, obj, {
                    User_Id: userId,
                    Product_Id: productId
                });
                return self.getRequest('/ProductBookingDetail', params);
            },
            addProduct: function addProduct(_ref9) {
                var Product_ItemCategory_Id = _ref9.Product_ItemCategory_Id,
                    Product_Title = _ref9.Product_Title,
                    Product_Description = _ref9.Product_Description,
                    Product_Price_Perday = _ref9.Product_Price_Perday,
                    Product_IsShop = _ref9.Product_IsShop,
                    Product_City = _ref9.Product_City,
                    Product_ShopURL = _ref9.Product_ShopURL,
                    Price1Day = _ref9.Price1Day,
                    Price15Day = _ref9.Price15Day,
                    Product_TryAndBuy = _ref9.Product_TryAndBuy,
                    MinRentalPeriod = _ref9.MinRentalPeriod,
                    MaxRentalPeriod = _ref9.MaxRentalPeriod,
                    Product_Longitude = _ref9.Product_Longitude,
                    Product_Latitude = _ref9.Product_Latitude,
                    ProductImage_Image1 = _ref9.ProductImage_Image1,
                    Product_LenduserId = _ref9.Product_LenduserId;

                var data = _extends({}, self.getDefaultParams(), {
                    Product_ItemCategory_Id: Product_ItemCategory_Id,
                    Product_Title: Product_Title,
                    Product_Description: Product_Description,
                    Product_Price_Perday: Product_Price_Perday,
                    Product_IsShop: Product_IsShop,
                    Product_City: Product_City,
                    Product_ShopURL: Product_ShopURL,
                    Price1Day: Price1Day,
                    Price15Day: Price15Day,
                    Product_TryAndBuy: Product_TryAndBuy,
                    MinRentalPeriod: MinRentalPeriod,
                    MaxRentalPeriod: MaxRentalPeriod,
                    Product_Longitude: Product_Longitude,
                    Product_Latitude: Product_Latitude,
                    ProductImage_Image1: ProductImage_Image1,
                    Product_LenduserId: Product_LenduserId
                });

                return self.postRequest('/AddProduct', data);
            }
        },
        reviews: {
            submitTransactionReview: function submitTransactionReview(params) {
                //console.log('submit review params ', params)
                return self.postRequest('/AddBookingReview', params);
            }
        },
        users: {
            signUp: function signUp(_ref10) {
                var email = _ref10.email,
                    username = _ref10.username,
                    password = _ref10.password,
                    location = _ref10.location,
                    currentLang = _ref10.currentLang,
                    referralCode = _ref10.referralCode;

                var obj = {
                    User_UserName: username,
                    User_Email: email,
                    User_Address: location,
                    User_Password: password,
                    User_UDIDType: 3,
                    LanguageCode: currentLang,
                    ReferralCode: referralCode
                };
                return self.postRequest('/SignUp', obj);
            },

            signupFacebook: function signupFacebook(_ref11) {
                var facebookName = _ref11.facebookName,
                    email = _ref11.email,
                    address = _ref11.address,
                    currentLang = _ref11.currentLang,
                    facebookUserId = _ref11.facebookUserId,
                    referralCode = _ref11.referralCode;

                var dataObj = {
                    User_UserName: facebookName.replace(" ", "-"),
                    User_Email: email,
                    User_Address: address,
                    User_Password: "",
                    User_UDIDType: 3,
                    LanguageCode: currentLang,
                    User_DisplayPicturePath: 'https://graph.facebook.com/' + facebookUserId + '/picture?type=large',
                    User_DisplayPicture: 'https://graph.facebook.com/' + facebookUserId + '/picture?type=large',
                    User_FacebookId: facebookUserId,
                    User_FullName: facebookName,
                    User_QBId: '',
                    ReferralCode: referralCode
                };
                return self.postRequest('/Signup', dataObj);
            },

            signUpReferred: function signUpReferred(referralCode) {
                var dataObj = {
                    ReferralCode: referralCode,
                    LanguageCode: appStateManager.getCurrentLang()
                };

                return self.getRequest('/VerifyReferralCode', dataObj);
            },

            login: function login(_ref12) {
                var _ref12$username = _ref12.username,
                    username = _ref12$username === undefined ? '' : _ref12$username,
                    _ref12$email = _ref12.email,
                    email = _ref12$email === undefined ? '' : _ref12$email,
                    password = _ref12.password,
                    currentLang = _ref12.currentLang;

                var obj = {
                    User_UserName: username,
                    User_Email: email,
                    User_Mobile: "",
                    User_UDIDType: 3,
                    User_Password: password,
                    User_FacebookId: "",
                    LanguageCode: currentLang
                };
                return self.postRequest('/Login', obj);
            },

            forgotPassword: function forgotPassword(_ref13) {
                var email = _ref13.email,
                    currentLang = _ref13.currentLang;

                var dataObj = _extends({}, self.getDefaultParams(), {
                    User_Email: email
                });
                return self.postRequest('/ForgetPassword', dataObj, { Authorization: $base64.encode('Paladin:Paladin123') });
            },

            changePassword: function changePassword(_ref14) {
                var userId = _ref14.userId,
                    newPassword = _ref14.newPassword,
                    oldPassword = _ref14.oldPassword;

                var params = _extends({}, self.getDefaultParams(), {
                    User_Id: userId,
                    User_NewPassword: newPassword,
                    User_OldPassword: oldPassword
                });
                return self.postRequest('/ChangePassword', params);
            },

            emailVerification: function emailVerification(_ref15) {
                var userId = _ref15.userId;

                return self.getRequest('/EmailVerfication/?User_Id=' + userId, undefined, { Authorization: $base64.encode('Paladin:Paladin123') });
            },

            getUserProfile: function getUserProfile(_ref16) {
                var userId = _ref16.userId;

                var params = _extends({}, self.getDefaultParams(), {
                    User_Id: userId
                });
                return self.getRequest('/GetUserProfile', params);
            },

            getUserCredit: function getUserCredit(_ref17) {
                var userId = _ref17.userId;

                var params = _extends({}, self.getDefaultParams(), {
                    User_Id: userId
                });
                return self.getRequest('/GetUserCredit', params);
            },

            refreshToken: function refreshToken(_refreshToken) {
                return $http({
                    method: 'POST',
                    url: window.globals.TOKEN_URL,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    transformRequest: function transformRequest(obj) {
                        var str = [];
                        for (var p in obj) {
                            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                        }return str.join("&");
                    },
                    data: { grant_type: 'refresh_token', refresh_token: _refreshToken }
                });
            },

            editProfile: function editProfile(profile) {
                var body = _extends({}, self.getDefaultParams(), profile);
                return self.putRequest('/EditProfile', body);
            },

            updateNotificaton: function updateNotificaton(_ref18) {
                var userId = _ref18.userId,
                    emailNotif = _ref18.emailNotif,
                    chatNotif = _ref18.chatNotif;

                var dataObj = _extends({}, self.getDefaultParams(), {
                    Notification_Chat: chatNotif,
                    Notification_Push: chatNotif,
                    Notification_Email: emailNotif,
                    Notification_UserId: userId
                });
                return self.postRequest('/UpdateNotification', dataObj);
            },

            deleteAccount: function deleteAccount(userId) {
                var params = _extends({}, self.getDefaultParams(), {
                    User_Id: userId
                });
                return self.getRequest('/DeleteUser', params);
            }
        },
        bookings: {
            getUserBookings: function getUserBookings(userId) {
                var params = _extends({}, self.getDefaultParams(), {
                    User_Id: userId
                });
                return self.getRequest('/GetUserBookings', params);
            },
            getBookingDetailed: function getBookingDetailed(_ref19) {
                var bookingId = _ref19.bookingId,
                    userId = _ref19.userId;

                var params = _extends({}, self.getDefaultParams(), {
                    User_Id: userId,
                    BookingId: bookingId
                });
                return self.getRequest('/GetBookingDetail', params);
            },
            acceptBookingRequest: function acceptBookingRequest(_ref20) {
                var bookingId = _ref20.bookingId,
                    userId = _ref20.userId;

                var params = _extends({}, self.getDefaultParams(), {
                    Lender_Id: userId,
                    BookingId: bookingId
                });
                return self.getRequest('/AcceptBookingRequest', params);
            },
            rejectBookingRequest: function rejectBookingRequest(_ref21) {
                var bookingId = _ref21.bookingId,
                    userId = _ref21.userId;

                var params = _extends({}, self.getDefaultParams(), {
                    User_Id: userId,
                    BookingId: bookingId
                });
                return self.getRequest('/RejectBookingRequest', params);
            },
            cancelBookingRequest: function cancelBookingRequest(_ref22) {
                var bookingId = _ref22.bookingId,
                    userId = _ref22.userId,
                    reason = _ref22.reason;

                var params = _extends({}, self.getDefaultParams(), {
                    User_Id: userId,
                    BookingId: bookingId,
                    Reason: reason
                });
                return self.getRequest('/CancelBookingRequest', params);
            },
            startRental: function startRental(_ref23) {
                var bookingId = _ref23.bookingId,
                    userId = _ref23.userId;

                var params = _extends({}, self.getDefaultParams(), {
                    User_Id: userId,
                    BookingId: bookingId
                });
                return self.getRequest('/StartRentalBookingRequest', params);
            },
            endRental: function endRental(_ref24) {
                var bookingId = _ref24.bookingId,
                    userId = _ref24.userId;

                var params = _extends({}, self.getDefaultParams(), {
                    User_Id: userId,
                    BookingId: bookingId
                });
                return self.getRequest('/EndRentalBookingRequest', params);
            },
            bookProduct: function bookProduct(_ref25) {
                var stripeEmail = _ref25.stripeEmail,
                    borrowerId = _ref25.borrowerId,
                    lenderId = _ref25.lenderId,
                    productId = _ref25.productId,
                    startDate = _ref25.startDate,
                    endDate = _ref25.endDate,
                    noOfDays = _ref25.noOfDays,
                    coupon = _ref25.coupon,
                    stripeCustomerId = _ref25.stripeCustomerId,
                    isSaveCard = _ref25.isSaveCard,
                    idVerified = _ref25.idVerified,
                    isPickUp = _ref25.isPickUp,
                    deliveryLat = _ref25.deliveryLat,
                    deliveryLng = _ref25.deliveryLng,
                    deliveryAddress = _ref25.deliveryAddress,
                    deliveryName = _ref25.deliveryName,
                    deliveryPhone = _ref25.deliveryPhone,
                    deliveryBell = _ref25.deliveryBell,
                    isTryAndBuy = _ref25.isTryAndBuy;

                var dataObj = _extends({}, self.getDefaultParams(), {
                    Stripe_Email: stripeEmail,
                    Borrower_UserId: borrowerId,
                    Lender_UserId: lenderId,

                    Product_Id: productId,
                    StartDate: startDate,
                    EndDate: endDate,
                    NoOfDays: noOfDays,

                    CouponNumber: coupon,
                    CustomerAccountId: stripeCustomerId,
                    SaveCard: isSaveCard,

                    IdVerfied: idVerified,
                    Booking_PickupProduct: isPickUp,

                    Delivery_Latitude: deliveryLat,
                    Delivery_Longitude: deliveryLng,
                    Delivery_Address: deliveryAddress,
                    Complete_Borrower_Name: deliveryName,
                    Phone_Number: deliveryPhone,
                    House_Name: deliveryBell
                });

                return self.postRequest(isTryAndBuy ? '/BookTryAndBuyProduct' : '/BookProduct', dataObj);
            }
        },
        payments: {
            createUserStripeAccount: function createUserStripeAccount(_ref26) {
                var userId = _ref26.userId,
                    bookingId = _ref26.bookingId,
                    email = _ref26.email,
                    country = _ref26.country;

                var dataObj = _extends({}, self.getDefaultParams(), {
                    User_Id: userId,
                    Booking_Id: bookingId,
                    User_Email: email,
                    User_Country: country

                });
                return self.postRequest('/CreateBookingStripeAccount', dataObj);
            },
            verifyCoupon: function verifyCoupon(_ref27) {
                var coupon = _ref27.coupon,
                    userId = _ref27.userId;

                var params = _extends({}, self.getDefaultParams(), {
                    Coupon: coupon,
                    User_Id: userId
                });
                return self.getRequest('/VerifyCoupon', params);
            },
            createStripeCustomer: function createStripeCustomer(_ref28) {
                var email = _ref28.email,
                    cardToken = _ref28.cardToken;

                // Somebody, very smart, switched the values of token and email in the server -_- so I flipped them here as well
                // Email field is used as token and vice versa
                var params = _extends({}, self.getDefaultParams(), {
                    Email: cardToken,
                    TokenId: email
                });
                return self.getRequest('/CreateStripeCustomer', params);
            }
        },
        purchase: {
            buyProduct: function buyProduct(_ref29) {
                var stripeEmail = _ref29.stripeEmail,
                    bookingId = _ref29.bookingId,
                    purchaseAmount = _ref29.purchaseAmount,
                    borrowerId = _ref29.borrowerId,
                    lenderId = _ref29.lenderId,
                    productId = _ref29.productId,
                    stripeCustomerId = _ref29.stripeCustomerId,
                    isSaveCard = _ref29.isSaveCard,
                    isPickUp = _ref29.isPickUp,
                    deliveryLat = _ref29.deliveryLat,
                    deliveryLng = _ref29.deliveryLng,
                    deliveryAddress = _ref29.deliveryAddress,
                    deliveryName = _ref29.deliveryName,
                    deliveryPhone = _ref29.deliveryPhone,
                    deliveryBell = _ref29.deliveryBell;

                var dataObj = _extends({}, self.getDefaultParams(), {
                    Stripe_Email: stripeEmail,
                    Borrower_UserId: borrowerId,
                    Lender_UserId: lenderId,
                    Stripe_Amount: purchaseAmount,

                    Product_Id: productId,
                    Booking_Id: bookingId,

                    CustomerAccountId: stripeCustomerId,
                    SaveCard: isSaveCard,

                    Booking_PickupProduct: isPickUp,

                    Delivery_Latitude: deliveryLat,
                    Delivery_Longitude: deliveryLng,
                    Delivery_Address: deliveryAddress,
                    Complete_Borrower_Name: deliveryName,
                    Phone_Number: deliveryPhone,
                    House_Name: deliveryBell
                });

                return self.postRequest('/BuyProduct', dataObj);
            }
        },
        verification: {
            uploadPassport: function uploadPassport(_ref30) {
                var passportImage = _ref30.passportImage,
                    selfie = _ref30.selfie,
                    userId = _ref30.userId;

                var dataObj = _extends({}, self.getDefaultParams(), {
                    PassPort: passportImage,
                    User_Selfie: selfie,
                    User_Id: userId
                });
                return self.postRequest('/IDVerficationDocument', dataObj);
            },
            sendToManualVerification: function sendToManualVerification(data) {
                var dataObj = _extends({}, self.getDefaultParams(), {
                    PassPort: data.passportImage,
                    User_Id: data.userId,
                    NICFront: data.NICDLFront,
                    NICBack: data.NICDLBack,
                    User_Selfie: data.selfie,
                    BookingId: data.bookingId
                });
                return self.postRequest('/IDManualVerficationDocument', dataObj);
            },
            uploadNICDL: function uploadNICDL(_ref31) {
                var NICDLFront = _ref31.NICDLFront,
                    NICDLBack = _ref31.NICDLBack,
                    selfie = _ref31.selfie,
                    userId = _ref31.userId;

                var dataObj = _extends({}, self.getDefaultParams(), {
                    User_Id: userId,
                    NICFront: NICDLFront,
                    NICBack: NICDLBack,
                    User_Selfie: selfie
                });
                return self.postRequest('/IDVerficationDocument', dataObj);
            }
        },
        chats: {
            getChatsList: function getChatsList(_ref32) {
                var userId = _ref32.userId,
                    _ref32$pageIndex = _ref32.pageIndex,
                    pageIndex = _ref32$pageIndex === undefined ? 0 : _ref32$pageIndex;

                var params = _extends({}, self.getDefaultParams(), {
                    User_Id: userId,
                    PageIndex: pageIndex
                });
                return self.getRequest('/GetChatList', params);
            },
            getChatDetailed: function getChatDetailed(_ref33) {
                var chatId = _ref33.chatId;

                var params = _extends({}, self.getDefaultParams(), {
                    Chat_Id: chatId,
                    ChatDone: 0
                });
                return self.getRequest('/GetChatDetail', params);
            },
            getChatByQBId: function getChatByQBId(_ref34) {
                var chatQbId = _ref34.chatQbId;

                var params = _extends({}, self.getDefaultParams(), {
                    Chat_QBRoomId: chatQbId,
                    ChatDone: 0
                });
                return self.getRequest('/GetChatInfoByQBId', params);
            },
            startBookingChat: function startBookingChat(_ref35) {
                var lenderId = _ref35.lenderId,
                    borrowerId = _ref35.borrowerId,
                    productId = _ref35.productId,
                    _ref35$chatRoomId = _ref35.chatRoomId,
                    chatRoomId = _ref35$chatRoomId === undefined ? null : _ref35$chatRoomId,
                    _ref35$bookingId = _ref35.bookingId,
                    bookingId = _ref35$bookingId === undefined ? null : _ref35$bookingId;


                var dataObj = _extends({}, self.getDefaultParams(), {
                    User_UDIDType: 3,
                    Lender_Id: lenderId,
                    Borrower_Id: borrowerId,
                    Product_Id: productId,
                    BookingId: bookingId,
                    Chat_QBRoomId: chatRoomId
                });
                return self.postRequest('/StartBookingChat', dataObj);
            }
        }
    };

    return self.apiMethods;
}]);

// angular.module('paladinApp')
// .config(['$translateProvider', function($translateProvider) {
// 	$translateProvider
// 	.useStaticFilesLoader({
// 	    prefix: '/translations/',
// 	    suffix: '.json'
// 	})
// 	.preferredLanguage('it');
// 	/*.useLocalStorage()
//   	.useMissingTranslationHandlerLog()*/
// }]);
//

angular.module('paladinApp').factory('ngTranslateErrorHandler', ['ptLog', function (ptLog) {
    // has to return a function which gets a tranlation ID
    return function (translationID, uses) {
        // do something with dep1 and dep2
        ptLog.warn('Translation for key "' + translationID + '" not found when using: ' + uses + ', using key instead');
        return translationID;
    };
}]);
angular.module('paladinApp').config(['$translateProvider', function ($translateProvider) {
    $translateProvider.useStaticFilesLoader({
        prefix: '/translations/locale-',
        suffix: '.json'
    }).preferredLanguage(localStorage.getItem('PT_LSK_preferredLanguage') || 'it').useMissingTranslationHandler('ngTranslateErrorHandler')
    // .useMissingTranslationHandlerLog()
    .useSanitizeValueStrategy('escapeParameters');
}]);
angular.module('paladinApp').factory('Filters', ['$http', '$base64', '$rootScope', '$q', function ($http, $base64, $rootScope, $q) {

    var Filters = {};

    Filters.getHeaders = function () {
        var headers = {
            //"Authorization": "Basic " + auth,
            'Access-Control-Allow-Origin': '*',
            'X-Requested': null,
            'Content-Type': 'application/json; charset=utf-8'
        };

        return headers;
    };

    Filters.get = function (languageCode, callback) {

        if ($rootScope.categoriesMap && $rootScope.categoriesMap.get(languageCode)) {
            return;
        }

        var payload = {
            // headers: this.getHeaders()
        };

        $http.get(window.globals.API_URL + 'GetCategories?LanguageCode=' + this.formatLanguageCode(languageCode)).then(callback);
    };

    Filters.getCategoryById = function (id, lang) {
        if ($rootScope.categoriesMap && $rootScope.categoriesMap.get(lang)) {
            var categories = $rootScope.categoriesMap.get(lang);
            for (var i = 0; i < categories.length; i++) {
                if (categories[i].Category_Id == id) {
                    return categories[i];
                }
            }
        }
        //console.error("Filters.getCategoryById: "+ id + ","+lang+" $rootScope.categoriesMap not defined or null")
    };

    Filters.getSubcategoryById = function (id, lang) {

        if ($rootScope.categoriesMap && $rootScope.categoriesMap.get(lang)) {
            var categories = $rootScope.categoriesMap.get(lang);
            for (var i = 0; i < categories.length; i++) {
                for (var j = 0; j < categories[i].Category_SubCatrgories.length; j++) {
                    if (categories[i].Category_SubCatrgories[j].SubCategory_Id == id) {
                        return categories[i].Category_SubCatrgories[j];
                    }
                }
            }
        }
        //console.error("Filters.getSubcategoryById: "+ id + ","+lang+" $rootScope.categoriesMap not defined or null")    
    };

    Filters.getCategoryByName = function (name, lang, isTryAndBuy) {
        if ($rootScope.categoriesMap && $rootScope.categoriesMap.get(lang)) {
            var categories = $rootScope.categoriesMap.get(lang);
            for (var i = 0; i < categories.length; i++) {
                if (isTryAndBuy == categories[i].IsTryAndBuy && categories[i].Category_Name && categories[i].Category_Name.toLowerCase().replace(/ /g, '-') == name.toLowerCase()) {
                    return categories[i];
                }
            }
        }
        //console.error("Filters.getCategoryByName: "+ name + ","+lang+" $rootScope.categoriesMap not defined or null");
    };

    Filters.getSubcategoryByName = function (name, lang) {

        if ($rootScope.categoriesMap && $rootScope.categoriesMap.get(lang)) {
            var categories = $rootScope.categoriesMap.get(lang);
            for (var i = 0; i < categories.length; i++) {
                for (var j = 0; j < categories[i].Category_SubCatrgories.length; j++) {
                    if (categories[i].Category_SubCatrgories[j].SubCategory_Name && categories[i].Category_SubCatrgories[j].SubCategory_Name.toLowerCase().replace(/ /g, '-') == name.toLowerCase()) {
                        return categories[i].Category_SubCatrgories[j];
                    }
                }
            }
        }
        //console.error("Filters.getSubcategoryByName: "+ name + ","+lang+" $rootScope.categoriesMap not defined or null");
    };

    Filters.findByName = function (name, languageCode, callback) {
        var payload = {
            headers: this.getHeaders()
        };

        $http.get(window.globals.API_URL + 'GetCategories?LanguageCode=' + this.formatLanguageCode(languageCode)).then(function (response) {
            var categories = response.data.Data;
            for (var i = 0; i < categories.length; i++) {
                var category = categories[i];
                if (category.Category_Name && category.Category_Name.toLowerCase().replace(/ /g, '-') == name.toLowerCase()) {
                    callback(category);
                    return;
                }
            }
            callback(null);
        });
    };

    Filters.getSuggestions = function (keywords, languageCode) {
        return $http.get(window.globals.API_URL + 'Suggestion?Keyword=' + keywords + '&&LanguageCode=' + this.formatLanguageCode(languageCode)).then(function (response) {
            return response.data.Data.map(function (item) {
                return item.Keyword;
            });
        });
    };

    Filters.getCategoriesUrl = function (categoryName, subcategoryName, isTryAndBuy, languageCode) {
        var path = window.globals.ROOT_PATH + languageCode + "/categorie/" + (isTryAndBuy ? '' : "privato/");
        if (subcategoryName == null) {
            path = path + categoryName;
        } else {
            path = path + categoryName + "/" + subcategoryName + (filter.glCity ? "/" + filter.glCity : '');
        }

        return path.split(' ').join('-');;
    };

    Filters.formatLanguageCode = function (code) {
        return code == 'it' ? 'it-IT' : code;
    };

    return Filters;
}]);

angular.module('paladinApp').factory('Products', ['$http', '$base64', 'enums', function ($http, $base64, enums) {
    var Products = {};

    Products.getHeaders = function () {
        var headers = {
            //"Authorization": "Basic " + auth,
            'Access-Control-Allow-Origin': '*',
            'X-Requested': null,
            'Content-Type': 'application/json; charset=utf-8'
        };

        return headers;
    };

    Products.getAll = function (filters) {

        if (!filters.languageCode) filters.languageCode = 'it-IT';

        var payload = {
            //headers: this.getHeaders()
        };

        //console.log("-----GET SEARCHED PRODUCTS: ");
        //console.log(this.searchProductParam(filters));
        return $http.get(window.globals.API_URL + 'GetSearchedProduct?' + this.searchProductParam(filters));
    };

    Products.getTotalPageCount = function (filters) {

        if (!filters.languageCode) filters.languageCode = 'en';

        var payload = {
            headers: this.getHeaders()
        };
        //console.log("-----GET PAGE COUNT----");
        //console.log(window.globals.API_URL  + 'GetPageCount?'+this.searchProductParam(filters));

        return $http.get(window.globals.API_URL + 'GetPageCount?' + this.searchProductParam(filters));
    };

    /*
    Products.decryptProductURL = function(url) {
      return url.split('-').join(' ').split('_').join('-').split('^').join('/').split('__').join('_');
    }
    */

    Products.encryptProductURL = function (productName) {
        return productName.trim().split(' ').join('-').split('/').join('-');
    };

    Products.getDetail = function (productId, languageCode, callback) {
        var payload = {
            headers: this.getHeaders()
        };

        if (!languageCode) LanguageCode = 'en';

        //console.log("-----GET PRODUCT DETAIL API----");
        //console.log(window.globals.API_URL  + 'GetProductDetail?User_Id=0&Product_Title='
        //+encodeURIComponent(Products.decryptProductURL(productId)));


        if (!isNaN(productId)) {
            $http.get(window.globals.API_URL + 'GetProductDetail?User_Id=0&Product_Id=' + productId).then(callback);
        } else {
            $http.get(window.globals.API_URL + 'GetProductDetail?User_Id=0&Product_Title=' + encodeURIComponent(Products.decryptProductURL(productId))).then(callback);
        }
    };

    Products.formatLanguageCode = function (code) {
        return code == 'it' ? 'it-IT' : code;
    };

    Products.searchProductParam = function (json) {
        var _this = this;
        var keys = Object.keys(json);
        var paramStr = '';
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            var val = json[k];
            if (k == 'languageCode' && val) {
                paramStr += 'LanguageCode' + '=' + encodeURIComponent(this.formatLanguageCode(val));
            } else if (k == 'category' && val) {
                if (val.selectedCategoryId) {
                    paramStr += 'Category_Id' + '=' + encodeURIComponent(val.selectedCategoryId);
                }
                if (val.selectedSubCategoryId) {
                    paramStr += '&SubCategory_Id' + '=' + encodeURIComponent(val.selectedSubCategoryId);
                }
                if (val.isTryAndBuy != undefined) {
                    paramStr += paramStr[paramStr.length - 1] == '&' ? 'isTryAndBuy=' + encodeURIComponent(val.isTryAndBuy) : '&isTryAndBuy=' + encodeURIComponent(val.isTryAndBuy);
                }
            } else if (k == 'sortBy' && val) {

                if (val == 'SortByPopularity') {
                    paramStr += 'SortByPopularity' + '=true';
                } else if (val == 'SortByRecent') {
                    paramStr += 'SortByRecent' + '=true';
                } else if (val == 'SortByGeoLocation') {
                    paramStr += 'SortByGeoLocation' + '=true';
                } else if (val == 'SortByLowPrice') {
                    paramStr += 'SortByLowPrice' + '=true';
                } else if (val == 'SortByHighPrice') {
                    paramStr += 'SortByHighPrice' + '=true';
                } else if (val == 'SortByBestProduct') {
                    paramStr += 'SortByBestProduct' + '=true';
                }
            } else if (k == 'priceRange' && val) {
                var minPrice = val[0];
                var maxPrice = val[1];
                paramStr += 'MinPriceRange' + '=' + encodeURIComponent(minPrice) + '&' + 'MaxPriceRange' + '=' + encodeURIComponent(maxPrice);
            } else if (k == 'currentPage' && val) {
                paramStr += 'PageIndex' + '=' + encodeURIComponent(val - 1);
            } else if (k == 'search' && val) {

                var finalStr = '';
                if (val.searchStr) {
                    finalStr += 'KeywordProduct' + '=' + encodeURIComponent(val.searchStr);
                    if (val.lat) finalStr += '&';
                }

                //we only need to send lat long for sort = nearest
                if (val.lat && json.sortByCode == enums.productsSortByTextCode.SortByGeoLocation) {
                    finalStr += 'Latitude' + '=' + encodeURIComponent(val.lat);
                    if (val.lng) finalStr += '&';
                }
                if (val.lng && json.sortByCode == enums.productsSortByTextCode.SortByGeoLocation) {
                    finalStr += 'Longitude' + '=' + encodeURIComponent(val.lng);
                }
                paramStr += finalStr;
            } else if (k == 'distanceRange' && val && json.sortByCode == enums.productsSortByTextCode.SortByGeoLocation) {
                var maxDistance = val;
                if (maxDistance <= 50) paramStr += 'Range' + '=' + encodeURIComponent(maxDistance);
            } else if (k == 'currentPage' && val) {
                paramStr += 'PageIndex=' + (val - 1);
            }

            if (i < keys.length - 1 && paramStr && paramStr.slice(-1) != '&') {

                paramStr += '&';
            }
        }

        if (paramStr.endsWith('&')) {
            paramStr = paramStr.substring(0, paramStr.length - 1);
        }

        paramStr += '&isWeb=true';
        return paramStr;
    };

    return Products;
}]);
angular.module('paladinApp').service('productReviewService', ['$state', '$stateParams', '$window', 'enums', 'apiService', function ($state, $stateParams, $window, enums, apiService) {

    var self = this;

    // save ref to the booking to be reviewed
    self.booking = null;

    var startReviewFlow = function startReviewFlow(booking, isLender) {
        self.booking = booking;
        $state.go('app.products.productReview', { bookingId: booking.Booking_Id });
    };

    var leaveProductReviewPage = function leaveProductReviewPage() {
        var toState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

        $window.history.back();
    };

    var submitTransactionReview = function submitTransactionReview(params) {
        apiService.reviews.submitTransactionReview(params).then(function (result) {
            toastService.simpleToast($translate.instant('REVIEW_ADDED_SUCCESSFULLY'));
        });
    };

    var getBookingToReview = function getBookingToReview() {
        return self.booking;
    };

    return {
        startReviewFlow: startReviewFlow,
        leaveProductReviewPage: leaveProductReviewPage,
        submitTransactionReview: submitTransactionReview,
        getBookingToReview: getBookingToReview
    };
}]);

angular.module('paladinApp').factory('pager', ['$rootScope', '$location', function ($rootScope, $location) {
    var pagerService = {};

    // service implementation
    pagerService.GetPager = function (totalPages, currentPage, pageSize) {
        // default to first page
        currentPage = currentPage || 1;

        // default page size is 10
        pageSize = pageSize || 10;

        // calculate total pages
        //var totalPages = Math.ceil(totalItems / pageSize);
        var totalItems = totalPages * pageSize;
        var startPage, endPage;
        if (totalPages <= 10) {
            // less than 10 total pages so show all
            startPage = 1;
            endPage = totalPages;
        } else {
            // more than 10 total pages so calculate start and end pages
            if (currentPage <= 6) {
                startPage = 1;
                endPage = 10;
            } else if (currentPage + 4 >= totalPages) {
                startPage = totalPages - 9;
                endPage = totalPages;
            } else {
                startPage = currentPage - 5;
                endPage = currentPage + 4;
            }
        }

        // calculate start and end item indexes
        var startIndex = (currentPage - 1) * pageSize;
        var endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

        // create an array of pages to ng-repeat in the pager control
        var pages = _.range(startPage, endPage + 1);

        // return object with all pager properties required by the view
        return {
            totalItems: totalItems,
            currentPage: currentPage,
            pageSize: pageSize,
            totalPages: totalPages,
            startPage: startPage,
            endPage: endPage,
            startIndex: startIndex,
            endIndex: endIndex,
            pages: pages
        };
    };

    return pagerService;
}]);
angular.module('paladinApp').service('appStateManager', ['enums', '$base64', function (enums, $base64) {
    /// Filled from server and localStorage
    var appState = {
        currentLang: localStorage.getItem(enums.localStorageKeys.preferredLanguage) || 'it',
        getCurrentLang: function getCurrentLang() {
            return appState.currentLang == 'it' ? 'it-IT' : appState.currentLang;
        },
        user: null,
        chatUser: null,
        getUserId: function getUserId() {
            var userId = void 0;
            var hash = localStorage.getItem(enums.localStorageKeys.userId);
            userId = $base64.decode(hash).split(':')[1] || undefined;
            return userId;
        },
        location: null, // Filled from geoLocation service -> dataService
        categoriesDict: null
    };

    return appState;
}]);
angular.module('paladinApp').service('dataService', ['$rootScope', 'enums', 'appStateManager', '$translate', 'ptLog', '$base64', 'apiService', '$state', 'popupService', '$timeout', 'geoLocationService', 'chatService', '$interval', 'ngMeta', '$location', function ($rootScope, enums, appStateManager, $translate, ptLog, $base64, apiService, $state, popupService, $timeout, geoLocationService, chatService, $interval, ngMeta, $location) {
    var TAG = 'dataService || ';
    var didInit = false;
    var init = function init() {
        if (!didInit) {
            didInit = true;
            registerBus();
        }

        $translate.preferredLanguage(localStorage.getItem(enums.localStorageKeys.preferredLanguage) || 'it');

        /// Load user if exists
        if (getUserId()) {
            getMe();
        }

        // getCategories();

        //geoLocationUpdate();
        // geoLocationUpdateInterval();
    };

    var registerBus = function registerBus() {
        $rootScope.$on(enums.busEvents.userLogin, function (event, data) {
            var oAuthToken = data.oAuthToken;

            setTokens(oAuthToken);
            setUserId(data.User_Id);
            getMe();
        });

        $rootScope.$on(enums.busEvents.userSignup, function (event, data) {});

        $rootScope.$on(enums.busEvents.tokenRefresh, function (event, data) {
            setTokens(data);
        });

        $rootScope.$on(enums.busEvents.preferredLanguageChange, function (event, data) {
            localStorage.setItem(enums.localStorageKeys.preferredLanguage, data.currentLang);
            appStateManager.currentLang = data.currentLang;
            $translate.preferredLanguage(data.currentLang);
            $translate.use(data.currentLang);
            $translate.refresh();
            var newPath = location.pathname.replace(location.pathname.split('/')[1], data.currentLang);
            location.replace(newPath);
        });

        $rootScope.$on(enums.busEvents.userLogout, function (event) {
            chatService.disconnectChat();
            localStorage.clear();
            localStorage.setItem(enums.localStorageKeys.preferredLanguage, appStateManager.currentLang);
            false;
            appStateManager.user = null;
            $rootScope.$emit(enums.busEvents.updatedUser, null);
            $state.go('app.home', { languageCode: appStateManager.currentLang });
        });

        $rootScope.$on(enums.busEvents.triggerEmailValidation, function (event, data) {
            popupService.showEmailVerification(data.userId).then(function () {
                $state.go('app.home');
            }).catch(function () {
                $state.go('app.home');
            });
        });
        $rootScope.$on('$destroy', function () {
            console.log('ROOT SCOPE IS DEAD');
        });
    };

    var geoLocationUpdate = function geoLocationUpdate() {
        return new Promise(function (resolve, reject) {
            ptLog.log(TAG, 'Starting location update');
            geoLocationService.getLocation().then(function (location) {
                updateGeoLocationStorage(location);
                ptLog.log('Successfully got location');
                resolve(location);
            }).catch(function (err) {
                ptLog.error(TAG, 'error getting location', JSON.stringify(err));
                reject(err);
            });
        });
    };

    var geoLocationUpdateInterval = function geoLocationUpdateInterval() {
        $timeout(function () {
            geoLocationUpdate().finally(function () {
                geoLocationUpdateInterval();
            });
        }, 10 * 1000);
    };

    var getGeoLocationForApp = function getGeoLocationForApp() {
        return new Promise(function (resolve, reject) {
            if (appStateManager.location) {
                resolve(appStateManager.location);
            } else if (localStorage.getItem(enums.localStorageKeys.locationLatLong)) {
                var _JSON$parse = JSON.parse(localStorage.getItem(enums.localStorageKeys.locationLatLong)),
                    lat = _JSON$parse.lat,
                    lng = _JSON$parse.lng;

                resolve({
                    lat: lat,
                    lng: lng
                });
            } else {
                geoLocationUpdate().then(function (location) {
                    var lat = location.geometry.location.lat(),
                        lng = location.geometry.location.lng();
                    resolve({
                        lat: lat,
                        lng: lng
                    });
                }).catch(reject);
            }
        });
    };

    var updateGeoLocationStorage = function updateGeoLocationStorage(location) {
        appStateManager.location = location;
        var latLong = {
            lat: location.geometry.location.lat(),
            lng: location.geometry.location.lng()
        };
        localStorage.setItem(enums.localStorageKeys.locationLatLong, JSON.stringify(latLong));
        $rootScope.$emit(enums.busEvents.locationUpdate, latLong);
    };

    var getLatLong = function getLatLong() {
        return new Promise(function (resolve, reject) {
            var latLngStr = localStorage.getItem(enums.localStorageKeys.locationLatLong);
            if (!latLngStr) {
                geoLocationUpdate().then(function () {
                    getLatLong().then(resolve).catch(reject);
                }).catch(reject);
            } else {
                resolve(JSON.parse(latLngStr));
            }
        });
    };

    var setUserId = function setUserId(userId) {
        localStorage.setItem(enums.localStorageKeys.userId, $base64.encode(enums.secret + ':' + userId));
    };

    var setTokens = function setTokens(oAuthToken) {
        if (oAuthToken && oAuthToken.access_token && oAuthToken.token_type && oAuthToken.refresh_token) {
            localStorage.setItem(enums.localStorageKeys.jwtToken, oAuthToken.token_type + ' ' + oAuthToken.access_token);
            localStorage.setItem(enums.localStorageKeys.refreshToken, oAuthToken.refresh_token);
        } else {
            ptLog.error(TAG, 'Sign up successful but access token was not provided!');
        }
    };

    var getUserId = function getUserId() {
        return appStateManager.getUserId();
    };

    var messagesPollerInterval = undefined;
    var messagesPoller = function messagesPoller(isStart) {
        if (isStart) {
            if (messagesPollerInterval) {
                return new Error('message poller already active');
            }
            messagesPollerInterval = $interval(getUnreadMessages, 30 * 1000);
        } else {
            if (!messagesPollerInterval) {
                return new Error('message poller already deactivated');
            }
            $interval.cancel(messagesPollerInterval);
            messagesPollerInterval = undefined;
        }
    };

    var getUnreadMessages = function getUnreadMessages() {
        chatService.syncDialogList().then(function (dialogsDict) {
            console.log(dialogsDict);
            var nummberOfUnreadMessages = 0;
            Object.keys(dialogsDict).forEach(function (dialog) {
                nummberOfUnreadMessages += dialogsDict[dialog];
            });

            $rootScope.$emit(enums.busChatEvents.updateUnreadCount, {
                total: nummberOfUnreadMessages,
                detailedDict: dialogsDict
            });
        }).catch(function (err) {
            if (err.code == 404) {
                // no chats, no messages
                $rootScope.$emit(enums.busChatEvents.updateUnreadCount, {
                    total: 0,
                    detailedDict: {}
                });
            } else {
                ptLog.error(err);
            }
        });
    };

    var getCategories = function getCategories() {
        apiService.categories.getCategories().then(function (response) {
            var catDict = {};

            response.Data.forEach(function (item) {
                return catDict[item.Category_Id] = item;
            });
            appStateManager.categoriesDict = catDict;
            $rootScope.$emit(enums.busEvents.categoriesUpdate, catDict);
        }).catch(function (err) {
            ptLog.error(err);
        });
    };

    var getMe = function getMe() {
        var userId = getUserId();
        if (userId) {
            apiService.users.getUserProfile({ userId: userId }).then(function (response) {
                appStateManager.user = response.Data;
                ptLog.log(TAG, 'Fetched user profile');
                $rootScope.$emit(enums.busEvents.updatedUser, appStateManager.user);
                activatePendingPrivateState();
                chatService.loginToChat().then(function () {
                    chatService.connectToChat().then(function () {
                        chatService.syncDialogList();
                        messagesPoller(true);
                    }).catch(function (err) {
                        console.error('Could not connect to chat', JSON.stringify(err));
                    });
                });
            }).catch(function (err) {
                ptLog.error(TAG, JSON.stringify(err));
            });
        } else {
            ptLog.log(TAG, 'User Id not found');
        }
    };

    var forceLogin = function forceLogin(transition) {
        var nexState = transition.targetState();
        var stateObjToSave = {
            name: nexState.identifier().name,
            params: nexState.params(),
            options: nexState.options().current()
        };
        setPendingPrivateState(stateObjToSave);
        popupService.showLoginSignupPopup(false).catch(function (err) {
            // User decided not to login, delete saved state
            setPendingPrivateState(null);
        });
    };

    var updateGeneralSEO = function updateGeneralSEO() {
        var languageCode = appStateManager.currentLang;
        window.globals.SUPPORTED_LANGS.forEach(function (item) {
            ngMeta.setTag(enums.ngMetaValues.currentUrl(item.code), $location.absUrl().replace('/' + languageCode + '/', '/' + item.code + '/'));
        });
    };

    var setPendingPrivateState = function setPendingPrivateState(state) {
        if (state) {
            var encodedState = $base64.encode(enums.secret + '|:' + JSON.stringify(state));
            localStorage.setItem(enums.localStorageKeys.pendingPrivateState, encodedState);
        } else {
            localStorage.removeItem(enums.localStorageKeys.pendingPrivateState);
        }
    };

    var activatePendingPrivateState = function activatePendingPrivateState() {
        var encodedState = localStorage.getItem(enums.localStorageKeys.pendingPrivateState);
        if (encodedState) {
            var targetState = JSON.parse($base64.decode(encodedState).split('|:')[1]);
            if (targetState) {
                setPendingPrivateState(null);
                $state.go(targetState.name, targetState.params, targetState.options);
            }
        }
    };

    return {
        init: init,
        setUserId: setUserId,
        getUserId: getUserId,
        getCategories: getCategories,
        getGeoLocationForApp: getGeoLocationForApp,
        forceLogin: forceLogin,
        updateGeneralSEO: updateGeneralSEO
    };
}]);
angular.module('paladinApp').service('menusService', ['$rootScope', 'appStateManager', '$translate', 'popupService', '$mdToast', '$state', 'enums', 'ZendeskWidget', function ($rootScope, appStateManager, $translate, popupService, $mdToast, $state, enums, ZendeskWidget) {

    /**
     *
     About:
     How it works
     Try & Buy
     Blog
     FAQ
     Account (logged in):
     My profile
     My Listings
     My Rentals
     Log out
     Account (logged out)
     Log in
     Sign up
     Links:
     Contact us
     Terms and Conditions  → (not showing in header) → route to paladintrue.com/terms-and-conditions/
     */

    /**
     *
     * @type {{aboutMenu: {title: string, list: *[]}, accountLoggedOut: {title: string, shouldHide: function(), list: *[]}, accountLoggedIn: {title: string, shouldHide: function(), list: *[]}, linksMenu: {title: string, list: *[]}, common: {title: string, list: *[]}}}
     */
    var commonMenus = {
        aboutMenu: {
            title: 'ABOUT',
            list: [
            // {
            //     itemId:'menu-item-how-it-works',
            //     title: 'HOW_IT_WORKS', // $translate directive
            //     link:`https://paladintrue.com/${appStateManager.currentLang}/how-it-works/`
            // },
            {
                itemId: 'menu-item-try-n-buy',
                title: 'TRY_AND_BUY',
                link: 'https://paladintrue.com/' + appStateManager.currentLang + '/' + window.globals.SUPPORTED_LANGS.find(function (lang) {
                    return appStateManager.currentLang == lang.code;
                }).tryAndBuyWordPressPath + '/'
            }, {
                itemId: 'menu-item-blog',
                title: 'BLOG',
                link: 'https://paladintrue.com/' + appStateManager.currentLang + '/blog/'
            }, {
                itemId: 'menu-item-faq',
                title: 'FAQ',
                link: 'https://paladintrue.com/' + appStateManager.currentLang + '/faq/'
            }]
        },
        accountLoggedOut: {
            title: 'HEADER_MY_ACCOUNT',
            shouldHide: function shouldHide() {
                return appStateManager.user != null;
            },
            list: [{
                itemId: 'menu-item-login',
                title: 'HEADER_LOGIN',
                BL: function BL() {
                    return popupService.showLoginSignupPopup(false);
                }
            }, {
                itemId: 'menu-item-signup',
                title: 'HEADER_SIGNUP',
                BL: function BL() {
                    return popupService.showLoginSignupPopup(true);
                }
            }]
        },
        accountLoggedIn: {
            title: 'HEADER_MY_ACCOUNT',
            shouldHide: function shouldHide() {
                return appStateManager.user == null;
            },
            list: [{
                itemId: 'menu-item-my-profile',
                title: 'MY_PROFILE',
                BL: function BL() {
                    $rootScope.$emit(enums.busNavigation.userProfile, { userId: appStateManager.user.User_Id });
                }
            },
            // {
            //     itemId: 'menu-item-my-rentals',
            //     title: 'MY_RENTAL',
            //     BL: () => $rootScope.$emit(enums.busNavigation.rentals),
            // },
            {
                itemId: 'menu-item-message',
                title: 'MESSAGES',
                BL: function BL() {
                    return $rootScope.$emit(enums.busNavigation.chat);
                }
            }, {
                itemId: 'menu-item-logout',
                title: 'HEADER_LOGOUT',
                BL: function BL() {
                    return $rootScope.$emit(enums.busEvents.userLogout);
                }
            }]
        },
        linksMenu: {
            title: 'LINKS',
            list: [{
                itemId: 'menu-item-contact',
                title: 'CONTACT',
                //link:`https://paladintrue.com/${appStateManager.currentLang}/contact/`
                link: $translate.instant("URL_CONTACT")
            }, {
                itemId: 'menu-item-terms-n-conditions',
                title: 'TANDC',
                link: 'https://paladintrue.com/' + appStateManager.currentLang + '/terms-and-conditions/'
            }, {
                itemId: 'menu-item-privacy-policy',
                title: 'PRIVACY_POLICY',
                link: 'https://paladintrue.com/' + appStateManager.currentLang + '/privacy-policy/'
            }, {
                itemId: 'menu-item-help-support',
                title: 'SUPPORT',
                BL: function BL() {
                    ZendeskWidget.activate();
                }
            }]
        },
        common: {
            title: '', // no title
            list: [{
                itemId: 'menu-item-browse',
                title: 'BORROW',
                BL: function BL() {
                    return $state.go('app.browse');
                },
                link: window.globals.ROOT_PATH + appStateManager.currentLang + "/categorie/" + (appStateManager.currentLang == 'it' ? "Tutte-le-Categorie" : "All-Categories") + "?sortBy=SortByBestProduct&pageIndex=1"
            }, {
                itemId: 'menu-item-lend',
                title: 'LEND',
                BL: function BL() {
                    if (appStateManager.user == null) {
                        popupService.showLoginSignupPopup(false);
                    } else {
                        $rootScope.$emit(enums.busNavigation.userListings);
                    }
                }
            }, {
                itemId: 'menu-item-my-rentals',
                title: 'MY_RENTAL',
                BL: function BL() {
                    if (appStateManager.user == null) {
                        popupService.showLoginSignupPopup(false);
                    } else {
                        $rootScope.$emit(enums.busNavigation.rentals);
                    }
                }
            }]
        }

    };

    /**
     *
     * @param menuItem the clicked menu item
     *
     */
    var menuClickHandlerMethod = function menuClickHandlerMethod(menuItem) {
        //bl has prio against link
        if (menuItem.BL) {
            menuItem.BL();
        } else if (menuItem.link) {
            window.open(menuItem.link, "_self");
        }
    };

    var shouldShowMenuItem = function shouldShowMenuItem(menuItem) {
        return menuItem.shouldHide == undefined || !menuItem.shouldHide();
    };

    var dummyNavNotImplementedToast = function dummyNavNotImplementedToast() {
        $mdToast.show($mdToast.simple().textContent('Navigation on menu item not implemented yet').hideDelay(3000));
    };
    return {
        commonMenus: commonMenus,
        menuClickHandlerMethod: menuClickHandlerMethod,
        shouldShowMenuItem: shouldShowMenuItem
    };
}]);
angular.module('paladinApp').service('geoLocationService', ['$rootScope', 'appStateManager', 'ptLog', function ($rootScope, appStateManager, ptLog) {
    var TAG = 'geoLocationService || ';
    var geocoder = new google.maps.Geocoder();

    var getGeoLocationPostion = function getGeoLocationPostion() {
        return new Promise(function (resolve, reject) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(resolve, reject); //,{timeout: 5 * 1000}) // drop results that take more than five secs
            } else {
                reject({ message: 'goeLocation not supported by browser' });
            }
        });
    };

    var getLocation = function getLocation() {
        return new Promise(function (resolve, reject) {
            ptLog.log('GET USER LOCATION');
            getGeoLocationPostion().then(function (position) {
                var data = {
                    location: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                };
                geoCodeLocation(data).then(function (results) {
                    resolve(results);
                }).catch(reject);
            }).catch(function (err) {
                ptLog.error(TAG, JSON.stringify(err));
                ptLog.log(TAG, 'Getting default location');
                var defaultLoc = getDefaultLocationAddressForLang();
                geoCodeLocation(defaultLoc).then(function (results) {
                    resolve(results);
                }).catch(reject);
            });
        });
    };

    var geoCodeLocation = function geoCodeLocation(locData) {
        return new Promise(function (resolve, reject) {
            geocoder.geocode(locData, function (results, status) {
                if (results && results.length > 0) {
                    resolve(results[0]);
                } else {
                    reject({ status: status });
                }
            });
        });
    };

    var getDefaultLocationAddressForLang = function getDefaultLocationAddressForLang() {
        var lang = window.globals.SUPPORTED_LANGS.find(function (lang) {
            return lang.code === appStateManager.currentLang;
        });
        return lang ? { address: lang.defaultLocation } : { address: 'milan italy' };
    };

    var getUserCountryFromUserAddress = function getUserCountryFromUserAddress(address) {
        return new Promise(function (resolve, reject) {
            geocoder.geocode({ address: address }, function (results, status) {

                if (status == 'OK') {

                    if (results && results.length > 0) {
                        var address_components = results[0].address_components;


                        if (address_components && address_components.length > 0) {
                            var country = address_components.find(function (comp) {
                                var types = comp.types;

                                if (types && types.length > 0) {
                                    return types[0].toLowerCase() === 'country';
                                } else {
                                    return false;
                                }
                            });

                            if (country) {
                                resolve(country);
                            } else {
                                reject(new Error('Country not found'));
                            }
                        } else {
                            reject(new Error('Address not found'));
                        }
                    } else {
                        reject(new Error('No results found'));
                    }
                } else {
                    reject(new Error('Could not geocode address'));
                }
            });
        });
    };

    var getUserAddressFromCoordinates = function getUserAddressFromCoordinates(_ref36) {
        var lat = _ref36.lat,
            lng = _ref36.lng;

        return new Promise(function (resolve, reject) {
            geocoder.geocode({ location: { lat: lat, lng: lng } }, function (results, status) {

                if (status === 'OK') {

                    if (results && results.length > 0) {
                        var streetAddress = results.find(function (res) {
                            var types = res.types;

                            if (types && types.length > 0) {
                                return types[0].toLowerCase() === 'street_address';
                            } else {
                                return false;
                            }
                        });

                        if (streetAddress) {
                            resolve(streetAddress.formatted_address);
                        } else {
                            reject(new Error('Address not found'));
                        }
                    } else {
                        reject(new Error('No results found'));
                    }
                } else {
                    reject(new Error('Could not geocode coordinates'));
                }
            });
        });
    };
    return {
        getLocation: getLocation,
        getUserCountryFromUserAddress: getUserCountryFromUserAddress,
        getUserAddressFromCoordinates: getUserAddressFromCoordinates
    };
}]);
angular.module('paladinApp').service('toastService', ['$mdToast', function ($mdToast) {
    this.simpleToast = function (message) {
        var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3000;
        var isRight = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

        $mdToast.show($mdToast.simple().textContent(message).hideDelay(delay).position(isRight ? 'bottom right' : 'bottom left'));
    };
}]);
angular.module('paladinApp').service('navigationService', ['$rootScope', '$state', 'enums', 'ptLog', 'ptUtils', 'toastService', function ($rootScope, $state, enums, ptLog, ptUtils, toastService) {
    var TAG = 'navigationService ||';

    $rootScope.$on(enums.busNavigation.homePage, function () {
        return $state.go('app.home');
    });

    $rootScope.$on(enums.busNavigation.productDetailed, function (event, _ref37) {
        var product = _ref37.product;

        if (product) {
            $state.go('app.products.selectedProduct', { productNameAndId: ptUtils.getProductNameAndId(product) });
        } else {
            ptLog.error(TAG, enums.busNavigation.productDetailed, 'NO PRODUCT');
        }
    });

    $rootScope.$on(enums.busNavigation.browseCategory, function (event, _ref38) {
        var categoryId = _ref38.categoryId,
            subCategoryName = _ref38.subCategoryName,
            categoryName = _ref38.categoryName;

        var obj = {};
        if (categoryId) obj.category = categoryId;else if (categoryName) obj.category = categoryName.replace(/\ /g, '-');

        if (subCategoryName) obj.subCategory = subCategoryName.replace(/\ /g, '-');
        obj.sortBy = enums.productsSortOptions.bestProduct;
        obj.isResetSearch = true;
        $state.go('app.browse', obj);
    });

    $rootScope.$on(enums.busNavigation.browseKeyword, function (event, data) {
        $state.go('app.browse', { search: data.keyword });
    });

    $rootScope.$on(enums.busNavigation.switchBrowseMode, function (event, _ref39) {
        var isTryAndBuy = _ref39.isTryAndBuy;

        if (isTryAndBuy) {
            $state.go('app.browse');
        } else {
            $state.go('app.browsePrivate');
        }
    });

    $rootScope.$on(enums.busNavigation.browseSort, function (event, data) {
        $state.go('app.browse', { sortBy: data.sortBy, search: '', isResetSearch: true });
    });

    $rootScope.$on(enums.busNavigation.userProfile, function (event, _ref40) {
        var userId = _ref40.userId,
            replace = _ref40.replace;

        $state.go('app.profiles.publicProfile', { userId: userId }, replace ? { location: 'replace' } : undefined);
    });

    $rootScope.$on(enums.busNavigation.userListings, function () {
        return $state.go('app.myListings');
    });

    $rootScope.$on(enums.busNavigation.newProduct, function () {
        return $state.go('app.products.newProduct');
    });

    $rootScope.$on(enums.busNavigation.rentals, function () {
        return $state.go('app.bookings.userBookings');
    });

    $rootScope.$on(enums.busNavigation.transactionDetailed, function (event, _ref41) {
        var bookingId = _ref41.bookingId,
            replace = _ref41.replace;

        $state.go('app.bookings.bookingDetailed', { bookingId: bookingId }, replace ? { location: 'replace' } : undefined);
    });

    $rootScope.$on(enums.busNavigation.idVerification, function (event, _ref42) {
        var bookingId = _ref42.bookingId,
            replace = _ref42.replace;

        // optional booking object
        $state.go('verification.user', { bookingId: bookingId ? bookingId : undefined }, replace ? { location: 'replace' } : undefined);
    });

    $rootScope.$on(enums.busNavigation.userReview, function (event, _ref43) {
        var bookingId = _ref43.bookingId,
            isLender = _ref43.isLender;


        $state.go('app.products.productReview', { bookingId: booking.Booking_Id });
    });

    $rootScope.$on(enums.busNavigation.paymentDetailed, function (event, _ref44) {
        var startDate = _ref44.startDate,
            endDate = _ref44.endDate,
            productId = _ref44.productId,
            purchase = _ref44.purchase,
            bookingId = _ref44.bookingId;

        $state.go('app.bookings.paymentDetailed', {
            startDate: startDate,
            endDate: endDate,
            productId: productId,
            purchase: purchase,
            bookingId: bookingId
        });
        // ptLog.error(TAG, `Navigation Error: ${enums.busNavigation.paymentDetailed}, please provide startDate, endDate and productId`)
        // }
    });

    $rootScope.$on(enums.busNavigation.chat, function (event) {
        var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

        if (data && data.chatId) $state.go('app.chat', { chatId: data.chatId });else $state.go('app.chat');
    });
}]);
angular.module('paladinApp').service('uploadHandler', [function () {
    this.convertInputElementToBas64 = function (inputElement) {
        return new Promise(function (resolve, reject) {
            if (inputElement && inputElement.files && inputElement.files.length > 0) {
                return convertFile(inputElement.files[0]).then(resolve).catch(reject);
            } else {
                // No file uploaded
                reject('no file uploaded');
            }
        });
    };

    var convertFile = function convertFile(imgFile) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onloadend = function () {
                if (reader.result) {
                    var img64 = reader.result.replace('data:' + imgFile.type + ';base64,', '');
                    resolve({
                        original64: reader.result,
                        serverParsed64: img64
                    });
                } else reject('error uploading image');
            };
            reader.readAsDataURL(imgFile);
        });
    };
}]);
'use strict';
angular.module('paladinApp').service('ptUtils', ['$rootScope', 'enums', 'moment', '$translate', '$timeout', 'ptLog', 'geoLocationService', '$sce', function ($rootScope, enums, moment, $translate, $timeout, ptLog, geoLocationService, $sce) {
    var TAG = 'ptUtils';

    var stringToDate = function stringToDate(dateString) {
        var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'DD/MM/YYYY HH:mm';
        var dateDelimiter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '/';
        var timeDelimiter = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : ':';
        var dateTimeSplitter = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : ' ';


        var isHasTime = format.indexOf('HH') != -1 && format.indexOf('mm') != -1;
        var dateTimeSplits = [dateString];

        if (isHasTime) dateTimeSplits = dateString.split(dateTimeSplitter);

        var datePartFormat = (isHasTime ? format.split(dateTimeSplitter)[0] : format).split(dateDelimiter);
        var dateItems = (isHasTime ? dateString.split(dateTimeSplitter)[0] : dateString).split(dateDelimiter);
        var yearI = datePartFormat.indexOf(datePartFormat.find(function (item) {
            return item.indexOf('Y') != -1;
        }));
        var monthI = datePartFormat.indexOf('MM');
        var dayI = datePartFormat.indexOf('DD');
        var hourI = undefined;
        var minuteI = undefined;

        if (isHasTime) {
            var timeItems = dateString.split(dateTimeSplitter)[1].split(timeDelimiter);
            var timePartFormat = format.split(dateTimeSplitter)[1].split(timeDelimiter);
            hourI = timePartFormat.indexOf('HH');
            minuteI = timePartFormat.indexOf('mm');
            return new Date(dateItems[yearI], parseInt(dateItems[monthI]) - 1, dateItems[dayI], timeItems[hourI], timeItems[minuteI]);
        }
        return new Date(dateItems[yearI], parseInt(dateItems[monthI]) - 1, dateItems[dayI]);
    };

    var getDisplayDataForTransactionStatus = function getDisplayDataForTransactionStatus(statusId) {
        var text = undefined;
        var color = undefined;
        switch (statusId) {
            case enums.productRentalStatus.available:
                text = 'PRODUCT_STATUS_AVAILABLE';
                color = 'rentOrderStatus-primary-50';
                break;
            case enums.productRentalStatus.requested:
                color = 'rentOrderStatus-primary-100';
                text = 'PRODUCT_STATUS_REQUESTED';
                break;
            case enums.productRentalStatus.timeout:
            case enums.productRentalStatus.timeoutByBorrower:
                color = 'rentOrderStatus-primary-200';
                text = 'PRODUCT_STATUS_TIMEOUT';
                break;
            case enums.productRentalStatus.canceled:
            case enums.productRentalStatus.criticalCancel:
            case enums.productRentalStatus.moderateCancel:
            case enums.productRentalStatus.canceledByLender:
                color = 'rentOrderStatus-primary-200';
                text = 'PRODUCT_STATUS_CANCELED';
                break;
            case enums.productRentalStatus.denied:
                color = 'rentOrderStatus-primary-200';
                text = 'PRODUCT_STATUS_DECLINED';
                break;
            case enums.productRentalStatus.accepted:
                color = 'rentOrderStatus-primary-300';
                text = 'PRODUCT_STATUS_ACCEPTED';
                break;
            case enums.productRentalStatus.started:
                color = 'rentOrderStatus-primary-400';
                text = 'PRODUCT_STATUS_STARTED';
                break;
            case enums.productRentalStatus.ended:
                color = 'rentOrderStatus-primary-500';
                text = 'PRODUCT_STATUS_ENDED';
                break;
            case enums.productRentalStatus.verified:
                color = 'rentOrderStatus-primary-50';
                text = 'PRODUCT_STATUS_VERIFIED';
                break;
            case enums.productRentalStatus.notVerified:
                color = 'rentOrderStatus-primary-100';
                text = 'PRODUCT_STATUS_NOT_VERIFIED';
                break;
            case enums.productRentalStatus.verifying:
                color = 'rentOrderStatus-primary-100';
                text = 'PRODUCT_STATUS_VERIFYING';
                break;
            case enums.productRentalStatus.booked:
                color = 'rentOrderStatus-primary-300';
                text = 'PRODUCT_STATUS_BOOKED';
                break;
        }
        return {
            text: text,
            color: color
        };
    };

    var getPriceForRentalPeriod = function getPriceForRentalPeriod(product, rentalPeriodInDays) {
        var Price1Day = product.Price1Day,
            Price3Day = product.Price3Day,
            Price5Day = product.Price5Day,
            Price7Day = product.Price7Day,
            Price10Day = product.Price10Day,
            Price15Day = product.Price15Day,
            Product_TryAndBuy = product.Product_TryAndBuy,
            Product_CategoryId = product.Product_CategoryId,
            Product_Price_Perday = product.Product_Price_Perday;

        var daysFactor = 0;

        if (enums.categoriesIds.tryAndBuy == Product_CategoryId || Product_TryAndBuy) {
            if (Price15Day > 0 && rentalPeriodInDays >= 15) {
                daysFactor = rentalPeriodInDays - 15;
                if (daysFactor > 0) return Price15Day + getPriceForRentalPeriod(product, daysFactor);else return Price15Day;
            } else if (Price10Day > 0 && rentalPeriodInDays >= 10) {
                daysFactor = rentalPeriodInDays - 10;
                if (daysFactor > 0) return Price10Day + getPriceForRentalPeriod(product, daysFactor);else return Price10Day;
            } else if (Price7Day > 0 && rentalPeriodInDays >= 7) {
                daysFactor = rentalPeriodInDays - 7;
                if (daysFactor > 0) return Price7Day + getPriceForRentalPeriod(product, daysFactor);else return Price7Day;
            } else if (Price5Day > 0 && rentalPeriodInDays >= 5) {
                daysFactor = rentalPeriodInDays - 5;
                if (daysFactor > 0) return Price5Day + getPriceForRentalPeriod(product, daysFactor);else return Price5Day;
            } else if (Price3Day > 0 && rentalPeriodInDays >= 3) {
                daysFactor = rentalPeriodInDays - 3;
                if (daysFactor > 0) return Price3Day + getPriceForRentalPeriod(product, daysFactor);else return Price3Day;
            } else if (Price1Day > 0 && rentalPeriodInDays >= 1) {
                daysFactor = rentalPeriodInDays - 1;
                if (daysFactor > 0) return Price1Day + getPriceForRentalPeriod(product, daysFactor);else return Price1Day;
            } else {
                return Product_Price_Perday * rentalPeriodInDays;
            }
        } else {
            return Product_Price_Perday * rentalPeriodInDays;
        }
    };

    var getPriceForRentalPeriodLegacy = function getPriceForRentalPeriodLegacy(product, rentalPeriodInDays) {
        var Price3Day = product.Price3Day,
            Price5Day = product.Price5Day,
            Price7Day = product.Price7Day,
            Price10Day = product.Price10Day,
            Price15Day = product.Price15Day,
            Product_TryAndBuy = product.Product_TryAndBuy,
            Product_CategoryId = product.Product_CategoryId,
            Product_Price_Perday = product.Product_Price_Perday;

        var daysFactor = 0;
        var periodFixedPrice = undefined;
        if (enums.categoriesIds.tryAndBuy == Product_CategoryId || Product_TryAndBuy) {
            if (Price15Day > 0 && rentalPeriodInDays >= 15) {
                daysFactor = rentalPeriodInDays - 15;
                periodFixedPrice = Price15Day;
            } else if (Price10Day > 0 && rentalPeriodInDays >= 10) {
                daysFactor = rentalPeriodInDays - 10;
                periodFixedPrice = Price10Day;
            } else if (Price7Day > 0 && rentalPeriodInDays >= 7) {
                daysFactor = rentalPeriodInDays - 7;
                periodFixedPrice = Price7Day;
            } else if (Price5Day > 0 && rentalPeriodInDays >= 5) {
                daysFactor = rentalPeriodInDays - 5;
                periodFixedPrice = Price5Day;
            } else if (Price3Day > 0 && rentalPeriodInDays >= 3) {
                daysFactor = rentalPeriodInDays - 3;
                periodFixedPrice = Price3Day;
            }
        }

        if (periodFixedPrice) {
            if (daysFactor > 0) return periodFixedPrice + daysFactor * Product_Price_Perday;else return periodFixedPrice;
        } else {
            return Product_Price_Perday * rentalPeriodInDays;
        }
    };

    var getPriceCalculatedDescriptionForRentalPeriod = function getPriceCalculatedDescriptionForRentalPeriod(product, rentalPeriodInDays) {
        var Price1Day = product.Price1Day,
            Price3Day = product.Price3Day,
            Price5Day = product.Price5Day,
            Price7Day = product.Price7Day,
            Price10Day = product.Price10Day,
            Price15Day = product.Price15Day,
            Product_TryAndBuy = product.Product_TryAndBuy,
            Product_CategoryId = product.Product_CategoryId,
            Product_Price_Perday = product.Product_Price_Perday;

        var days = rentalPeriodInDays;
        var priceDivisions = {};

        for (var i = days; i > 0;) {
            var division = 0;
            var divisionPrice = 0;
            if (enums.categoriesIds.tryAndBuy == Product_CategoryId || Product_TryAndBuy) {
                if (Price15Day > 0 && i >= 15) {
                    division = 15;
                    divisionPrice = Price15Day;
                } else if (Price10Day > 0 && i >= 10) {
                    division = 10;
                    divisionPrice = Price10Day;
                } else if (Price7Day > 0 && i >= 7) {
                    division = 7;
                    divisionPrice = Price7Day;
                } else if (Price5Day > 0 && i >= 5) {
                    division = 5;
                    divisionPrice = Price5Day;
                } else if (Price3Day > 0 && i >= 3) {
                    division = 3;
                    divisionPrice = Price3Day;
                } else if (Price1Day > 0 && i >= 1) {
                    division = 1;
                    divisionPrice = Price1Day;
                } else {
                    division = 1;
                    divisionPrice = Product_Price_Perday;
                }
            } else {
                division = 1;
                divisionPrice = Product_Price_Perday;
            }

            priceDivisions[divisionPrice] = (priceDivisions[divisionPrice] || 0) + 1;
            i -= division;
        }

        var priceDescription = '';
        for (var div in priceDivisions) {
            priceDescription += (priceDescription === '' ? '' : '+') + (div + 'x' + priceDivisions[div]);
        }
        return priceDescription;
    };

    var calculatePricingListForProduct = function calculatePricingListForProduct(startRentDate, endRentDate, product, productBookingDetails) {
        var isDelivery = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
        var userCredit = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;
        var coupon = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : undefined;
        var isBuy = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : false;

        return new Promise(function (resolve, reject) {
            if (startRentDate && endRentDate && !isBuy) {
                var days = getRentalPeriodInDays({ startRentDate: startRentDate, endRentDate: endRentDate });
                var prices = [];
                var Product_CategoryId = product.Product_CategoryId,
                    Product_TryAndBuy = product.Product_TryAndBuy,
                    MinRentalPeriod = product.MinRentalPeriod,
                    MaxRentalPeriod = product.MaxRentalPeriod;
                var DeliveryAndPickupDetail = productBookingDetails.DeliveryAndPickupDetail;
                var Delivery_Fee = DeliveryAndPickupDetail.Delivery_Fee,
                    PickUp_Address = DeliveryAndPickupDetail.PickUp_Address;


                var isTryAndBuy = enums.categoriesIds.tryAndBuy == Product_CategoryId || Product_TryAndBuy;
                var price = getPriceForRentalPeriodLegacy(product, days);
                var priceDescription = '' + days;
                // getPriceCalculatedDescriptionForRentalPeriod(product, days);

                if (isTryAndBuy) {
                    if (MinRentalPeriod > 0 && days < MinRentalPeriod) return reject({
                        code: -2,
                        message: $translate.instant('INVALID_MIN_RENTAL_PERIOD', { days: MinRentalPeriod })
                    });else if (MaxRentalPeriod > 0 && days > MaxRentalPeriod) reject({
                        code: -3,
                        message: $translate.instant('INVALID_MAX_RENTAL_PERIOD', { days: MaxRentalPeriod })
                    });
                }

                prices = [{
                    price: price,
                    description: priceDescription + ' ' + $translate.instant(days == 1 ? 'DAY' : 'DAYS')
                }, {
                    price: 0,
                    description: $translate.instant('SERVICE_FEE'),
                    tooltip: $translate.instant('SERVICE_FEE_FREE')
                }];

                if (isTryAndBuy && isDelivery) {
                    prices.push({
                        price: Delivery_Fee || 0,
                        description: $translate.instant('DELIVERY_FEE')
                    });
                }

                var totalPrice = (isTryAndBuy && isDelivery ? Delivery_Fee || 0 : 0) + price;

                if (coupon) {
                    var Coupon = coupon.Coupon,
                        CouponValue = coupon.CouponValue,
                        CouponIsPercentage = coupon.CouponIsPercentage,
                        CouponIsFixed = coupon.CouponIsFixed;


                    if (!CouponIsFixed) {

                        var discount = CouponIsPercentage ? totalPrice * (CouponValue / 100) : CouponValue;
                        totalPrice -= discount;
                        if (totalPrice < 0) {
                            totalPrice = 0;
                        }
                        prices.push({
                            description: $translate.instant('COUPON'),
                            isCoupon: true,
                            price: '-' + discount
                        });
                    } else {
                        totalPrice = CouponValue;
                        prices.push({
                            description: $translate.instant('FIX_COUPON_DISCOUNT'),
                            isCoupon: true,
                            price: '' + CouponValue
                        });
                    }
                } else if (userCredit && userCredit.User_Credit) {
                    var credit = userCredit.User_Credit;

                    var _discount = credit >= totalPrice - 5 ? totalPrice - 5 : credit;

                    totalPrice -= _discount;

                    prices.push({
                        description: $translate.instant('CREDIT'),
                        isCredit: false,
                        price: '-' + _discount
                    });
                }

                prices.push({
                    description: $translate.instant('TOTAL'),
                    price: totalPrice
                });

                resolve(prices);
            } else if (isBuy) {
                var _prices = [];
                //buy case
                _prices.push({
                    description: $translate.instant('RETAIL_PRICE'),
                    price: product.Product_PurchasePrice
                });
                if (isDelivery) {
                    _prices.push({
                        description: $translate.instant('DELIVERY_FEE'),
                        price: product.Product_Process_Fee
                    });
                }

                var _totalPrice = product.Product_Process_Fee + product.Product_PurchasePrice;
                _prices.push({
                    description: $translate.instant('TOTAL'),
                    price: _totalPrice
                });

                resolve(_prices);
            }
        });
    };

    var calculatePriceingListForBooking = function calculatePriceingListForBooking(booking) {
        return new Promise(function (resolve) {
            var Booking_PickupProduct = booking.Booking_PickupProduct,
                FullEndDate = booking.FullEndDate,
                FullStartDate = booking.FullStartDate,
                Discount = booking.Discount,
                DeliveryAndPickupDetail = booking.DeliveryAndPickupDetail,
                RentAmount = booking.RentAmount,
                Fix_Amount_Coupon = booking.Fix_Amount_Coupon,
                AmountCharge = booking.AmountCharge;
            var Delivery_Fee = DeliveryAndPickupDetail.Delivery_Fee;


            var days = getRentalPeriodInDays({
                startRentDate: new Date(FullStartDate),
                endRentDate: new Date(FullEndDate)
            });
            var priceDescription = '' + days;
            var isDelivery = !Booking_PickupProduct;

            var prices = [{
                price: isDelivery ? RentAmount - Delivery_Fee : RentAmount,
                description: priceDescription + ' ' + $translate.instant(days == 1 ? 'DAY' : 'DAYS')
            }, {
                price: 0,
                description: $translate.instant('SERVICE_FEE'),
                tooltip: $translate.instant('SERVICE_FEE_FREE')
            }];

            if (isDelivery) {
                prices.push({
                    price: Delivery_Fee || 0,
                    description: $translate.instant('DELIVERY_FEE')
                });
            }
            if (Discount) {
                prices.push({
                    price: -Discount,
                    description: $translate.instant('DISCOUNT')
                });
            }

            if (Fix_Amount_Coupon > 0) {
                prices.push({
                    price: Fix_Amount_Coupon,
                    description: $translate.instant('FIX_COUPON_DISCOUNT')
                });
            }
            /* 
            let totalPrice = RentAmount + (Booking_PickupProduct ? 0 : Delivery_Fee || 0) - (Discount ? Discount : 0);
            if (totalPrice < 0)
                totalPrice = 0;
            */
            //as total price we use AmountCharge    
            prices.push({
                price: AmountCharge,
                description: $translate.instant('TOTAL')
            });

            resolve(prices);
        });
    };

    var getRentalPeriodInDays = function getRentalPeriodInDays(_ref45) {
        var startRentDate = _ref45.startRentDate,
            endRentDate = _ref45.endRentDate;

        var startDate = moment.isMoment(startRentDate) ? startRentDate : moment(new Date(startRentDate));
        var endDate = moment.isMoment(endRentDate) ? endRentDate : moment(new Date(endRentDate));
        return endDate.diff(startDate, 'days') + 1;
    };

    /**
     * @return {
     *  startDate: Date,
     *  endDate: Date,
     * }
     */
    var getProductFirstAvailableDatesToRent = function getProductFirstAvailableDatesToRent(productBookingDetails) {
        var dateRanges = getBookedDateRanges(productBookingDetails);
        var firstAvailableDates = {
            startDate: moment(),
            endDate: moment().add(1, 'day')
        };

        for (var i = 0; i < dateRanges.length; i++) {
            if (isBookingDateBookedForDateRange(firstAvailableDates.startDate, dateRanges[i]) || isBookingDateBookedForDateRange(firstAvailableDates.endDate, dateRanges[i])) {
                firstAvailableDates.startDate = moment(dateRanges[i].endDate).add(1, 'day');
                firstAvailableDates.endDate = moment(firstAvailableDates.startDate).add(1, 'day');
            }
        }

        return firstAvailableDates;
    };

    var getBookedDateRanges = function getBookedDateRanges(productBookingDetails) {
        var ProductBookingDetail = productBookingDetails.ProductBookingDetail;


        if (ProductBookingDetail && ProductBookingDetail.length > 0) {
            var dateRanges = [];
            ProductBookingDetail.forEach(function (booking) {
                dateRanges.push({
                    endDate: moment(booking.EndDate),
                    startDate: moment(booking.StartDate)
                });
            });

            return dateRanges;
        }
        return [];
    };

    /**
     *
     * @param momentDate date to validate (moment Object)
     * @param range dateRange containing startDate and enDate dates, usually means that the method "getBookedDateRanges" was called at an earlier step
     */
    var isBookingDateBookedForDateRange = function isBookingDateBookedForDateRange(momentDate, range) {
        return momentDate.isBetween(range.startDate, range.endDate) || momentDate.isSame(range.startDate) || momentDate.isSame(range.endDate);
    };
    var regexPatterns = {
        email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        numbersOnly: /^[0-9]+$/,
        minMaxLength: function minMaxLength() {
            var min = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2;
            var max = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
            return new RegExp('.{' + min + ',' + (max ? max : '') + '}');
        }
    };

    var sorters = {
        bookingLastModifiedEpoch: function bookingLastModifiedEpoch(a, b) {
            return b.Last_Modified - a.Last_Modified;
        }
    };

    var dataUrlToBlob = function dataUrlToBlob(dataUrl) {
        // Decode the dataUrl
        var binary = atob(dataUrl.split(',')[1]);
        // Create 8-bit unsigned array
        var array = [];
        for (var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        // Return our Blob object
        return new Blob([new Uint8Array(array)], { type: 'image/jpg' });
    };

    var isMobile = {
        Android: function Android() {
            return navigator.userAgent.match(/Android/i);
        },
        BlackBerry: function BlackBerry() {
            return navigator.userAgent.match(/BlackBerry/i);
        },
        iOS: function iOS() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        Opera: function Opera() {
            return navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function Windows() {
            return navigator.userAgent.match(/IEMobile/i);
        },
        any: function any() {
            return isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows();
        }
    };

    var isCrawler = function isCrawler() {
        return (/bot|prerender|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent)
        );
    };

    var playErrorSound = function playErrorSound() {
        try {
            var context = new AudioContext();
            var o = context.createOscillator();
            var g = context.createGain();
            o.type = "sine";
            o.connect(g);
            g.connect(context.destination);
            o.start();
            g.gain.exponentialRampToValueAtTime(0.00010, context.currentTime + 1);
        } catch (err) {
            ptLog.error('AudioContext not supported');
        }
    };

    var isProductTryAndBuy = function isProductTryAndBuy(product) {
        var Product_CategoryId = product.Product_CategoryId,
            Product_TryAndBuy = product.Product_TryAndBuy;

        return enums.categoriesIds.tryAndBuy == Product_CategoryId || Product_TryAndBuy;
    };

    var getProductDetailUrl = function getProductDetailUrl(product) {
        return window.globals.ROOT_PATH + $translate.use() + '/product/' + getProductNameAndId(product);
    };

    var getProductNameAndId = function getProductNameAndId(product) {
        return (product.Product_Title + ' ' + product.Product_Id).replace(/\ /g, '-');
    };

    var getAddressToDisplayForBooking = function getAddressToDisplayForBooking(_ref46) {
        var product = _ref46.product,
            productBookingDetails = _ref46.productBookingDetails,
            booking = _ref46.booking;

        return new Promise(function (resolve, reject) {
            var isProductTryAndBuyBool = isProductTryAndBuy(product);
            var location = {
                title: 'PICK_UP',
                address: undefined,
                lat: undefined,
                lng: undefined
            };
            if (!product) {
                return reject('product must not be undefined');
            }
            location.address = product.Lender_User_Address;
            location.lat = product.Product_Latitude;
            location.lng = product.Product_Longitude;

            if (isProductTryAndBuyBool) {
                if (productBookingDetails) {
                    if (booking) {
                        var Booking_PickupProduct = booking.Booking_PickupProduct,
                            Delivery_Latitude = booking.Delivery_Latitude,
                            Delivery_Longitude = booking.Delivery_Longitude,
                            Delivery_Address = booking.Delivery_Address;


                        if (!Booking_PickupProduct) {
                            location.title = 'DELIVERY_ADDRESS';
                            location.address = Delivery_Address;
                            location.lat = Delivery_Latitude;
                            location.lng = Delivery_Longitude;
                        } else {
                            var PickUp_Address = productBookingDetails.PickUp_Address,
                                PickUp_Latitude = productBookingDetails.PickUp_Latitude,
                                PickUp_Longitude = productBookingDetails.PickUp_Longitude;

                            location.address = PickUp_Address;
                            location.lat = PickUp_Latitude;
                            location.lng = PickUp_Longitude;
                        }
                    }
                }
            }

            extractAndGeoLocateAddressFromObjectForFieldNames({
                object: location,
                addressFieldName: 'address',
                latFieldName: 'lat',
                lngFieldName: 'lng'
            }).then(function (address) {
                resolve(_extends({}, address, {
                    title: location.title
                }));
            }).catch(reject);
        });
    };

    var extractAndGeoLocateAddressFromObjectForFieldNames = function extractAndGeoLocateAddressFromObjectForFieldNames(_ref47) {
        var object = _ref47.object,
            addressFieldName = _ref47.addressFieldName,
            latFieldName = _ref47.latFieldName,
            lngFieldName = _ref47.lngFieldName;

        return new Promise(function (resolve, reject) {
            var address = object[addressFieldName];
            var lat = Number(object[latFieldName] || 0);
            var lng = Number(object[lngFieldName] || 0);
            if (!address && lat && lng) {
                geoLocationService.getUserAddressFromCoordinates({ lat: lat, lng: lng }).then(function (geoLocatedAddress) {
                    resolve({
                        address: geoLocatedAddress,
                        lat: lat,
                        lng: lng
                    });
                }).catch(reject);
            } else {
                resolve({
                    address: address,
                    lat: lat,
                    lng: lng
                });
            }
        });
    };

    var parseBookingStepTutorialHTMLTemplateForTranslationId = function parseBookingStepTutorialHTMLTemplateForTranslationId(translationId) {
        var translatedText = $translate.instant(translationId);

        if (translatedText.indexOf('|') != -1) {
            var textComponents = $translate.instant(translationId).split('|');
            var HTML_TEXT = '<div>';
            textComponents.forEach(function (comp, index) {
                if (index == 0) HTML_TEXT += '<span>' + comp + '</span> <ol>';else HTML_TEXT += '<li>' + comp + '</li>';
            });
            HTML_TEXT += '</ol><div>';
            return $sce.trustAsHtml(HTML_TEXT);
        } else {
            ptLog.warn(TAG, 'parseBookingStepTutorialHTMLTemplateForTranslationId', 'failed to parse translationId:', translationId);
            return translatedText;
        }
    };

    var getTranslationIdForBookingStatus = function getTranslationIdForBookingStatus(bookingStatus, isLender, isTryAndBuy) {
        if (bookingStatus === enums.productRentalStatus.notVerified || bookingStatus === enums.productRentalStatus.verified) return 'BookingStatusNotVerified_' + (isLender ? 'Lender' : 'Borrower');else if (bookingStatus === enums.productRentalStatus.verifying) return 'BookingStatusVerifying_Borrower';else if (bookingStatus === enums.productRentalStatus.requested) return 'BookingStatusRequested_' + (isLender ? 'Lender' : 'Borrower');else if (bookingStatus === enums.productRentalStatus.accepted) return 'BookingStatusAccepted_' + (isLender ? 'Lender' : 'Borrower');else if (bookingStatus === enums.productRentalStatus.booked) return 'BookingStatusBooked_Borrower';else if (bookingStatus === enums.productRentalStatus.timeout) return 'BookingStatusTimeout_' + (isLender ? 'Lender' : 'Borrower');else if (bookingStatus === enums.productRentalStatus.denied) return 'BookingStatusDenied_' + (isLender ? 'Lender' : 'Borrower');else if (bookingStatus === enums.productRentalStatus.canceled) return 'BookingStatusCancelled_' + (isLender ? 'Lender' : 'Borrower');else if (bookingStatus === enums.productRentalStatus.criticalCancel) return 'BookingStatusCriticalCancelled_' + (isLender ? 'Lender' : 'Borrower');else if (bookingStatus === enums.productRentalStatus.moderateCancel) return 'BookingStatusModerateCancelled_' + (isLender ? 'Lender' : 'Borrower');else if (bookingStatus === enums.productRentalStatus.canceledByLender) return 'BookingStatusCancelledLender_' + (isLender ? 'Lender' : 'Borrower');else if (bookingStatus === enums.productRentalStatus.started) {
            if (isTryAndBuy) return isLender ? 'BookingStatusStarted_Lender' : 'BookingStatusStarted_Borrower_TnB';else return 'BookingStatusStarted_' + (isLender ? 'Lender' : 'Borrower');
        } else if (bookingStatus === enums.productRentalStatus.ended) if (isTryAndBuy) return isLender ? 'BookingStatusEnded_Lender' : 'BookingStatusEnded_Borrower_TnB';else return 'BookingStatusEnded_' + (isLender ? 'Lender' : 'Borrower');
    };

    var getTranslationDictForDatePicker = function getTranslationDictForDatePicker() {
        return {
            'Month': $translate.instant('Month'),
            'Year': $translate.instant('Year'),
            'Date Range Template': $translate.instant('Date Range Template'),
            'Custom Date Range': $translate.instant('Custom Date Range'),
            'Today': $translate.instant('Today'),
            'Yesterday': $translate.instant('Yesterday'),
            'This Week': $translate.instant('Week'),
            'Last Week': $translate.instant('Week'),
            'This Month': $translate.instant('Month'),
            'Last Month': $translate.instant('Month'),
            'This Year': $translate.instant('Year'),
            'Last Year': $translate.instant('Year'),
            'Cancel': $translate.instant('Cancel'),
            'Clear': $translate.instant('Clear'),
            'Ok': $translate.instant('Ok'),
            'Sunday': $translate.instant('Sunday'),
            'Monday': $translate.instant('Monday'),
            'Tuesday': $translate.instant('Tuesday'),
            'Wednesday': $translate.instant('Wednesday'),
            'Thursday': $translate.instant('Thursday'),
            'Friday': $translate.instant('Friday'),
            'Saturday': $translate.instant('Saturday'),
            'Sun': $translate.instant('Sunday'),
            'Mon': $translate.instant('Monday'),
            'Tue': $translate.instant('Tuesday'),
            'Wed': $translate.instant('Wednesday'),
            'Thu': $translate.instant('Thursday'),
            'Fri': $translate.instant('Friday'),
            'Sat': $translate.instant('Saturday'),
            'January': $translate.instant('January'),
            'February': $translate.instant('February'),
            'March': $translate.instant('March'),
            'April': $translate.instant('April'),
            'May': $translate.instant('May'),
            'June': $translate.instant('June'),
            'July': $translate.instant('July'),
            'August': $translate.instant('August'),
            'September': $translate.instant('September'),
            'October': $translate.instant('October'),
            'November': $translate.instant('November'),
            'December': $translate.instant('December'),
            'Week': $translate.instant('Week')
        };
    };

    var getCategoriesUrl = function getCategoriesUrl(categoryName, subcategoryName, isTryAndBuy, languageCode) {
        var path = window.globals.ROOT_PATH + languageCode + "/categorie/" + (isTryAndBuy ? '' : "privato/");
        if (subcategoryName == null) {
            path = path + categoryName;
        } else {
            path = path + categoryName + "/" + subcategoryName;
        }

        return path.split(' ').join('-');;
    };

    return {
        stringToDate: stringToDate,
        getDisplayDataForTransactionStatus: getDisplayDataForTransactionStatus,
        getPriceForRentalPeriod: getPriceForRentalPeriod,
        calculatePricingListForProduct: calculatePricingListForProduct,
        getPriceCalculatedDescriptionForRentalPeriod: getPriceCalculatedDescriptionForRentalPeriod,
        getBookedDateRanges: getBookedDateRanges,
        isBookingDateBookedForDateRange: isBookingDateBookedForDateRange,
        getProductFirstAvailableDatesToRent: getProductFirstAvailableDatesToRent,
        regexPatterns: regexPatterns,
        sorters: sorters,
        isProductTryAndBuy: isProductTryAndBuy,
        playErrorSound: playErrorSound,
        dataUrlToBlob: dataUrlToBlob,
        isMobile: isMobile,
        isCrawler: isCrawler,
        extractAndGeoLocateAddressFromObjectForFieldNames: extractAndGeoLocateAddressFromObjectForFieldNames,
        getAddressToDisplayForBooking: getAddressToDisplayForBooking,
        getRentalPeriodInDays: getRentalPeriodInDays,
        calculatePriceingListForBooking: calculatePriceingListForBooking,
        parseBookingStepTutorialHTMLTemplateForTranslationId: parseBookingStepTutorialHTMLTemplateForTranslationId,
        getTranslationIdForBookingStatus: getTranslationIdForBookingStatus,
        getTranslationDictForDatePicker: getTranslationDictForDatePicker,
        getProductDetailUrl: getProductDetailUrl,
        getProductNameAndId: getProductNameAndId,
        getCategoriesUrl: getCategoriesUrl

    };
}]);

'use strict';
angular.module('paladinApp').service('transactionService', ['$rootScope', 'appStateManager', 'enums', 'apiService', 'popupService', 'geoLocationService', 'ptLog', 'ptUtils', '$translate', 'gtmService', 'productReviewService', 'moment', function ($rootScope, appStateManager, enums, apiService, popupService, geoLocationService, ptLog, ptUtils, $translate, gtmService, productReviewService, moment) {
    var TAG = 'transactionService || ';
    var acceptRental = function acceptRental(booking) {
        return new Promise(function (resolve, reject) {
            var apiMethod = function apiMethod() {
                return new Promise(function (resolve2, reject2) {
                    apiService.bookings.acceptBookingRequest({ bookingId: booking.Booking_Id, userId: booking.Lender_Id }).then(function (res) {
                        gtmService.trackEvent('rental-status', 'request-accepted');
                        popupService.showAlert('SUCCESS', 'BOOKING_ACCEPTED_SUCCESS').finally(function () {
                            $rootScope.$emit(enums.busEvents.reloadDetailedBooking, { bookingId: booking.Booking_Id });
                            resolve2();
                        });
                    }).catch(function (err) {
                        if (err && err.data && err.data.Data && err.data.Data == 403) {
                            return showInvalidOperationError(booking);
                        }
                        popupService.showConfirm('ERROR', 'BOOKING_ACCEPTED_FAILURE', 'POPUP_TRY_AGAIN', 'POPUP_CANCEL').then(function () {
                            apiMethod().then(resolve2).catch(reject2);
                        }).catch(function () {
                            resolve2();
                        });
                    });
                });
            };
            popupService.showTransactionStatusChange({ booking: booking, apiMethod: apiMethod, title: 'ACCEPT_REQUEST' }).then(resolve).catch(reject);
        });
    };

    // Reject Rental is used for both lender and borrower prio request acceptance
    // Borrower: will see a cancel request CTA
    // Lender: will see decline request CTA
    // Both "Reject" the booking and don't "Cancel" it
    // transactionService.cancelBooking should be called only after a certain booking was accepted,
    // by either the borrower or the lender
    var rejectRental = function rejectRental(booking, isLender) {
        return new Promise(function (resolve, reject) {
            var apiMethod = function apiMethod() {
                return new Promise(function (resolve2, reject2) {
                    var userId = isLender ? booking.Lender_Id : booking.Borrower_Id;
                    apiService.bookings.rejectBookingRequest({
                        bookingId: booking.Booking_Id,
                        userId: userId,
                        reason: ''
                    }).then(function (res) {
                        gtmService.trackEvent('rental-status', isLender ? 'request-declined' : 'request-cancelled-prior-approval');
                        popupService.showAlert('SUCCESS', 'BOOKING_CANCELED_SUCCESS').finally(function () {
                            $rootScope.$emit(enums.busEvents.reloadDetailedBooking, { bookingId: booking.Booking_Id });
                            resolve2();
                        });
                    }).catch(function (err) {
                        if (err && err.data && err.data.Data && err.data.Data == 403) {
                            return showInvalidOperationError(booking);
                        }
                        popupService.showConfirm('ERROR', 'BOOKING_CANCELED_FAILURE', 'POPUP_TRY_AGAIN', 'POPUP_CANCEL').then(function () {
                            apiMethod().then(resolve2).catch(reject2);
                        }).catch(function () {
                            resolve2();
                        });
                    });
                });
            };

            popupService.showConfirm('CONFIRM', isLender ? 'BOOKING_REJECT_WARNING' : 'CANCEL_REQUEST_WARNING').then(function () {
                popupService.showTransactionStatusChange({ booking: booking, apiMethod: apiMethod, title: isLender ? 'DECLINE_REQUEST' : 'CANCEL_REQUEST' }).then(resolve).catch(function (e) {
                    console.log('...... ERR ', e, ' .... ', reject);
                    reject();
                });
            }).catch(function () {
                resolve();
            });
        });
    };

    var cancelRental = function cancelRental(booking, isLender) {
        return new Promise(function (resolve, reject) {
            var apiMethod = function apiMethod() {
                return new Promise(function (resolve2, reject2) {
                    var userId = isLender ? booking.Lender_Id : booking.Borrower_Id;
                    apiService.bookings.cancelBookingRequest({
                        bookingId: booking.Booking_Id,
                        userId: userId,
                        reason: ''
                    }).then(function (res) {
                        gtmService.trackEvent('rental-status', isLender ? 'booking-cancelled-by-lender' : 'booking-cancelled-by-borrower');
                        popupService.showAlert('SUCCESS', 'BOOKING_CANCELED_SUCCESS').finally(function () {
                            $rootScope.$emit(enums.busEvents.reloadDetailedBooking, { bookingId: booking.Booking_Id });
                            resolve2();
                        });
                    }).catch(function (err) {
                        if (err && err.data && err.data.Data && err.data.Data == 403) {
                            return showInvalidOperationError(booking);
                        }
                        popupService.showConfirm('ERROR', 'BOOKING_CANCELED_FAILURE', 'POPUP_TRY_AGAIN', 'POPUP_CANCEL').then(function () {
                            return apiMethod().then(resolve2).catch(reject2);
                        }).catch(function () {
                            resolve2();
                        });
                    });
                });
            };
            var FullStartDate = booking.FullStartDate;

            var daysLeftBeforeBookingStarts = moment(new Date(FullStartDate)).diff(moment(), 'days');
            var msg = 'BOOKING_CANCELLATION_MODERATE_WARNING';
            if (daysLeftBeforeBookingStarts <= 1) {
                msg = 'BOOKING_CANCELLATION_CRITICAL_WARNING';
            }

            popupService.showConfirm('CONFIRM', msg).then(function () {
                popupService.showTransactionStatusChange({ booking: booking, apiMethod: apiMethod, title: 'CANCEL_REQUEST' }).then(resolve).catch(reject);
            }).catch(function () {
                resolve();
            });
        });
    };

    var startRental = function startRental(booking) {
        return new Promise(function (resolve, reject) {
            var apiMethod = function apiMethod() {
                return new Promise(function (resolve2, reject2) {
                    apiService.bookings.startRental({
                        bookingId: booking.Booking_Id,
                        userId: booking.Borrower_Id
                    }).then(function () {
                        gtmService.trackEvent('rental-status', 'rental-started');
                        popupService.showAlert('SUCCESS', 'BOOKING_START_RENTAL_SUCCESS').finally(function () {
                            resolve2();
                            $rootScope.$emit(enums.busEvents.reloadDetailedBooking, { bookingId: booking.Booking_Id });
                        });
                    }).catch(function (err) {
                        if (err && err.data && err.data.Data && err.data.Data == 403) {
                            return showInvalidOperationError(booking);
                        }

                        popupService.showConfirm('ERROR', 'BOOKING_START_RENTAL_FAILURE', 'POPUP_TRY_AGAIN', 'POPUP_CANCEL').then(function () {
                            return apiMethod().then(resolve2).catch(reject2);
                        }).catch(reject2);
                    });
                });
            };
            popupService.showConfirm('CONFIRM', 'BOOKING_START_RENTAL_WARNING').then(function () {
                popupService.showTransactionStatusChange({ booking: booking, apiMethod: apiMethod, title: 'START_RENTAL' }).then(resolve).catch(reject);
            });
        });
    };

    var endRental = function endRental(booking) {
        return new Promise(function (resolve, reject) {
            var apiMethod = function apiMethod() {
                return new Promise(function (resolve2, reject2) {
                    var user = appStateManager.user;
                    apiService.bookings.endRental({
                        bookingId: booking.Booking_Id,
                        userId: booking.Lender_Id
                    }).then(function (res) {
                        gtmService.trackEvent('rental-status', 'rental-ended');
                        if (!user.User_StripeAccount) {
                            // user has no stripe account, call create stripe account to allow him to get paid
                            createUserStripeAccount(booking).then(function (res) {
                                gtmService.trackEvent('rental-status', 'stripe-account-created');
                                popupService.showAlert('SUCCESS', 'BOOKING_END_RENTAL_SUCCESS_PAYMENT').finally(function () {
                                    resolve2();
                                    $rootScope.$emit(enums.busEvents.reloadDetailedBooking, { bookingId: booking.Booking_Id });
                                });
                            }).catch(function (err) {
                                if (err && err.isMissingAddress) {
                                    popupService.showAlert('ERROR', 'PAYOUT_MISSING_ADDRESS').finally(function () {
                                        reject2();
                                    });
                                } else {
                                    reject2();
                                }
                            });
                        } else {
                            popupService.showAlert('SUCCESS', 'BOOKING_END_RENTAL_SUCCESS_PAYMENT').finally(function () {
                                resolve2();
                                $rootScope.$emit(enums.busEvents.reloadDetailedBooking, { bookingId: booking.Booking_Id });
                            });
                        }
                    }).catch(function (err) {
                        if (err && err.data && err.data.Data && err.data.Data == 403) {
                            return showInvalidOperationError(booking);
                        }
                        popupService.showConfirm('ERROR', 'BOOKING_END_RENTAL_FAILURE').then(function () {
                            return apiMethod().then(resolve2).catch(reject2);
                        }).catch(function () {
                            resolve2();
                        });
                    });
                });
            };
            popupService.showConfirm('CONFIRM', 'BOOKING_END_RENTAL_WARNING').then(function () {
                popupService.showTransactionStatusChange({ booking: booking, apiMethod: apiMethod, title: 'END_RENTAL' }).then(resolve).catch(reject);
            });
        });
    };

    var endRentalForStripeAccountOnly = function endRentalForStripeAccountOnly(booking) {
        return new Promise(function (resolve, reject) {
            var apiMethod = function apiMethod() {
                return createUserStripeAccount(booking);
            };
            popupService.showTransactionStatusChange({ booking: booking, apiMethod: apiMethod, title: 'CREATE_STRIPE_ACCOUNT' }).then(function () {
                gtmService.trackEvent('rental-status', 'stripe-account-created');
                popupService.showAlert('SUCCESS', 'CREATE_STRIPE_ACCOUNT_SUCCESS').then(function () {
                    $rootScope.$emit(enums.busEvents.reloadDetailedBooking, { bookingId: booking.Booking_Id });
                    resolve();
                });
            }).catch(function (err) {
                if (err && err.isMissingAddress) {
                    popupService.showAlert('ERROR', 'PAYOUT_MISSING_ADDRESS').finally(function () {
                        resolve();
                    });
                } else {
                    popupService.showAlert('ERROR', 'CREATE_STRIPE_ACCOUNT_FAILURE').then(function () {
                        $rootScope.$emit(enums.busEvents.reloadDetailedBooking, { bookingId: booking.Booking_Id });
                        resolve();
                    });
                }
            });
        });
    };

    var createUserStripeAccount = function createUserStripeAccount(booking) {
        var email = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

        return new Promise(function (resolve, reject) {
            var user = appStateManager.user;
            var User_Address = user.User_Address,
                User_Email = user.User_Email,
                User_Id = user.User_Id;


            if (!User_Address) {
                return reject({ isMissingAddress: true });
            }

            geoLocationService.getUserCountryFromUserAddress(User_Address).then(function (country) {
                var short_name = country.short_name;

                apiService.payments.createUserStripeAccount({
                    userId: User_Id,
                    email: email == undefined ? User_Email : email,
                    bookingId: booking.Booking_Id,
                    country: short_name
                }).then(resolve).catch(function (err) {
                    popupService.showInputField({
                        title: 'ERROR',
                        message: 'BOOKING_END_RENTAL_STRIPE_ACCOUNT_DUPLICATE_ERROR',
                        initialValue: appStateManager.user.User_Email,
                        inputRegexValidation: ptUtils.regexPatterns.email
                    }).then(function (res) {
                        var apiMethod = function apiMethod() {
                            return createUserStripeAccount(booking, res.value);
                        };
                        popupService.showTransactionStatusChange({ booking: booking, apiMethod: apiMethod, title: 'END_RENTAL' }).then(resolve).catch(reject);
                    }).catch(reject);
                });
            }).catch(function (err) {
                ptLog.error(TAG + ', error getting user country, ' + JSON.stringify(err));
                reject(err);
            });
        });
    };

    var showInvalidOperationError = function showInvalidOperationError(booking) {
        popupService.showAlert('ERROR', 'BOOKING_INVALID_OPERATION', 'REFRESH').finally(function () {
            $rootScope.$emit(enums.busEvents.reloadDetailedBooking, { bookingId: booking.Booking_Id });
        });
    };

    return {
        acceptRental: acceptRental,
        rejectRental: rejectRental,
        cancelRental: cancelRental,
        startRental: startRental,
        endRental: endRental,
        createUserStripeAccount: createUserStripeAccount,
        endRentalForStripeAccountOnly: endRentalForStripeAccountOnly
    };
}]);

'use strict';
angular.module('paladinApp').service('stripeService', ['$rootScope', 'enums', 'appStateManager', '$q', '$http', function ($rootScope, enums, appStateManager, $q, $http) {

    var self = this;
    self.ENV = window.globals.STRIPE_URL;

    self.JSON_to_URLEncoded = function (element, key, list) {
        list = list || [];
        if ((typeof element === 'undefined' ? 'undefined' : _typeof(element)) == 'object') {
            for (var idx in element) {
                self.JSON_to_URLEncoded(element[idx], key ? key + '[' + idx + ']' : idx, list);
            }
        } else {
            list.push(key + '=' + encodeURIComponent(element));
        }
        return list.join('&');
    };

    self.getHttpConfig = function (params, headers) {
        var config = {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'X-Requested': null,
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token',
                'Authorization': 'Bearer ' + window.globals.STRIPE_SK
            }
        };

        if (headers) {
            Object.keys(headers).forEach(function (headerKey) {
                config.headers[headerKey] = headers[headerKey];
            });
        }

        if (params) {
            config.params = params;
        }
        return config;
    };

    self.postRequest = function (path, data, headers) {
        // let deferred = $q.defer();
        var config = self.getHttpConfig(null, headers);
        return $http({
            method: 'POST',
            url: self.ENV + path,
            headers: config.headers,
            params: config.params,
            transformRequest: function transformRequest(obj) {
                return self.JSON_to_URLEncoded(obj);
            },
            data: data
        });
        // return deferred.promise;
    };

    self.getRequest = function (path, params, headers) {
        var config = self.getHttpConfig(null, headers);
        return $http({
            method: 'GET',
            url: self.ENV + path,
            headers: config.headers,
            params: config.params,
            transformRequest: function transformRequest(obj) {
                return self.JSON_to_URLEncoded(obj);
            }
        });
    };

    self.apiMethods = {
        createToken: function createToken(_ref48) {
            var number = _ref48.number,
                exp_month = _ref48.exp_month,
                exp_year = _ref48.exp_year,
                cvc = _ref48.cvc,
                name = _ref48.name;

            return self.postRequest('/tokens', {
                card: {
                    number: number,
                    exp_month: exp_month,
                    exp_year: exp_year,
                    cvc: cvc,
                    name: name
                }
            });
        },
        getCustomer: function getCustomer(customerId) {
            return self.getRequest('/customers/' + customerId);
        },
        getCustomerSources: function getCustomerSources(customerId) {
            return self.getRequest('/customers/' + customerId + '/sources');
        }
    };

    return self.apiMethods;
}]);
'use strict';
angular.module('paladinApp').service('acuantService', ['$rootScope', '$http', '$base64', function ($rootScope, $http, $base64) {

    var ACUANT_URL = 'https://cssnwebservices.com/CSSNService/CardProcessor';
    var LISENCE = $base64.encode(window.globals.isProd() ? 'A0E66E952D88' : 'E265037472E6');
    var post = function post(path, imageData) {
        return $http({
            method: 'POST',
            url: ACUANT_URL + path,
            headers: {
                // 'Access-Control-Allow-Headers': 'Content-Type',
                // 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                // 'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/octet-stream; charset=utf-8;',
                'Authorization': 'LicenseKey ' + LISENCE
            },

            dataType: 'json',
            data: imageData

        });
    };
    var postDuplex = function postDuplex(path, imageData) {
        return $http({
            method: 'POST',
            url: ACUANT_URL + path,
            transformRequest: angular.identity,
            headers: {
                // 'Access-Control-Allow-Headers': 'Content-Type',
                // 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                // 'Access-Control-Allow-Origin': '*',
                'Content-Type': undefined,
                'Authorization': 'LicenseKey ' + LISENCE
            },

            dataType: 'json',
            data: imageData

        });
    };
    var processPassportImage = function processPassportImage(_ref49) {
        var imageToProcess = _ref49.imageToProcess,
            imageSource = _ref49.imageSource,
            usePreprocessing = _ref49.usePreprocessing;

        return post('/ProcessPassport/true/true/true/0/150/' + usePreprocessing.toString() + '/' + imageSource.toString() + '/true/false', imageToProcess);
    };

    var processNICDLDuplexImage = function processNICDLDuplexImage(_ref50) {
        var frontImage = _ref50.frontImage,
            backImage = _ref50.backImage,
            selectedRegion = _ref50.selectedRegion,
            imageSource = _ref50.imageSource,
            usePreprocessing = _ref50.usePreprocessing;

        var imgsToProcess = new FormData();
        imgsToProcess.append("frontImage", frontImage);
        imgsToProcess.append("backImage", backImage);
        return postDuplex('/ProcessDLDuplex/' + selectedRegion + '/true/-1/true/false/true/0/150/' + imageSource.toString() + '/' + usePreprocessing.toString() + '/true/false', imgsToProcess);
        // .success(function(){
        //     console.log("SUCCESS");
        // })
        // .error(function(){
        //     console.log("ERROR");
        // });
    };

    var processDriversLicense = function processDriversLicense(_ref51) {
        var imageToProcess = _ref51.imageToProcess,
            selectedRegion = _ref51.selectedRegion,
            imageSource = _ref51.imageSource,
            usePreprocessing = _ref51.usePreprocessing;

        return post('/ProcessDriversLicense/' + selectedRegion + '/true/-1/true/true/true/0/150/' + usePreprocessing.toString() + '/' + imageSource.toString() + '/true/false', imageToProcess);
    };

    var processFacialMatch = function processFacialMatch(_ref52) {
        var idFaceImage = _ref52.idFaceImage,
            selfie = _ref52.selfie;

        var facialMatchData = new FormData();
        facialMatchData.append("idFaceImage", idFaceImage);
        facialMatchData.append("selfie", selfie);
        return post('/FacialMatch', facialMatchData);
    };

    return {
        processPassportImage: processPassportImage,
        processNICDLDuplexImage: processNICDLDuplexImage,
        processFacialMatch: processFacialMatch,
        processDriversLicense: processDriversLicense
    };
}]);
'use strict';
angular.module('paladinApp').service('gtmService', ['$window', function ($window) {

    this.trackEvent = function (category, action, label, value) {

        if (!window.globals.isProd()) return;

        if (category == undefined || action == undefined) {
            throw Error('GTMService.trackEvent: Missing required property. Aborting hit.');
        }

        $window.dataLayer.push({
            'event': 'ngTrackEvent',
            'attributes': {
                'category': category,
                'action': action,
                'label': label ? label : null,
                'value': value ? value : null,
                'nonInteraction': true
            }
        });

        console.log("DataLayer Event fired " + category + " " + action);
    };
}]);
angular.module('paladinApp').service('referralsService', ['$q', '$location', 'apiService', function ($q, $location, apiService) {
    var _this2 = this;

    this.userName = null;
    this.referralCode = null;

    this.validateReferralCode = function (referralNameCode) {
        var self = _this2;

        // referralCode includes the userName
        var referralCode = referralNameCode;

        var parts = referralNameCode.split('-');
        // remove the alpha-numeric part which is last
        parts.pop();
        var userName = parts.join(' ');

        // do some validation here to avoid unnecessary api calls
        /*
                        if(!referralCode || !referralCode.match(/^[a-z0-9]{6}$/i)){
                            $location.path('/');
                            return false;
                        }
        */

        return $q(function (resolve, reject) {
            return apiService.users.signUpReferred(referralCode).then(function (result) {
                self.userName = userName;
                self.referralCode = referralCode;

                resolve({
                    userName: self.userName,
                    referralCode: self.referralCode
                });
            }, function (reason) {
                // redirect to normal registration or some handler page
                $location.path('/');
                reject(reason);
            });
        }, function (reason) {
            console.info('Validating the referralCode was rejected with reason: ', reason);
        });
    };

    this.getReferralData = function () {
        return {
            userName: _this2.userName,
            code: _this2.referralCode
        };
    };
}]);

var FilterComponent = function () {
    FilterComponent.$inject = ['$scope', '$sce', 'Filters', '$rootScope', '$translate', '$location', 'enums'];
    function FilterComponent($scope, $sce, Filters, $rootScope, $translate, $location, enums) {
        _classCallCheck(this, FilterComponent);

        this.scope = $scope;
        this.Filters = Filters;
        this.translate = $translate;
        //this.filter = {categories:[],languageCode:'en',selectedCategoryId:null,priceRange:[10,100]};
        this.enums = enums;
        this.rootScope = $rootScope;
        this.categoryImageBaseUrl = window.globals.CATEGORY_IMAGE_URL;
        this.location = $location;
        this.sce = $sce;
        this.slider = {};
        this.showCategoriesDiv = false;
        this.slider.priceSliderOption = {
            options: {
                orientation: 'horizontal',
                min: 0,
                max: 240,
                step: 10,
                range: true
            }
        };
        this.slider.distanceSliderOption = {
            options: {
                orientation: 'horizontal',
                min: 0,
                max: 240,
                step: 10,
                range: false
            }
        };
    }

    _createClass(FilterComponent, [{
        key: '$onInit',
        value: function $onInit() {
            this.scope.priceRange = [0, 1000];
            this.count = 0;
            this.selectedTab = this.filter.category.isTryAndBuy == true ? 0 : 1 || 0;
            this.customCategoriesTnB = this.getCategories(true);
            this.customCategoriesP2P = this.getCategories(false);

            var _this = this;
            //this.scope.distanceRange = 100;


            this.scope.$watch('priceRange', function () {
                if (_this.filter.priceRange[0] != _this.scope.priceRange[0] || _this.filter.priceRange[1] != _this.scope.priceRange[1]) {
                    _this.filter.priceRange = _this.scope.priceRange;
                    //console.log("price range changed... to " + _this.scope.priceRange);
                    //console.log("old price range is " + _this.filter.priceRange);
                    _this.refreshProducts();
                }
            });

            /*this.scope.$watch('distanceRange',function(){
              _this.filter.distanceRange = _this.scope.distanceRange;
              _this.refreshProducts();
            })*/

            /*
            //here we already load the categories in case the page is refreshed, and we select the All Categories by default
            if (!this.rootScope.filter || this.rootScope.forceLoadCategory) {
              this.refreshCategories(null,null, $rootScope.lang);
            }
            */

            this.scope.$on('languageChanged', function (event, data) {
                _this.filter.languageCode = _this.getCurrentLanguageCode();

                if (_this.filter.category.selectedSubCategoryId != null) {
                    //subcategory selected

                    _this.refreshCategories(_this.filter.category.selectedCategoryId, _this.filter.category.selectedSubCategoryId, _this.filter.languageCode);
                } else if (_this.filter.category.selectedCategoryId != null) {
                    //parent category other than All Categories selected
                    _this.refreshCategories(_this.filter.category.selectedCategoryId, null, _this.filter.languageCode);
                } else {
                    _this.refreshCategories(null, null, _this.filter.languageCode);
                }
            });
        }
    }, {
        key: 'selectCategories',
        value: function selectCategories(selCategoryId, selSubcategoryId, lang) {
            if (selCategoryId == null) {
                this.selectCategory(this.enums.allCategories[lang], false);
            } else {
                this.selectCategory(this.Filters.getCategoryById(selCategoryId, lang), false);
                if (selSubcategoryId != null) this.selectSubCategory(this.Filters.getSubcategoryById(selSubcategoryId, lang), false);
            }
        }
    }, {
        key: 'refreshCategories',
        value: function refreshCategories(selCategoryId, selSubcategoryId, lang) {

            this.filter.categories = this.rootScope.categoriesMap.get(lang);
            this.selectCategories(selCategoryId, selSubcategoryId, lang);
        }
    }, {
        key: 'getCategories',
        value: function getCategories(isTryAndBuy) {
            var categories = {};
            var i = 0;
            this.rootScope.categoriesMap.get(this.getCurrentLanguageCode()).forEach(function (item) {
                if (isTryAndBuy && item.IsTryAndBuy || !isTryAndBuy && !item.IsTryAndBuy) {
                    categories[i++] = item;
                }
            });

            return categories;
        }
    }, {
        key: 'toggleDiv',
        value: function toggleDiv() {
            this.showCategoriesDiv = !this.showCategoriesDiv;
        }
    }, {
        key: 'getCurrentLanguageCode',
        value: function getCurrentLanguageCode() {
            return this.translate.use();
        }
    }, {
        key: 'selectCategory',
        value: function selectCategory(category, refreshProductList) {
            if (typeof category != 'string') {
                this.filter.category.selectedCategoryId = category.Category_Id;
                this.filter.category.selectedCategoryDesc = this.sce.trustAsHtml(category.Category_Description);
                this.filter.category.selectedCategoryName = this.sce.trustAsHtml(category.Category_Name);
                this.filter.category.selectedCategoryImagePath = category.Category_ImagePath;
                this.filter.category.selectedCategoryBannerImage = category.Category_BannerPath;
                this.filter.category.isTryAndBuy = category.IsTryAndBuy;
                this.rootScope.category = this.filter.category.selectedCategoryName;
            } else {
                this.filter.category.selectedCategoryId = null;
                this.filter.category.selectedCategoryDesc = this.sce.trustAsHtml(category);
                this.filter.category.selectedCategoryName = category;
                this.filter.category.selectedCategoryImagePath = null;
                this.filter.category.isTryAndBuy = this.rootScope.isTryAndBuy;
                this.filter.category.selectedCategoryBannerImage = window.globals.IS_PROMO ? this.enums.categoriesBannersPaths.promo : this.enums.categoriesBannersPaths.all[this.getCurrentLanguageCode()];
                this.rootScope.category = category;
            }
            this.selectSubCategory(null, false);

            //console.log('category clicked...')

            if (refreshProductList) {
                this.refreshProducts();
            }
        }
    }, {
        key: 'onTabSelected',
        value: function onTabSelected() {
            if (this.selectedTab == 0) {
                this.rootScope.$emit(this.enums.busNavigation.switchBrowseMode, { isTryAndBuy: true });
            } else {
                this.rootScope.$emit(this.enums.busNavigation.switchBrowseMode, { isTryAndBuy: false });
            }
        }
    }, {
        key: 'selectSubCategory',
        value: function selectSubCategory(subCategory, refreshProductList) {
            if (subCategory) {
                //console.log(this.sce.trustAsHtml(subCategory.SubCategory_Name));
                this.filter.category.selectedSubCategoryId = subCategory.SubCategory_Id;
                this.filter.category.selectedSubCategoryDesc = this.sce.trustAsHtml(subCategory.SubCategory_Description);
                this.filter.category.selectedSubCategoryName = this.sce.trustAsHtml(subCategory.SubCategory_Name);
                this.filter.category.selectedSubCategoryImagePath = subCategory.SubCategory_ImagePath;
                this.filter.category.selectedSubCategoryBannerImage = subCategory.SubCategory_BannerPath;
                this.rootScope.subcategory = this.filter.category.selectedSubCategoryName;
            } else {
                this.filter.category.selectedSubCategoryId = null;
                this.filter.category.selectedSubCategoryDesc = null;
                this.filter.category.selectedSubCategoryName = null;
                this.filter.category.selectedSubCategoryImagePath = null;
                this.filter.category.selectedSubCategoryBannerImage = null;
                this.rootScope.subcategory = null;
            }

            this.filter.search.searchStr = '';
            this.filter.search.currentSearchStr = '';
            this.rootScope.searchKey = null;
            this.location.search('search', null);

            if (this.rootScope.searchKey != null) {
                this.rootScope.searchKey = null;
            }

            this.filter.currentPage = 1;

            //console.log('sub category clicked...')
            if (refreshProductList) this.refreshProducts();
        }
    }, {
        key: 'getCategoryUrl',
        value: function getCategoryUrl(category, subcategory, isTryAndBuy) {
            return this.Filters.getCategoriesUrl(category == 0 ? this.translate.instant('ACTG') : category.Category_Name, subcategory == null ? null : subcategory.SubCategory_Name, isTryAndBuy, this.translate.use());
        }
    }, {
        key: 'refreshProducts',
        value: function refreshProducts() {
            //console.log("REFRESH PRODUCTS in filters.js");
            this.rootScope.$broadcast('filtersUpdated', this.filter);
        }
    }, {
        key: 'increment',
        value: function increment() {
            this.count++;
        }
    }, {
        key: 'decrement',
        value: function decrement() {
            this.count--;
        }
    }]);

    return FilterComponent;
}();

;

angular.module('paladinApp').component('filters', {
    bindings: {
        categories: '<',
        filter: '=',
        count: '='
    },
    controller: FilterComponent,
    templateUrl: './views/templates/filter.tpl.html'
});
angular.module('paladinApp').directive('footer', ['$rootScope', 'menusService', 'appStateManager', 'enums', '$mdMedia', '$state', function ($rootScope, menusService, appStateManager, enums, $mdMedia, $state) {
    return {
        restrict: 'E',
        templateUrl: './views/templates/footer.tpl.html',
        scope: {},
        link: function link($scope, elem, attr) {

            $scope.extraStyle = {
                height: '150px'
            };

            $scope.aboutMenu = menusService.commonMenus.aboutMenu;
            $scope.linksMenu = menusService.commonMenus.linksMenu;
            $scope.menuLists = [menusService.commonMenus.aboutMenu, menusService.commonMenus.accountLoggedIn, menusService.commonMenus.accountLoggedOut, menusService.commonMenus.linksMenu];

            $scope.supportedLanguages = window.globals.SUPPORTED_LANGS;
            $scope.selectedLanguage = $scope.supportedLanguages.find(function (lang) {
                return lang.code === appStateManager.currentLang;
            });

            $scope.menuClick = function (item) {
                menusService.menuClickHandlerMethod(item);
            };

            $scope.getMenuItemLink = function (item) {
                return item.link || '#';
            };

            $scope.filterMenuItems = function (item) {
                return menusService.shouldShowMenuItem(item);
            };

            $scope.onSelectLanguage = function (code) {
                $scope.selectedLanguage = $scope.supportedLanguages.find(function (lang) {
                    return lang.code === code;
                });
                $rootScope.$emit(enums.busEvents.preferredLanguageChange, { currentLang: code });
                $rootScope.$broadcast('languageChanged', code);
            };

            var setExtraHeight = function setExtraHeight(extraHeight) {
                if (extraHeight != $scope.extraStyle.height) $scope.extraStyle.height = extraHeight;
            };
            var deregs = [];

            deregs.push($rootScope.$on(enums.busEvents.footerExtraHeight, function (event, data) {
                $scope.extraStyle.height = data.height || $scope.extraStyle.height;
            }));

            deregs.push($scope.$watch(function () {
                return $mdMedia('gt-sm');
            }, function (mgSm) {
                var extraHeight = '0';
                if (!mgSm) {
                    if ($state.includes('app.products.newProduct') || $state.includes('app.products.selectedProduct') || $state.includes('app.bookings.bookingDetailed') || $state.includes('app.bookings.paymentDetailed') || $state.includes('app.bookings.bookingDetailed') || $state.includes('verification.user')) {
                        extraHeight = '150px';
                    }
                }

                setExtraHeight(extraHeight);
            }));

            $scope.$on('$destroy', function () {
                while (deregs.length) {
                    deregs.pop()();
                }
            });
        }

    };
}]);
angular.module('paladinApp').component('header', {
    bindings: {
        user: '='
    },
    controller: function () {
        HeaderComponent.$inject = ['$base64', '$scope', '$rootScope', '$translate', '$mdDialog', '$http', '$cookies', '$timeout', 'popupService', 'enums'];
        function HeaderComponent($base64, $scope, $rootScope, $translate, $mdDialog, $http, $cookies, $timeout, popupService, enums) {
            _classCallCheck(this, HeaderComponent);

            this.base64 = $base64;
            this.scope = $scope;
            this.rootScope = $rootScope;
            this.translate = $translate;
            this.baseUrl = window.globals.API_URL;
            this.supportedLanguages = window.globals.SUPPORTED_LANGS;
            this.profileImageBaseUrl = window.globals.PROFILE_IMAGE_URL;
            this.mdDialog = $mdDialog;
            this.http = $http;
            this.btnStatus = 10;
            this.signupMessage = "";
            this.signupStatus = "";
            this.signupFacebookStatus = "";
            this.signupacebookMessage = "";
            this.loginFacebookStatus = "";
            this.loginFacebookMessage = "";
            this.loginStatus = "";
            this.loginMessage = "";
            this.cookies = $cookies;
            this.userStatus = false;
            this.timeout = $timeout;
            this.popupService = popupService;
            this.enums = enums;
            this.user = null;
            this.registerBusEvents();
        }

        _createClass(HeaderComponent, [{
            key: 'registerBusEvents',
            value: function registerBusEvents() {
                var _this3 = this;

                var deregs = [];

                deregs.push(this.rootScope.$on(this.enums.busEvents.updatedUser, function (event, data) {
                    _this3.user = data;
                    _this3.userStatus = _this3.user != null;
                }));

                this.scope.$on('$destroy', function () {
                    while (deregs.length) {
                        deregs.pop()();
                    }
                });
            }
        }, {
            key: '$onInit',
            value: function $onInit() {

                this.profileDefaultImage = "../../assets/profile.png";
                var _this = this;
                this.currentLang = this.translate.proposedLanguage() ? this.translate.proposedLanguage() : this.translate.preferredLanguage();
                this.currentLang = this.rootScope.lang;
                this.translate.use(this.rootScope.lang);

                this.scope.$on('updateLanguage', function (event, data) {
                    _this.changeLanguage(data, false);
                });

                if (this.cookies.getObject('globals') != undefined) if (this.cookies.getObject('globals').currentUser != undefined) if (this.cookies.getObject('globals').currentUser.username != undefined) this.userStatus = true;

                this.rootScope.$on('registeredSuccess', function (event, data) {
                    _this.userStatus = true;
                });
            }
        }, {
            key: 'changeLanguage',
            value: function changeLanguage(lang, broadcastChange) {
                this.rootScope.lang = lang.code;
                this.translate.use(lang.code);
                this.currentLang = lang.code;

                if (broadcastChange) {
                    this.rootScope.$broadcast('languageChanged', lang.code);
                    this.rootScope.$emit(this.enums.busEvents.preferredLanguageChange, { currentLang: lang.code });
                }
            }
        }, {
            key: 'hide',
            value: function hide() {
                this.mdDialog.hide();
            }
        }, {
            key: 'cancel',
            value: function cancel() {
                this.mdDialog.cancel();
            }
        }, {
            key: 'answer',
            value: function answer(_answer) {
                this.mdDialog.hide(_answer);
            }
        }, {
            key: 'forgotPassword',
            value: function forgotPassword(email) {
                var _this4 = this;

                this.btnForgotPasswordStatus = 1;
                var dataObj = {
                    User_Email: email,
                    LanguageCode: this.currentLang == "it" ? "it-IT" : this.currentLang
                };

                this.http.defaults.headers.common['Authorization'] = 'Basic ' + this.base64.encode('Paladin:Paladin123');
                this.http.defaults.headers.common['Charset'] = 'UTF-8';
                this.http.defaults.headers.common['Content-Type'] = 'application/json';

                this.http.post(this.baseUrl + "ForgetPassword/", JSON.stringify(dataObj)).then(function (response) {
                    _this4.btnForgotPasswordStatus = 10;
                    _this4.forgotpasswordStatus = response.data.Status;
                    _this4.forgotPasswordMessage = response.data.Message;
                });
            }
        }, {
            key: 'showTabDialogForgotPassword',
            value: function showTabDialogForgotPassword(ev) {
                var _this5 = this;

                this.mdDialog.show({
                    controller: function controller() {
                        return _this5;
                    },
                    controllerAs: 'ctrl',
                    templateUrl: 'tabDialogForgotPassword',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    http: this.http
                });
            }
        }, {
            key: 'register',
            value: function register(username, password, email, location) {
                var _this6 = this;

                this.btnStatus = 1;
                var dataObj = {
                    User_UserName: username,
                    User_Email: email,
                    User_Address: location,
                    User_Password: password,
                    User_UDIDType: 3,
                    LanguageCode: this.currentLang == "it" ? "it-IT" : this.currentLang
                };
                this.http.post(this.baseUrl + "SignUp/", dataObj).then(function (response) {
                    _this6.btnStatus = 10;
                    _this6.signupStatus = response.data.Status;
                    if (response.data.Status == 'error') _this6.signupMessage = response.data.Message;
                });
            }
        }, {
            key: 'registerFacebook',
            value: function registerFacebook() {
                var _this7 = this;

                if (this.rootScope.facebookApiLoaded) {

                    this.btnStatus = 1;

                    var dataObj = {
                        User_UserName: this.rootScope.facebook_user.name.replace(" ", "-"),
                        User_Email: this.rootScope.facebook_user.email,
                        User_Address: this.rootScope.facebook_user.address,
                        User_Password: "",
                        User_UDIDType: 3,
                        LanguageCode: this.currentLang == "it" ? "it-IT" : this.currentLang,
                        User_DisplayPicturePath: 'http://graph.facebook.com/' + this.rootScope.facebook_user.id + '/picture?type=small',
                        User_DisplayPicture: 'http://graph.facebook.com/' + this.rootScope.facebook_user.id + '/picture?type=small',
                        User_FacebookId: this.rootScope.facebook_user.id,
                        User_FullName: this.rootScope.facebook_user.name,
                        User_QBId: ''
                    };

                    this.http.post(this.baseUrl + "SignUp/", dataObj).then(function (response) {
                        _this7.btnStatus = 10;
                        _this7.signupFacebookStatus = response.data.Status;
                        if (response.data.Status == 'error') {
                            _this7.signupFacebookMessage = response.data.Message;
                        } else {
                            _this7.rootScope.globals = {
                                currentUser: {
                                    username: response.data.Data.User_UserName,
                                    token_type: response.data.Data.oAuthToken.token_type,
                                    access_token: response.data.Data.oAuthToken.access_token,
                                    refresh_token: response.data.Data.oAuthToken.refresh_token,
                                    User_Id: response.data.Data.User_Id,
                                    User_DisplayPicturePath: 'http://graph.facebook.com/' + _this7.rootScope.facebook_user.id + '/picture?type=small',
                                    User_DisplayPicture: 'http://graph.facebook.com/' + _this7.rootScope.facebook_user.id + '/picture?type=small'
                                }
                            };

                            var cookieExp = new Date();
                            cookieExp.setDate(cookieExp.getDate() + response.data.Data.oAuthToken.expires_in);
                            _this7.cookies.putObject('globals', _this7.rootScope.globals, { expires: cookieExp });

                            _this7.http.defaults.headers.common['Authorization'] = _this7.cookies.getObject('globals').currentUser.token_type + ' ' + _this7.cookies.getObject('globals').currentUser.access_token;
                            _this7.hide();
                            _this7.userStatus = true;
                        }
                    });
                } else {
                    this.signupFacebookStatus = 'error';
                    this.signupFacebookMessage = this.translate.instant('FACEBOOK_LOADING');
                    var _this = this;
                    this.timeout(function () {
                        _this.registerFacebook();
                    }, 2000);
                }
            }
        }, {
            key: 'logout',
            value: function logout() {
                this.userStatus = false;
                this.cookies.remove("globals");
                this.http.defaults.headers.common['Authorization'] = '';
            }
        }, {
            key: 'login',
            value: function login(username, password) {
                var _this8 = this;

                this.btnStatus = 1;
                var dataObj = {
                    User_UserName: username,
                    User_Email: "",
                    User_Mobile: "",
                    User_Password: password,
                    User_FacebookId: "",
                    LanguageCode: this.currentLang == "it" ? "it-IT" : this.currentLang
                };

                this.http.post(this.baseUrl + "Login/", dataObj).then(function (response) {
                    _this8.btnStatus = 10;

                    if (response.data.Status != 'error') {
                        _this8.loginStatus = response.data.Status;
                        console.log(response.data.Data);
                        _this8.rootScope.globals = {
                            currentUser: {
                                username: response.data.Data.User_UserName,
                                token_type: response.data.Data.oAuthToken.token_type,
                                access_token: response.data.Data.oAuthToken.access_token,
                                refresh_token: response.data.Data.oAuthToken.refresh_token,
                                User_Id: response.data.Data.User_Id,
                                User_DisplayPicturePath: response.data.Data.User_DisplayPicturePath
                            }
                        };

                        var cookieExp = new Date();
                        cookieExp.setDate(cookieExp.getDate() + response.data.Data.oAuthToken.expires_in);
                        _this8.cookies.putObject('globals', _this8.rootScope.globals, { expires: cookieExp });

                        _this8.http.defaults.headers.common['Authorization'] = _this8.cookies.getObject('globals').currentUser.token_type + ' ' + _this8.cookies.getObject('globals').currentUser.access_token;

                        _this8.http.get(_this8.baseUrl + "GetUserProfile?User_Id=" + _this8.cookies.getObject('globals').currentUser.User_Id + "&LanguageCode=" + _this8.currentLang).then(function (response) {
                            console.log(response);
                            _this8.hide();
                            _this8.userStatus = true;
                        });
                    } else {
                        console.log(JSON.stringify(response, null, 4));
                        _this8.loginStatus = response.data.Status;
                        _this8.loginMessage = response.data.Message;
                    }
                });
            }
        }, {
            key: 'showTabDialog',
            value: function showTabDialog(ev) {
                this.popupService.showLoginSignupPopup();
            }
        }]);

        return HeaderComponent;
    }(),
    templateUrl: './views/templates/header.tpl.html'
});

angular.module('paladinApp').directive('headerV2', ['$rootScope', 'appStateManager', 'popupService', '$mdMenu', '$translate', 'enums', '$mdSidenav', '$window', 'menusService', 'apiService', '$state', '$transitions', '$mdComponentRegistry', function ($rootScope, appStateManager, popupService, $mdMenu, $translate, enums, $mdSidenav, $window, menusService, apiService, $state, $transitions, $mdComponentRegistry) {
    return {
        restrict: 'E',
        scope: {
            // isScrollOffsetZero: '=',
        },
        templateUrl: './views/templates/headerV2.tpl.html',
        link: function link($scope, elem, attr) {
            $scope.isScrollOffsetZero = ($state.current.data || {}).isCollapsingHeader || false;
            $scope.searchText = '';
            $scope.searchItems = ['one', 'two', 'three', 'four', 'five'];

            $scope.unreadBadge = 0;
            $scope.aboutMenu = menusService.commonMenus.aboutMenu.list;

            $scope.profileMenu = menusService.commonMenus.accountLoggedIn.list;
            $scope.loggedOutMenu = menusService.commonMenus.accountLoggedOut.list;
            $scope.commonMenu = menusService.commonMenus.common.list;
            $scope.linksMenu = menusService.commonMenus.linksMenu;

            $scope.loggedInMenu = [{
                title: $translate.instant('LENT_BORROWED'),
                BL: function BL() {
                    return alert('Navigate to ' + $translate.instant('LENT_BORROWED'));
                }
            }, {
                title: $translate.instant('LISTINGS'),
                BL: function BL() {
                    return alert('Navigate to ' + $translate.instant('LISTINGS'));
                }
            }, {
                title: $translate.instant('MESSAGES'),
                BL: function BL() {
                    return alert('Navigate to ' + $translate.instant('MESSAGES'));
                }
            }];

            $scope.loginSignUpPopupClick = function (isSignUp) {
                popupService.showLoginSignupPopup(isSignUp);
            };

            $scope.querySearch = function (textQuery) {
                var query = textQuery.toLowerCase();
                return apiService.products.getSuggestions(query).then(function (response) {
                    return [{ Rank: Infinity, Keyword: textQuery }].concat(_toConsumableArray(response.Data.sort(function (a, b) {
                        return b.Rank - a.Rank;
                    })));
                });
            };

            $scope.headerMenuClick = function (item) {
                $scope.close();
                menusService.menuClickHandlerMethod(item);
            };

            $scope.getMenuItemLink = function (item) {
                return item.link || '#';
            };

            $scope.initiateSearch = function (keyword) {
                if (keyword && keyword != '') {
                    $rootScope.$emit(enums.busNavigation.browseKeyword, { keyword: keyword });
                }
            };

            $scope.searchBarOnKeyPress = function ($event) {
                if ($event.which == 13 && $event.target.value && $event.target.value != '') {
                    $scope.initiateSearch($event.target.value);
                    $event.preventDefault();
                }
            };

            $scope.toggleSideNav = function () {
                if ($mdComponentRegistry.get(enums.inAppSideNavsIds.chatSideNav) && $mdSidenav(enums.inAppSideNavsIds.chatSideNav).isOpen()) $mdSidenav(enums.inAppSideNavsIds.chatSideNav).toggle();

                $mdSidenav(enums.inAppSideNavsIds.mainMobileNav).toggle();
            };

            $scope.close = function () {
                $mdSidenav(enums.inAppSideNavsIds.mainMobileNav).close();
            };

            if (appStateManager.user) {
                //TODO here user is always undefined 
                $scope.user = appStateManager.user;
            }

            $scope.updateCreditButton = function () {
                var userId = appStateManager.getUserId();
                if (userId) {
                    apiService.users.getUserCredit({ userId: userId }).then(function (result) {
                        $scope.currentCredit = result.Data.User_Credit;
                        $scope.currentCreditText = $scope.currentCredit && $scope.currentCredit > 0 ? $translate.instant('CREDIT_MENU_ITEM') + ": " + $scope.currentCredit + "€" : $translate.instant('GET_FREE_CREDIT');
                    }, function (reason) {
                        console.log('getUserCredit failed because: ', reason);
                    });
                }
            };

            $scope.creditMenuClick = function () {
                $scope.close();
                $rootScope.$emit(enums.busNavigation.userProfile, { userId: $scope.user.User_Id });
            };

            var deregs = [];
            deregs.push($rootScope.$on(enums.busEvents.updatedUser, function (event, data) {
                $scope.user = appStateManager.user;
                $scope.updateCreditButton();
            }));

            deregs.push($rootScope.$on(enums.busChatEvents.updateUnreadCount, function (event, data) {
                $scope.unreadBadge = data.total || 0;
                $scope.$apply();
            }));

            $transitions.onSuccess({ to: 'app.**' }, function () {
                $scope.isScrollOffsetZero = ($state.current.data || {}).isCollapsingHeader || false;
                $scope.hideSearch = $state.includes('app.browse');
            });

            // let isLocked = false;
            angular.element(document.getElementById('main-ui-view')).bind('scroll', function () {

                var lastState = $scope.isScrollOffsetZero;
                var newState = void 0;
                if (this.scrollTop > 50) newState = false;else newState = ($state.current.data || {}).isCollapsingHeader || false;
                if (newState !== lastState) {
                    $scope.$evalAsync(function () {
                        $scope.isScrollOffsetZero = newState;
                    });
                    // if (!isLocked) {
                    //     isLocked = true;
                    //     $scope.$apply(function () {
                    //         isLocked = false;
                    //     });
                    // }
                }
            });

            $scope.$on('$destroy', function () {
                angular.element(document.getElementById('main-ui-view')).unbind('scroll');
                while (deregs.length) {
                    deregs.pop()();
                }
            });

            $scope.updateCreditButton();
        }
    };
}]);
angular.module('paladinApp').component('search', {
    bindings: {

        filter: '='
    },
    controller: function () {
        FilterComponent.$inject = ['$scope', '$rootScope', '$translate', 'apiService', 'enums'];
        function FilterComponent($scope, $rootScope, $translate, apiService, enums) {
            _classCallCheck(this, FilterComponent);

            this.scope = $scope;
            this.rootScope = $rootScope;
            this.translate = $translate;
            this.apiService = apiService;
            this.enums = enums;
        }

        _createClass(FilterComponent, [{
            key: '$onInit',
            value: function $onInit() {
                var _this = this;
                this.scope.distanceDropDown = [{
                    "l_id": 1,
                    "distance": 1,
                    "name": "VC"
                }, {
                    "l_id": 2,
                    "distance": 5,
                    "name": "NB"
                }, {
                    "l_id": 3,
                    "distance": 10,
                    "name": "IC"
                }, {
                    "l_id": 4,
                    "distance": 50,
                    "name": "IA"
                }, {
                    "l_id": 5,
                    "distance": 200,
                    "name": "FA"
                }];
                this.scope.distanceRange = 200;
                this.selectedRange = {
                    "l_id": 5,
                    "distance": 200,
                    "name": "FA"
                };
                this.scope.myModelVal = this.scope.distanceDropDown[4];

                this.scope.$on('distanceChanged', function (event, args) {
                    if (args) {
                        _this.changeDistanceFilter();
                    }
                    _this.loading = false;
                });

                this.selectedItem = '';
            }
        }, {
            key: 'initiateSearch',
            value: function initiateSearch(keyword) {
                if (keyword && keyword != '') {
                    $rootScope.$emit(enums.busNavigation.browseKeyword, { keyword: keyword });
                }
            }
        }, {
            key: 'searchBarOnKeyPress',
            value: function searchBarOnKeyPress($event) {
                if ($event.which == 13 && $event.target.value && $event.target.value != '') {
                    this.initiateSearch($event.target.value);
                    $event.preventDefault();
                }
            }
        }, {
            key: 'querySearch',
            value: function querySearch(textQuery) {
                var query = textQuery.toLowerCase();
                return this.apiService.products.getSuggestions(query).then(function (response) {
                    return [{ Rank: Infinity, Keyword: textQuery }].concat(_toConsumableArray(response.Data.sort(function (a, b) {
                        return b.Rank - a.Rank;
                    })));
                });
            }
        }, {
            key: 'showLocation',
            value: function showLocation() {
                return this.filter.sortBy === this.enums.productsSortOptions.geoLocation;
            }
        }, {
            key: 'onSelectedSuggestion',
            value: function onSelectedSuggestion(item, model, label, event) {
                this.filter.search.searchStr = item;
                event.stopPropagation();
            }
        }, {
            key: 'onKeyPressed',
            value: function onKeyPressed(event, item) {

                if (event.keyCode == 13) {
                    applySearch();
                }

                if (event.keyCode == 38 || event.keyCode == 40) {
                    this.filter.search.searchStr = item;
                }
            }
        }, {
            key: 'changeDistanceFilter',
            value: function changeDistanceFilter() {
                if (this.filter) {
                    this.filter.distanceRange = this.selectedRange.distance;
                    this.applySearch();
                }
            }
        }, {
            key: 'applySearch',
            value: function applySearch() {
                this.filter.currentPage = 1;
                this.filter.search.currentSearchStr = this.filter.search.searchStr;
                this.rootScope.$broadcast('filtersUpdated');
            }
        }, {
            key: 'addSuggestionToSearch',
            value: function addSuggestionToSearch(suggestion, loadResults) {
                this.filter.search.searchStr = suggestion;
                applySearch();
            }
        }, {
            key: 'smallScreen',
            value: function smallScreen() {
                return window.innerWidth < 768;
            }
        }]);

        return FilterComponent;
    }(),
    templateUrl: './views/templates/search.tpl.html'
});
angular.module('paladinApp').component('productlist', {
    bindings: {
        filter: '=',
        pages: '<',
        totalPages: '<',
        productsList: '=?',
        count: '<',
        isLoading: '=?'
    },
    controller: function () {
        FilterComponent.$inject = ['$scope', '$rootScope', '$location', 'Products', 'ngMeta', 'pager', '$anchorScroll', '$translate', 'enums', 'ptUtils'];
        function FilterComponent($scope, $rootScope, $location, Products, ngMeta, pager, $anchorScroll, $translate, enums, ptUtils) {
            _classCallCheck(this, FilterComponent);

            this.rootScope = $rootScope;
            this.scope = $scope;
            this.Products = Products;
            this.profileImageBaseUrl = window.globals.PROFILE_IMAGE_URL;
            this.productImageBaseUrl = window.globals.PRODUCT_IMAGE_URL;
            this.ngMeta = ngMeta;
            this.pager = pager;
            this.anchorScroll = $anchorScroll;
            this.translate = $translate;
            this.location = $location;
            this.enums = enums;
            this.ptUtils = ptUtils;
        }

        _createClass(FilterComponent, [{
            key: '$onInit',
            value: function $onInit() {
                //this.products=[];
                this.count = 0;
                this.totalPages = 0;
                this.productsList = null;
                this.isLoading = false;
                //    this.refreshPageList();      
                this.anchorScroll.yOffset = 0;
                this.profileDefaultImage = "../../assets/profile.png";

                //this.onFilterChange(false);
                var _this = this;
                this.scope.$on('filtersUpdated', function (event) {
                    _this.onFilterChange(false);
                });

                this.scope.$on('languageChanged', function (event, data) {

                    _this.filter.languageCode = data;
                    _this.onFilterChange(false);
                });

                if (this.rootScope.filter) {
                    this.onFilterChange(false);
                }
            }
        }, {
            key: 'updateMetaTags',
            value: function updateMetaTags() {
                this.ngMeta.setTitle(this.getPageTitle());
                this.ngMeta.setTag('description', this.getMetaTags());
                this.ngMeta.setTag('imagePath', '../../assets/paladin-logo-300x300.png');
            }
        }, {
            key: 'getPageTitle',
            value: function getPageTitle() {
                if (!this.filter.category.selectedCategoryId) {
                    //all categories selected, we put static title
                    return this.translate.instant('HOME_TITLE');
                }
                var title = this.translate.instant('RENT') + ' ';
                if (this.filter.category && this.filter.category.selectedCategoryName && !this.filter.category.selectedSubCategoryName) {
                    title += this.filter.category.selectedCategoryName;
                } else if (this.filter.category && this.filter.category.selectedSubCategoryName) {
                    title += this.filter.category.selectedSubCategoryName;
                }

                var placeName = this.filter.glCity;
                if (placeName) {
                    title += this.translate.instant('IN') + ' ' + placeName.split(',')[0];
                }

                return title;
            }
        }, {
            key: 'getPricePerDayLabel',
            value: function getPricePerDayLabel() {
                return this.translate.instant(window.innerWidth < 768 ? 'PD' : 'PPD');
            }
        }, {
            key: 'getMetaTags',
            value: function getMetaTags() {
                if (this.filter.category.selectedCategoryName == this.enums.allCategories[this.filter.languageCode]) {
                    return this.translate.instant("DEFAULT_META_DESC");
                }
                var tag = this.translate.instant("RENT_AND_LEND") + ' ';
                if (this.filter.category && this.filter.category.selectedCategoryName) {
                    tag += this.filter.category.selectedCategoryName;
                } else if (this.filter.category && this.filter.category.selectedSubCategoryName) {
                    tag += this.filter.category.selectedSubCategoryName;
                }

                var placeName = this.filter.glCity;
                if (placeName) {
                    tag += this.translate.instant('IN') + ' ' + placeName.split(',')[0];
                }
                tag += ' ' + this.translate.instant("WITH") + ' Paladin!';
                return tag;
            }
        }, {
            key: 'getDistanceLabel',
            value: function getDistanceLabel(product) {

                return '< ' + Math.ceil(this.getDistanceFromLatLonInKm(product.Product_Latitude, product.Product_Longitude, this.rootScope.filter.search.lat, this.rootScope.filter.search.lng)) + " " + this.translate.instant("KM_FROM_YOU");
            }
        }, {
            key: 'getDistanceFromLatLonInKm',
            value: function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
                var R = 6371; // Radius of the earth in km
                var dLat = this.deg2rad(lat2 - lat1); // deg2rad below
                var dLon = this.deg2rad(lon2 - lon1);
                var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                var d = R * c; // Distance in km
                return d;
            }
        }, {
            key: 'deg2rad',
            value: function deg2rad(deg) {
                return deg * (Math.PI / 180);
            }
        }, {
            key: 'navigateToProduct',
            value: function navigateToProduct(product) {
                this.rootScope.$emit(this.enums.busNavigation.productDetailed, { product: product });
            }
        }, {
            key: 'getProductDetailUrl',
            value: function getProductDetailUrl(product) {
                var url = '/';

                if (product) {

                    url += this.filter.languageCode ? this.filter.languageCode : '';

                    url += '/product';

                    //url+='/'+product.Product_Title.trim().split('-').join('+').split(' ').join('-').split('/').join('^');
                    url += '/' + this.Products.encryptProductURL(product.Product_Id);
                    url += '-' + product.Product_Id;

                    /*
                    var placeName = this.filter.glCity;
                    this.rootScope.searchedLocation = placeName;
                    if(placeName){
                      //url+='?searchedLocation='+encodeURIComponent(placeName);
                    }
                     if(this.filter.search.searchStr){
                      this.rootScope.q = this.filter.search.searchStr;
                      //url+='&&q='+encodeURIComponent(this.filter.search.searchStr); 
                    }
                     if(this.filter.category && this.filter.category.selectedCategoryName){
                      if(url.indexOf('?')<0)url+='?';
                       //console.log('SEL CAT : '+this.filter.category.selectedCategoryName)
                      this.rootScope.category = this.filter.category.selectedCategoryName.toString().replace(/-/g, ' ');
                      //url += '&&category='+this.filter.category.selectedCategoryName.toString().replace(/\s+/g, '-');
                    }
                    if(this.filter.category && this.filter.category.selectedSubCategoryName){
                      if(url.indexOf('?')<0)url+='?';
                       //console.log('SEL SUBCAT : '+this.filter.category.selectedSubCategoryName)
                      this.rootScope.subcategory =this.filter.category.selectedSubCategoryName.toString().replace(/-/g, ' ');
                     // url += '&&subcategory='+this.filter.category.selectedSubCategoryName.toString().replace(/\s+/g, '-');
                    }
                    }
                    //console.log('before redirect : '+this.filter.category.selectedCategoryName);
                    */
                }
                return url;
                //return url;
            }
        }, {
            key: 'goToProductPage',
            value: function goToProductPage(product) {
                this.location.url(getProductDetailUrl(product));
            }
        }, {
            key: 'goTo',
            value: function goTo(pageNumber) {
                this.filter.currentPage = pageNumber;

                this.onFilterChange(true);
            }
        }, {
            key: 'isFirstPage',
            value: function isFirstPage() {
                if (this.filter.currentPage == 1) return true;
                return false;
            }
        }, {
            key: 'setPage',
            value: function setPage(page) {
                if (page >= 1 && page <= this.totalPages) {
                    this.filter.currentPage = page;
                    this.refreshPageList();
                    this.onFilterChange(true);
                }
            }
        }, {
            key: 'refreshPageList',
            value: function refreshPageList() {
                this.pages = this.pager.GetPager(this.totalPages, this.filter.currentPage, 5);
                this.isLoading = false;
                this.ngMeta.setTag("prevUrl", undefined);
                this.ngMeta.setTag("nextUrl", undefined);

                if (this.filter.currentPage > 1) {
                    this.ngMeta.setTag("prevUrl", this.location.absUrl().replace('pageIndex=' + this.filter.currentPage, 'pageIndex=' + (this.filter.currentPage - 1)));
                }
                if (this.filter.currentPage < this.totalPages) {
                    this.ngMeta.setTag("nextUrl", this.location.absUrl().replace('pageIndex=' + this.filter.currentPage, 'pageIndex=' + (this.filter.currentPage + 1)));
                }
                // this.rootScope.$broadcast('hideSpinner');
            }
        }, {
            key: 'scrollToAnchor',
            value: function scrollToAnchor() {

                var oldAnchor = this.location.hash();
                this.location.hash("breadcrumb");
                this.anchorScroll();
                this.location.hash(oldAnchor);
            }
        }, {
            key: 'getProductUrl',
            value: function getProductUrl(product) {
                if (product) return this.ptUtils.getProductDetailUrl(product);
                return "#";
            }
        }, {
            key: 'isParentCategorySelected',
            value: function isParentCategorySelected() {
                return this.filter.category.selectedCategoryId && this.filter.category.selectedSubCategoryId == null;
            }
        }, {
            key: 'onFilterChange',
            value: function onFilterChange(scrollTop) {
                var _this9 = this;

                if (this.rootScope.filter && !this.isParentCategorySelected() && window.innerWidth < 768 || scrollTop) {
                    this.scrollToAnchor();
                }
                // this.rootScope.$broadcast('showSpinner');
                this.isLoading = true;
                this.productsList = [];
                this.updateMetaTags();

                this.scope.$evalAsync(function () {
                    _this9.productsList = [];
                    Promise.all([_this9.Products.getAll(_this9.filter), _this9.Products.getTotalPageCount(_this9.filter)]).then(function (results) {
                        _this9.scope.$evalAsync(function () {
                            _this9.isLoading = false;
                            _this9.productsList = results[0].data.Data[0];
                            _this9.totalPages = results[1].data.Data;
                            _this9.refreshPageList();
                        });
                    }).catch(function (err) {
                        _this9.scope.$evalAsync(function () {
                            _this9.isLoading = false;
                            _this9.productsList = [];
                            _this9.totalPages = 0;
                        });
                    });
                });
            }
        }, {
            key: 'increment',
            value: function increment() {
                this.count++;
            }
        }, {
            key: 'decrement',
            value: function decrement() {
                this.count--;
            }
        }]);

        return FilterComponent;
    }(),
    templateUrl: './views/templates/product_list.tpl.html'
});
angular.module('paladinApp').component('products', {
    bindings: {
        filter: '=',
        count: '<',
        loading: '<'
    },
    controller: function () {
        ProductController.$inject = ['$scope', '$sce', 'Filters', '$rootScope', 'enums', 'ngMeta', '$translate', '$window', '$location'];
        function ProductController($scope, $sce, Filters, $rootScope, enums, ngMeta, $translate, $window, $location) {
            _classCallCheck(this, ProductController);

            this.scope = $scope;
            this.sce = $sce;
            this.Filters = Filters;
            this.rootScope = $rootScope;
            this.ngMeta = ngMeta;
            this.loading = true;
            this.translate = $translate;
            this.window = $window;
            this.location = $location;
            this.enums = enums;
        }

        _createClass(ProductController, [{
            key: '$onInit',
            value: function $onInit() {
                this.count = 0;
                this.loading = true;
                var _this = this;

                this.scope.$on('showSpinner', function (event) {

                    _this.loading = true;
                });

                this.scope.$on('hideSpinner', function (event) {

                    _this.loading = false;
                });
            }
        }, {
            key: 'getCurrentCategory',
            value: function getCurrentCategory() {

                return this.translate.instant('ACTG');
            }
        }, {
            key: 'isNotAllCategory',
            value: function isNotAllCategory() {
                return this.filter.category.defaultCategoryName != this.filter.category.selectedCategoryName && this.filter.category.selectedCategoryName != this.getCurrentCategory();
            }
        }, {
            key: 'refreshProducts',
            value: function refreshProducts() {
                //console.log("REFRESH PRODUCTS in products.js");  
                this.rootScope.$broadcast('filtersUpdated', this.filter);
            }
        }, {
            key: 'sortBy',
            value: function sortBy(sort, code) {
                this.filter.sortBy = sort;
                this.filter.sortByCode = code;
                this.filter.currentPage = 1;
                this.refreshProducts();
            }
        }, {
            key: 'getBannerImageUrl',
            value: function getBannerImageUrl() {
                return (this.isNotAllCategory() ? window.globals.CATEGORY_IMAGE_URL : '') + (this.filter.category.selectedSubCategoryBannerImage ? this.filter.category.selectedSubCategoryBannerImage : this.filter.category.selectedCategoryBannerImage);
            }
        }, {
            key: 'getCategoryDescription',
            value: function getCategoryDescription() {
                if (!this.filter.category.selectedCategoryId) {
                    //all categories selected
                    var desc = this.translate.instant('ALL_CATEGORIES_DESC');
                    if (desc.length > 0) {
                        return this.sce.trustAsHtml(desc);
                    } else {
                        return null;
                    }
                } else if (this.filter.category.selectedSubCategoryId != null) {
                    //sub category selected
                    return this.filter.category.selectedSubCategoryDesc;
                } else {
                    return this.filter.category.selectedCategoryDesc;
                }
            }
        }, {
            key: 'switchCategoryToAll',
            value: function switchCategoryToAll(category) {
                this.filter.category.selectedCategoryId = null;
                this.filter.category.selectedCategoryDesc = this.sce.trustAsHtml(this.translate.instant('ACTG'));
                this.filter.category.selectedCategoryName = this.translate.instant('ACTG');
                this.filter.category.selectedCategoryImagePath = null;
                this.filter.category.selectedCategoryBannerImage = window.globals.IS_PROMO ? this.enums.categoriesBannersPaths.promo : this.enums.categoriesBannersPaths.all[this.translate.use()];
                this.removeSubCategory();
                this.refreshProducts();
            }
        }, {
            key: 'getH1',
            value: function getH1() {

                var h1 = '';
                var selectedCategoryStr = this.filter.category && this.filter.category.selectedSubCategoryName ? this.filter.category.selectedSubCategoryName : this.filter.category.selectedCategoryName;

                h1 += this.isNotAllCategory() ? this.translate.instant('FIND_THE_BEST') + ' ' : this.translate.instant('RENT') + ' ';

                if (this.filter.search.currentSearchStr && this.filter.search.currentSearchStr.length > 0) {
                    h1 += "\"" + this.filter.search.currentSearchStr + "\"" + " " + this.translate.instant('WITHIN') + " ";
                }
                h1 += selectedCategoryStr;

                var placeName = this.filter.glCity;
                if (placeName) {
                    h1 += this.translate.instant('IN') + ' ' + placeName.split(',')[0];
                }
                //return this.capitalizeFilter(h1);
                return h1;
            }
        }, {
            key: 'getH2',
            value: function getH2() {
                var h2 = this.translate.instant('RENT_AT_BEST_PRICE') + ' ';

                if (this.filter.category && this.filter.category.selectedCategoryName && !this.filter.category.selectedSubCategoryName) {
                    h2 += this.filter.category.selectedCategoryName;
                } else if (this.filter.category && this.filter.category.selectedSubCategoryName) {
                    h2 += this.filter.category.selectedSubCategoryName;
                }

                var placeName = this.filter.glCity;
                if (placeName) {
                    h2 += this.translate.instant('IN') + ' ' + placeName.split(',')[0];
                }
                return h2;
            }
        }, {
            key: 'getCategoriesUrl',
            value: function getCategoriesUrl(categoryName, subcategoryName) {
                return this.Filters.getCategoriesUrl(categoryName, subcategoryName, this.rootScope.isTryAndBuy, this.translate.use());
            }
        }, {
            key: 'removeSubCategory',
            value: function removeSubCategory() {
                this.filter.category.selectedSubCategoryId = null;
                this.filter.category.selectedSubCategoryDesc = null;
                this.filter.category.selectedSubCategoryName = null;
                this.filter.category.selectedSubCategoryImagePath = null;
                this.filter.category.selectedSubCategoryBannerImage = null;
            }
        }, {
            key: 'switchMainCategory',
            value: function switchMainCategory() {
                //here when sub category is implemented make it defaut so only main category will be seen
                this.removeSubCategory();
                this.refreshProducts();
            }
        }, {
            key: 'switchSubCategory',
            value: function switchSubCategory() {
                this.refreshProducts();
            }
            /*goBack(){
              console.log('GO BACK CLICKED')
              console.log(this.translate.proposedLanguage())
              //this.location.url('/');
              //this.refreshProducts();
            }*/

        }]);

        return ProductController;
    }(),
    templateUrl: './views/templates/products.tpl.html'
});
angular.module('paladinApp').directive('userAvatar', [function () {
    return {
        restrict: 'E',
        scope: {
            user: '<?',
            userId: '<?',
            picSize: '<?',
            userImage: '<?'
        },
        templateUrl: './views/templates/userAvatar.tpl.html',
        link: function link($scope, elem, attr) {
            // <img class="userAvatarImage" ng-if="user != null" ng-src="{{user.User_DisplayPicturePath =! null ? (imgServerPath +  user.User_DisplayPicturePath) : '/assets/profile.png'}}" alt="{{::user.User_UserName}}"/>

            var init = function init() {
                $scope.picSize = $scope.picSize || 30;
                $scope.picSizeParsed = $scope.picSize + "px";
                $scope.sizeStyle = 'width: ' + $scope.picSize + 'px; height: ' + $scope.picSize + 'px;';
                $scope.imgServerPath = window.globals.PROFILE_IMAGE_URL;
                var temp = $scope.userImage;
                $scope.userImage = '';
                if ($scope.user) {
                    $scope.userImage = $scope.user.User_DisplayPicturePath;
                } else if (temp) {
                    $scope.userImage = temp;
                }
            };

            init();

            var deregs = [];
            deregs.push($scope.$watch('userImage', function () {
                init();
            }));

            deregs.push($scope.$watch('user', function () {

                init();
            }));

            $scope.$on('destroy', function () {
                while (deregs.length) {
                    deregs.pop()();
                }
            });
        }
    };
}]);
angular.module('paladinApp').directive('loaderContainer', [function () {
    return {
        restrict: 'E',
        transclude: true,
        // scope: {
        //     isLoading: '=',
        //     loaderSize: '=?',
        // },
        templateUrl: './views/templates/loaderContainer.tpl.html',
        link: function link($scope, elem, attr) {
            $scope.loaderSize = $scope.loaderSize || 50;
        }
    };
}]);
angular.module('paladinApp').directive('homeStepsTutorial', ['$rootScope', '$sce', function ($rootScope, $sce) {
    return {
        restrict: 'E',
        scope: {
            stepsList: '<', /* strings[]*/
            imgUrl: '<',
            tutorialTitle: '<',
            tutorialDescription: '<'
        },
        templateUrl: './views/templates/homeStepsTutorial.tpl.html',
        link: function link($scope, elem, attt) {
            $scope.tutorialTitle = $sce.trustAsHtml($scope.tutorialTitle);
        }
    };
}]);
// /views/templates/homeStepsTutorial.tpl.html
angular.module('paladinApp').directive('productsTeaser', ['$rootScope', 'apiService', 'enums', 'dataService', 'appStateManager', 'toastService', '$timeout', function ($rootScope, apiService, enums, dataService, appStateManager, toastService, $timeout) {
    return {
        restrict: 'E',
        templateUrl: './views/templates/productsTeaser.tpl.html',
        scope: {
            customTitle: '<?',
            categoryId: '<?',
            categoryName: '<?',
            subCategoryId: '<?',
            categoryDescription: '<?',
            descriptionLink: '<?',
            isPopularItems: '<?',
            isRecentItems: '<?',
            isTryAndBuy: '<?',
            productIds: '<?',
            userId: '<?',
            products: '<?',
            currentProductId: '<?'
        },
        link: function link($scope, elem, attr) {
            $scope.isLoading = true;
            $scope.isPopularItems = $scope.isPopularItems || false;
            $scope.isRecentItems = $scope.isRecentItems || false;
            $scope.category = null;
            $scope.products = $scope.products || [];
            $scope.scrollArrows = { isRightVisible: false, isLeftVisible: false };

            var init = function init() {

                if ($scope.products) {
                    $scope.isLoading = false;
                    $timeout(function () {
                        $scope.validateScrollingArrows();
                    }, 300);
                    return;
                }

                if ($scope.categoryId) {
                    if (!appStateManager.categoriesDict) {
                        return dataService.getCategories();
                    }
                    $scope.category = appStateManager.categoriesDict[$scope.categoryId];
                }

                fetchProducts();
            };

            var getData = function getData() {
                //get products via productID list
                if ($scope.products) {
                    return;
                }
                if ($scope.productIds) {
                    return apiService.products.getSearchedProducts({
                        productPerPage: 20,
                        sortBy: enums.productsSortOptions.bestProduct,
                        productIDs: $scope.productIds
                    });
                }

                if ($scope.isTryAndBuy) {
                    return apiService.products.getPopularTryAndBuy();
                } else if ($scope.userId) {
                    var requestParams = {
                        userId: $scope.userId,
                        productsFilter: enums.userProductsFilter.myProductsToBorrow
                    };
                    return apiService.products.getUserProducts(requestParams).then(function (res) {
                        return { Data: [res.Data.User_AllProducts] };
                    });
                } else {

                    var _requestParams = {
                        productPerPage: 20
                    };

                    if ($scope.categoryId) {
                        _requestParams.categoryId = $scope.categoryId;
                        _requestParams.sortBy = enums.productsSortOptions.bestProduct;
                        if ($scope.subCategoryId) {
                            _requestParams.subCategoryId = $scope.subCategoryId;
                        }
                    } else if ($scope.isPopularItems) {
                        _requestParams.sortBy = enums.productsSortOptions.popularity;
                    } else if ($scope.isRecentItems) {
                        _requestParams.sortBy = enums.productsSortOptions.recent;
                    }
                    return apiService.products.getSearchedProducts(_requestParams);
                }
                // return new Promise((resolve,reject)=> reject('Method not implemented'))
            };
            var fetchProducts = function fetchProducts() {
                $scope.isLoading = true;
                getData().then(function (response) {
                    $scope.isLoading = false;
                    $scope.products = response.Data[0].filter(function (product) {
                        return product.Product_Id != $scope.currentProductId;
                    });
                    $timeout(function () {
                        $scope.validateScrollingArrows();
                    }, 300);
                }).catch(function (err) {
                    $scope.isLoading = false;
                    $scope.products = [];
                });
            };

            $scope.onSwipe = function (isLeft, $event, $target) {
                // button-overlay -> products-teaser-list-item -> products-teaser-list -> div#productsTeaserList + categoryId
                var objToScroll = $target.current.parentElement.parentElement.parentElement;
                if (objToScroll) {

                    var minScrollOffset = 0,
                        visibleWidth = objToScroll.clientWidth,
                        maxScrollOffset = objToScroll.scrollWidth - visibleWidth,
                        currentOffset = objToScroll.scrollLeft,
                        itemWidth = $target.current.clientWidth,
                        itemsInPage = visibleWidth / itemWidth;

                    var newScrollTo = isLeft ? currentOffset + (visibleWidth - itemWidth / itemsInPage) : currentOffset - (visibleWidth - itemWidth / itemsInPage);
                    if (newScrollTo > maxScrollOffset) newScrollTo = maxScrollOffset;else if (newScrollTo < minScrollOffset) newScrollTo = minScrollOffset;

                    var initialTimes = 30;
                    var times = 0;
                    var offset = currentOffset > newScrollTo ? currentOffset - newScrollTo : newScrollTo - currentOffset;
                    var step = offset / initialTimes;
                    var lastOffset = currentOffset < newScrollTo ? currentOffset + step : currentOffset - step;
                    // objToScroll.scrollTo(newScrollTo, objToScroll.scrollTop);


                    var id = setInterval(function () {
                        lastOffset = currentOffset < newScrollTo ? lastOffset + step : lastOffset - step;
                        objToScroll.scrollTo(lastOffset, objToScroll.scrollTop);
                        if (times == initialTimes) {
                            clearInterval(id);
                            $scope.validateScrollingArrows();
                        }
                        times++;
                    }, step * 0.4);
                }
            };

            $scope.onArrowClick = function (isLeft) {
                // 'productTeaserItem-' + $scope.products[0].Product_Id
                var firstItem = angular.element(document.querySelector('#productTeaserItem-' + $scope.products[0].Product_Id + ' .products-teaser-list-item-v2 .button-overlay'))[0];
                $scope.onSwipe(isLeft, null, { current: firstItem });
            };

            $scope.validateScrollingArrows = function () {
                $scope.instantiateScroller();
                if ($scope.products.length > 0) {
                    var firstItem = angular.element(document.querySelector('#productTeaserItem-' + $scope.products[0].Product_Id + ' .products-teaser-list-item-v2 .button-overlay'))[0];
                    // if (firstItem) {
                    var scroller = angular.element(document.getElementById('productsTeaserList' + ($scope.categoryId || ($scope.isRecentItems ? 'Recent' : $scope.isPopularItems ? 'Popular' : ''))));
                    if (scroller[0]) {
                        var visibleWidth = scroller[0].clientWidth,
                            maxScrollOffset = scroller[0].scrollWidth - visibleWidth,
                            currentOffset = scroller[0].scrollLeft;
                        $scope.$evalAsync(function () {
                            $scope.scrollArrows.isLeftVisible = Math.round(currentOffset) != 0;
                            $scope.scrollArrows.isRightVisible = Math.round(currentOffset) != maxScrollOffset;
                        });
                    }

                    // }
                } else {
                    $scope.$evalAsync(function () {
                        $scope.scrollArrows.isLeftVisible = false;
                        $scope.scrollArrows.isRightVisible = false;
                    });
                }
            };
            $scope.seeAll = function () {
                if ($scope.categoryId) {
                    $rootScope.$emit(enums.busNavigation.browseCategory, { categoryName: $scope.categoryName });
                } else if ($scope.isPopularItems || $scope.isRecentItems) $rootScope.$emit(enums.busNavigation.browseSort, { sortBy: $scope.isRecentItems ? enums.productsSortOptions.recent : enums.productsSortOptions.popularity });else if ($scope.userId) {
                    $rootScope.$emit(enums.busNavigation.userProfile, { userId: $scope.userId });
                } else if ($scope.isTryAndBuy != undefined) {
                    $rootScope.$emit(enums.busNavigation.switchBrowseMode, { isTryAndBuy: $scope.isTryAndBuy });
                }
            };

            $scope.getHrefLink = function () {
                var href = '';

                if ($scope.categoryId) {
                    href = window.globals.ROOT_PATH + appStateManager.currentLang + "/categorie/" + $scope.categoryName;

                    // $rootScope.$emit(enums.busNavigation.userProfile,{userId:$scope.userId})
                } else if ($scope.isTryAndBuy != undefined) {
                    href = window.globals.ROOT_PATH + appStateManager.currentLang + "/categorie/" + ($scope.isTryAndBuy ? '' : "privato/") + (appStateManager.currentLang == 'it' ? "Tutte-le-Categorie" : "All-Categories") + "?sortBy=SortByBestProduct&pageIndex=1";
                } else if ($scope.userId) {}

                return href.length > 0 ? href.split(' ').join('-') : "javascript:void(0);";
            };

            $scope.instantiateScroller = function () {
                if (!$scope.scroller) {
                    $scope.scroller = angular.element(document.getElementById('productsTeaserList' + ($scope.categoryId || ($scope.isRecentItems ? 'Recent' : $scope.isPopularItems ? 'Popular' : ''))));

                    $scope.scroller.bind('resize', function () {
                        $scope.validateScrollingArrows();
                    });
                }
            };

            var deregs = [];

            deregs.push($rootScope.$on(enums.busEvents.categoriesUpdate, function (event, data) {
                init();
            }));

            $scope.$on('$destroy', function () {
                if ($scope.scroller) $scope.scroller.unbind('resize');
                while (deregs.length) {
                    deregs.pop()();
                }
            });
            init();
        }
    };
}]);
angular.module('paladinApp').directive('lazyLoading', [function () {
    return {
        restrict: 'A',
        link: function link($scope, elem, attr) {

            /*We build sourceSet based on sizes: 
                Product: 100w,200w,300w,400w,500w
                Profile: 100w,300w,500w
                */
            var buildSourceSet = function buildSourceSet(imagePath, isProfile) {
                var sourceSet = '';
                for (var index = 1; index <= 5; index++) {
                    if (isProfile && index % 2 == 0) continue;
                    sourceSet = sourceSet + imagePath + attr.lazyLoading + "_" + index + "00 " + index + "00w, ";
                }
                if (sourceSet.length > 0) sourceSet = sourceSet + imagePath + attr.lazyLoading + " 600w";

                return sourceSet;
            };
            angular.element(elem)[0].src = '/assets/empty-image.png';

            var getImagePath = function getImagePath() {
                var imagePath = '';
                if (attr.imageType) {
                    if (attr.imageType == "product") {
                        imagePath = window.globals.PRODUCT_IMAGE_URL;
                    } else if (attr.imageType == "profile") {
                        if (attr.lazyLoading.length > 0) imagePath = window.globals.PROFILE_IMAGE_URL;else imagePath = '/assets/profile.png';
                    }
                }
                return imagePath;
            };

            function loadImg(changes) {
                changes.forEach(function (change) {
                    if (change.intersectionRatio > 0) {
                        var imagePath = getImagePath();
                        change.target.src = imagePath + attr.lazyLoading;
                        if (attr.imageType && (attr.imageType == "product" || attr.imageType == "profile" && attr.lazyLoading.length > 0)) {
                            change.target.srcset = buildSourceSet(imagePath, attr.imageType == "profile");
                        }
                    }
                });
            }

            var observer = new IntersectionObserver(loadImg);
            var img = angular.element(elem)[0];
            observer.observe(img);
        }
    };
}]);
angular.module('paladinApp').directive('profileImage', [function () {
    return {
        restrict: 'A',
        link: function link($scope, elem, attr) {
            var update = function update() {
                if (elem && elem[0]) {
                    if (attr.profileImage == '') elem[0].src = '/assets/profile.png';else elem[0].src = window.globals.PROFILE_IMAGE_URL + attr.profileImage;
                }
            };

            update();

            var deregs = [];

            deregs.push($scope.$watch('profileImage', function () {
                update();
            }));

            $scope.$on('$destroy', function () {
                while (deregs.length) {
                    deregs.pop()();
                }
            });
        }
    };
}]);
angular.module('paladinApp').directive('productTeaserListItem', ['$rootScope', 'enums', 'ptUtils', function ($rootScope, enums, ptUtils) {
    return {
        restrict: 'E',
        scope: {
            product: '<',
            onSwipe: '&'
        },
        templateUrl: './views/templates/productTeaserListItem.tpl.html',
        link: function link($scope, elem, attr) {
            $scope.onItemClick = function () {
                $rootScope.$emit(enums.busNavigation.productDetailed, { product: $scope.product });
            };

            $scope.getProductUrl = function () {
                if ($scope.product) return ptUtils.getProductDetailUrl($scope.product);
                return "#";
            };

            $scope.onItemSwipe = function (isLeft, $event, $target) {
                if ($scope.onSwipe) $scope.onSwipe()(isLeft, $event, $target);
            };
        }
    };
}]);
angular.module('paladinApp').directive('ratingView', [function () {
    return {
        restrict: 'E',
        scope: {
            rating: '=',
            count: '<?',
            readOnly: '<?',
            onRating: '&'
        },
        templateUrl: './views/templates/ratingView.tpl.html',
        link: function link($scope, elem, attrs) {

            $scope.onRatingSet = function (rating) {
                if ($scope.onRating) $scope.onRating({ rating: rating });
            };
        }
    };
}]);
angular.module('paladinApp').directive('userItem', ['$rootScope', 'enums', 'appStateManager', function ($rootScope, enums, appStateManager) {

    return {
        restrict: 'E',
        templateUrl: './views/templates/userItem.tpl.html',
        scope: {
            userId: '=?',
            userName: '=?',
            userImage: '=?',
            reviews: '=?',
            stars: '=?',
            picSize: '=?'
        },
        link: function link($scope, elem, attr) {
            $scope.picSize = $scope.picSize || 50;
            $scope.goToProfile = function () {
                if ($scope.userId) $rootScope.$emit(enums.busNavigation.userProfile, { userId: $scope.userId });
            };
        }
    };
}]);
angular.module('paladinApp').directive('reviewsList', ['$rootScope', 'appStateManager', function ($rootScope, appStateManager) {
    return {
        restrict: 'E',
        templateUrl: './views/templates/reviewsList.tpl.html',
        scope: {
            reviews: '='
        },
        link: function link($scope, elem, attr) {}
    };
}]);
angular.module('paladinApp').directive('reviewsListItem', ['$rootScope', function ($rootScope) {
    return {
        restrict: 'E',
        templateUrl: './views/templates/reviewsListItem.tpl.html',
        scope: {
            review: '='
        },
        link: function link($scope, elem, attr) {}
    };
}]);
'use strict';
angular.module('paladinApp').directive('rentalRequestPicker', ['$rootScope', 'appStateManager', 'enums', 'apiService', 'moment', '$translate', 'ptUtils', 'gtmService', function ($rootScope, appStateManager, enums, apiService, moment, $translate, ptUtils, gtmService) {
    return {
        restrict: 'E',
        templateUrl: './views/templates/rentalRequestPicker.tpl.html',
        scope: {
            product: '=',
            productBookingDetails: '=',
            onRequestRent: '&',
            onDatesUpdated: '&'
        },
        link: function link($scope, elem, attr) {
            console.log('rentalRequestPicker: ', elem[0].id);

            $scope.userCredit = null;

            $scope.calculatePrice = function () {
                var isShowErrorOnFaiure = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

                $scope.statusError = undefined;

                var calculateTransactionPrice = function calculateTransactionPrice() {
                    ptUtils.calculatePricingListForProduct($scope.startDate, $scope.endDate, $scope.product, $scope.productBookingDetails, true, $scope.userCredit).then(function (prices) {
                        $scope.$evalAsync(function () {
                            $scope.statusError = undefined;
                            $scope.prices = prices;
                        });
                    }).catch(function (err) {
                        $scope.$evalAsync(function () {
                            $scope.prices = [];
                            if (isShowErrorOnFaiure) {
                                if (err && err.message) {
                                    $scope.statusError = err.message;
                                }
                            }
                        });
                    });
                };

                // TODO: Refactor this and make sure credit is not requested more than necessary
                // maybe move the credit object to appStateManager

                var userId = appStateManager.getUserId();
                if (userId) {
                    apiService.users.getUserCredit({ userId: userId }).then(function (result) {
                        $scope.userCredit = result.Data;
                        calculateTransactionPrice();
                    }).catch(function (err) {
                        console.error('getuserCredit failed ', err);
                    });
                }
            };
            $scope.bookingPickerId = attr.id + '-bookingPicker';

            $scope.init = function () {
                // const dates = ptUtils.getProductFirstAvailableDatesToRent($scope.productBookingDetails);
                $scope.statusError = undefined;
                $scope.startDate = undefined; //dates.startDate;
                $scope.endDate = undefined; //dates.endDate;
                $scope.calculatePrice(false);
            };
            // scope.validateDates = () => {
            //
            // };
            $scope.onDatesSelected = function (_ref53) {
                var startDate = _ref53.startDate,
                    endDate = _ref53.endDate;

                if ($scope.startDate != startDate || $scope.endDate != endDate) {
                    $scope.startDate = startDate;
                    $scope.endDate = endDate;
                    $scope.calculatePrice();

                    if ($scope.onDatesUpdated) $scope.onDatesUpdated()({
                        startDate: $scope.startDate,
                        endDate: $scope.endDate,
                        componentId: elem[0].id
                    });
                }
            };

            $scope.onBuyBtnClicked = function () {
                $rootScope.$emit(enums.busNavigation.paymentDetailed, {
                    productId: $scope.product.Product_Id,
                    purchase: true
                });
            };

            $scope.onRequestRentBtnClicked = function () {
                if ($scope.prices == undefined || $scope.prices.length == 0) {
                    $scope.$$postDigest(function () {
                        angular.element(document.querySelector('#' + elem[0].id + ' #desktopPicker span.md-select-value'))[0].click();
                    });
                    return;
                }
                $scope.onRequestRent()({
                    startDate: $scope.startDate,
                    endDate: $scope.endDate,
                    componentId: elem[0].id
                });

                gtmService.trackEvent('booking', 'request-now-button-post-calendar', 'productDetailpage', 'value');
            };

            $scope.init();

            var deregs = [];

            deregs.push($rootScope.$on(enums.busEvents.rentalRequestPickerUpdateDates, function (event, data) {
                if (data && data.startDate && data.endDate && data.componentId == elem[0].id) {
                    $scope.onDatesSelected(data);
                }
            }));

            $scope.$on('$destroy', function () {
                while (deregs.length) {
                    deregs.pop()();
                }
            });
        }
    };
}]);

angular.module('paladinApp').directive('rentalRequestHowTo', [function () {
    return {
        restrict: 'E',
        templateUrl: './views/templates/rentalRequestHowTo.tpl.html',
        scope: {
            isTryAndBuy: '=?',
            isBuy: '=?'
        },
        link: function link($scope, elem, attr) {}
    };
}]);
angular.module('paladinApp').directive('bookingDatePicker', ['$rootScope', 'moment', 'popupService', 'ptUtils', '$mdMedia', function ($rootScope, moment, popupService, ptUtils, $mdMedia) {
    return {
        restrict: 'E',
        templateUrl: './views/templates/bookingDatePicker.tpl.html',
        scope: {
            resultCallback: '&',
            defaultValue: '=?',
            startDate: '=?',
            endDate: '=?',
            dateRange: '=?',
            productBookingDetails: '=?',
            product: '=?'
        },
        link: function link($scope, elem, attr) {
            // const dates = ptUtils.getProductFirstAvailableDatesToRent($scope.productBookingDetails);

            var updateDateRanges = function updateDateRanges() {
                if ($scope.productBookingDetails != null) {
                    dateRanges = ptUtils.getBookedDateRanges($scope.productBookingDetails);
                }
            };

            var dateRanges = [];
            updateDateRanges();

            $scope.isDateAvailable = function ($date) {
                var momentDate = moment($date);
                for (var i = 0; i < dateRanges.length; i++) {
                    if (momentDate.isBetween(dateRanges[i].startDate, dateRanges[i].endDate) || momentDate.isSame(dateRanges[i].startDate) || momentDate.isSame(dateRanges[i].endDate)) return true;
                }if (moment().isBefore($date)) return false; // TODO: - Check if product available for rent at dates

                return true;
            };
            $scope.startDate = $scope.startDate || undefined;
            $scope.endDate = $scope.endDate || undefined;
            $scope.dateRange = {};

            $scope.advancedModel = { selectedTemplate: 'Last 3 Days' };
            $scope.pickerModel = {
                selectedTemplate: false,
                dateStart: $scope.startDate,
                dateEnd: undefined
            };

            $scope.pickerTranslations = ptUtils.getTranslationDictForDatePicker();

            $scope.selectDate = function () {
                if (!$mdMedia('gt-sm')) {
                    popupService.showDateRangePicker($scope.productBookingDetails, $scope.product).then(function (data) {
                        if ($scope.resultCallback) {
                            $scope.resultCallback()({
                                startDate: moment(data.dateStart),
                                endDate: moment(data.dateEnd)
                            });
                        }
                    }).catch(function () {
                        return console.log('canceled date picking');
                    });
                } else {
                    $scope.$$postDigest(function () {
                        angular.element(document.querySelector('#' + elem[0].id + ' #desktopPicker span.md-select-value'))[0].click();
                    });
                }
            };
            $scope.onDesktopSelect = function ($dates) {
                if ($dates && $dates.length > 0) {
                    var dateStart = moment($dates[0]);
                    var dateEnd = moment($dates[$dates.length - 1]);
                    $scope.pickerModel.dateStart = undefined;
                    $scope.pickerModel.dateEnd = undefined;
                    if ($scope.resultCallback) {
                        $scope.resultCallback()({
                            startDate: moment(dateStart),
                            endDate: moment(dateEnd)
                        });
                    }
                }
            };

            // deregs.push($scope.$watchGroup([
            //     'startDate',
            //     'endDate'
            // ],function () {
            //     // $scope.pickerModel.dateStart = undefined;
            //     // $scope.pickerModel.dateEnd = undefined;
            // }));
            var deregs = [];

            deregs.push($scope.$watch('productBookingDetails', function () {
                updateDateRanges();
            }));

            $scope.$on('$destroy', function () {
                while (deregs.length) {
                    deregs.pop()();
                }
            });
        }
    };
}]);
angular.module('paladinApp').directive('userListingsListItem', ['$rootScope', 'enums', function ($rootScope, enums) {
    return {
        restrict: 'E',
        templateUrl: './views/templates/userListingsListItem.tpl.html',
        scope: {
            product: '<',
            isMinified: '=?'
        },
        link: function link($scope, elem, attr) {
            $scope.isMinified = $scope.isMinified || false;
        }
    };
}]);
angular.module('paladinApp').directive('userListingsList', ['$rootScope', 'enums', 'apiService', function ($rootScope, enums, apiService) {
    return {
        restrict: 'E',
        templateUrl: './views/templates/userListingsList.tpl.html',
        scope: {
            userId: '=',
            isMinified: '=?'
        },
        link: function link($scope, elem, att) {
            $scope.isMinified = $scope.isMinified || false;
            $scope.isLoading = false;
            $scope.userProducts = [];
            $scope.fetchUserListings = function () {
                $scope.isLoading = true;
                apiService.products.getUserProducts({
                    productsFilter: enums.userProductsFilter.lentProduct,
                    userId: $scope.userId
                }).then(function (res) {
                    $scope.userProducts = res.Data.User_AllProducts;
                    $scope.isLoading = false;
                });
            };

            $scope.listItemClick = function (product) {
                $rootScope.$emit(enums.busNavigation.productDetailed, { product: product });
            };

            $scope.fetchUserListings();
        }
    };
}]);
angular.module('paladinApp').directive('productStatusLabel', ['$rootScope', 'enums', 'ptUtils', function ($rootScope, enums, ptUtils) {
    return {
        restrict: 'E',
        templateUrl: './views/templates/productStatusLabel.tpl.html',
        scope: {
            statusId: '='
        },
        link: function link($scope, elem, attr) {
            /*
              "PRODUCT_STATUS_REQUESTED": "Requested",
              "PRODUCT_STATUS_ACCEPTED": "Accepted",
              "PRODUCT_STATUS_CANCELED": "Canceled",
              "PRODUCT_STATUS_DECLINED": "Declined",
              "PRODUCT_STATUS_TIMEOUT": "Timeout",
              "PRODUCT_STATUS_STARTED": "Started",
              "PRODUCT_STATUS_ENDED": "Ended"
            '50': '#69C187', //available,
            '100': '#fb814a', // requested
            '200': '#ee4e4a', // timeout / canceled (pre accept) / canceled by lender / canceled by borrower / declined
            '300': '#4ec07e', // accepted
            '400': '#0d87f6', // started
            '500': '#8d72f4', // ended
            'A100': '#fff', // not in use (must have for palette definition)
            'A200': '#fff', // not in use (must have for palette definition)
            'A400': '#fff', // not in use (must have for palette definition)
            'A700': '#fff', // not in use (must have for palette definition)
            */
            $scope.setDataForStatusId = function () {
                var _ptUtils$getDisplayDa = ptUtils.getDisplayDataForTransactionStatus($scope.statusId),
                    text = _ptUtils$getDisplayDa.text,
                    color = _ptUtils$getDisplayDa.color;

                $scope.mainColor = color;
                $scope.statusLabel = text;
            };

            $scope.setDataForStatusId();
        }
    };
}]);
'use strict';
angular.module('paladinApp').directive('bookingListItem', ['$rootScope', 'enums', 'appStateManager', function ($rootScope, enums, appStateManager) {
    return {
        restrict: 'E',
        templateUrl: './views/templates/bookingsListItem.tpl.html',
        scope: {
            booking: '=',
            isLent: '=?'
        },
        link: function link($scope, elem, attr) {
            $scope.isLent = appStateManager.getUserId() == $scope.booking.Lender_Id;
        }
    };
}]);
'use strict';
angular.module('paladinApp').directive('bookingTrackerInfo', ['$rootScope', 'enums', 'appStateManager', 'apiService', 'ptUtils', '$sce', '$translate', 'productReviewService', function ($rootScope, enums, appStateManager, apiService, ptUtils, $sce, $translate, productReviewService) {
    return {
        restrict: 'E',
        templateUrl: './views/templates/bookingTrackerInfo.tpl.html',
        scope: {
            booking: '='
        },
        link: function link($scope, elem, attr) {

            var getTutorialHTMLTemplate = function getTutorialHTMLTemplate(translationId) {
                return ptUtils.parseBookingStepTutorialHTMLTemplateForTranslationId(translationId);
            };

            $scope.getStaticBookingStepsP2P = function (isLender) {

                if (isLender) {
                    return [{
                        label: 'BOOKING_TRACK_INFO_REQUEST_RECEIVED',
                        status: enums.trackingStep.pending,
                        description: getTutorialHTMLTemplate('BookingStatusRequested_Lender'),
                        date: undefined,
                        isCurrent: false,
                        rentalStatus: [enums.productRentalStatus.requested]
                    }, {
                        label: 'BOOKING_TRACK_INFO_REQUEST_ACCEPTED',
                        status: enums.trackingStep.pending,
                        description: getTutorialHTMLTemplate('BookingStatusAccepted_Lender'),
                        date: undefined,
                        isCurrent: false,
                        rentalStatus: [enums.productRentalStatus.accepted]
                    }, {
                        label: 'BOOKING_TRACK_INFO_START',
                        status: enums.trackingStep.pending,
                        description: getTutorialHTMLTemplate('BookingStatusStarted_Lender'),
                        date: undefined,
                        isCurrent: false,
                        rentalStatus: [enums.productRentalStatus.started]
                    }, {
                        label: 'BOOKING_TRACK_INFO_END',
                        status: enums.trackingStep.pending,
                        description: getTutorialHTMLTemplate('BookingStatusEnded_Lender'),
                        date: undefined,
                        isCurrent: false,
                        rentalStatus: [enums.productRentalStatus.ended]
                    }];
                } else {

                    return [{
                        label: 'BOOKING_TRACK_INFO_CARD_VERIFICATION',
                        status: enums.trackingStep.failure,
                        description: getTutorialHTMLTemplate('BookingStatusNotVerified_Borrower'),
                        date: undefined,
                        isCurrent: true,
                        rentalStatus: [enums.productRentalStatus.verified, enums.productRentalStatus.verifying]
                    }, {
                        label: 'BOOKING_TRACK_INFO_REQUEST_SENT',
                        status: enums.trackingStep.pending,
                        description: getTutorialHTMLTemplate('BookingStatusRequested_Borrower'),
                        date: undefined,
                        isCurrent: false,
                        rentalStatus: [enums.productRentalStatus.requested]
                    }, {
                        label: 'BOOKING_TRACK_INFO_AWAIT_ACCEPT',
                        status: enums.trackingStep.pending,
                        description: getTutorialHTMLTemplate('BookingStatusAccepted_Borrower'),
                        date: undefined,
                        isCurrent: false,
                        rentalStatus: [enums.productRentalStatus.accepted]
                    }, {
                        label: 'BOOKING_TRACK_INFO_START',
                        status: enums.trackingStep.pending,
                        description: getTutorialHTMLTemplate('BookingStatusStarted_Borrower'),
                        date: undefined,
                        isCurrent: false,
                        rentalStatus: [enums.productRentalStatus.started]
                    }, {
                        label: 'BOOKING_TRACK_INFO_END',
                        status: enums.trackingStep.pending,
                        description: getTutorialHTMLTemplate('BookingStatusEnded_Borrower'),
                        date: undefined,
                        isCurrent: false,
                        rentalStatus: [enums.productRentalStatus.ended]
                    }];
                }
            };

            $scope.getStaticBookingStepsTnB = function (isLender) {
                //lender steps
                if (isLender) {
                    return [{
                        label: 'BOOKING_TRACK_INFO_BOOKED',
                        status: enums.trackingStep.pending,
                        description: getTutorialHTMLTemplate('BookingStatusBooked_Borrower'),
                        date: undefined,
                        isCurrent: false,
                        rentalStatus: [enums.productRentalStatus.booked]
                    }, {
                        label: 'BOOKING_TRACK_INFO_START',
                        status: enums.trackingStep.pending,
                        description: getTutorialHTMLTemplate('BookingStatusStarted_Lender'),
                        date: undefined,
                        isCurrent: false,
                        rentalStatus: [enums.productRentalStatus.started]
                    }, {
                        label: 'BOOKING_TRACK_INFO_END',
                        status: enums.trackingStep.pending,
                        description: getTutorialHTMLTemplate('BookingStatusEnded_Lender'),
                        date: undefined,
                        isCurrent: false,
                        rentalStatus: [enums.productRentalStatus.ended]
                    }];
                    //borrower steps    
                } else {

                    return [{
                        label: 'BOOKING_TRACK_INFO_CARD_VERIFICATION',
                        status: enums.trackingStep.failure,
                        description: getTutorialHTMLTemplate('BookingStatusNotVerified_Borrower_TnB'),
                        date: undefined,
                        isCurrent: true,
                        rentalStatus: [enums.productRentalStatus.verified, enums.productRentalStatus.verifying]
                    }, {
                        label: 'BOOKING_TRACK_INFO_BOOKED',
                        status: enums.trackingStep.pending,
                        description: getTutorialHTMLTemplate('BookingStatusBooked_Borrower'),
                        date: undefined,
                        isCurrent: false,
                        rentalStatus: [enums.productRentalStatus.booked]
                    }, {
                        label: 'BOOKING_TRACK_INFO_START',
                        status: enums.trackingStep.pending,
                        description: getTutorialHTMLTemplate('BookingStatusStarted_Borrower_TnB'),
                        date: undefined,
                        isCurrent: false,
                        rentalStatus: [enums.productRentalStatus.started]
                    }, {
                        label: 'BOOKING_TRACK_INFO_END',
                        status: enums.trackingStep.pending,
                        description: getTutorialHTMLTemplate('BookingStatusEnded_Borrower_TnB'),
                        date: undefined,
                        isCurrent: false,
                        rentalStatus: [enums.productRentalStatus.ended]
                    }];
                }
            };
            // Lender steps
            // Request received
            // Request Accepted
            // Start Rental (chat)
            // End Rental (chat)


            // Borrower steps
            // Card Verification
            // ID Verification
            // Request sent
            // await accept
            // Start Rental (chat)
            // End Rental (chat)

            var trackId = null;
            var cases = [enums.productRentalStatus.timeout, enums.productRentalStatus.denied, enums.productRentalStatus.canceled, enums.productRentalStatus.criticalCancel, enums.productRentalStatus.moderateCancel];

            $scope.setStaticStepAtIndexAsCurrent = function (staticSteps, atIndex) {
                staticSteps.forEach(function (step, index) {
                    step.isCurrent = index === atIndex;
                });
            };
            $scope.getCurrentStep = function () {
                return $scope.steps.find(function (item) {
                    return item.isCurrent == true;
                });
            };
            $scope.updateSteps = function (staticSteps) {
                var statuses = $scope.booking.BookingStatus;
                //special handling for Verifying status
                if (statuses[statuses.length - 1].Status_TrackId == enums.productRentalStatus.verifying) {
                    var currentStatus = statuses[statuses.length - 1];
                    staticSteps[0].status = enums.trackingStep.pending;
                    staticSteps[0].date = ptUtils.stringToDate(currentStatus.CreatedDate + ' ' + currentStatus.CreatedTime);
                    staticSteps[0].label = 'BOOKING_TRACK_INFO_ID_VERIFICATION';
                    staticSteps[0].description = getTutorialHTMLTemplate('BookingStatusVerifying_Borrower');
                    $scope.setStaticStepAtIndexAsCurrent(staticSteps, 0);
                    return staticSteps;
                }
                for (var i = 0; i < statuses.length; i++) {
                    var _currentStatus = statuses[i];
                    //lookup static step matching the status and update date and status
                    for (var j = 0; j < staticSteps.length; j++) {
                        if (staticSteps[j].rentalStatus.includes(_currentStatus.Status_TrackId)) {
                            staticSteps[j].status = enums.trackingStep.success;
                            staticSteps[j].date = ptUtils.stringToDate(_currentStatus.CreatedDate + ' ' + _currentStatus.CreatedTime);
                            //if its the last status, show description
                            if (i == statuses.length - 1) {
                                $scope.setStaticStepAtIndexAsCurrent(staticSteps, j);
                            }
                            break;
                        }
                    }
                }

                return staticSteps;
            };

            $scope.init = function () {
                $scope.userId = appStateManager.getUserId();
                $scope.isLender = $scope.userId == $scope.booking.Lender_Id;
                $scope.isTryAndBuy = $scope.booking.IsTryAndBuy;
                var steps = angular.copy($scope.booking.IsTryAndBuy ? $scope.getStaticBookingStepsTnB($scope.isLender) : $scope.getStaticBookingStepsP2P($scope.isLender));
                $scope.steps = $scope.updateSteps(steps);
            };

            $scope.init();
        }
    };
}]);

'use strict';
angular.module('paladinApp').directive('bookingDetailedStatus', ['$rootScope', 'enums', 'appStateManager', 'apiService', 'ptUtils', function ($rootScope, enums, appStateManager, apiService, ptUtils) {
    return {
        restrict: 'E',
        templateUrl: './views/templates/bookingDetailedStatus.tpl.html',
        scope: {
            booking: '='
            // productBookingDetails: '=',
            // product: '='
        },
        link: function link($scope, elem, attr) {
            $scope.prices = [];
            $scope.youWontBeChargedText = undefined;

            var init = function init() {

                if ($scope.booking && $scope.booking.BookingStatus && $scope.booking.BookingStatus.length > 0) $scope.youWontBeChargedText = $scope.booking.BookingStatus[$scope.booking.BookingStatus.length - 1].Status_TrackId == enums.productRentalStatus.requested ? 'YOU_WONT_BE_CHARGED_MSG' : undefined;

                // Booking_PickupProduct
                // FullEndDate
                // FullStartDate
                // Discount
                // ptUtils.calculatePricingListForProduct($scop)

                ptUtils.calculatePriceingListForBooking($scope.booking).then(function (prices) {
                    $scope.$evalAsync(function () {
                        $scope.prices = prices;
                    });
                });
            };

            init();
        }
    };
}]);
'use strict';
angular.module('paladinApp').directive('bookingDetailedCtaButton', ['$rootScope', 'enums', 'appStateManager', 'apiService', 'ptUtils', 'toastService', 'ptLog', 'transactionService', 'productReviewService', function ($rootScope, enums, appStateManager, apiService, ptUtils, toastService, ptLog, transactionService, productReviewService) {
    return {
        restrict: 'E',
        templateUrl: './views/templates/bookingDetailedCTAButton.tpl.html',
        scope: {
            booking: '='
        },
        link: function link($scope, elem, attr) {
            $scope.btns = [];

            var getTextAndCTAforTransactionStatus = function getTextAndCTAforTransactionStatus(status, isLender, booking, isTryAndBuy) {
                $scope.btns = [];
                switch (status) {
                    case enums.productRentalStatus.notVerified:
                        {
                            if (!isLender) {
                                $scope.btns.push({ // Verify ID
                                    text: 'VERIFY_ID',
                                    BL: function BL(booking) {
                                        $rootScope.$emit(enums.busNavigation.idVerification, { bookingId: booking.Booking_Id });
                                    },
                                    isEnabled: true
                                });
                            }
                            break;
                        }
                    case enums.productRentalStatus.requested:
                        {
                            if (!isLender) {
                                $scope.btns.push({ // Cancel Request
                                    text: 'CANCEL_REQUEST',
                                    BL: function BL(booking) {
                                        return transactionService.rejectRental(booking, false);
                                    },
                                    isEnabled: true,
                                    isDestructive: true
                                });
                            } else {
                                $scope.btns.push({
                                    text: 'DECLINE_REQUEST',
                                    BL: function BL(booking) {
                                        return transactionService.rejectRental(booking, true);
                                    },
                                    isEnabled: true,
                                    isDestructive: true
                                });
                                $scope.btns.push({
                                    text: 'ACCEPT_REQUEST',
                                    BL: function BL(booking) {
                                        return transactionService.acceptRental(booking);
                                    },
                                    isEnabled: true
                                });
                            }
                            break;
                        }

                    case enums.productRentalStatus.canceled:
                        {
                            if (!isLender) {
                                $scope.btns.push({
                                    text: 'REQUEST_AGAIN',
                                    BL: function BL(booking) {
                                        return $rootScope.$emit(enums.busNavigation.productDetailed, { product: booking });
                                    },
                                    isEnabled: true
                                });
                            }
                            break;
                        }
                    case enums.productRentalStatus.accepted:
                        {
                            if (!isLender) {
                                $scope.btns.push({
                                    text: 'CANCEL_BOOKING',
                                    BL: function BL(booking) {
                                        return transactionService.cancelRental(booking, false);
                                    },
                                    isEnabled: true,
                                    isDestructive: true
                                });
                                $scope.btns.push({
                                    text: 'START_RENTAL',
                                    BL: function BL(booking) {
                                        return transactionService.startRental(booking);
                                    },
                                    isEnabled: true
                                });
                            } else {
                                $scope.btns.push({
                                    text: 'CANCEL_BOOKING',
                                    BL: function BL(booking) {
                                        return transactionService.cancelRental(booking, true);
                                    },
                                    isEnabled: true,
                                    isDestructive: true
                                });
                            }
                            break;
                        }

                    case enums.productRentalStatus.timeout:
                        {
                            if (!isLender) {
                                if (booking.Booking_ReviewStatus != enums.bookingReviewStatus.reviewByBorrower && booking.Booking_ReviewStatus != enums.bookingReviewStatus.reviewByBoth) {
                                    $scope.btns.push({
                                        text: 'REVIEW_LENDER',
                                        BL: function BL(booking) {
                                            return productReviewService.startReviewFlow(booking, true);
                                        },
                                        isEnabled: true
                                    });
                                } else {

                                    $scope.btns.push({
                                        text: 'REQUEST_AGAIN',
                                        BL: function BL(booking) {
                                            return $rootScope.$emit(enums.busNavigation.productDetailed, { product: booking });
                                        },
                                        isEnabled: true
                                    });
                                }
                            }
                            break;
                        }

                    case enums.productRentalStatus.denied:
                        {
                            $scope.btns.push({
                                text: 'REQUEST_AGAIN',
                                BL: function BL(booking) {
                                    return $rootScope.$emit(enums.busNavigation.productDetailed, { product: booking });
                                },
                                isEnabled: true
                            });

                            break;
                        }
                    case enums.productRentalStatus.canceledByLender:
                        {
                            if (!isLender && !isTryAndBuy) {
                                $scope.btns.push({
                                    text: 'REVIEW_LENDER',
                                    BL: function BL(booking) {
                                        return productReviewService.startReviewFlow(booking, true);
                                    },
                                    isEnabled: true
                                });
                            }
                            break;
                        }
                    case enums.productRentalStatus.criticalCancel:
                    case enums.productRentalStatus.moderateCancel:
                        {
                            if (isLender) {
                                $scope.btns.push({
                                    text: 'REVIEW_BORROWER',
                                    BL: function BL(booking) {
                                        return productReviewService.startReviewFlow(booking, false);
                                    },
                                    isEnabled: true
                                });
                            }
                            break;
                        }
                    case enums.productRentalStatus.started:
                        {
                            if (isLender) {
                                $scope.btns.push({
                                    text: 'END_RENTAL',
                                    BL: function BL(booking) {
                                        return transactionService.endRental(booking);
                                    },
                                    isEnabled: true
                                });
                            } else if (isTryAndBuy) {
                                $scope.btns.push({
                                    text: 'BUY_NOW',
                                    BL: function BL(booking) {
                                        return $rootScope.$emit(enums.busNavigation.paymentDetailed, { productId: booking.Product_Id, purchase: true, bookingId: booking.Booking_Id });
                                    },
                                    isEnabled: true
                                });
                            }
                            break;
                        }
                    case enums.productRentalStatus.ended:
                        {
                            if (!isLender) {
                                if (booking.Booking_ReviewStatus != enums.bookingReviewStatus.reviewByBorrower && booking.Booking_ReviewStatus != enums.bookingReviewStatus.reviewByBoth) {
                                    $scope.btns.push({
                                        text: 'REVIEW_LENDER',
                                        BL: function BL(booking) {
                                            return productReviewService.startReviewFlow(booking, true);
                                        },
                                        isEnabled: true
                                    });
                                } else {
                                    $scope.btns.push({
                                        text: 'REQUEST_AGAIN',
                                        BL: function BL(booking) {
                                            return $rootScope.$emit(enums.busNavigation.productDetailed, { product: booking });
                                        },
                                        isEnabled: true
                                    });
                                }
                                if (isTryAndBuy) {
                                    $scope.btns.push({
                                        text: 'BUY_NOW',
                                        BL: function BL(booking) {
                                            return $rootScope.$emit(enums.busNavigation.paymentDetailed, { productId: booking.Product_Id, purchase: true, bookingId: booking.Booking_Id });
                                        },
                                        isEnabled: true
                                    });
                                }
                            } else {
                                if (booking.Booking_ReviewStatus != enums.bookingReviewStatus.reviewByLender && booking.Booking_ReviewStatus != enums.bookingReviewStatus.reviewByBoth) {
                                    $scope.btns.push({
                                        text: 'REVIEW_BORROWER',
                                        BL: function BL(booking) {
                                            return productReviewService.startReviewFlow(booking, false);
                                        },
                                        isEnabled: true
                                    });
                                }

                                if (!booking.Lender_StripeAccount) {
                                    $scope.btns.push({
                                        text: 'CREATE_STRIPE_ACCOUNT',
                                        BL: function BL(booking) {
                                            return transactionService.endRentalForStripeAccountOnly(booking);
                                        },
                                        isEnabled: true
                                    });
                                }
                            }
                            break;
                        }
                    case enums.productRentalStatus.timeoutByBorrower:
                        {
                            if (isLender) {
                                $scope.btns.push({
                                    text: 'REVIEW_BORROWER',
                                    BL: function BL() {
                                        return productReviewService.startReviewFlow(booking, false);
                                    },
                                    isEnabled: true
                                });
                            }
                            break;
                        }
                }
            };
            $scope.init = function () {
                var userId = appStateManager.getUserId();
                var isUserLender = $scope.booking.Lender_Id == userId;
                var bookingStatus = $scope.booking.BookingStatus[$scope.booking.BookingStatus.length - 1].Status_TrackId;

                var _ptUtils$getDisplayDa2 = ptUtils.getDisplayDataForTransactionStatus(bookingStatus),
                    color = _ptUtils$getDisplayDa2.color,
                    text = _ptUtils$getDisplayDa2.text;

                $scope.mainColor = color;
                getTextAndCTAforTransactionStatus(bookingStatus, isUserLender, $scope.booking, $scope.booking.IsTryAndBuy);
            };
            $scope.ctaClicked = function () {};

            $scope.init();
        }
    };
}]);
'use strict';
angular.module('paladinApp').directive('chatCtaButton', ['$rootScope', 'enums', 'apiService', 'appStateManager', 'toastService', 'chatService', '$translate', function ($rootScope, enums, apiService, appStateManager, toastService, chatService, $translate) {

    return {
        restrict: 'E',
        templateUrl: './views/templates/chatCTAButton.tpl.html',
        scope: {
            product: '=',
            productBookingDetails: '=',
            booking: '=?'
        },
        link: function link($scope, elem, attr) {
            $scope.userId = appStateManager.getUserId();
            $scope.startChat = function () {
                $scope.isLoading = true;
                var _$scope$product = $scope.product,
                    Chat_QBRoomId = _$scope$product.Chat_QBRoomId,
                    Lender_UserId = _$scope$product.Lender_UserId,
                    Product_Id = _$scope$product.Product_Id,
                    Product_Title = _$scope$product.Product_Title;
                // toastService.simpleToast(`Start Chat between lenderID: ${$scope.lenderQbId} and borrowerId: ${$scope.borrowerQbId} for productId: ${$scope.productId}`);

                var _$scope$productBookin = $scope.productBookingDetails,
                    Borrower_QBId = _$scope$productBookin.Borrower_QBId,
                    Lender_QBId = _$scope$productBookin.Lender_QBId;


                var borrowerId = $scope.userId;
                var bookingId = undefined;
                if ($scope.booking) {
                    bookingId = $scope.booking.Booking_Id;
                    borrowerId = $scope.booking.Borrower_Id;
                }

                chatService.createOrStartChat({
                    lenderId: Lender_UserId,
                    borrowerId: borrowerId,
                    lenderQBId: Lender_QBId,
                    borrowerQBId: Borrower_QBId,
                    chatRoomId: Chat_QBRoomId,
                    bookingId: bookingId,
                    productId: Product_Id,
                    productName: Product_Title
                }).then(function (res) {
                    $scope.isLoading = false;
                    //     nav to chat
                    console.log(res);
                    $rootScope.$emit(enums.busNavigation.chat, { chatId: res.Chat_QBRoomId });
                }).catch(function (err) {
                    $scope.isLoading = false;
                    console.error(err);
                    toastService.simpleToast($translate.instant('DEFAULT_ERROR'));
                });
            };
        }
    };
}]);
'use strict';
angular.module('paladinApp').directive('bookingCoupon', ['$rootScope', 'enums', 'apiService', 'appStateManager', 'ptUtils', function ($rootScope, enums, apiService, appStateManager, ptUtils) {

    return {
        restrict: 'E',
        templateUrl: './views/templates/bookingCoupon.tpl.html',
        scope: {
            onCouponValidation: '&'
        },
        link: function link($scope, elem, attr) {
            $scope.isAddingCoupon = false;
            $scope.isLoading = false;
            $scope.error = null;
            $scope.coupon = { code: '' };
            $scope.addCoupon = function () {
                $scope.isAddingCoupon = true;
            };
            $scope.cancel = function () {
                $scope.isAddingCoupon = false;
            };

            $scope.validateCoupon = function () {
                // if (!ptUtils.regexPatterns.numbersOnly.test($scope.coupon.code)) {
                //     return $scope.error = 'Please insert a valid coupon'
                // }
                $scope.isLoading = true;
                var userId = appStateManager.getUserId();
                var coupon = $scope.coupon.code;
                apiService.payments.verifyCoupon({
                    userId: userId,
                    coupon: coupon
                }).then(function (res) {
                    $scope.isLoading = false;
                    $scope.onCouponValidation()(res.Data);
                    $scope.isAddingCoupon = false;
                    $scope.coupon.code = '';
                }).catch(function (err) {
                    $scope.isLoading = false;
                    $scope.error = err.data.Message || 'PLEASE_INSERT_VALID_COUPON';
                    // console.error(JSON.stringify(err))
                });
            };
        }
    };
}]);

'use strict';
angular.module('paladinApp').directive('chatsList', ['$rootScope', 'enums', 'chatService', 'appStateManager', function ($rootScope, enums, chatService, appStateManager) {

    return {
        restrict: 'E',
        templateUrl: './views/templates/chatsList.tpl.html',
        link: function link($scope, attr, elem) {
            $scope.currentPage = 0;
            $scope.isLoading = true;
            $scope.canLoadMore = true;
            var isLoadingMore = false;
            $scope.chats = [];
            $scope.unreadDict = {};
            $scope.selectedChatId = null;
            $scope.loadChatsList = function () {
                var isReplace = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

                $scope.isLoading = true;
                chatService.getChatList(appStateManager.getUserId(), $scope.currentPage).then(function (list) {
                    $scope.$evalAsync(function () {
                        $scope.isLoading = false;
                        isLoadingMore = false;
                        if (isReplace) {
                            $scope.chats = list;
                            $scope.currentPage = 0;
                            $scope.canLoadMore = true;
                        } else {
                            if (list.length > 0) {
                                $scope.chats = $scope.chats.concat(list);
                                $scope.currentPage++;
                            } else {
                                $scope.canLoadMore = false;
                            }
                        }
                    });
                    chatService.getUnreadMessage().then(function (dialogsDict) {
                        $scope.unreadDict = dialogsDict || {};
                    }).catch(function () {
                        return $scope.unreadDict = {};
                    });
                }).catch(function (err) {
                    $scope.isLoading = false;
                });
            };

            $scope.onChatListItemClicked = function (chatItem) {
                console.log(chatItem);
                if ($scope.selectedChatId != chatItem.Chat_QBRoomId) {
                    $scope.selectedChatId = chatItem.Chat_QBRoomId;
                    $rootScope.$emit(enums.busChatEvents.detailedChatSelected, { chatId: chatItem.Chat_QBRoomId });
                }
            };
            $rootScope.$on(enums.busChatEvents.updateUnreadCount, function (event, data) {
                $scope.unreadDict = data.detailedDict || {};
            });

            var deregs = [];

            deregs.push($rootScope.$on(enums.busChatEvents.selectPendingChat, function (event, data) {
                $scope.selectedChatId = data.chatId;
            }));

            $scope.loadMore = function () {
                if ($scope.canLoadMore) {
                    if (!isLoadingMore) {
                        isLoadingMore = true;
                        console.log('$scope.canLoadMore');
                        $scope.loadChatsList(false);
                    }
                }
            };

            $scope.loadChatsList(true);

            $scope.$on('$destroy', function () {
                while (deregs.length > 0) {
                    deregs.pop()();
                }
            });
        }
    };
}]);
'use strict';
angular.module('paladinApp').directive('chatDetailed', ['$rootScope', 'apiService', 'appStateManager', 'enums', 'chatService', '$mdSidenav', 'toastService', 'ptUtils', function ($rootScope, apiService, appStateManager, enums, chatService, $mdSidenav, toastService, ptUtils) {

    return {
        restrict: 'E',
        templateUrl: './views/templates/chatDetailed.tpl.html',
        scope: {
            chatId: '=?'
        },
        link: function link($scope, elem, attr) {
            // if ($stateParams.chatId) {
            //     $scope.chatId = $stateParams.chatId;
            // }
            $scope.chat = null;
            $scope.bookingId = null;
            $scope.messages = [];
            $scope.compose = { text: '', img: null };
            $scope.isUploadingMedia = false;
            $scope.userImages = {
                me: undefined,
                recipient: undefined
            };
            $scope.canLoadMoreMsgs = true;
            var deregs = [];

            $scope.setSelectedChat = function (chatId) {
                var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

                if (chatId) {
                    if (chatId != $scope.chatId || force) {
                        $scope.chatId = chatId;
                        if ($scope.chat && $scope.chat.Chat_QBRoomId) chatService.leaveChat($scope.chat.Chat_QBRoomId);
                        $scope.getDetailedChat();
                    }
                } else {
                    // deselect chat
                    if ($scope.chat && $scope.chat.Chat_QBRoomId) chatService.leaveChat($scope.chat.Chat_QBRoomId);
                }
            };
            $scope.goToProduct = function () {
                $rootScope.$emit(enums.busNavigation.productDetailed, { product: $scope.product });
            };
            $scope.goToRental = function () {
                $rootScope.$emit(enums.busNavigation.transactionDetailed, { bookingId: $scope.bookingId });
            };

            $scope.getDetailedChat = function () {
                $scope.bookingId = null;
                $scope.isLoading = true;
                chatService.getChatDetailed($scope.chatId).then(function (chat) {
                    $scope.chat = chat;
                    if (chat.BookingList && chat.BookingList.length > 0 && chat.BookingList[0].BookingId) {
                        $scope.bookingId = chat.BookingList[0].BookingId;
                    }
                    $scope.userImages.me = appStateManager.user.User_DisplayPicturePath;
                    $scope.userImages.recipient = chat.Lender_UserId == appStateManager.user.User_Id ? chat.Borrower_ProfileImage : chat.Lender_ProfileImage;
                    chatService.joinChat($scope.chat.Chat_QBRoomId).then(function () {
                        $scope.getDetailedProduct();
                    }).catch(function (err) {
                        console.log('Failed to join chat', err);
                        $scope.chat = null;
                        $scope.chatId = null;
                        $scope.isLoading = false;
                        toastService.simpleToast($translate.instant('FAILED_JOIN_CHAT'));
                    });
                }).catch(function (err) {
                    $scope.isLoading = false;
                    $scope.chatId = null;
                });
            };

            $scope.getDetailedProduct = function () {
                var Product_Id = $scope.chat.Product_Id;

                apiService.products.getDetailedProduct(Product_Id).then(function (res) {
                    $scope.product = res.Data;
                    $scope.getChatHistory();
                }).catch(function (err) {
                    $scope.chat = null;
                    $scope.isLoading = false;
                });
            };

            $scope.getChatHistory = function () {
                chatService.getChatHistory($scope.chat.Chat_QBRoomId, 0).then(function (msgs) {
                    chatService.clearUnreadBadgesForDialog($scope.chat.Chat_QBRoomId);
                    $scope.$evalAsync(function () {
                        $scope.canLoadMoreMsgs = true;
                        $scope.messages = msgs;
                        $scope.isLoading = false;
                        // document.getElementById('composeTextMessage').focus();
                    });
                }).catch(function (err) {
                    $scope.$evalAsync(function () {
                        $scope.messages = [];
                        $scope.isLoading = false;
                    });
                });
            };

            $scope.loadMoreMessages = function () {
                if (!$scope.isGettingMoreMsgs && $scope.canLoadMoreMsgs) {
                    $scope.isGettingMoreMsgs = true;
                    console.log('loadMoreMessages');
                    chatService.getChatHistory($scope.chat.Chat_QBRoomId, $scope.messages.length).then(function (msgs) {
                        if (msgs.length == 0) {
                            $scope.canLoadMoreMsgs = false;
                        }
                        $scope.isGettingMoreMsgs = false;
                        $scope.messages = msgs.concat($scope.messages);
                    }).catch(function (err) {
                        $scope.isGettingMoreMsgs = false;
                    });
                }
            };

            $scope.toggleNav = function () {
                $mdSidenav(enums.inAppSideNavsIds.chatSideNav).toggle();
            };

            $scope.sendMessage = function () {
                chatService.sendMessage({
                    dialogId: $scope.chat.Chat_QBRoomId,
                    text: $scope.compose.text,
                    productId: $scope.chat.Product_Id,
                    input: null
                });
                $scope.compose.text = '';
            };

            $scope.keyPress = function ($event) {
                if ($event.which == 13 && !$event.shiftKey) {
                    $event.preventDefault();
                    if ($scope.compose.text != '') $scope.sendMessage();else ptUtils.playErrorSound();
                }
            };

            $scope.uploadMedia = function () {
                $scope.$$postDigest(function () {
                    angular.element(document.getElementById('chatMediaUpload'))[0].click();
                });
            };
            $scope.onUploaded = function (inputElement) {
                $scope.$evalAsync(function () {
                    $scope.isUploadingMedia = true;
                    if (inputElement && inputElement.files && inputElement.files.length > 0) {
                        chatService.sendMessage({
                            dialogId: $scope.chat.Chat_QBRoomId,
                            text: null,
                            input: inputElement

                        }).then(function () {
                            $scope.$evalAsync(function () {
                                $scope.isUploadingMedia = false;
                            });
                        }).catch(function (err) {
                            $scope.$evalAsync(function () {
                                $scope.isUploadingMedia = false;
                            });
                            alert('error! upload again!');
                        });
                    }
                });
            };
            deregs.push($rootScope.$on(enums.busChatEvents.detailedChatSelected, function (event, data) {
                $scope.toggleNav();
                if (data && data.chatId) {
                    $scope.setSelectedChat(data.chatId);
                } else $scope.setSelectedChat(null);
            }));

            deregs.push($rootScope.$on(enums.busChatEvents.newMessage, function (event, data) {
                $scope.messages.push(data);
                chatService.clearUnreadBadgesForDialog($scope.chat.Chat_QBRoomId);
                $scope.$apply();
            }));

            deregs.push($rootScope.$on(enums.busChatEvents.selectPendingChat, function (event, data) {
                $scope.setSelectedChat(data.chatId, true);
            }));

            $scope.$on('$destroy', function () {
                while (deregs.length > 0) {
                    deregs.pop()();
                }
            });
        }
    };
}]);
'use strict';
angular.module('paladinApp').directive('chatListMessageItem', [function () {
    return {
        restrict: 'E',
        templateUrl: './views/templates/chatListMessageItem.tpl.html',
        scope: {
            myImage: '=?',
            recipientImage: '=?',
            message: '='
        },
        link: function link($scope, elem, attr) {}
    };
}]);
'use strict';
angular.module('paladinApp').directive('whenScrolled', function () {
    var threshold = 10;
    return function (scope, elm, attr) {
        var raw = elm[0];

        elm.bind('scroll', function () {
            if (Math.ceil(raw.scrollTop + raw.offsetHeight) >= raw.scrollHeight - threshold) {
                var t = setTimeout(function () {
                    scope.$apply(attr.whenScrolled);
                    clearTimeout(t);
                    t = null;
                }, 10);
            }
        });
    };
});
'use strict';
angular.module('paladinApp').directive('contactLenderOrBorrower', ['$rootScope', 'enums', 'appStateManager', function ($rootScope, enums, appStateManager) {
    return {
        restrict: 'E',
        templateUrl: './views/templates/contactLenderOrBorrower.tpl.html',
        scope: {
            isTitleHidden: '=?',
            isDescriptionHidden: '=?',
            product: '=?',
            productBookingDetails: '=?',
            booking: '=?'
        },
        link: function link($scope, elem, att) {
            $scope.isTitleHidden = $scope.isTitleHidden || false;
            $scope.isDescriptionHidden = $scope.isDescriptionHidden || false;

            $scope.displayedUser = {
                username: null,
                profilePic: null,
                id: null,
                stars: undefined,
                reviews: undefined
            };
            var init = function init() {
                var product = $scope.product || {};
                $scope.isMyProduct = product.Lender_UserId == appStateManager.getUserId();
                $scope.isCanStartChat = !$scope.isMyProduct || $scope.booking != null;
                $scope.titleText = $scope.isMyProduct ? 'CONTACT_BORROWER' : 'CONTACT_LENDER';

                if ($scope.isMyProduct) {
                    if ($scope.booking) {
                        // if null, can't start chat anyways, so directive will be hidden
                        $scope.displayedUser.username = $scope.booking.Borrower_Name;
                        $scope.displayedUser.profilePic = $scope.booking.Borrower_Image;
                        $scope.displayedUser.id = $scope.booking.Borrower_Id;
                        $scope.displayedUser.stars = $scope.booking.Borrower_ReviewScore;
                        $scope.displayedUser.reviews = $scope.booking.Borrower_ReviewCount;
                    } else {
                        $scope.isCanStartChat = false;
                    }
                } else {
                    if ($scope.product) {
                        $scope.displayedUser.username = product.Lender_FullName;
                        $scope.displayedUser.profilePic = product.Lender_User_DisplayPicturePath;
                        $scope.displayedUser.id = product.Lender_UserId;
                        $scope.displayedUser.stars = product.User_ReviewAsLender;
                        $scope.displayedUser.reviews = product.User_ReviewCountAsLender;
                    } else {
                        $scope.isCanStartChat = false;
                    }
                }
            };

            var deregs = [];
            deregs.push($scope.$watch('product', function () {
                init();
            }));

            deregs.push($scope.$watch('productBookingDetails', function () {
                init();
            }));

            deregs.push($scope.$watch('booking', function () {
                init();
            }));

            init();

            $scope.$on('$destroy', function () {
                while (deregs.length) {
                    deregs.pop()();
                }
            });
        }
    };
}]);
'use strict';
angular.module('paladinApp').directive('authedAction', ['$rootScope', 'enums', 'appStateManager', 'popupService', function ($rootScope, enums, appStateManager, popupService) {

    return {
        restrict: 'A',
        link: function link($scope, elem, attr) {

            var deAuthedLoginDiv = document.createElement('div');
            deAuthedLoginDiv.style.position = 'absolute';
            deAuthedLoginDiv.style.top = '0';
            deAuthedLoginDiv.style.left = '0';
            deAuthedLoginDiv.style.height = '100%';
            deAuthedLoginDiv.style.width = '100%';
            // deAuthedLoginDiv.style.backgroundColor = 'red';
            // deAuthedLoginDiv.style.opacity = '0.5';
            deAuthedLoginDiv.style.cursor = 'pointer';

            // deAuthedLoginDiv.style.zIndex = '200';
            deAuthedLoginDiv.onclick = function () {
                // deAuthedLoginDiv.style.zIndex = 'auto';
                popupService.showLoginSignupPopup(false).finally(function () {});
                isReloadPage = true;
            };

            elem[0].classList.add('forceRelativePosition');
            var isAdded = false;
            var isReloadPage = false;

            var validateAuth = function validateAuth() {
                if (appStateManager.getUserId()) {
                    if (isAdded) {
                        isAdded = false;
                        elem[0].removeChild(deAuthedLoginDiv);
                        if (isReloadPage) {
                            location.reload();
                        }
                    }
                } else {
                    if (!isAdded) {
                        isAdded = true;
                        elem[0].appendChild(deAuthedLoginDiv);
                    }
                }
            };

            validateAuth();

            var deregs = [];

            deregs.push($rootScope.$on(enums.busEvents.updatedUser, function (event, data) {
                validateAuth();
            }));

            $scope.$on('$destroy', function () {
                while (deregs.length) {
                    deregs.pop()();
                }
            });
        }
    };
}]);
'use strict';
angular.module('paladinApp').directive('focusMe', ['$timeout', function ($timeout) {
    return {
        restrict: 'A',
        link: function link($scope, elem, attr) {
            $timeout(function () {
                if (!elem[0].disabled) {
                    elem[0].focus();
                }
            }, 300);
        }
    };
}]);
angular.module('paladinApp').directive('copyTextToClipboard', ['$mdToast', function ($mdToast) {
    return {
        restrict: 'A',
        link: function link($scope, elem, attr) {

            // requires an element with an ID to be present on page
            // TODO: generalize for other uses

            $(elem).click(function () {

                var containerId = attr.copyTextToClipboard;

                if (document.selection) {
                    var range = document.body.createTextRange();
                    range.moveToElementText(document.getElementById(containerId));
                    range.select().createTextRange();
                    document.execCommand("copy");
                    $mdToast.showSimple('Text copied to clipboard');
                } else if (window.getSelection) {
                    var range = document.createRange();
                    range.selectNode(document.getElementById(containerId));
                    window.getSelection().addRange(range);
                    document.execCommand("copy");
                    console.info("text copied");
                    $mdToast.showSimple('Text copied to clipboard');
                }
            });
        }
    };
}]);

angular.module('paladinPopups').controller('confirmPopup', ['$scope', '$mdDialog', 'locals', function ($scope, $mdDialog, locals) {
    $scope.title = locals.title;
    $scope.message = locals.message;
    $scope.isConfirm = locals.isConfirm;
    if ($scope.isConfirm) {
        $scope.yesButton = locals.yesButton;
        $scope.noButton = locals.noButton;
    } else {
        $scope.okBtn = locals.okBtn || 'POPUP_OK';
    }

    $scope.closeDialog = function (isConfirm) {
        if (isConfirm) $mdDialog.hide();else $mdDialog.cancel();
    };
}]);
angular.module('paladinPopups').controller('loginSignUpPopup', ['$scope', '$rootScope', '$mdDialog', 'enums', 'apiService', '$translate', 'ptLog', 'appStateManager', 'popupService', '$timeout', 'locals', 'ptUtils', 'gtmService', 'referralsService', function ($scope, $rootScope, $mdDialog, enums, apiService, $translate, ptLog, appStateManager, popupService, $timeout, locals, ptUtils, gtmService, referralsService) {
    $scope.selectedTab = locals.selectedTab;
    $scope.currentLang = $translate.proposedLanguage() ? $translate.proposedLanguage() : $translate.preferredLanguage();
    if ($rootScope.currentLang) $scope.currentLang = $rootScope.currentLang;
    $scope.loginMessage = '';
    $scope.loginFacebookMessage = '';
    $scope.signupFacebookMessage = '';
    $scope.signupFacebookStatus = '';
    $scope.signupMessage = '';
    $scope.signupStatus = '';
    $scope.registerFacebookStatus = '';
    $scope.btnStatus = 10;
    $scope.isLoading = false;
    $scope.isFacebookApiLoaded = $rootScope.facebookApiLoaded;

    // if referralsService.referralCode is defined, it has alredy been validated
    var referralData = referralsService.getReferralData();
    var referralCode = referralData.code;

    $scope.promoMessage = referralsService.getReferralData().code ? $translate.instant('PROMO_MESSAGE_REGISTER_REFERRED', { ambassadorUserName: referralData.userName }) : window.globals.IS_PROMO ? $translate.instant('PROMO_MESSAGE_REGISTER_PROMO', { startDate: window.globals.START_DATE, endDate: window.globals.END_DATE, couponValue: window.globals.COUPON_VALUE }) : $translate.instant('PROMO_MESSAGE_REGISTER');

    $scope.register = function (username, password, email, location) {
        var currentLang = appStateManager.currentLang === 'it' ? 'it-IT' : appStateManager.currentLang;
        if (!ptUtils.regexPatterns.minMaxLength(6).test(password)) {
            $scope.signupStatus = 'error';
            $scope.signupMessage = 'SIGN_UP_ERROR_PASSWORD_RESTRICTION';
            return;
        }
        $scope.btnStatus = 1;

        apiService.users.signUp({
            email: email,
            username: username,
            password: password,
            location: location,
            currentLang: currentLang,
            referralCode: referralCode
        }).then(function (response) {
            $scope.btnStatus = 10;
            $scope.signupMessage = response.Message;
            $scope.signupStatus = response.Status;
            popupService.showAlert('ACTIVATION_EMAIL_SENT_TITLE', 'ACTIVATION_EMAIL_SENT_DESCR');
            ptLog.log(JSON.stringify(response));
            gtmService.trackEvent('registration', 'click-on-sign-up-button', 'email signup');
        }).catch(function (err) {
            $scope.btnStatus = 10;
            $scope.signupMessage = err.data.Message;
            $scope.signupStatus = err.data.Status;
            ptLog.error(JSON.stringify(err));
        });
    };

    $scope.login = function (username, password) {
        var currentLang = appStateManager.currentLang === 'it' ? 'it-IT' : appStateManager.currentLang;
        $scope.isLoading = true;
        var loginObj = { username: username, password: password, currentLang: currentLang };
        if (ptUtils.regexPatterns.email.test(username)) {
            //    username is actually email address, edit loginObj
            delete loginObj.username;
            loginObj.email = username;
        }
        apiService.users.login(loginObj).then(function (response) {
            $scope.isLoading = false;
            ptLog.log(JSON.stringify(response));
            $rootScope.$emit(enums.busEvents.userLogin, response.Data);
            $mdDialog.hide();
        }).catch(function (err) {
            $scope.isLoading = false;
            $scope.loginStatus = err.data.Status;
            $scope.loginMessage = err.data.Message;
            ptLog.error(JSON.stringify(err));
        });
    };

    $scope.registerFacebook = function () {
        if ($rootScope.facebookApiLoaded) {

            $scope.btnStatus = 1;

            apiService.users.signupFacebook({
                facebookName: $rootScope.facebook_user.name,
                email: $rootScope.facebook_user.email,
                address: $rootScope.facebook_user.address,
                currentLang: appStateManager.getCurrentLang(),
                facebookUserId: $rootScope.facebook_user.id,
                referralCode: referralCode
            }).then(function (response) {
                $scope.btnStatus = 10;
                $scope.signupFacebookStatus = response.Status;
                ptLog.log(JSON.stringify(response));
                $rootScope.$emit(enums.busEvents.userLogin, response.Data);
                $mdDialog.hide();
                //only track event if its the first facebook signup and not login
                if (response.Data.FbSignup && response.Data.FbSignup == true) {
                    gtmService.trackEvent('registration', 'click-on-facebook-signup', 'facebook signup');
                }
            }).catch(function (err) {
                $scope.btnStatus = 10;
                $scope.signupFacebookStatus = err.data.Status;
                $scope.signupFacebookMessage = err.data.Message;
            });
        } else {
            $scope.signupFacebookStatus = 'error';
            $scope.signupFacebookMessage = $translate.instant('FACEBOOK_LOADING');
            $timeout(function () {
                $scope.registerFacebook();
            }, 2000);
        }
    };

    $scope.cancel = function () {
        $mdDialog.hide();
    };

    $scope.showTabDialogForgotPassword = function () {
        popupService.showForgotPassword();
    };

    var deregs = [];

    deregs.push($rootScope.$on(enums.busEvents.facebookApiLoad), function (event, data) {
        // $scope.isFacebookApiLoaded = data.isLoaded;
    });

    $scope.$on('$destroy', function () {
        while (deregs.length) {
            deregs.pop()();
        }
    });

    // $scope.
}]);

angular.module('paladinPopups').controller('forgotPasswordPopup', ['$scope', '$rootScope', '$mdDialog', 'enums', 'apiService', '$translate', 'ptLog', 'appStateManager', function ($scope, $rootScope, $mdDialog, enums, apiService, $translate, ptLog, appStateManager) {
    $scope.forgotPasswordMessage = '';
    $scope.forgotpasswordStatus = '';
    $scope.btnForgotPasswordStatus = 10;

    $scope.forgotPassword = function (email) {
        $scope.btnForgotPasswordStatus = 1;

        apiService.users.forgotPassword({ email: email, currentLang: appStateManager.getCurrentLang() }).then(function (response) {
            $scope.btnForgotPasswordStatus = 10;
            $scope.forgotpasswordStatus = response.Status;
            $scope.forgotPasswordMessage = response.Message;
            ptLog.log(JSON.stringify(response));
        }).catch(function (err) {
            $scope.btnForgotPasswordStatus = 10;
            $scope.forgotpasswordStatus = err.data.Status;
            $scope.forgotPasswordMessage = err.data.Message;
            ptLog.error(JSON.stringify(err));
        });
    };

    $scope.cancel = function () {
        $mdDialog.cancel();
    };
}]);
'use strict';
angular.module('paladinPopups').controller('shareToSocialMediaPopup', ['$scope', '$mdDialog', 'locals', 'ptUtils', function ($scope, $mdDialog, locals, ptUtils) {
    $scope.referralLink = locals.referralLink;

    $scope.isMobile = ptUtils.isMobile.any();

    $scope.cancel = function () {
        $mdDialog.cancel();
    };
}]);

angular.module('paladinPopups').controller('idVerificationFailureHandlerPopup', ['$scope', '$mdDialog', '$translate', 'locals', function ($scope, $mdDialog, $translate, locals) {
    $scope.popupTitle = $translate.instant("ID_VERIFY_FAIL_POPUP_TITLE");
    $scope.isProcessing = false;
    $scope.isSuccess = true;
    $scope.message = locals.message; // already translated in userVerification controller

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    $scope.retry = function () {
        // close popup and clear form data
        locals.retryClb();
        $scope.cancel();
    };

    $scope.sendToManualVerification = function () {
        locals.sendToManualClb();
        $scope.cancel();
    };
}]);
angular.module('paladinPopups').controller('emailVerificationPopup', ['$scope', '$rootScope', '$mdDialog', 'enums', 'apiService', '$translate', 'ptLog', 'appStateManager', 'locals', function ($scope, $rootScope, $mdDialog, enums, apiService, $translate, ptLog, appStateManager, locals) {
    $scope.welcome_message_dialog = $translate.instant("WELCOME");
    $scope.isProcessing = true;
    $scope.isSuccess = true;
    $scope.message = $translate.instant('PLEASE_WAIT');

    $scope.hide = function () {
        $mdDialog.hide();
    };

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    $scope.answer = function (answer) {
        $mdDialog.hide(answer);
    };

    $scope.retry = function () {
        $scope.verifyUser();
    };

    $scope.verifyUser = function () {
        $scope.message = $translate.instant('PLEASE_WAIT');
        $scope.isProcessing = true;
        $scope.isSuccess = true;
        apiService.users.emailVerification({ userId: locals.userId }).then(function (response) {
            $scope.isProcessing = false;
            $scope.isSuccess = true;
            $scope.message = $translate.instant('REGISTRATION_SUCCESS');
            $rootScope.$emit(enums.busEvents.userLogin, response.Data);
        }).catch(function (err) {
            $scope.isProcessing = false;
            $scope.isSuccess = false;
            $scope.message = $translate.instant('REGISTRATION_ERROR');
        });
    };

    $scope.verifyUser();
}]);
angular.module('paladinPopups').controller('changePasswordPopup', ['$scope', '$mdDialog', 'locals', 'appStateManager', 'apiService', function ($scope, $mdDialog, locals, appStateManager, apiService) {

    $scope.isProcessing = false;
    $scope.statusError = null;
    $scope.changePassModel = {
        oldPassword: '',
        newPassword: '',
        newPasswordConfirmation: ''
    };

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    $scope.validator = function () {
        var isValid = true;
        if ($scope.changePassModel.oldPassword && $scope.changePassModel.newPassword && $scope.changePassModel.newPasswordConfirmation) {

            if ($scope.changePassModel.newPassword != $scope.changePassModel.newPasswordConfirmation) {
                isValid = false;
                $scope.statusError = 'PASSES_DONT_MATCH';
            }
        } else {
            $scope.statusError = 'FILL_ALL_FIELDS';
            isValid = false;
        }
        return isValid;
    };
    $scope.changePass = function () {
        $scope.statusError = null;
        if ($scope.validator()) {
            $scope.isProcessing = true;

            apiService.users.changePassword({
                newPassword: $scope.changePassModel.newPassword,
                oldPassword: $scope.changePassModel.oldPassword,
                userId: appStateManager.getUserId()
            }).then(function (response) {
                $mdDialog.hide();
            }).catch(function (err) {
                $scope.statusError = err.data.Message || 'DEFAULT_ERROR';
                $scope.isProcessing = false;
            });
        }
    };
}]);
'use strict';
angular.module('paladinPopups').controller('transactionStatusChangePopup', ['$scope', '$mdDialog', 'locals', function ($scope, $mdDialog, locals) {
    $scope.title = locals.title;
    $scope.apiMethod = locals.apiMethod;
    $scope.isLoading = true;

    $scope.runApiMethod = function () {
        $scope.apiMethod().then(function (res) {
            $mdDialog.hide(res);
        }).catch(function (err) {
            $mdDialog.cancel(err);
        });
    };

    $scope.runApiMethod();
}]);

'use strict';
angular.module('paladinPopups').controller('inputFieldPopup', ['$scope', '$mdDialog', 'locals', function ($scope, $mdDialog, locals) {
    $scope.isInvalid = false;
    $scope.message = locals.message;
    $scope.title = locals.title;
    $scope.inputRegexValidation = locals.inputRegexValidation;
    $scope.validationErrorMessage = locals.validationErrorMessage;
    $scope.inputField = { value: locals.value };
    $scope.closeDialog = function (isConfirm) {
        if (isConfirm) {
            if ($scope.inputRegexValidation && $scope.inputRegexValidation.test($scope.inputField.value)) $mdDialog.hide($scope.inputField);else $scope.isInvalid = true;
        } else {
            $mdDialog.cancel();
        }
    };
}]);

'use strict';
angular.module('paladinPopups').controller('loaderPopup', ['$rootScope', '$scope', function ($rootScope, $scope) {
    $scope.loadingText = undefined;
}]);
'use strict';
angular.module('paladinPopups').controller('bookingTrackerInfoMobilePopup', ['$scope', 'enums', 'ptUtils', 'locals', 'appStateManager', '$mdDialog', '$mdColors', function ($scope, enums, ptUtils, locals, appStateManager, $mdDialog, $mdColors) {

    $scope.userId = appStateManager.getUserId();
    $scope.isLender = $scope.userId == locals.booking.Lender_Id;
    $scope.isTryAndBuy = locals.booking.IsTryAndBuy;
    $scope.currentStatusId = locals.booking.BookingStatus[locals.booking.BookingStatus.length - 1].Status_TrackId;
    $scope.popupDescription = ptUtils.parseBookingStepTutorialHTMLTemplateForTranslationId(ptUtils.getTranslationIdForBookingStatus($scope.currentStatusId, $scope.isLender, $scope.isTryAndBuy));

    $scope.close = function () {
        return $mdDialog.hide();
    };

    var setTrackerDescriptionStyle = function setTrackerDescriptionStyle() {
        document.getElementById('bookingTrackerInfoMobilePopupId').parentNode.classList.add('md-dialog-booking-tracker-class');
        var bookingTrackerWrapperDiv = document.querySelector('#bookingTrackerInfoMobilePopupId div>div');
        bookingTrackerWrapperDiv.className = 'flex-100 layout-column layout-align-center-center';

        var titleSpan = document.querySelector('#bookingTrackerInfoMobilePopupId div>div>span');
        titleSpan.className = 'fontWeight450 font20pt md-padding';
        $mdColors.applyThemeColors(angular.element(titleSpan), { color: 'default-primary-A300' });

        var ol = document.querySelector('#bookingTrackerInfoMobilePopupId div>div>ol');
        ol.className = 'md-padding';

        var listItems = document.querySelectorAll('#bookingTrackerInfoMobilePopupId div>div>ol>li');

        listItems.forEach(function (item) {
            item.className = 'font12pt';
            $mdColors.applyThemeColors(angular.element(item), { color: 'default-primary-A400' });
        });
    };

    $scope.$$postDigest(function () {
        setTrackerDescriptionStyle();
    });
}]);

angular.module('paladinApp').controller('homeController', ['$scope', '$http', '$location', '$cookies', '$rootScope', '$sce', '$route', 'Filters', '$translate', 'ZendeskWidget', 'ngMeta', '$mdDialog', 'enums', '$state', '$stateParams', 'popupService', '$timeout', 'appStateManager', function ($scope, $http, $location, $cookies, $rootScope, $sce, $route, Filters, $translate, ZendeskWidget, ngMeta, $mdDialog, enums, $state, $stateParams, popupService, $timeout, appStateManager) {

    $scope.verificationMessage = "Processing ...";
    var geocoder = void 0;
    var cat = $stateParams.category;
    var categoryParam = cat && cat.toString().replace(/-/g, ' ') != $translate.instant('ACTG') ? cat : $translate.instant('ACTG');
    var subCategoryParam = $stateParams.subCategory ? $stateParams.subCategory : '';
    var initialSortBy = $state.params.sortBy || undefined;
    var pageIndex = $state.params.pageIndex || 1;

    var city = $stateParams.city || ($rootScope.filter || {}).glCity || undefined;

    var languageCode = $stateParams.languageCode;
    $rootScope.lang = languageCode;
    $translate.use(languageCode);

    ZendeskWidget.setLocale(languageCode);

    var scope = $scope;
    if ($state.params.search != undefined) {
        $rootScope.searchKey = $state.params.search;
    } else if ($location.search().search != undefined) {
        $rootScope.searchKey = $location.search().search;
    }
    if ($stateParams.isResetSearch) {
        $rootScope.searchKey = '';
    }

    $rootScope.isTryAndBuy = $stateParams.isTryAndBuy;

    function initCategories() {
        Filters.get('it', function (response) {
            $rootScope.categoriesMap.set('it', response.data.Data);
            Filters.get('en', function (response) {
                $rootScope.categoriesMap.set('en', response.data.Data);
                // Filters.get('de', function(response){
                //     $rootScope.categoriesMap.set('de', response.data.Data);
                scope.selectCategory();
                scope.findLatLong();
                // });
            });
        });
    }

    function updateHreflangTags() {
        updateHreflang("it");
        // updateHreflang("de");
        updateHreflang("en");
    }

    scope.filter = {
        categories: [],
        languageCode: languageCode,
        priceRange: [0, 1000],
        search: {
            lat: undefined,
            lng: undefined,
            searchStr: ''
        },
        currentPage: 1,
        distanceRange: city ? 10 : null,
        sortBy: enums.productsSortOptions.bestProduct,
        sortByCode: enums.productsSortByTextCode.SortByBestProduct,
        category: {
            defaultCategoryName: $translate.instant('ACTG'),
            defaultCategoryDesc: $translate.instant('ACTG'),
            selectedCategoryName: $translate.instant('ACTG'),
            isTryAndBuy: $rootScope.isTryAndBuy,
            selectedCategoryBannerImage: window.globals.IS_PROMO ? enums.categoriesBannersPaths.promo : enums.categoriesBannersPaths.all[languageCode],
            selectedSubCategoryName: null
        },
        gl: null, //google location object when location searched this will be accessible to all
        glString: '',
        glCity: ''
    };

    scope.prepareUrl = function () {
        var url = $rootScope.isTryAndBuy ? '/' + appStateManager.currentLang + '/categorie' : '/' + appStateManager.currentLang + '/categorie/privato';
        if (scope.filter.category.selectedCategoryName && scope.filter.category.selectedCategoryName.toString()) {
            url += '/' + scope.filter.category.selectedCategoryName.toString();
            if (scope.filter.category.selectedSubCategoryName && scope.filter.category.selectedSubCategoryName.toString()) {
                url += '/' + scope.filter.category.selectedSubCategoryName.toString();
                if (city) {
                    url += '/' + city;
                }
                //if(scope.filter.glCity){
                //	url +='/'+scope.filter.glCity;
                //}
            }
        }
        return url.split(' ').join('-');
    };

    scope.prepareQuery = function () {
        var obj = {};
        if (scope.filter.search.searchStr) {
            obj.search = scope.filter.search.searchStr;
        }
        if (scope.filter.sortBy) {
            obj.sortBy = scope.filter.sortBy;
        }
        if (scope.filter.currentPage) {
            obj.pageIndex = scope.filter.currentPage;
        }

        return obj;
    };

    function updateHreflang(lang) {
        var metaTag = enums.ngMetaValues.currentUrl(lang);
        if (lang == languageCode) {
            ngMeta.setTag(metaTag, $location.absUrl());
            return;
        }

        var url = '/' + lang + '/categorie/';
        if (scope.filter.category.selectedCategoryId == null) {
            url += enums.allCategories[lang].replace(/ /g, '-') + '/';
        } else {
            url += Filters.getCategoryById(scope.filter.category.selectedCategoryId, lang).Category_Name.replace(/ /g, '-');
        }

        if (scope.filter.category.selectedSubCategoryId && scope.filter.category.selectedSubCategoryId != null) {
            url += '/' + Filters.getSubcategoryById(scope.filter.category.selectedSubCategoryId, lang).SubCategory_Name.replace(/ /g, '-');

            if (city) {
                url += '/' + city;
            }
        }
        ngMeta.setTag(metaTag, $location.absUrl().split('/' + languageCode + '/')[0] + url);
    }

    //method needed to init the app. We will determine the location based on either
    //0. previous location stored (in rootscope)
    //1. city in url
    //2. GPS loc
    //3. Default loc
    function init() {

        //dont need to reload if $rootscope has already filter stored
        if (initialSortBy) {
            scope.filter.sortBy = initialSortBy;
            scope.filter.sortByCode = enums.productsSortByTextCode[initialSortBy];
            // scope.filter.search.searchStr = '';
            if ($stateParams.isResetSearch) {
                scope.filter.search.searchStr = $rootScope.searchKey;
                scope.filter.search.currentSearchStr = $rootScope.searchKey;
            }
        } else if ($rootScope.searchKey != undefined) {
            scope.filter.search.searchStr = $rootScope.searchKey;
            scope.filter.search.currentSearchStr = $rootScope.searchKey;
        }

        if (pageIndex) {
            scope.filter.currentPage = pageIndex;
        }

        if ($rootScope.filter) {
            //case where we press back button from product preview page or to breadcrumb
            scope.filter = $rootScope.filter; //!important for not loading again all data
            //dont need to reload if $rootscope has already filter stored
            if (initialSortBy) {
                scope.filter.sortBy = initialSortBy;
                scope.filter.sortByCode = enums.productsSortByTextCode[initialSortBy];

                if ($stateParams.isResetSearch) {
                    scope.filter.search.searchStr = '';
                    scope.filter.search.currentSearchStr = '';
                }
                // scope.filter.search.searchStr = '';
            } else if ($rootScope.searchKey != undefined) {
                scope.filter.search.searchStr = $rootScope.searchKey;
                scope.filter.search.currentSearchStr = $rootScope.searchKey;
            }
            registerUpdateUrlListener();
            scope.selectCategory();
            scope.findLatLong();
        } else {
            //case where we init/refresh website
            if (!$rootScope.categoriesMap) {
                $rootScope.categoriesMap = new Map();
                initCategories(languageCode);
            } else {

                scope.selectCategory();
                scope.findLatLong();
            }
        }

        scope.promoTimeout = $timeout(function () {
            if (appStateManager.user == null && !angular.element(document.body).hasClass('md-dialog-is-showing')) {
                popupService.showLoginSignupPopup(true);
            }
        }, window.globals.PROMO_SIGNUP_TIMER);
    }

    scope.findLatLong = function () {
        //location already defined
        if (scope.filter.glString) {
            scope.geocodeNow(null, null, scope.filter.glString);
        } else if (!city) {
            //asking for location access
            if (navigator.geolocation) {
                scope.geocodeNow(null, null, null);
                navigator.geolocation.getCurrentPosition(function (position) {
                    scope.geocodeNow(position.coords.latitude, position.coords.longitude, null);
                }, function () {
                    scope.geocodeNow(null, null, null);
                });
            } else {
                // Browser doesn't support Geolocation
                scope.geocodeNow(null, null, null);
            }
        } else {
            scope.geocodeNow(null, null, null);
        }
    };

    scope.geocodeNow = function (lat, lng, address) {
        var data = {};
        if (lat && lng) {
            data.location = {};
            data.location.lat = lat;
            data.location.lng = lng;
        } else if (address) {
            data.address = address;
        } else {
            if (languageCode == 'it' || languageCode == 'en') {
                data.address = 'milan italy';
            } else if (languageCode == 'de') {
                data.address = 'berlin germany';
            } else {
                data.address = 'berlin germany';
            }
        }

        geocoder = new google.maps.Geocoder();
        geocoder.geocode(data, function (results, status) {
            if (results && results.length > 0) {
                saveLocationToScope(results[0]);
            }

            $rootScope.$broadcast('filtersUpdated', scope.filter);
        });
    };

    function saveLocationToScope(place) {
        scope.filter.gl = place;
        scope.filter.search.lat = place.geometry.location.lat();
        scope.filter.search.lng = place.geometry.location.lng();
        scope.filter.glCity = getCity(place);
        scope.filter.glString = place.formatted_address;
    }

    function getCity(result) {
        var country = '',
            state = '',
            city = '';
        for (var i = 0; i < result.address_components.length; i++) {
            var types = result.address_components[i].types;
            for (var j = 0; j < types.length; j++) {
                var type = types[j];
                if (type == 'country' || type == "political") {
                    country = result.address_components[i].long_name;
                    break;
                } else if (type == 'administrative_area_level_1') {
                    state = result.address_components[i].long_name;
                    break;
                } else if (type == 'administrative_area_level_2' && !city || type == 'locality') {
                    city = result.address_components[i].long_name;
                    break;
                }
            }
        }
        return city;

        //var shortAddress = (city ? city+',':'' )+(state ? state+',':'' )+(country ? country:'' );
        //return shortAddress;
    }

    scope.selectCategory = function () {

        scope.filter.categories = $rootScope.categoriesMap.get(languageCode);

        var category = Filters.getCategoryByName(categoryParam, languageCode, $rootScope.isTryAndBuy);

        var tempCategory = scope.filter.category;
        if (category) {
            tempCategory.selectedCategoryId = category.Category_Id;
            tempCategory.selectedCategoryDesc = $sce.trustAsHtml(category.Category_Description);
            tempCategory.selectedCategoryName = category.Category_Name;
            tempCategory.selectedCategoryImagePath = category.Category_ImagePath;
            tempCategory.selectedCategoryBannerImage = category.Category_BannerPath;

            if (category.Category_SubCatrgories && category.Category_SubCatrgories.length > 0) {
                for (var i = 0; i < category.Category_SubCatrgories.length; i++) {
                    var subCategory = category.Category_SubCatrgories[i];

                    tempCategory.selectedSubCategoryId = undefined;
                    tempCategory.selectedSubCategoryDesc = undefined;
                    tempCategory.selectedSubCategoryName = undefined;
                    tempCategory.selectedSubCategoryImagePath = undefined;
                    tempCategory.selectedSubCategoryBannerImage = undefined;

                    if (subCategory.SubCategory_Name.toLowerCase().replace(/ /g, '-') == subCategoryParam.toLowerCase()) {
                        tempCategory.selectedSubCategoryId = subCategory.SubCategory_Id;
                        tempCategory.selectedSubCategoryDesc = $sce.trustAsHtml(subCategory.SubCategory_Description);
                        tempCategory.selectedSubCategoryName = subCategory.SubCategory_Name;
                        tempCategory.selectedSubCategoryImagePath = subCategory.SubCategory_ImagePath;
                        tempCategory.selectedSubCategoryBannerImage = subCategory.SubCategory_BannerPath;
                        break;
                    }
                }
            }
        } else {
            //all categories selected
            tempCategory.selectedCategoryId = null;
            tempCategory.selectedCategoryDesc = $sce.trustAsHtml(categoryParam);
            tempCategory.selectedCategoryName = $translate.instant('ACTG');
            tempCategory.selectedCategoryImagePath = null;
            tempCategory.selectedCategoryBannerImage = window.globals.IS_PROMO ? enums.categoriesBannersPaths.promo : enums.categoriesBannersPaths.all[languageCode];
            tempCategory.selectedSubCategoryId = undefined;
            tempCategory.selectedSubCategoryDesc = undefined;
            tempCategory.selectedSubCategoryName = undefined;
            tempCategory.selectedSubCategoryImagePath = undefined;
            tempCategory.selectedSubCategoryBannerImage = undefined;
            tempCategory.isTryAndBuy = $rootScope.isTryAndBuy;
        }
        scope.filter.category = tempCategory; // this is required because if we set only one param than immediately list directive will be loaded and fetch data ;


        //$rootScope.$broadcast('filtersUpdated',scope.filter);


        //when city is in url, we select distance "In the City (10km)"
        if (city) {
            var radius = {
                "l_id": 3,
                "distance": 10,
                "name": "IC"
            };
            $rootScope.$broadcast('distanceChanged', radius);
        }
        //listen to any filter changes in order to update url
        registerUpdateUrlListener();
    };

    var deregs = [];
    //here is where we start everything
    init();

    // var off = $scope.$on('$stateChangeStart', function(e) {
    //     e.preventDefault();
    //     off();
    // });

    deregs.push($rootScope.$on(enums.busEvents.googlePlacesAutocompletePlaceChanged, function (events, args) {
        if (args && args.place && (args.elementId == 'search-location-bar-desktop' || args.elementId == 'search-location-bar-mobile')) {
            saveLocationToScope(args.place);
            city = null;
            $rootScope.$broadcast('filtersUpdated', scope.filter);
        }
    }));

    deregs.push(scope.$on('languageChanged', function (event, data) {
        scope.filter.languageCode = data;
        ZendeskWidget.setLocale(data);
    }));

    function registerUpdateUrlListener() {
        //listen to any filter changes in order to update url
        deregs.push(scope.$watchGroup(['filter.languageCode', 'filter.sortBy', 'filter.currentPage', 'filter.category.selectedCategoryName', 'filter.category.selectedSubCategoryName', 'search.lat', 'search.lng'], function (value) {
            if (value) {
                $rootScope.filter = scope.filter;
                $location.search(scope.prepareQuery());
                $location.update_path(scope.prepareUrl(), false);
                // $scope
                updateHreflangTags();
            }
        }));
    }

    $scope.$on('$destroy', function () {

        while (deregs.length) {
            deregs.pop()();
        }

        $timeout.cancel(scope.promoTimeout);
    });
}]);

angular.module('paladinApp').directive('googleplaceAutocomplete', ['$rootScope', 'enums', function ($rootScope, enums) {
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            googleplaceAutocompletePlace: '=?',
            googleplaceAutocomplete: '='
        },
        link: function postLink(scope, element, attrs, model) {
            var options = scope.googleplaceAutocomplete || {};
            options.placeholder = '';
            options.componentRestrictions = { country: 'it' };
            var autocomplete = new google.maps.places.Autocomplete(element[0], options);
            delete element[0].placeholder;
            google.maps.event.addListener(autocomplete, 'place_changed', function () {
                delete element[0].placeholder;
                scope.$apply(function () {
                    scope.googleplaceAutocompletePlace = autocomplete.getPlace();
                    model.$setViewValue(element.val());
                    $rootScope.$emit(enums.busEvents.googlePlacesAutocompletePlaceChanged, {
                        place: scope.googleplaceAutocompletePlace,
                        elementId: element[0].attributes.id.nodeValue
                    });
                });
            });

            scope.$on('$destroy', function () {
                google.maps.event.clearInstanceListeners(element[0]);
            });
        }
    };
}]);
angular.module('paladinApp').controller('homeV2Controller', ['$rootScope', '$scope', 'enums', 'apiService', 'appStateManager', '$mdToast', '$translate', 'popupService', 'ngMeta', '$timeout', 'referralsService', 'validReferralCode', function ($rootScope, $scope, enums, apiService, appStateManager, $mdToast, $translate, popupService, ngMeta, $timeout, referralsService, validReferralCode // from resolve
) {
    $scope.isLoading = true;

    $scope.isPromo = window.globals.IS_PROMO;

    $scope.lendTutorial = {
        title: $translate.instant('MAKE_MONEY'),
        description: 'ITEMS_ARE_INSURED',
        // imgUrl: 'https://picsum.photos/400/250/?random',
        imgUrl: '/assets/lend_tutorial_image.png',
        steps: ['UPLOAD_AN_ITEM', 'WAIT_FOR_REQUEST', 'LEND_YOUR_ITEM']
    };

    $scope.borrowTutorial = {
        title: $translate.instant('SAVE_MONEY'),
        description: 'ITEMS_ARE_INSURED',
        // imgUrl: 'https://picsum.photos/400/250/?random',
        imgUrl: '/assets/browse-banner-hp.jpg',
        steps: ['FIND_THE_ITEM', 'MAKE_A_REQUEST', 'PICK_UP_OR_DELIVER']
    };

    $scope.promoFixCoupon1 = {
        title: $translate.instant('PROMO_TITLE_1'),
        description: $translate.instant('OFERTA_VALIDA', { couponValue: window.globals.COUPON_VALUE }),
        // imgUrl: 'https://picsum.photos/400/250/?random',
        imgUrl: '/assets/promo1.jpg',
        steps: ['STEP1', $translate.instant('STEP2', { couponCode: window.globals.COUPON_CODE }), 'STEP3']
    };
    $scope.promoFixCoupon2 = {
        title: $translate.instant('PROMO_TITLE_2'),
        description: $translate.instant('OFERTA_VALIDA', { couponValue: window.globals.COUPON_VALUE }),
        // imgUrl: 'https://picsum.photos/400/250/?random',
        imgUrl: '/assets/promo2.jpg',
        steps: ['STEP1', $translate.instant('STEP2', { couponCode: window.globals.COUPON_CODE }), 'STEP3']
    };

    $scope.productTeasers = {
        tryAndBuy: {
            description: 'TRY_AND_BUY_INFO',
            link: 'https://paladintrue.com/' + appStateManager.currentLang + '/' + window.globals.SUPPORTED_LANGS.find(function (lang) {
                return appStateManager.currentLang == lang.code;
            }).tryAndBuyWordPressPath + '/'
        },
        homeAppliance: {
            categoryId: enums.categoriesIds.homeAppliance
        },
        smartMobility: {
            categoryId: enums.categoriesIds.smartMobility
        },
        hiTech: {
            categoryId: enums.categoriesIds.hiTech
        },
        outdoor: {
            categoryId: enums.categoriesIds.outdoor
        }
    };

    $scope.takingAboutUsImages = [{
        img: "assets/talkingAboutUs/nuvola_testata-black-white_squared.jpg",
        link: 'http://nuvola.corriere.it/2017/04/26/paladin-lapp-di-noleggio-di-oggetti-tra-privati/'
    }, {
        img: 'assets/talkingAboutUs/corriere-sera-square-1.jpg',
        link: 'http://www.corriere.it/tecnologia/app-software/17_aprile_27/paladin-l-app-mettere-noleggio-oggetti-che-non-usiamo-750154f0-2b76-11e7-9442-4fba01914cee.shtml'
    }, {
        img: "assets/talkingAboutUs/deejay_Logo-black-white.jpg",
        link: 'https://www.deejay.it/audio/20170430-4/520066/'
    }, {
        img: "assets/talkingAboutUs/green-me-black-white.jpg",
        link: 'https://www.greenme.it/tecno/cellulari/23899-paladin-app-affitto-oggetti'
    }, {
        img: 'assets/talkingAboutUs/webnews-black-white.jpg',
        link: 'http://www.webnews.it/2017/05/05/paladin-sharing-applicazione-economia-startup/'
    }, {
        img: 'assets/talkingAboutUs/logo-lifegate-radio-black-white.jpeg',
        link: 'https://www.lifegate.it/radio-sound'
    }, {
        img: 'assets/talkingAboutUs/logo-radio-popolare-black-white.jpeg',
        link: 'http://www.radiopopolare.it/podcast/pionieri-di-lun-2310/'
    }, {
        img: 'assets/talkingAboutUs/green-planner-black-white.jpeg',
        link: 'https://www.greenplanner.it/2017/10/10/paladin-noleggio-strumenti/'
    }, {
        img: 'assets/talkingAboutUs/logo-Rai3-black-white.jpeg',
        link: 'http://www.rai.it/rai3/'
    }];

    $scope.getHomePageData = function () {
        $scope.isLoading = true;
        apiService.pages.getHomePageData([$scope.productTeasers.hiTech.categoryId, $scope.productTeasers.smartMobility.categoryId, $scope.productTeasers.homeAppliance.categoryId, $scope.productTeasers.outdoor.categoryId]).then(function (response) {
            $scope.isLoading = false;
            $scope.data = response.Data;
        }).catch(function (err) {
            $scope.isLoading = false;
            $scope.data = {};
        });
    };

    $scope.getCategoryName = function (categoryId) {
        var category = $scope.data.Categories.find(function (item) {
            return item.CategoryId == categoryId;
        });
        if (category) return category.CategoryName;
    };

    $scope.getProductList = function (categoryId, isTryAndBuy) {
        if (categoryId == 0) {
            return isTryAndBuy ? $scope.data.TryAndBuyProducts : $scope.data.P2PProducts;
        }

        var category = $scope.data.Categories.find(function (item) {
            return item.CategoryId == categoryId;
        });
        if (category) return category.ProductList;
    };

    $scope.getPopularTryAndBuy = function () {
        $scope.isLoading = true;
        apiService.products.getPopularTryAndBuy().then(function (response) {
            $scope.isLoading = false;
            $scope.tryAndBuy = response.Data;
        }).catch(function (err) {
            $scope.isLoading = false;
            $scope.tryAndBuy = [];
        });
    };
    $scope.getHomePageData();

    // $scope.getPopularTryAndBuy();

    ngMeta.setTitle($translate.instant('HOME_TITLE'));
    ngMeta.setTag('description', $translate.instant('DEFAULT_META_DESC'));
    ngMeta.setTag('imagePath', '../../assets/paladin-logo-300x300.png');

    $scope.promoTimeout = $timeout(function () {
        if (!$scope.isCrawler()) {
            if (appStateManager.user == null && !angular.element(document.body).hasClass('md-dialog-is-showing')) {
                popupService.showLoginSignupPopup(true);
            }
        }
    }, referralsService.referralCode ? 0 : window.globals.PROMO_SIGNUP_TIMER);

    $scope.isCrawler = function () {

        return (/bot|prerender|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent)
        );
    };
    $scope.$on('$destroy', function () {

        // while (deregs.length)
        //     deregs.pop()();

        $timeout.cancel($scope.promoTimeout);
    });

    $scope.showToast = function (message) {
        var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3000;

        $mdToast.show($mdToast.simple().textContent(message).hideDelay(delay));
    };
}]);

// angular.module('productPreview', ['resources.products', 'resources.filters','directives.header','directives.footer','resources.constants',
//     'uiGmapgoogle-maps','ui.bootstrap','ngMeta','ngMap','pascalprecht.translate','angularReverseGeocode'])
//
//     .config(['$routeProvider', function ($routeProvider,GoogleMapApi) {
//
//         $routeProvider.when('/:languageCode/product/:productId', {
//             templateUrl:'/script/productPreview/productPreview.tpl.html',
//             reloadOnSearch: false,
//             controller:'PreviewController'
//         }).when('/product/:productId', {
//             templateUrl:'/script/productPreview/productPreview.tpl.html',
//             reloadOnSearch: false,
//             controller:'PreviewController'
//         });
//
//
//     }])

angular.module('paladinApp').controller('PreviewController', ['$scope', '$sce', '$window', '$rootScope', '$translate', '$stateParams', '$location', 'Products', 'ngMeta', '$filter', '$anchorScroll', 'ZendeskWidget', 'Filters', 'enums', function ($scope, $sce, $window, $rootScope, $translate, $stateParams, $location, Products, ngMeta, NgMap, $anchorScroll, ZendeskWidget, Filters, enums) {

    var scope = $scope;

    scope.getCurrentLanguageCode = function () {
        return $translate.proposedLanguage() ? $translate.proposedLanguage() : $translate.preferredLanguage();
    };
    //Lender rating
    scope.rating = 0;
    scope.ratingRounded = 0;
    //Profile default image path
    scope.profileDefaultImage = "../../assets/profile.png";

    //console.log('ROOT SCOPE : ')
    //console.log($routeParams);

    var product_id = $stateParams.productId.split('-')[$stateParams.productId.split('-').length - 1];
    var languageCode = $stateParams.languageCode ? $stateParams.languageCode : scope.getCurrentLanguageCode();
    updateHreflang();
    //updating language code globally if user comes directly to this page
    $translate.use(languageCode);
    $rootScope.lang = languageCode;
    ZendeskWidget.setLocale(languageCode);
    $rootScope.$broadcast('updateLanguage', languageCode);

    var searchedLocation = $rootScope.searchedLocation; // $location.search().searchedLocation;

    scope.allCategory = $translate.instant('ACTG');
    if (scope.allCategory == scope.selectedCategoryName) scope.selectedCategoryName = null;

    //console.log( scope.selectedCategoryName)
    //console.log(scope.allCategory)
    //console.log(scope.allCategory == scope.selectedCategoryName);

    scope.selectedSubCategoryName = $rootScope.subcategory; //$location.search().subcategory?$location.search().subcategory.replace(/-/g, ' '):null;

    scope.productDetail = {};
    scope.productImageBaseUrl = window.globals.PRODUCT_IMAGE_URL;
    scope.userImageBaseUrl = window.globals.PROFILE_IMAGE_URL;
    scope.rentNowUrl = window.globals.RENT_NOW_URL;
    scope.h1 = '';
    scope.h2 = '';
    scope.productAddress = '';
    scope.sample = 1;

    function updateBreadcrumb() {
        if (scope.productDetail.Product_CategoryId) {
            scope.selectedCategoryName = Filters.getCategoryById(scope.productDetail.Product_CategoryId, languageCode).Category_Name;
        }

        if (scope.productDetail.Product_SubCategoryId) {
            scope.selectedSubCategoryName = Filters.getSubcategoryById(scope.productDetail.Product_SubCategoryId, languageCode).SubCategory_Name;
        }
    }

    scope.fetchProductAddress = function () {
        var data = {};

        data.location = {};
        //console.log(scope.productDetail.Product_Latitude);
        data.location.lat = Number(scope.productDetail.Product_Latitude);
        data.location.lng = Number(scope.productDetail.Product_Longitude);

        geocoder = new google.maps.Geocoder();
        var _scope = scope;
        geocoder.geocode(data, function (results, status) {
            if (results && results.length > 0) {
                scope.productLocation = results[0];
                scope.setProductAddress(results[0]);
            }
        });
    };

    scope.setProductAddress = function (loc) {
        $scope.productDetail.productAddress = loc.formatted_address;
        scope.sample = 2;
        scope.productLocation = loc;
        //console.log('SETTING ADD : '+$scope.productDetail.productAddress);
        scope.updateMetaTags();
        $scope.$apply();
    };

    scope.getCity = function (result) {
        var country = '',
            state = '',
            city = '';
        for (var i = 0; i < result.address_components.length; i++) {
            var types = result.address_components[i].types;
            for (var j = 0; j < types.length; j++) {
                var type = types[j];
                if (type == 'country' || type == "political") {
                    country = result.address_components[i].long_name;
                    break;
                } else if (type == 'administrative_area_level_1') {
                    state = result.address_components[i].long_name;
                    break;
                } else if (type == 'administrative_area_level_2' && !city || type == 'locality') {
                    city = result.address_components[i].long_name;
                    break;
                }
            }
        }
        return city;

        //var shortAddress = (city ? city+',':'' )+(state ? state+',':'' )+(country ? country:'' );
        //return shortAddress;
    };

    scope.$on('languageChanged', function (event, data) {
        $location.update_path($location.path().replace('/' + languageCode + '/', '/' + data + '/'), true);
        languageCode = data;
        scope.refreshProductDetail();
        ZendeskWidget.setLocale(languageCode);
        updateBreadcrumb();
    });
    scope.getPageTitle = function () {
        var title = $translate.instant('RENT') + ' ';

        //console.log('meta tag :')
        //console.log(scope.selectedCategoryName);

        if (scope.selectedCategoryName && !scope.selectedSubCategoryName) {
            title += scope.selectedCategoryName + ' ';
        } else if (scope.selectedSubCategoryName) {
            title += scope.selectedSubCategoryName + ' ';
        }

        if (scope.productDetail && scope.productDetail.Product_Title) {
            title += scope.productDetail.Product_Title + '  ';
        }

        if (scope.productLocation) {
            title += $translate.instant('IN') + ' ' + scope.getCity(scope.productLocation);
        }

        return title;
    };

    scope.getMetaTags = function () {
        var tag = $translate.instant('RENT') + ' ';

        if (scope.selectedCategoryName) {
            tag += scope.selectedCategoryName + ' ';
        }
        if (scope.selectedSubCategoryName) {
            tag += scope.selectedSubCategoryName + ' ';
        }

        if (scope.productDetail && scope.productDetail.Product_Title) {
            tag += scope.productDetail.Product_Title + '  ';
        }

        if (scope.productLocation) {
            tag += $translate.instant('IN') + ' ' + scope.getCity(scope.productLocation);
        }
        return tag;
    };

    scope.updateH1 = function () {
        scope.h1 = $translate.instant('RENT') + ' ';

        /*
        if(scope.selectedCategoryName && !scope.selectedSubCategoryName){
          scope.h1 += capitalizeFilter(scope.selectedCategoryName)+ ' ';
        }else if(scope.selectedSubCategoryName){
          scope.h1 += capitalizeFilter(scope.selectedSubCategoryName) + ' ';
        }
        */

        if (scope.productDetail && scope.productDetail.Product_Title) {
            scope.h1 += '<span class="greenText">' + scope.productDetail.Product_Title + '</span> ';
        }

        if (scope.productLocation) {
            scope.h1 += $translate.instant('IN') + ' ' + scope.getCity(scope.productLocation);
        }

        //console.log('setting h1 = '+scope.h1)
        scope.h1 = $sce.trustAsHtml(scope.h1);
    };

    scope.updateH2 = function () {
        scope.h2 = scope.getPageTitle();
    };

    scope.updateMetaTags = function () {
        if (scope.productDetail) {

            ngMeta.setTitle(scope.getPageTitle());
            ngMeta.setTag('description', scope.getMetaTags());
            ngMeta.setTag('imagePath', window.globals.PRODUCT_IMAGE_URL + scope.productDetail.ProductImage_Image1);

            scope.updateH1();

            scrollToH1();
            //scope.updateH2();
        }
    };
    scope.refreshProductDetail = function () {
        //console.log('PRODUCT ID IS : '+product_id);

        if (product_id) {
            Products.getDetail(product_id, languageCode, function (response) {
                scope.productDetail = response.data.Data;
                scope.rating = scope.productDetail.User_ReviewAsLender > 0 ? parseFloat(scope.productDetail.User_ReviewAsLender / 2).toFixed(1) : 0;
                scope.ratingRounded = Math.round(scope.rating);
                scope.fetchProductAddress();

                if (!$rootScope.categoriesMap) {
                    $rootScope.categoriesMap = new Map();
                    Filters.get('it', function (response) {
                        $rootScope.categoriesMap.set('it', response.data.Data);
                        Filters.get('en', function (response) {
                            $rootScope.categoriesMap.set('en', response.data.Data);
                            Filters.get('de', function (response) {
                                $rootScope.categoriesMap.set('de', response.data.Data);
                                updateBreadcrumb();
                                scope.updateMetaTags();
                            });
                        });
                    });
                } else {
                    updateBreadcrumb();
                }
            });
        }
    };

    scope.goToAllCategory = function () {
        if ($rootScope.filter) {
            $rootScope.filter.category.selectedCategoryId = null;
            $rootScope.filter.category.selectedCategoryDesc = null;
            $rootScope.filter.category.selectedCategoryName = $translate.instant('ACTG');
            $rootScope.filter.category.selectedCategoryImagePath = null;
            $rootScope.filter.category.selectedCategoryBannerImage = enums.categoriesBannersPaths.all;

            $rootScope.filter.category.selectedSubCategoryId = null;
            $rootScope.filter.category.selectedSubCategoryDesc = null;
            $rootScope.filter.category.selectedSubCategoryName = null;
            $rootScope.filter.category.selectedSubCategoryImagePath = null;
            $rootScope.filter.category.selectedSubCategoryBannerImage = null;

            $rootScope.filter.currentPage = 1;
        }

        $location.search('key', null);
        $location.url('/' + languageCode + '/' + $translate.instant('ACTG').replace(/ /g, '-'));
    };

    scope.goToCategory = function () {

        if ($rootScope.filter) {
            var category = Filters.getCategoryById(scope.productDetail.Product_CategoryId, languageCode);
            $rootScope.filter.category.selectedCategoryId = scope.productDetail.Product_CategoryId;
            $rootScope.filter.category.selectedCategoryDesc = $sce.trustAsHtml(category.Category_Description);
            $rootScope.filter.category.selectedCategoryName = category.Category_Name;
            $rootScope.filter.category.selectedCategoryImagePath = category.Category_ImagePath;
            $rootScope.filter.category.selectedCategoryBannerImage = category.Category_BannerPath;

            $rootScope.filter.category.selectedSubCategoryId = null;
            $rootScope.filter.category.selectedSubCategoryDesc = null;
            $rootScope.filter.category.selectedSubCategoryName = null;
            $rootScope.filter.category.selectedSubCategoryImagePath = null;
            $rootScope.filter.category.selectedSubCategoryBannerImage = null;

            $rootScope.filter.currentPage = 1;
        }

        $location.search('key', null);
        //$location.url('/'+languageCode+'/'+scope.selectedCategoryName);
        $location.url('/' + languageCode + '/' + scope.selectedCategoryName.replace(/ /g, '-'));
    };

    scope.goToSubCategory = function () {
        if ($rootScope.filter) {
            var category = Filters.getCategoryById(scope.productDetail.Product_CategoryId, languageCode);
            $rootScope.filter.category.selectedCategoryId = scope.productDetail.Product_CategoryId;
            $rootScope.filter.category.selectedCategoryDesc = $sce.trustAsHtml(category.Category_Description);
            $rootScope.filter.category.selectedCategoryName = category.Category_Name;
            $rootScope.filter.category.selectedCategoryImagePath = category.Category_ImagePath;
            $rootScope.filter.category.selectedCategoryBannerImage = category.Category_BannerPath;

            var subCategory = Filters.getSubcategoryById(scope.productDetail.Product_SubCategoryId, languageCode);
            $rootScope.filter.category.selectedSubCategoryId = scope.productDetail.Product_SubCategoryId;
            $rootScope.filter.category.selectedSubCategoryDesc = $sce.trustAsHtml(subCategory.SubCategory_Description);
            $rootScope.filter.category.selectedSubCategoryName = subCategory.SubCategory_Name;
            $rootScope.filter.category.selectedSubCategoryImagePath = subCategory.SubCategory_ImagePath;
            $rootScope.filter.category.selectedSubCategoryBannerImage = subCategory.SubCategory_BannerPath;

            $rootScope.filter.currentPage = 1;
        }
        $location.search('key', null);
        $location.url('/' + languageCode + '/' + scope.selectedCategoryName.replace(/ /g, '-') + '/' + scope.selectedSubCategoryName.replace(/ /g, '-'));
        //$window.history.back();
    };

    function updateHreflang() {
        ngMeta.setTag('currentUrl_en', $location.absUrl().replace('/' + languageCode + '/', '/en/'));
        ngMeta.setTag('currentUrl_it', $location.absUrl().replace('/' + languageCode + '/', '/it/'));
        ngMeta.setTag('currentUrl_de', $location.absUrl().replace('/' + languageCode + '/', '/de/'));
    }

    scope.go = function (path) {
        $location.$$search = {};
        $location.path(path);
    };

    scope.rentNow = function () {
        var url = scope.rentNowUrl.replace('{0}', languageCode).replace('{1}', scope.productDetail.Product_Id);

        $window.location.href = url;
    };

    scope.rentNowDesktop = function () {
        $window.location.href = $translate.instant('URL_DOWNLOAD');
    };

    var scrollToH1 = function scrollToH1() {
        //scroll preview page up at startup
        var oldAnchor = $location.hash();
        $location.hash("breadcrumb-pr-detail");
        $anchorScroll();
        $location.hash(oldAnchor);
    };

    scope.refreshProductDetail();
    /*
       $scope.$on('$routeChangeSuccess', function () {
        scrollToH1();
      });
      */
}]);

angular.module('paladinApp').controller('productDetailedController', ['$rootScope', '$scope', 'enums', 'apiService', '$stateParams', 'toastService', 'appStateManager', 'dataService', '$sce', 'NgMap', 'popupService', '$timeout', 'moment', 'ngMeta', '$translate', 'ptUtils', '$anchorScroll', '$location', 'referralsService', function ($rootScope, $scope, enums, apiService, $stateParams, toastService, appStateManager, dataService, $sce, NgMap, popupService, $timeout, moment, ngMeta, $translate, ptUtils, $anchorScroll, $location, referralsService) {
    $scope.isLoading = false;
    if ($stateParams.productNameAndId) {
        $scope.productId = $stateParams.productNameAndId.split('-')[$stateParams.productNameAndId.split('-').length - 1];
    }
    $scope.category = null;
    $scope.subCategory = null;
    $scope.rentPickersIds = {
        mobile: 'rental-request-picker-mobile',
        desktop: 'rental-request-picker-desktop'
    };
    $scope.productAddress = {
        address: undefined,
        lat: undefined,
        lng: undefined

    };
    $scope.productBookingDetails = null;

    $scope.isLoggedInUser = function () {
        return appStateManager.getUserId();
    };
    $scope.updateMetaTags = function () {
        if ($scope.product) {

            ngMeta.setTitle($scope.getPageTitle());
            ngMeta.setTag('description', $scope.getPageTitle());
            ngMeta.setTag('imagePath', window.globals.PRODUCT_IMAGE_URL + $scope.product.ProductImage_Image1);
        }
    };

    $scope.getPageTitle = function () {
        var title = $translate.instant('RENT') + ' ';

        // if($scope.category && !$scope.subCategory) {
        //     title +=$scope.category.Category_Name + ' ';
        // }else if($scope.subCategory){
        //     title += $scope.subCategory.SubCategory_Name + ' ';
        // }

        if ($scope.product && $scope.product.Product_Title) {
            title += $scope.product.Product_Title + '  ';
        }

        // if(scope.productLocation){
        //     title += $translate.instant('IN')+' '+scope.getCity(scope.productLocation);
        // }

        return title + "| Paladintrue";
    };

    $scope.fetchDetailedProduct = function () {
        $scope.isLoading = true;
        apiService.products.getDetailedProduct($scope.productId).then(function (response) {
            $scope.product = response.Data;
            $scope.isMyProduct = $scope.product.Lender_UserId == appStateManager.getUserId();
            $scope.product.Product_Description = $sce.trustAsHtml($scope.product.Product_Description);

            ptUtils.extractAndGeoLocateAddressFromObjectForFieldNames({
                object: $scope.product,
                addressFieldName: 'Product_Address',
                latFieldName: 'Product_Latitude',
                lngFieldName: 'Product_Longitude'
            }).then(function (location) {
                $scope.productAddress = location;
            });

            if (appStateManager.getUserId()) {
                $scope.fetchBookingDetails();
            }

            $scope.getCategory();
            $scope.updateMetaTags();
            $scope.isLoading = false;
        }).catch(function (err) {
            $scope.isLoading = false;
            toastService.simpleToast(JSON.stringify(err));
            console.error(err);
        });
    };
    $scope.fetchBookingDetails = function () {
        apiService.products.getProductBookingDetails({
            productId: $scope.product.Product_Id,
            userId: appStateManager.getUserId()
        }).then(function (response) {
            $scope.productBookingDetails = response.Data;
            $scope.isLoading = false;
        }).catch(function (err) {
            $scope.isLoading = false;
            console.error(err);
        });
    };

    $scope.getCategory = function () {
        if (!appStateManager.categoriesDict) {
            return dataService.getCategories();
        }
        if ($scope.product) {
            $scope.category = appStateManager.categoriesDict[$scope.product.Product_CategoryId];
            if ($scope.category && $scope.product.Product_SubCategoryId > 0) {
                var subCat = $scope.category.Category_SubCatrgories.find(function (subCat) {
                    return subCat.SubCategory_Id == $scope.product.Product_SubCategoryId;
                });
                if (subCat) $scope.subCategory = subCat;
            }
        }
    };

    $scope.requestRentalDates = function () {
        popupService.showDateRangePicker($scope.productBookingDetails, $scope.product).then(function (data) {
            var startDate = moment(data.dateStart);
            var endDate = moment(data.dateEnd);
            var days = ptUtils.getRentalPeriodInDays({
                startRentDate: data.dateStart,
                endRentDate: data.dateEnd
            });
            if ($scope.product.MinRentalPeriod > 0 && days < $scope.product.MinRentalPeriod) {
                return popupService.showAlert('OOPS', $translate.instant('INVALID_MIN_RENTAL_PERIOD', { days: $scope.product.MinRentalPeriod })).finally(function () {
                    $scope.requestRentalDates();
                });
            }

            $scope.onRequestRent({
                startDate: startDate,
                endDate: endDate
            });
        });
    };

    $scope.onRequestRent = function (_ref54) {
        var startDate = _ref54.startDate,
            endDate = _ref54.endDate,
            componentId = _ref54.componentId;

        if (startDate && endDate) {
            $rootScope.$emit(enums.busNavigation.paymentDetailed, {
                startDate: startDate,
                endDate: endDate,
                productId: $scope.productId
            });
        }
        // toastService.simpleToast(`Rental request not implemented yet, startDate: ${moment(startDate).format('DD/MM/YY')} endDate ${moment(endDate).format('DD/MM/YY')}`);
    };

    $scope.onDatesUpdated = function (_ref55) {
        var startDate = _ref55.startDate,
            endDate = _ref55.endDate,
            componentId = _ref55.componentId;

        var compToUpdate = componentId == $scope.rentPickersIds.desktop ? $scope.rentPickersIds.mobile : $scope.rentPickersIds.desktop;
        $rootScope.$emit(enums.busEvents.rentalRequestPickerUpdateDates, { startDate: startDate, endDate: endDate, componentId: compToUpdate });
    };

    $scope.browseCategory = function (cat, subCat) {
        $rootScope.$emit(enums.busNavigation.browseCategory, { categoryName: cat, subCategoryName: subCat });
    };

    $scope.getCategoriesUrl = function (cat, subCat) {

        return ptUtils.getCategoriesUrl(cat, subCat, $scope.product.Product_TryAndBuy, $translate.use());
    };

    $scope.onStartEndDateSelected = function (_ref56) {
        var startDate = _ref56.startDate,
            endDate = _ref56.endDate;
    };

    var deregs = [];
    deregs.push($rootScope.$on(enums.busEvents.categoriesUpdate, function (event, data) {
        $scope.getCategory();
    }));

    // deregs.push($scope.$on('$viewContentLoaded', function() {
    // }));

    $scope.fetchDetailedProduct();

    $scope.promoTimeout = $timeout(function () {
        if (!ptUtils.isCrawler()) {
            if (appStateManager.user == null && !angular.element(document.body).hasClass('md-dialog-is-showing')) {
                popupService.showLoginSignupPopup(true);
            }
        }
    }, referralsService.referralCode ? 0 : window.globals.PROMO_SIGNUP_TIMER);

    $scope.$on('$destroy', function () {
        while (deregs.length) {
            deregs.pop()();
        }
        $timeout.cancel($scope.promoTimeout);
    });

    //scroll to top (workaround)
    var oldAnchor = $location.hash();
    $location.hash("main-product-image");
    $anchorScroll();
    $location.hash(oldAnchor);
}]);
angular.module('paladinApp').controller('appController', ['$scope', '$rootScope', 'ZendeskWidget', 'enums', 'ptLog', 'appStateManager', 'dataService', '$state', '$location', '$mdToast', '$mdMedia', function ($scope, $rootScope, ZendeskWidget, enums, ptLog, appStateManager, dataService, $state, $location, $mdToast, $mdMedia) {
    // $rootScope.lang =  localStorage.getItem(enums.localStorageKeys.preferredLanguage) || 'it';
    $rootScope.isAppOnline = true;
    //if any error this will log
    $scope.$on(enums.busEvents.$routeChangeError, function (event, current, previous, rejection) {
        ptLog.log('route change error');
        ptLog.log(rejection);
    });

    if ($state.includes('app.emailVerification') && Object.keys($location.search())[0] != undefined) {
        $rootScope.$emit(enums.busEvents.triggerEmailValidation, { userId: Object.keys($location.search())[0] });
    }

    var deregs = [];
    deregs.push($rootScope.$on(enums.busEvents.locationUpdate, function (event, data) {
        // $mdToast.show(
        //     $mdToast.simple()
        //         .textContent('Location update')
        //         .hideDelay(3000)
        // );
    }));

    deregs.push($rootScope.$on(enums.busEvents.scrollMainScrollerToTop, function (event, data) {
        // let isAnimated = false;
        //
        // if (data && data.isAnimated)
        //     isAnimated = data.isAnimated;
        document.getElementById('main-ui-view').scrollTo(0, 0);
    }));

    if ($mdMedia('gt-sm')) ZendeskWidget.show();else ZendeskWidget.hide();

    deregs.push($scope.$watch(function () {
        return $mdMedia('gt-sm');
    }, function (mgMd) {
        if (mgMd) {
            ZendeskWidget.show();
        } else {
            ZendeskWidget.hide();
        }
    }));

    $scope.$on('$destroy', function () {
        while (deregs.length) {
            deregs.pop()();
        }
    });
}]);
angular.module('paladinApp').controller('userProfileController', ['$rootScope', '$scope', 'appStateManager', 'apiService', '$stateParams', '$state', 'toastService', 'enums', 'popupService', '$translate', 'ptLog', 'ptUtils', function ($rootScope, $scope, appStateManager, apiService, $stateParams, $state, toastService, enums, popupService, $translate, ptLog, ptUtils) {

    console.log('userProfileController $scope ', $scope);

    $scope.isLoading = false;
    $scope.isMyProfile = false;
    $scope.isEditing = false;
    $scope.isUpdating = false;
    $scope.userId = $stateParams.userId;
    $scope.editableProfile = null;
    $scope.tempBas64Image = null;

    if ($state.includes('app.profiles.myProfile')) {
        $scope.isMyProfile = true;
        if (!$scope.userId) {
            if (appStateManager.getUserId()) $scope.userId = appStateManager.getUserId();else $state.go('app.home');
        }
    } else if ($scope.userId == appStateManager.getUserId()) $state.go('app.profiles.myProfile', { userId: $scope.userId });

    $scope.fetchUserProfile = function () {
        $scope.profile = null;
        $scope.isLoading = true;
        var userId = $scope.userId;

        apiService.users.getUserProfile({ userId: userId }).then(function (response) {
            $scope.profile = response.Data;

            getUserCredit();

            ptUtils.extractAndGeoLocateAddressFromObjectForFieldNames({
                object: $scope.profile,
                addressFieldName: 'User_Address',
                latFieldName: 'User_Latitude',
                lngFieldName: 'User_Longitude'
            }).then(function (location) {
                $scope.profile.User_Address = location.address;
            });
            $scope.isLoading = false;
        }).catch(function (err) {
            $scope.isLoading = false;
            toastService.simpleToast(err.data.Message || $translate.instant('DEFAULT_ERROR'));
        });
    };

    $scope.editProfile = function () {
        var _$scope$profile = $scope.profile,
            User_Address = _$scope$profile.User_Address,
            User_FullName = _$scope$profile.User_FullName;

        $scope.editableProfile = angular.copy($scope.profile);
        var fullName = User_FullName.split(' ');
        $scope.editableProfile.userFirstName = fullName[0];
        $scope.editableProfile.userLastName = fullName.length > 1 ? fullName[1] : '';
        $scope.isEditing = true;
    };

    $scope.submitProfileEdit = function () {
        $scope.editableProfile.User_FullName = $scope.editableProfile.userFirstName + ' ' + ($scope.editableProfile.userLastName || '');
        var objToSend = angular.copy($scope.editableProfile);
        delete objToSend.userFirstName;
        delete objToSend.userLastName;
        $scope.isUpdating = true;
        apiService.users.editProfile(objToSend).then(function () {
            apiService.users.updateNotificaton({
                userId: $scope.userId,
                emailNotif: objToSend.Notification_Email || false,
                chatNotif: objToSend.Notification_Chat || false
            }).then(function (res) {
                location.reload();
            }).catch(function (err) {
                $scope.isUpdating = false;
                toastService.simpleToast(err.data.Message);
                console.error(err);
            });
        }).catch(function (err) {
            $scope.isUpdating = false;
            toastService.simpleToast(err.data.Message);
        });
    };

    $scope.uploadImage = function () {
        angular.element(document.getElementById('uploadImageBtn'))[0].click();
    };

    $scope.onUploaded = function (inputElement) {
        toastService.simpleToast($translate.instant('UPLOADING_IMAGE'));
        if (inputElement && inputElement.files && inputElement.files.length > 0) {
            canvasResize(inputElement.files[0], {
                quality: 75,
                isPreprocessing: true,
                cardType: '',
                maxW: 2048,
                maxH: 2008,
                isiOS: ptUtils.isMobile.iOS(),
                callback: function callback(data, width, height) {
                    $scope.$evalAsync(function () {
                        $scope.editableProfile.User_DisplayPicture = data.split(',')[1];
                        $scope.tempBas64Image = data;
                        toastService.simpleToast($translate.instant('IMAGE_UPLOADED'));
                    });
                }
            });
        } else {
            // No file uploaded
        }
    };

    $scope.changePassword = function () {
        popupService.showChangePassword().then(function () {
            return toastService.simpleToast($translate.instant('PASSWORD_SUCCESSFULLY_CHANGED'));
        }).catch(function () {
            return ptLog.log('pass change Canceled');
        });
    };

    $scope.logout = function () {
        $rootScope.$emit(enums.busEvents.userLogout);
    };

    $scope.deleteAccount = function () {
        popupService.showConfirm($translate.instant('WARN'), $translate.instant('DEL_ACCOUNT_CONFIRM_MESSAGE')).then(function () {
            //TODO: - delete account
            $scope.isLoading = true;
            apiService.users.deleteAccount($scope.userId).then(function () {
                $scope.isLoading = false;
                popupService.showAlert($translate.instant('DEL_ACCOUNT'), $translate.instant('DEL_ACCOUNT_SUCCESS')).finally(function () {
                    $rootScope.$emit(enums.busEvents.userLogout);
                });
            }).catch(function (err) {
                $scope.isLoading = false;
                popupService.showAlert($translate.instant('DEL_ACCOUNT'), err.data.Message || $translate.instant('DEFAULT_ERROR')).finally(function () {});
            });
        }).catch(function () {
            // Delete account canceled
        });
    };

    var copyReferralLink = function copyReferralLink(containerid) {
        // TODO: make this a directive or utility

        if (document.selection) {
            var range = document.body.createTextRange();
            range.moveToElementText(document.getElementById(containerid));
            range.select().createTextRange();
            document.execCommand("copy");
        } else if (window.getSelection) {
            var range = document.createRange();
            range.selectNode(document.getElementById(containerid));
            window.getSelection().addRange(range);
            document.execCommand("copy");
            console.info("text copied");
        }
    };

    var shareReferralLink = function shareReferralLink() {
        // open popup with social media buttons
        console.log('open share referral link popup ', popupService, ' .. ', $scope.referralLink);

        popupService.showShareReferralLink($scope.credit.ReferralCode);
    };

    var getUserCredit = function getUserCredit() {
        var userId = $scope.userId;


        apiService.users.getUserCredit({ userId: userId }).then(function (result) {
            console.log('user.credit ', result);

            $scope.credit = result.Data;

            $scope.credit.shareReferralLink = shareReferralLink;
        }, function (reason) {
            console.log('getUserCredit failed because: ', reason);
        });
    };

    $scope.fetchUserProfile();

    var deregs = [];

    deregs.push($rootScope.$on(enums.busEvents.googlePlacesAutocompletePlaceChanged, function (event, data) {
        if (data.elementId == 'editProfileAddressField') {
            var place = data.place,
                geometry = place.geometry;

            $scope.editableProfile.User_Latitude = geometry.location.lat();
            $scope.editableProfile.User_Longitude = geometry.location.lng();
            $scope.editableProfile.User_LocationId = place.id;
        }
    }));

    $scope.$on('$destroy', function () {
        while (deregs.length) {
            deregs.pop()();
        }
    });
}]);

angular.module('paladinApp').controller('newProductController', ['$rootScope', '$scope', 'enums', 'appStateManager', 'apiService', 'uploadHandler', 'toastService', '$translate', 'gtmService', 'ptUtils', function ($rootScope, $scope, enums, appStateManager, apiService, uploadHandler, toastService, $translate, gtmService, ptUtils) {
    $scope.isLoading = true;
    $scope.emptyProductImage = enums.categoriesBannersPaths.addProduct;
    $scope.subCategories = [];

    $scope.userAddress = undefined;
    $scope.isUseUserAddress = { value: false };

    $scope.newProductModel = {
        Product_Title: '',
        Product_Description: '',

        Product_ItemCategory_Id: 0,
        Product_SubCategoryId: 0,
        Product_LenduserId: appStateManager.getUserId(),
        Product_TryAndBuy: false,
        Product_IsShop: false,
        Product_ShopURL: '',
        Product_Price_Perday: null,
        Product_City: '',
        Price7Day: null,
        Price15Day: null
    };

    $scope.onUploadClicked = function () {
        $scope.$$postDigest(function () {
            angular.element(document.getElementById('uploadImageBtn'))[0].click();
        });
    };

    $scope.onUploaded = function (inputElement) {
        toastService.simpleToast($translate.instant('UPLOADING_IMAGE'));
        // Resize
        canvasResize(inputElement.files[0], {
            quality: 75,
            isPreprocessing: true,
            cardType: '',
            maxW: 2048,
            maxH: 2008,
            isiOS: ptUtils.isMobile.iOS(),
            callback: function callback(data, width, height) {
                $scope.$evalAsync(function () {
                    $scope.tmpUlpoadedImg = data;
                    $scope.newProductModel.ProductImage_Image1 = data.split(',')[1];
                    toastService.simpleToast($translate.instant('IMAGE_UPLOADED'));
                });
            }
        });
    };

    $scope.validator = function () {
        var valid = true;
        var errMsg = '';
        if (!$scope.newProductModel.Product_Title) {
            valid = false;
            // Please select title
            if (!errMsg) errMsg = $translate.instant('PRODUCT_INVALID_TITLE');
        }

        if (!$scope.newProductModel.Product_Description) {
            valid = false;
            // Please select description
            if (!errMsg) errMsg = $translate.instant('PRODUCT_INVALID_DESCRIPTION');
        }

        if ($scope.newProductModel.Product_Latitude && $scope.newProductModel.Product_Longitude || $scope.isUseUserAddress.value && $scope.userAddress && $scope.userAddress.lat && $scope.userAddress.lng) {} else {
            valid = false;
            // Please select address
            if (!errMsg) errMsg = $translate.instant('PRODUCT_INVALID_ADDRESS');
        }

        if (!$scope.newProductModel.ProductImage_Image1) {
            valid = false;
            // Please upload image
            if (!errMsg) errMsg = $translate.instant('PRODUCT_INVALID_IMAGE');
        }

        if (!$scope.newProductModel.Product_ItemCategory_Id) {
            valid = false;
            // Please select category
            if (!errMsg) errMsg = $translate.instant('PRODUCT_INVALID_CATEGORY');
        }

        if (!$scope.newProductModel.Product_Price_Perday) {
            valid = false;
            // Please select price per day
            if (!errMsg) errMsg = $translate.instant('PRODUCT_INVALID_PRICE_PER_DAY');
        }

        if ($scope.newProductModel.Product_TryAndBuy && !$scope.newProductModel.Product_ShopURL) {
            valid = false;
            // Try and buy must have url
            if (!errMsg) errMsg = $translate.instant('PRODUCT_INVALID_TRY_AND_BUY_URL');
        }
        if (!valid) toastService.simpleToast(errMsg);
        return valid;
    };

    $scope.onCategorySelected = function (categoryId) {
        $scope.subCategories = [];
        $scope.newProductModel.Product_SubCategoryId = 0;
        if ($scope.categories) {
            var selectedCategory = $scope.categories.find(function (cat) {
                return cat.Category_Id == categoryId;
            });
            if (selectedCategory && selectedCategory.Category_SubCatrgories && selectedCategory.Category_SubCatrgories.length > 0) {
                $scope.subCategories = selectedCategory.Category_SubCatrgories;
            } else {
                $scope.subCategories = [];
            }
        }
    };

    $scope.addProduct = function () {
        if (!$scope.validator()) return;
        $scope.isLoading = true;
        var newProduct = angular.copy($scope.newProductModel);
        if ($scope.isUseUserAddress.value) {
            delete newProduct.Product_LocationId;
            newProduct.Product_Latitude = $scope.userAddress.lat;
            newProduct.Product_Longitude = $scope.userAddress.lng;
        }
        $rootScope.$emit(enums.busEvents.scrollMainScrollerToTop);
        apiService.products.addProduct(newProduct).then(function (response) {
            gtmService.trackEvent('add-product', 'new-product-added');
            apiService.products.getUserProducts({
                userId: appStateManager.getUserId(),
                productsFilter: enums.userProductsFilter.myProductsToBorrow
            }).then(function (res) {
                $scope.isLoading = false;
                if (res && res.Data && res.Data.User_AllProducts && res.Data.User_AllProducts.length > 0) {
                    var _newProduct = res.Data.User_AllProducts[res.Data.User_AllProducts.length - 1];
                    $rootScope.$emit(enums.busNavigation.productDetailed, { product: _newProduct });
                }
                console.log(res);
            }).catch(function (err) {
                $scope.isLoading = false;
                console.error(err);
            });
        }).catch(function (err) {
            $scope.isLoading = false;
            // toastService.simpleToast(JSON.stringify(err));
        });
    };

    var formValuesInit = function formValuesInit() {
        if (appStateManager.user && appStateManager.user.User_Address && appStateManager.user.User_Latitude && appStateManager.user.User_Longitude && !$scope.userAddress) {
            $scope.userAddress = {
                address: appStateManager.user.User_Address,
                lat: appStateManager.user.User_Latitude,
                lng: appStateManager.user.User_Longitude
            };
        }
        if (appStateManager.categoriesDict && !$scope.categories) {
            var tnBCategories = [];
            var i = 0;
            Object.values(appStateManager.categoriesDict).forEach(function (category) {
                if (!category.IsTryAndBuy) tnBCategories[i++] = category;
            });
            $scope.categories = tnBCategories;
        }
    };

    formValuesInit();
    $scope.isLoading = false;

    var deregs = [];
    deregs.push($rootScope.$on(enums.busEvents.categoriesUpdate, function () {
        formValuesInit();
    }));

    deregs.push($rootScope.$on(enums.busEvents.updatedUser, function () {
        formValuesInit();
    }));

    deregs.push($rootScope.$on(enums.busEvents.googlePlacesAutocompletePlaceChanged, function (event, data) {
        if (data.elementId == 'newProductAddress') {
            var place = data.place,
                geometry = place.geometry;

            $scope.newProductModel.Product_Latitude = geometry.location.lat();
            $scope.newProductModel.Product_Longitude = geometry.location.lng();
            $scope.newProductModel.Product_LocationId = place.id;
        }
    }));
    $scope.$on('$destroy', function () {
        while (deregs.length) {
            deregs.pop()();
        }
    });
}]);
angular.module('paladinApp').controller('myListingsController', ['$rootScope', '$scope', 'enums', 'appStateManager', 'apiService', '$mdMedia', function ($rootScope, $scope, enums, appStateManager, apiService, $mdMedia) {
    $scope.isLoading = false;
    $scope.userId = appStateManager.getUserId();
    $scope.addNewItem = function () {
        $rootScope.$emit(enums.busNavigation.newProduct);
    };

    $scope.isGtMd = $mdMedia('gt-md');

    var deregs = [];

    deregs.push($scope.$watch(function () {
        return $mdMedia('gt-md');
    }, function (mgMd) {
        $scope.isGtMd = mgMd;
    }));

    $scope.$on('$destroy', function () {
        while (deregs.length) {
            deregs.pop()();
        }
    });
}]);
angular.module('paladinApp').controller('productReviewController', ['$scope', '$state', '$location', '$rootScope', 'appStateManager', 'apiService', 'productReviewService', 'toastService', '$translate', function ($scope, $state, $location, $rootScope, appStateManager, apiService, productReviewService, toastService, $translate) {
    var self = this;
    // normally done through "controllerAs: 'vm'" property but didn't want to
    // break the code style outside this file;
    // there's a lot to gain from proper namespacing...
    var vm = {};

    vm.review = {
        text: null,
        rating: null
    };

    vm.booking = productReviewService.getBookingToReview();

    vm.isLoading = false;
    vm.onRating = function (rating) {
        vm.review.rating = rating;
    };
    vm.submitReview = function () {
        var transactionId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

        // validate
        if (!vm.booking) {

            console.error('Invalid booking: ', vm.booking);
            return;
        } else if (vm.review.stars === undefined) {
            toastService.simpleToast($translate.instant('REVIEW_VALIDATION_NO_STARS'));
            return;
        } else if (vm.review.text === null) {
            toastService.simpleToast($translate.instant('REVIEW_VALIDATION_NO_COMMENT'));
            return;
        }

        // keep transactionId out of prereqData in case this controller
        // needs to be reused in other context
        var params = {
            Review_Precnt: vm.review.stars * 2,
            Review_ProductId: vm.booking.Product_Id,
            Review_UserId: vm.booking.Borrower_Id,
            LanguageCode: appStateManager.getCurrentLang(),
            ReviewDetail_Comment: vm.review.text || '',
            Review_BookingId: vm.booking.Booking_Id
        };

        apiService.reviews.submitTransactionReview(params).then(function (result) {
            console.log('submit review result ', result);
            // show a toast message
            toastService.simpleToast($translate.instant('REVIEW_ADDED_SUCCESS'));
        }, function (err) {
            toastService.simpleToast($translate.instant('REVIEW_ADDED_FAILED'));

            console.error(err);
        });

        $scope.vm.closeProductReview();
    };

    vm.closeProductReview = function () {
        // done through service to make it easily accessible
        productReviewService.leaveProductReviewPage();
    };

    // booking already has a rating
    // only the borrower ca review the product
    /*
                if (vm.booking.Booking_ReviewStatus
                    || vm.booking.Borrower_Id !== appStateManager.getUserId()) {
                    // maybe display a toast message or some other error handling here
                    vm.closeProductReview();
                }
    
    */
    /** it's always a good idea to namespace properties in $scope */
    $scope.vm = vm;
}]);

'use strict';

var mockDummyData = {
    "Status": "success",
    "Data": {
        "User_Booking_Borrower": [{
            "Product_Id": 11425,
            "Booking_Id": 736,
            "Borrower_Id": 11736,
            "Borrower_Name": "milalou2 milalou2-last",
            "Borrower_ReviewScore": 0,
            "Borrower_ReviewCount": 0,
            "Borrower_QBId": null,
            "Lender_Id": 11608,
            "Lender_Name": "Marc Ferrer",
            "Lender_StripeAccount": "acct_1AJTHYAN9BUpHCOJ",
            "Lender_ReviewScore": 0,
            "Lender_ReviewCount": 0,
            "Lender_QBId": null,
            "Booking_PaidToLender": false,
            "StartDate": "4/26/2018",
            "EndDate": "4/27/2018",
            "FullStartDate": "2018-04-26T00:00:00Z",
            "FullEndDate": "2018-04-27T00:00:00Z",
            "Lender_Image": "qSzR0g6M0HFiwOZaTm42D5a4stKjQj",
            "Borrower_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
            "Chat_Id": 0,
            "NoOfdays": 2,
            "Product_Title": "retina screen",
            "Lender_BillingAddress": null,
            "Product_Image": "lFYnTHaa7yI4kboCpsrT5a4stKjQj",
            "Product_PricePerDay": "5",
            "BorrowerCusotmerId": "",
            "RentAmount": 10,
            "Discount": 0,
            "AmountCharge": 10,
            "Status": "timeout",
            "Booking_ReadId": 2,
            "Delivery_Latitude": "",
            "Delivery_Longitude": "",
            "Delivery_Address": "",
            "Booking_PickupProduct": false,
            "BookingStatus": [{
                "StatusName": "requested",
                "CreatedDate": "10/04/2018",
                "Status_TrackId": 1,
                "CreatedTime": "05:46"
            }, {
                "StatusName": "verified",
                "CreatedDate": "10/04/2018",
                "Status_TrackId": 3,
                "CreatedTime": "05:46"
            }, {
                "StatusName": "timeout",
                "CreatedDate": "10/04/2018",
                "Status_TrackId": 4,
                "CreatedTime": "06:00"
            }],
            "Booking_ReviewStatus": null,
            "DeliveryAndPickupDetail": null
        }, {
            "Product_Id": 11510,
            "Booking_Id": 730,
            "Borrower_Id": 11736,
            "Borrower_Name": "milalou2 milalou2-last",
            "Borrower_ReviewScore": 0,
            "Borrower_ReviewCount": 0,
            "Borrower_QBId": null,
            "Lender_Id": 11624,
            "Lender_Name": "Muhammad Ali",
            "Lender_StripeAccount": "acct_1CCQcZLXqrrI6AjN",
            "Lender_ReviewScore": 0,
            "Lender_ReviewCount": 0,
            "Lender_QBId": null,
            "Booking_PaidToLender": false,
            "StartDate": "4/19/2018",
            "EndDate": "4/21/2018",
            "FullStartDate": "2018-04-19T00:00:00Z",
            "FullEndDate": "2018-04-21T00:00:00Z",
            "Lender_Image": "yTj58mdeStrfU5QoJBmtD5a4stKjQj",
            "Borrower_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
            "Chat_Id": 0,
            "NoOfdays": 3,
            "Product_Title": "Plastic bottle",
            "Lender_BillingAddress": null,
            "Product_Image": "Iti4Fsg9gJl2db5XWKAseD5a4stKjQj",
            "Product_PricePerDay": "14",
            "BorrowerCusotmerId": "",
            "RentAmount": 7,
            "Discount": 0,
            "AmountCharge": 7,
            "Status": "timeout",
            "Booking_ReadId": 2,
            "Delivery_Latitude": "",
            "Delivery_Longitude": "",
            "Delivery_Address": "",
            "Booking_PickupProduct": false,
            "BookingStatus": [{
                "StatusName": "requested",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 1,
                "CreatedTime": "20:16"
            }, {
                "StatusName": "verified",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 3,
                "CreatedTime": "20:16"
            }, {
                "StatusName": "timeout",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 4,
                "CreatedTime": "20:30"
            }],
            "Booking_ReviewStatus": null,
            "DeliveryAndPickupDetail": null
        }, {
            "Product_Id": 11535,
            "Booking_Id": 689,
            "Borrower_Id": 11736,
            "Borrower_Name": "milalou2 milalou2-last",
            "Borrower_ReviewScore": 0,
            "Borrower_ReviewCount": 0,
            "Borrower_QBId": null,
            "Lender_Id": 11735,
            "Lender_Name": "milalou4",
            "Lender_StripeAccount": "",
            "Lender_ReviewScore": 0,
            "Lender_ReviewCount": 0,
            "Lender_QBId": null,
            "Booking_PaidToLender": false,
            "StartDate": "4/19/2018",
            "EndDate": "4/20/2018",
            "FullStartDate": "2018-04-19T00:00:00Z",
            "FullEndDate": "2018-04-20T00:00:00Z",
            "Lender_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
            "Borrower_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
            "Chat_Id": 0,
            "NoOfdays": 2,
            "Product_Title": "tennis sport",
            "Lender_BillingAddress": null,
            "Product_Image": "3rQf5vmj3KTZmJ2y5Notj5a4stKjQj",
            "Product_PricePerDay": "3",
            "BorrowerCusotmerId": "",
            "RentAmount": 6,
            "Discount": 0,
            "AmountCharge": 6,
            "Status": "timeout",
            "Booking_ReadId": 3,
            "Delivery_Latitude": "",
            "Delivery_Longitude": "",
            "Delivery_Address": "",
            "Booking_PickupProduct": false,
            "BookingStatus": [{
                "StatusName": "requested",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 1,
                "CreatedTime": "14:25"
            }, {
                "StatusName": "verified",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 3,
                "CreatedTime": "14:25"
            }, {
                "StatusName": "timeout",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 4,
                "CreatedTime": "14:40"
            }],
            "Booking_ReviewStatus": null,
            "DeliveryAndPickupDetail": null
        }, {
            "Product_Id": 11545,
            "Booking_Id": 688,
            "Borrower_Id": 11736,
            "Borrower_Name": "milalou2 milalou2-last",
            "Borrower_ReviewScore": 0,
            "Borrower_ReviewCount": 0,
            "Borrower_QBId": null,
            "Lender_Id": 11746,
            "Lender_Name": "milalou3",
            "Lender_StripeAccount": "acct_1CDbR1BB9Tg1dJD4",
            "Lender_ReviewScore": 0,
            "Lender_ReviewCount": 0,
            "Lender_QBId": null,
            "Booking_PaidToLender": false,
            "StartDate": "4/20/2018",
            "EndDate": "4/20/2018",
            "FullStartDate": "2018-04-20T00:00:00Z",
            "FullEndDate": "2018-04-20T00:00:00Z",
            "Lender_Image": null,
            "Borrower_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
            "Chat_Id": 0,
            "NoOfdays": 1,
            "Product_Title": "little mu",
            "Lender_BillingAddress": null,
            "Product_Image": "dQgiMmnnpqeikt2ASslLj5a4stKjQj",
            "Product_PricePerDay": "5",
            "BorrowerCusotmerId": "",
            "RentAmount": 5,
            "Discount": 0,
            "AmountCharge": 5,
            "Status": "card_not_verified_timeout",
            "Booking_ReadId": 2,
            "Delivery_Latitude": "",
            "Delivery_Longitude": "",
            "Delivery_Address": "",
            "Booking_PickupProduct": false,
            "BookingStatus": [{
                "StatusName": "requested",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 1,
                "CreatedTime": "14:18"
            }, {
                "StatusName": "notverified",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 2,
                "CreatedTime": "14:18"
            }, {
                "StatusName": "card_not_verified_timeout",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 13,
                "CreatedTime": "18:35"
            }],
            "Booking_ReviewStatus": null,
            "DeliveryAndPickupDetail": null
        }, {
            "Product_Id": 11535,
            "Booking_Id": 556,
            "Borrower_Id": 11736,
            "Borrower_Name": "milalou2 milalou2-last",
            "Borrower_ReviewScore": 0,
            "Borrower_ReviewCount": 0,
            "Borrower_QBId": null,
            "Lender_Id": 11735,
            "Lender_Name": "milalou4",
            "Lender_StripeAccount": "",
            "Lender_ReviewScore": 0,
            "Lender_ReviewCount": 0,
            "Lender_QBId": null,
            "Booking_PaidToLender": false,
            "StartDate": "4/26/2018",
            "EndDate": "4/28/2018",
            "FullStartDate": "2018-04-26T00:00:00Z",
            "FullEndDate": "2018-04-28T00:00:00Z",
            "Lender_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
            "Borrower_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
            "Chat_Id": 0,
            "NoOfdays": 3,
            "Product_Title": "tennis sport",
            "Lender_BillingAddress": null,
            "Product_Image": "3rQf5vmj3KTZmJ2y5Notj5a4stKjQj",
            "Product_PricePerDay": "3",
            "BorrowerCusotmerId": "",
            "RentAmount": 9,
            "Discount": 0,
            "AmountCharge": 9,
            "Status": "started",
            "Booking_ReadId": 2,
            "Delivery_Latitude": "",
            "Delivery_Longitude": "",
            "Delivery_Address": "",
            "Booking_PickupProduct": false,
            "BookingStatus": [{
                "StatusName": "requested",
                "CreatedDate": "03/04/2018",
                "Status_TrackId": 1,
                "CreatedTime": "20:15"
            }, {
                "StatusName": "verified",
                "CreatedDate": "03/04/2018",
                "Status_TrackId": 3,
                "CreatedTime": "20:15"
            }, {
                "StatusName": "accepted",
                "CreatedDate": "03/04/2018",
                "Status_TrackId": 7,
                "CreatedTime": "20:16"
            }, {
                "StatusName": "started",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 8,
                "CreatedTime": "21:13"
            }],
            "Booking_ReviewStatus": null,
            "DeliveryAndPickupDetail": null
        }, {
            "Product_Id": 11537,
            "Booking_Id": 526,
            "Borrower_Id": 11736,
            "Borrower_Name": "milalou2 milalou2-last",
            "Borrower_ReviewScore": 0,
            "Borrower_ReviewCount": 0,
            "Borrower_QBId": null,
            "Lender_Id": 11737,
            "Lender_Name": "milalou5",
            "Lender_StripeAccount": "acct_1CClL3HkZgZyGSpV",
            "Lender_ReviewScore": 0,
            "Lender_ReviewCount": 0,
            "Lender_QBId": null,
            "Booking_PaidToLender": true,
            "StartDate": "4/19/2018",
            "EndDate": "4/21/2018",
            "FullStartDate": "2018-04-19T00:00:00Z",
            "FullEndDate": "2018-04-21T00:00:00Z",
            "Lender_Image": null,
            "Borrower_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
            "Chat_Id": 0,
            "NoOfdays": 3,
            "Product_Title": "sock",
            "Lender_BillingAddress": null,
            "Product_Image": "GCdCsbMYjJAIQ3CnJQ93Mj5a4stKjQj",
            "Product_PricePerDay": "7",
            "BorrowerCusotmerId": "",
            "RentAmount": 21,
            "Discount": 0,
            "AmountCharge": 21,
            "Status": "ended",
            "Booking_ReadId": 3,
            "Delivery_Latitude": "",
            "Delivery_Longitude": "",
            "Delivery_Address": "",
            "Booking_PickupProduct": false,
            "BookingStatus": [{
                "StatusName": "requested",
                "CreatedDate": "03/04/2018",
                "Status_TrackId": 1,
                "CreatedTime": "08:38"
            }, {
                "StatusName": "verified",
                "CreatedDate": "03/04/2018",
                "Status_TrackId": 3,
                "CreatedTime": "08:38"
            }, {
                "StatusName": "accepted",
                "CreatedDate": "03/04/2018",
                "Status_TrackId": 7,
                "CreatedTime": "08:46"
            }, {
                "StatusName": "started",
                "CreatedDate": "03/04/2018",
                "Status_TrackId": 8,
                "CreatedTime": "08:47"
            }, {
                "StatusName": "ended",
                "CreatedDate": "03/04/2018",
                "Status_TrackId": 9,
                "CreatedTime": "08:48"
            }],
            "Booking_ReviewStatus": null,
            "DeliveryAndPickupDetail": null
        }],
        "User_Booking_Lender": [{
            "Product_Id": 11533,
            "Booking_Id": 756,
            "Borrower_Id": 11735,
            "Borrower_Name": "milalou4",
            "Borrower_ReviewScore": 0,
            "Borrower_ReviewCount": 0,
            "Borrower_QBId": null,
            "Lender_Id": 11736,
            "Lender_Name": "milalou2 milalou2-last",
            "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
            "Lender_ReviewScore": 0,
            "Lender_ReviewCount": 0,
            "Lender_QBId": null,
            "Booking_PaidToLender": false,
            "StartDate": "4/20/2018",
            "EndDate": "4/20/2018",
            "FullStartDate": "2018-04-20T00:00:00Z",
            "FullEndDate": "2018-04-20T00:00:00Z",
            "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
            "Borrower_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
            "Chat_Id": 0,
            "NoOfdays": 1,
            "Product_Title": "pen blue ",
            "Lender_BillingAddress": null,
            "Product_Image": "ezPAZU9e8Z3LaNECKB8FQT5a4stKjQj",
            "Product_PricePerDay": "3",
            "BorrowerCusotmerId": "",
            "RentAmount": 3,
            "Discount": 0,
            "AmountCharge": 3,
            "Status": "timeout",
            "Booking_ReadId": 3,
            "Delivery_Latitude": "0",
            "Delivery_Longitude": "0",
            "Delivery_Address": "",
            "Booking_PickupProduct": true,
            "BookingStatus": [{
                "StatusName": "requested",
                "CreatedDate": "10/04/2018",
                "Status_TrackId": 1,
                "CreatedTime": "10:28"
            }, {
                "StatusName": "verified",
                "CreatedDate": "10/04/2018",
                "Status_TrackId": 3,
                "CreatedTime": "10:28"
            }, {
                "StatusName": "timeout",
                "CreatedDate": "10/04/2018",
                "Status_TrackId": 4,
                "CreatedTime": "10:40"
            }],
            "Booking_ReviewStatus": null,
            "DeliveryAndPickupDetail": null
        }, {
            "Product_Id": 11533,
            "Booking_Id": 755,
            "Borrower_Id": 11735,
            "Borrower_Name": "milalou4",
            "Borrower_ReviewScore": 0,
            "Borrower_ReviewCount": 0,
            "Borrower_QBId": null,
            "Lender_Id": 11736,
            "Lender_Name": "milalou2 milalou2-last",
            "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
            "Lender_ReviewScore": 0,
            "Lender_ReviewCount": 0,
            "Lender_QBId": null,
            "Booking_PaidToLender": false,
            "StartDate": "4/19/2018",
            "EndDate": "4/22/2018",
            "FullStartDate": "2018-04-19T00:00:00Z",
            "FullEndDate": "2018-04-22T00:00:00Z",
            "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
            "Borrower_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
            "Chat_Id": 0,
            "NoOfdays": 4,
            "Product_Title": "pen blue ",
            "Lender_BillingAddress": null,
            "Product_Image": "ezPAZU9e8Z3LaNECKB8FQT5a4stKjQj",
            "Product_PricePerDay": "3",
            "BorrowerCusotmerId": "",
            "RentAmount": 12,
            "Discount": 0,
            "AmountCharge": 12,
            "Status": "cancelled",
            "Booking_ReadId": 2,
            "Delivery_Latitude": "0",
            "Delivery_Longitude": "0",
            "Delivery_Address": "",
            "Booking_PickupProduct": true,
            "BookingStatus": [{
                "StatusName": "requested",
                "CreatedDate": "10/04/2018",
                "Status_TrackId": 1,
                "CreatedTime": "10:26"
            }, {
                "StatusName": "verified",
                "CreatedDate": "10/04/2018",
                "Status_TrackId": 3,
                "CreatedTime": "10:26"
            }, {
                "StatusName": "cancelled",
                "CreatedDate": "10/04/2018",
                "Status_TrackId": 6,
                "CreatedTime": "10:26"
            }],
            "Booking_ReviewStatus": null,
            "DeliveryAndPickupDetail": null
        }, {
            "Product_Id": 11533,
            "Booking_Id": 735,
            "Borrower_Id": 11735,
            "Borrower_Name": "milalou4",
            "Borrower_ReviewScore": 0,
            "Borrower_ReviewCount": 0,
            "Borrower_QBId": null,
            "Lender_Id": 11736,
            "Lender_Name": "milalou2 milalou2-last",
            "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
            "Lender_ReviewScore": 0,
            "Lender_ReviewCount": 0,
            "Lender_QBId": null,
            "Booking_PaidToLender": false,
            "StartDate": "4/26/2018",
            "EndDate": "4/26/2018",
            "FullStartDate": "2018-04-26T00:00:00Z",
            "FullEndDate": "2018-04-26T00:00:00Z",
            "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
            "Borrower_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
            "Chat_Id": 0,
            "NoOfdays": 1,
            "Product_Title": "pen blue ",
            "Lender_BillingAddress": null,
            "Product_Image": "ezPAZU9e8Z3LaNECKB8FQT5a4stKjQj",
            "Product_PricePerDay": "3",
            "BorrowerCusotmerId": "",
            "RentAmount": 3,
            "Discount": 0,
            "AmountCharge": 3,
            "Status": "accepted",
            "Booking_ReadId": 2,
            "Delivery_Latitude": "0",
            "Delivery_Longitude": "0",
            "Delivery_Address": "",
            "Booking_PickupProduct": true,
            "BookingStatus": [{
                "StatusName": "requested",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 1,
                "CreatedTime": "21:44"
            }, {
                "StatusName": "verified",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 3,
                "CreatedTime": "21:44"
            }, {
                "StatusName": "accepted",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 7,
                "CreatedTime": "21:44"
            }],
            "Booking_ReviewStatus": null,
            "DeliveryAndPickupDetail": null
        }, {
            "Product_Id": 11533,
            "Booking_Id": 734,
            "Borrower_Id": 11735,
            "Borrower_Name": "milalou4",
            "Borrower_ReviewScore": 0,
            "Borrower_ReviewCount": 0,
            "Borrower_QBId": null,
            "Lender_Id": 11736,
            "Lender_Name": "milalou2 milalou2-last",
            "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
            "Lender_ReviewScore": 0,
            "Lender_ReviewCount": 0,
            "Lender_QBId": null,
            "Booking_PaidToLender": false,
            "StartDate": "4/21/2018",
            "EndDate": "4/22/2018",
            "FullStartDate": "2018-04-21T00:00:00Z",
            "FullEndDate": "2018-04-22T00:00:00Z",
            "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
            "Borrower_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
            "Chat_Id": 0,
            "NoOfdays": 2,
            "Product_Title": "pen blue ",
            "Lender_BillingAddress": null,
            "Product_Image": "ezPAZU9e8Z3LaNECKB8FQT5a4stKjQj",
            "Product_PricePerDay": "3",
            "BorrowerCusotmerId": "",
            "RentAmount": 6,
            "Discount": 0,
            "AmountCharge": 6,
            "Status": "cancelled",
            "Booking_ReadId": 2,
            "Delivery_Latitude": "0",
            "Delivery_Longitude": "0",
            "Delivery_Address": "",
            "Booking_PickupProduct": true,
            "BookingStatus": [{
                "StatusName": "requested",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 1,
                "CreatedTime": "20:58"
            }, {
                "StatusName": "verified",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 3,
                "CreatedTime": "20:58"
            }, {
                "StatusName": "cancelled",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 6,
                "CreatedTime": "20:59"
            }],
            "Booking_ReviewStatus": null,
            "DeliveryAndPickupDetail": null
        }, {
            "Product_Id": 11533,
            "Booking_Id": 733,
            "Borrower_Id": 11735,
            "Borrower_Name": "milalou4",
            "Borrower_ReviewScore": 0,
            "Borrower_ReviewCount": 0,
            "Borrower_QBId": null,
            "Lender_Id": 11736,
            "Lender_Name": "milalou2 milalou2-last",
            "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
            "Lender_ReviewScore": 0,
            "Lender_ReviewCount": 0,
            "Lender_QBId": null,
            "Booking_PaidToLender": false,
            "StartDate": "4/21/2018",
            "EndDate": "4/22/2018",
            "FullStartDate": "2018-04-21T00:00:00Z",
            "FullEndDate": "2018-04-22T00:00:00Z",
            "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
            "Borrower_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
            "Chat_Id": 0,
            "NoOfdays": 2,
            "Product_Title": "pen blue ",
            "Lender_BillingAddress": null,
            "Product_Image": "ezPAZU9e8Z3LaNECKB8FQT5a4stKjQj",
            "Product_PricePerDay": "3",
            "BorrowerCusotmerId": "",
            "RentAmount": 6,
            "Discount": 0,
            "AmountCharge": 6,
            "Status": "cancelled",
            "Booking_ReadId": 3,
            "Delivery_Latitude": "0",
            "Delivery_Longitude": "0",
            "Delivery_Address": "",
            "Booking_PickupProduct": true,
            "BookingStatus": [{
                "StatusName": "requested",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 1,
                "CreatedTime": "20:56"
            }, {
                "StatusName": "verified",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 3,
                "CreatedTime": "20:56"
            }, {
                "StatusName": "cancelled",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 6,
                "CreatedTime": "20:58"
            }],
            "Booking_ReviewStatus": null,
            "DeliveryAndPickupDetail": null
        }, {
            "Product_Id": 11533,
            "Booking_Id": 732,
            "Borrower_Id": 11735,
            "Borrower_Name": "milalou4",
            "Borrower_ReviewScore": 0,
            "Borrower_ReviewCount": 0,
            "Borrower_QBId": null,
            "Lender_Id": 11736,
            "Lender_Name": "milalou2 milalou2-last",
            "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
            "Lender_ReviewScore": 0,
            "Lender_ReviewCount": 0,
            "Lender_QBId": null,
            "Booking_PaidToLender": true,
            "StartDate": "4/11/2018",
            "EndDate": "4/11/2018",
            "FullStartDate": "2018-04-11T00:00:00Z",
            "FullEndDate": "2018-04-11T00:00:00Z",
            "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
            "Borrower_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
            "Chat_Id": 0,
            "NoOfdays": 1,
            "Product_Title": "pen blue ",
            "Lender_BillingAddress": null,
            "Product_Image": "ezPAZU9e8Z3LaNECKB8FQT5a4stKjQj",
            "Product_PricePerDay": "3",
            "BorrowerCusotmerId": "",
            "RentAmount": 3,
            "Discount": 0,
            "AmountCharge": 3,
            "Status": "ended",
            "Booking_ReadId": 1,
            "Delivery_Latitude": "0",
            "Delivery_Longitude": "0",
            "Delivery_Address": "",
            "Booking_PickupProduct": true,
            "BookingStatus": [{
                "StatusName": "requested",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 1,
                "CreatedTime": "20:47"
            }, {
                "StatusName": "verified",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 3,
                "CreatedTime": "20:47"
            }, {
                "StatusName": "accepted",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 7,
                "CreatedTime": "20:47"
            }, {
                "StatusName": "started",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 8,
                "CreatedTime": "20:55"
            }, {
                "StatusName": "ended",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 9,
                "CreatedTime": "20:55"
            }],
            "Booking_ReviewStatus": null,
            "DeliveryAndPickupDetail": null
        }, {
            "Product_Id": 11532,
            "Booking_Id": 668,
            "Borrower_Id": 11737,
            "Borrower_Name": "milalou5",
            "Borrower_ReviewScore": 0,
            "Borrower_ReviewCount": 0,
            "Borrower_QBId": null,
            "Lender_Id": 11736,
            "Lender_Name": "milalou2 milalou2-last",
            "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
            "Lender_ReviewScore": 0,
            "Lender_ReviewCount": 0,
            "Lender_QBId": null,
            "Booking_PaidToLender": false,
            "StartDate": "4/19/2018",
            "EndDate": "4/21/2018",
            "FullStartDate": "2018-04-19T00:00:00Z",
            "FullEndDate": "2018-04-21T00:00:00Z",
            "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
            "Borrower_Image": null,
            "Chat_Id": 0,
            "NoOfdays": 3,
            "Product_Title": "napkins ",
            "Lender_BillingAddress": null,
            "Product_Image": "o8R3Gnu6yT2mVGdKix4Iz5a4stKjQj",
            "Product_PricePerDay": "6",
            "BorrowerCusotmerId": "",
            "RentAmount": 3,
            "Discount": 0,
            "AmountCharge": 3,
            "Status": "card_not_verified_timeout",
            "Booking_ReadId": 1,
            "Delivery_Latitude": "52.4746643",
            "Delivery_Longitude": "13.4244634",
            "Delivery_Address": "Weisestraße 26",
            "Booking_PickupProduct": false,
            "BookingStatus": [{
                "StatusName": "requested",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 1,
                "CreatedTime": "08:09"
            }, {
                "StatusName": "notverified",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 2,
                "CreatedTime": "08:09"
            }, {
                "StatusName": "card_not_verified_timeout",
                "CreatedDate": "09/04/2018",
                "Status_TrackId": 13,
                "CreatedTime": "18:35"
            }],
            "Booking_ReviewStatus": null,
            "DeliveryAndPickupDetail": null
        }, {
            "Product_Id": 11533,
            "Booking_Id": 555,
            "Borrower_Id": 11737,
            "Borrower_Name": "milalou5",
            "Borrower_ReviewScore": 0,
            "Borrower_ReviewCount": 0,
            "Borrower_QBId": null,
            "Lender_Id": 11736,
            "Lender_Name": "milalou2 milalou2-last",
            "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
            "Lender_ReviewScore": 0,
            "Lender_ReviewCount": 0,
            "Lender_QBId": null,
            "Booking_PaidToLender": true,
            "StartDate": "4/19/2018",
            "EndDate": "4/21/2018",
            "FullStartDate": "2018-04-19T00:00:00Z",
            "FullEndDate": "2018-04-21T00:00:00Z",
            "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
            "Borrower_Image": null,
            "Chat_Id": 0,
            "NoOfdays": 3,
            "Product_Title": "pen blue ",
            "Lender_BillingAddress": null,
            "Product_Image": "ezPAZU9e8Z3LaNECKB8FQT5a4stKjQj",
            "Product_PricePerDay": "3",
            "BorrowerCusotmerId": "",
            "RentAmount": 9,
            "Discount": 0,
            "AmountCharge": 9,
            "Status": "ended",
            "Booking_ReadId": 2,
            "Delivery_Latitude": "0",
            "Delivery_Longitude": "0",
            "Delivery_Address": "",
            "Booking_PickupProduct": true,
            "BookingStatus": [{
                "StatusName": "requested",
                "CreatedDate": "03/04/2018",
                "Status_TrackId": 1,
                "CreatedTime": "18:25"
            }, {
                "StatusName": "verified",
                "CreatedDate": "03/04/2018",
                "Status_TrackId": 3,
                "CreatedTime": "18:25"
            }, {
                "StatusName": "accepted",
                "CreatedDate": "03/04/2018",
                "Status_TrackId": 7,
                "CreatedTime": "18:26"
            }, {
                "StatusName": "started",
                "CreatedDate": "03/04/2018",
                "Status_TrackId": 8,
                "CreatedTime": "18:28"
            }, {
                "StatusName": "ended",
                "CreatedDate": "03/04/2018",
                "Status_TrackId": 9,
                "CreatedTime": "18:29"
            }],
            "Booking_ReviewStatus": null,
            "DeliveryAndPickupDetail": null
        }, {
            "Product_Id": 11533,
            "Booking_Id": 525,
            "Borrower_Id": 11735,
            "Borrower_Name": "milalou4",
            "Borrower_ReviewScore": 0,
            "Borrower_ReviewCount": 0,
            "Borrower_QBId": null,
            "Lender_Id": 11736,
            "Lender_Name": "milalou2 milalou2-last",
            "Lender_StripeAccount": "acct_1CCujsKRD1g5AQ99",
            "Lender_ReviewScore": 0,
            "Lender_ReviewCount": 0,
            "Lender_QBId": null,
            "Booking_PaidToLender": false,
            "StartDate": "4/3/2018",
            "EndDate": "4/3/2018",
            "FullStartDate": "2018-04-03T00:00:00Z",
            "FullEndDate": "2018-04-03T00:00:00Z",
            "Lender_Image": "JoyyjhIuu7zFjvau4s6HT5a4stKjQj",
            "Borrower_Image": "NXxMyDfZn2ZHu0dUvLJeT5a4stKjQj",
            "Chat_Id": 0,
            "NoOfdays": 1,
            "Product_Title": "pen blue ",
            "Lender_BillingAddress": null,
            "Product_Image": "ezPAZU9e8Z3LaNECKB8FQT5a4stKjQj",
            "Product_PricePerDay": "3",
            "BorrowerCusotmerId": "",
            "RentAmount": 3,
            "Discount": 0,
            "AmountCharge": 3,
            "Status": "timeout",
            "Booking_ReadId": 3,
            "Delivery_Latitude": "0",
            "Delivery_Longitude": "0",
            "Delivery_Address": "",
            "Booking_PickupProduct": true,
            "BookingStatus": [{
                "StatusName": "requested",
                "CreatedDate": "03/04/2018",
                "Status_TrackId": 1,
                "CreatedTime": "08:09"
            }, {
                "StatusName": "verified",
                "CreatedDate": "03/04/2018",
                "Status_TrackId": 3,
                "CreatedTime": "08:09"
            }, {
                "StatusName": "timeout",
                "CreatedDate": "03/04/2018",
                "Status_TrackId": 4,
                "CreatedTime": "08:15"
            }],
            "Booking_ReviewStatus": null,
            "DeliveryAndPickupDetail": null
        }],
        "User_ReviewScore": [{
            "User_ReviewScore": 8,
            "User_TotalReviews": 1,
            "User_ReviewAsLender": 8,
            "User_ReviewAsBorrower": 7,
            "User_ReviewCountAsLender": 1,
            "User_ReviewCountAsBorrower": 1
        }]
    },
    "Message": "User Bookings"
};

angular.module('paladinApp').controller('userBookingsController', ['$rootScope', '$scope', 'apiService', 'enums', 'appStateManager', 'ptLog', '$mdMedia', 'ptUtils', 'moment', function ($rootScope, $scope, apiService, enums, appStateManager, ptLog, $mdMedia, ptUtils, moment) {
    $scope.isLoading = false;

    $scope.tabs = [{
        title: 'BORROWED',
        content: 'I am tab borrowed content',
        bookings: []
    }, {
        title: 'LENT',
        content: 'I am tab lent content',
        bookings: []
    }];

    $scope.fetchUserBookings = function () {
        $scope.isLoading = true;
        apiService.bookings.getUserBookings(appStateManager.getUserId()).then(function (res) {
            $scope.tabs[0].bookings = res.Data.User_Booking_Borrower.map(function (item) {
                item.lastModified = new Date(item.Last_Modified * 1000);
                return item;
            }).sort(ptUtils.sorters.bookingLastModifiedEpoch);

            $scope.tabs[1].bookings = res.Data.User_Booking_Lender.map(function (item) {
                item.lastModified = new Date(item.Last_Modified * 1000);
                return item;
            }).sort(ptUtils.sorters.bookingLastModifiedEpoch);
            $scope.isLoading = false;
        }).catch(function (err) {
            $scope.isLoading = false;
            ptLog.error(err);
        });
    };

    $scope.fetchUserBookings();

    $scope.bookingListItemClick = function (booking) {
        $rootScope.$emit(enums.busNavigation.transactionDetailed, { bookingId: booking.Booking_Id });
    };

    $scope.addNewItem = function () {
        $rootScope.$emit(enums.busNavigation.newProduct);
    };

    $scope.isGtMd = $mdMedia('gt-md');

    var deregs = [];

    deregs.push($scope.$watch(function () {
        return $mdMedia('gt-md');
    }, function (mgMd) {
        $scope.isGtMd = mgMd;
    }));

    $scope.$on('$destroy', function () {
        while (deregs.length) {
            deregs.pop()();
        }
    });
}]);
'use strict';
angular.module('paladinApp').controller('bookingDetailedController', ['$rootScope', '$scope', 'enums', 'appStateManager', 'apiService', '$stateParams', 'ptLog', 'popupService', 'ptUtils', '$sce', function ($rootScope, $scope, enums, appStateManager, apiService, $stateParams, ptLog, popupService, ptUtils, $sce) {
    $scope.isLoading = false;
    $scope.bookingId = $stateParams.bookingId;
    $scope.booking = null;
    $scope.address = {
        title: undefined,
        address: undefined,
        lat: undefined,
        lng: undefined
    };
    $scope.fetchDetailedBooking = function () {
        $scope.isLoading = true;
        apiService.bookings.getBookingDetailed({
            bookingId: $scope.bookingId,
            userId: appStateManager.getUserId()
        }).then(function (res) {
            $scope.booking = res.Data;
            $scope.booking.Product_Description = $sce.trustAsHtml($scope.booking.Product_Description);
            $scope.fetchProduct();
        }).catch(function (err) {
            ptLog.error(JSON.stringify(err));
        });
    };

    $scope.fetchProduct = function () {
        apiService.products.getDetailedProduct($scope.booking.Product_Id).then(function (res) {
            $scope.product = res.Data;
            $scope.fetchProductBookingDetails();
        }).catch(function (err) {
            ptLog.error(JSON.stringify(err));
        });
    };

    $scope.fetchProductBookingDetails = function () {
        apiService.products.getProductBookingDetails({
            productId: $scope.product.Product_Id,
            userId: appStateManager.getUserId()
        }).then(function (response) {
            $scope.productBookingDetails = response.Data;

            ptUtils.getAddressToDisplayForBooking({
                product: $scope.product,
                productBookingDetails: $scope.productBookingDetails,
                booking: $scope.booking

            }).then(function (address) {
                $scope.$evalAsync(function () {
                    $scope.address = address;
                    $scope.isLoading = false;
                    if (ptUtils.isMobile.any()) {
                        popupService.showBookingTrackerInfoMobilePopup($scope.booking);
                    }
                });
            }).catch(function (err) {
                $scope.$evalAsync(function () {
                    $scope.isLoading = false;
                });
            });
        }).catch(function (err) {
            ptLog.error(err);
        });
    };

    $scope.goToProduct = function () {
        $rootScope.$emit(enums.busNavigation.productDetailed, { product: $scope.booking });
    };

    $scope.fetchDetailedBooking();

    var deregs = [];

    deregs.push($rootScope.$on(enums.busEvents.reloadDetailedBooking, function (event, _ref57) {
        var bookingId = _ref57.bookingId;

        if (bookingId == $scope.bookingId) {
            $scope.fetchDetailedBooking();
        }
    }));

    $scope.$on('$destroy', function () {
        while (deregs.length) {
            deregs.pop()();
        }
    });
}]);
'use strict';
angular.module('paladinApp').controller('paymentDetailedController', ['$rootScope', '$scope', 'apiService', 'appStateManager', 'enums', '$stateParams', 'popupService', 'toastService', '$sce', 'stripeService', 'creditcards', 'menusService', 'ptUtils', 'moment', 'geoLocationService', 'ptLog', '$translate', 'gtmService', function ($rootScope, $scope, apiService, appStateManager, enums, $stateParams, popupService, toastService, $sce, stripeService, creditcards, menusService, ptUtils, moment, geoLocationService, ptLog, $translate, gtmService) {
    var _this10 = this;

    $scope.isLoading = true;
    $scope.isHaveSavedCC = false;
    $scope.isTryAndBuy = false;
    $scope.isNewCardLayoutOpen = false;
    $scope.isBuy = false;

    if ($stateParams.startDate && $stateParams.startDate && $stateParams.productId) {
        $scope.rentStartDate = $stateParams.startDate;
        $scope.rentEndDate = $stateParams.endDate;
        $scope.productId = $stateParams.productId;
    } else if ($stateParams.productId && ($stateParams.purchase || $stateParams.bookingId)) {
        $scope.isBuy = $stateParams.purchase;
        $scope.bookingId = $stateParams.bookingId;
        $scope.productId = $stateParams.productId;
    } else {
        popupService.showAlert('Ops', $translate.instant('INVALID_PAGE')).finally(function () {
            $rootScope.$emit(enums.busNavigation.homePage);
        });
        return;
    }

    $scope.prices = [];
    $scope.userSavedCard = null;
    $scope.coupon = null;
    $scope.statusError = null;

    // New Card model
    $scope.ccModel = {
        number: '',
        type: '',
        expiration: '',
        exp_month: '',
        exp_year: '',
        cvc: '',
        name: '',
        isTermsAndConditionsAccepted: false,
        isSaveCardForFutureTransactions: true,
        isDelivery: true,
        deliveryAddress: '',
        deliveryName: '',
        deliveryPhone: '',
        deliveryBell: ''
    };
    // New CC submit form
    $scope.forms = {};

    $scope.ccIcon = {
        'MasterCard': 'fa-cc-mastercard',
        'Visa': 'fa-cc-visa',
        'American Express': 'fa-cc-amex',
        'Discover': 'fa-cc-discover',
        undefined: 'fa-credit-card',
        'Unknown': 'fa-credit-card',
        'Maestro': 'fa-credit-card',
        'JCB': 'fa-cc-jcb',
        'Diners': 'fa-cc-diners',
        'Diners Club': 'fa-cc-diners-club'
    };

    $scope.fetchProduct = function () {
        $scope.isLoading = true;
        apiService.products.getDetailedProduct($scope.productId).then(function (response) {
            $scope.product = response.Data;
            $scope.product.Product_Description = $sce.trustAsHtml($scope.product.Product_Description);

            ptUtils.extractAndGeoLocateAddressFromObjectForFieldNames({
                object: $scope.product,
                addressFieldName: 'Lender_User_Address',
                latFieldName: 'Product_Latitude',
                lngFieldName: 'Product_Longitude'
            }).then(function (address) {
                $scope.product.Lender_User_Address = address;
            });

            $scope.isTryAndBuy = ptUtils.isProductTryAndBuy($scope.product);

            $scope.fetchBookingDetails();
        }).catch(function (err) {
            $scope.isLoading = false;
            toastService.simpleToast(JSON.stringify(err));
            ptLog.error(JSON.stringify(err));
        });
    };

    $scope.fetchBookingDetails = function () {
        apiService.products.getProductBookingDetails({
            productId: $scope.product.Product_Id,
            userId: appStateManager.getUserId()
        }).then(function (response) {
            $scope.productBookingDetails = response.Data;
            $scope.calculatePrices();
            var UserCustomerDetail = $scope.productBookingDetails.UserCustomerDetail;
            var User_CustomerId = UserCustomerDetail.User_CustomerId;

            // User Has saved credit card, fetch and fill info

            if (User_CustomerId) {
                $scope.fetchStripeUserCard(User_CustomerId);
            } else {
                $scope.isLoading = false;
            }
        }).catch(function (err) {
            $scope.isLoading = false;
            console.error(err);
        });
    };

    $scope.fetchProduct();

    $scope.toggleNewCardLayout = function () {
        $scope.isNewCardLayoutOpen = !$scope.isNewCardLayoutOpen;
        $scope.userSavedCard = null;
        $scope.isHaveSavedCC = false;
    };

    $scope.gotoTermsAndConditions = function () {
        var url = menusService.commonMenus.linksMenu.list[1].link;
        var win = window.open(url, '_blank');
        win.focus();
    };

    $scope.fetchStripeUserCard = function (customerId) {
        stripeService.getCustomerSources(customerId).then(function (response) {
            if (response.status === 200 && response.data != null) {
                var _response$data = response.data,
                    data = _response$data.data,
                    object = _response$data.object;

                if (object == 'list' && data && data.length > 0) {
                    var card = data.find(function (sourceItem) {
                        return sourceItem.object == 'card';
                    });

                    if (card) {
                        $scope.userSavedCard = card;
                        $scope.isHaveSavedCC = true;
                    }
                }
            }
            $scope.isLoading = false;
        }).catch(function (err) {
            $scope.isLoading = false;
            console.error(err);
        });
    };

    $scope.calculatePrices = function () {

        $scope.prices = [];
        $scope.statusError = undefined;
        $scope.userCredit = null;

        var calculateTransactionPrice = function calculateTransactionPrice() {
            var product = $scope.product,
                productBookingDetails = $scope.productBookingDetails,
                rentStartDate = $scope.rentStartDate,
                rentEndDate = $scope.rentEndDate,
                userCredit = $scope.userCredit,
                coupon = $scope.coupon,
                ccModel = $scope.ccModel;


            ptUtils.calculatePricingListForProduct(rentStartDate, rentEndDate, product, productBookingDetails, ccModel.isDelivery, userCredit, coupon, $scope.isBuy).then(function (prices) {
                $scope.$evalAsync(function () {
                    $scope.prices = prices;
                });
            }).catch(function (err) {
                $scope.$evalAsync(function () {
                    if (err && err.message) $scope.statusError = err.message;
                });
            });
        };

        var userId = appStateManager.getUserId();

        apiService.users.getUserCredit({ userId: userId }).then(function (result) {
            $scope.userCredit = result.Data;
            calculateTransactionPrice();
        }).catch(function (err) {
            console.error('getuserCredit failed ', err);
        });
    };

    $scope.onDatesSelected = function (_ref58) {
        var startDate = _ref58.startDate,
            endDate = _ref58.endDate;

        $scope.rentStartDate = startDate;
        $scope.rentEndDate = endDate;
        $scope.calculatePrices();
    };

    $scope.couponValidated = function (coupon) {
        $scope.coupon = coupon;
        $scope.calculatePrices();
    };
    $scope.deleteCoupon = function () {
        $scope.coupon = null;
        $scope.calculatePrices();
    };

    $scope.isDeliveryStatusChange = function () {
        $scope.calculatePrices();
    };

    $scope.bookingValidator = function () {
        $scope.statusError = undefined;
        var ccModel = $scope.ccModel,
            forms = $scope.forms;
        var ccForm = forms.ccForm;
        var isHaveSavedCC = $scope.isHaveSavedCC,
            userSavedCard = $scope.userSavedCard,
            isNewCardLayoutOpen = $scope.isNewCardLayoutOpen;


        var isValid = true;
        var msg = '';

        if (!ccModel.isTermsAndConditionsAccepted) {
            isValid = false;
            msg = 'NEED_TO_ACCEPT_TERMS_AND_CONDITIONS';
        } else if (isHaveSavedCC && userSavedCard != undefined && !isNewCardLayoutOpen) {
            isValid = true;
        } else if (ccForm.$invalid || !ccForm.$valid || !ccForm.$dirty) {
            isValid = false;
            msg = 'INVALID_CC_FORM';
        }

        if ($scope.isTryAndBuy && ccModel.isDelivery) {
            if (!ccModel.deliveryAddress || !ccModel.productLat || !ccModel.productLng) {
                isValid = false;
                msg = 'INVALID_DELIVERY_ADDRESS';
            } else if (!ccModel.deliveryName) {
                isValid = false;
                msg = 'ADD_BILLING_NAME_MISSING';
            } else if (!ccModel.deliveryPhone) {
                isValid = false;
                msg = 'ADD_PHONE_NUMBER_MISSING';
            } else if (!ccModel.deliveryBell) {
                isValid = false;
                msg = 'ADD_RING_BELL_NAME_MISSING';
            }
        }

        if (!isValid && msg) {
            toastService.simpleToast($translate.instant(msg));
            $scope.statusError = msg;
        }
        return isValid;
    };

    $scope.bookNow = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var ccModel, product, isHaveSavedCC, userSavedCard, productBookingDetails, isNewCardLayoutOpen, UserCustomerDetail, User_CustomerId, _appStateManager$user, User_IsVerfied, User_Email, customerData, cardData, chargeCardRes, bookingId, errMsg;

        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        ccModel = angular.copy($scope.ccModel);
                        product = $scope.product, isHaveSavedCC = $scope.isHaveSavedCC, userSavedCard = $scope.userSavedCard, productBookingDetails = $scope.productBookingDetails, isNewCardLayoutOpen = $scope.isNewCardLayoutOpen;
                        UserCustomerDetail = productBookingDetails.UserCustomerDetail;
                        User_CustomerId = UserCustomerDetail.User_CustomerId;

                        if (!$scope.bookingValidator()) {
                            _context.next = 34;
                            break;
                        }

                        popupService.showLoader();

                        _context.prev = 6;
                        _appStateManager$user = appStateManager.user, User_IsVerfied = _appStateManager$user.User_IsVerfied, User_Email = _appStateManager$user.User_Email;
                        //Check if its a new credit card or we already have it

                        customerData = null;

                        if (User_CustomerId && isHaveSavedCC && userSavedCard && !isNewCardLayoutOpen) {
                            _context.next = 19;
                            break;
                        }

                        _context.next = 12;
                        return $scope.createNewCardToken();

                    case 12:
                        cardData = _context.sent;
                        _context.next = 15;
                        return $scope.createStripeCustomer(cardData.id, User_Email);

                    case 15:
                        customerData = _context.sent;

                        console.log(customerData);
                        _context.next = 20;
                        break;

                    case 19:
                        customerData = User_CustomerId;

                    case 20:
                        _context.next = 22;
                        return $scope.chargeCard(customerData, User_Email);

                    case 22:
                        chargeCardRes = _context.sent;


                        if (chargeCardRes && chargeCardRes.Data) {
                            //charge card successfull
                            popupService.hideLoader();

                            if (!$scope.isBuy) gtmService.trackEvent('booking', 'booking-request-submitted', chargeCardRes.Data.Booking_Id, chargeCardRes.Data.AmountCharge * 0.78);else gtmService.trackEvent('purchase', 'purchase-submitted');

                            console.log(chargeCardRes);
                            bookingId = chargeCardRes.Data.Booking_Id;

                            if ($scope.isBuy) {

                                if ($scope.bookingId) {
                                    $rootScope.$emit(enums.busNavigation.transactionDetailed, {
                                        bookingId: bookingId,
                                        replace: true
                                    });
                                } else {
                                    $rootScope.$emit(enums.busNavigation.productDetailed, {
                                        product: product

                                    });
                                }
                                popupService.showAlert('PURCHASE_SUCCESSFUL_TITLE', 'PURCHASE_SUCCESSFUL').finally(function () {
                                    if ($scope.bookingId) $rootScope.$emit(enums.busNavigation.transactionDetailed, { bookingId: $scope.bookingId, replace: true });else $rootScope.$emit(enums.busNavigation.productDetailed, { product: product });
                                });
                            } else if (User_IsVerfied || $scope.productBookingDetails.UserCustomerDetail.User_VerifyingStatus === 1) $rootScope.$emit(enums.busNavigation.transactionDetailed, {
                                bookingId: bookingId,
                                replace: true
                            });else {
                                $rootScope.$emit(enums.busNavigation.idVerification, { bookingId: bookingId, replace: true });
                            }
                        } else {
                            popupService.hideLoader();
                        }

                        _context.next = 34;
                        break;

                    case 26:
                        _context.prev = 26;
                        _context.t0 = _context['catch'](6);
                        errMsg = null;

                        if (_context.t0.data && _context.t0.data.error && _context.t0.data.error.code) {
                            //stripe error code from token creation
                            errMsg = $translate.instant(_context.t0.data.error.code);
                        } else {
                            errMsg = (_context.t0.data || {}).Message || _context.t0.message || 'DEFAULT_ERROR';
                        }
                        console.error(_context.t0);
                        popupService.hideLoader();
                        $scope.statusError = errMsg;
                        toastService.simpleToast($translate.instant(errMsg));

                    case 34:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, _this10, [[6, 26]]);
    }));

    $scope.createNewCardToken = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var _$scope$ccModel, number, exp_month, exp_year, cvc, name, tokenRes, data, id, card;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        _$scope$ccModel = $scope.ccModel, number = _$scope$ccModel.number, exp_month = _$scope$ccModel.exp_month, exp_year = _$scope$ccModel.exp_year, cvc = _$scope$ccModel.cvc, name = _$scope$ccModel.name;
                        // create new token and customer for new card

                        _context2.next = 3;
                        return stripeService.createToken({ number: number, exp_month: exp_month, exp_year: exp_year, cvc: cvc, name: name });

                    case 3:
                        tokenRes = _context2.sent;

                        if (!tokenRes.data) {
                            _context2.next = 14;
                            break;
                        }

                        data = tokenRes.data;
                        id = data.id, card = data.card;

                        if (!(!$scope.isBuy && card && card.funding == 'credit' || $scope.isBuy && card)) {
                            _context2.next = 11;
                            break;
                        }

                        return _context2.abrupt('return', data);

                    case 11:
                        throw new Error('DEBIT_CARD_NOT_SUPPORTED');

                    case 12:
                        _context2.next = 15;
                        break;

                    case 14:
                        throw new Error('CANT_CHARGE_CC');

                    case 15:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, _this10);
    }));

    $scope.createStripeCustomer = function () {
        var _ref61 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(tokenId, email) {
            var stripeCustomer;
            return regeneratorRuntime.wrap(function _callee3$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            _context3.next = 2;
                            return apiService.payments.createStripeCustomer({
                                cardToken: tokenId,
                                email: email
                            });

                        case 2:
                            stripeCustomer = _context3.sent;

                            if (!(stripeCustomer && stripeCustomer.Data)) {
                                _context3.next = 8;
                                break;
                            }

                            console.log(JSON.stringify(stripeCustomer.Data));
                            return _context3.abrupt('return', stripeCustomer.Data);

                        case 8:
                            throw new Error('COULD_CREATE_STRIPE_CUSTOMER');

                        case 9:
                        case 'end':
                            return _context3.stop();
                    }
                }
            }, _callee3, _this10);
        }));

        return function (_x27, _x28) {
            return _ref61.apply(this, arguments);
        };
    }();

    $scope.chargeCard = function () {
        var _ref62 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(customerId, stripeEmail) {
            var product, rentStartDate, rentEndDate, ccModel, coupon, rentalDays;
            return regeneratorRuntime.wrap(function _callee4$(_context4) {
                while (1) {
                    switch (_context4.prev = _context4.next) {
                        case 0:
                            product = $scope.product, rentStartDate = $scope.rentStartDate, rentEndDate = $scope.rentEndDate, ccModel = $scope.ccModel, coupon = $scope.coupon;

                            if ($scope.isBuy) {
                                _context4.next = 8;
                                break;
                            }

                            rentalDays = ptUtils.getRentalPeriodInDays({
                                startRentDate: rentStartDate,
                                endRentDate: rentEndDate
                            });
                            _context4.next = 5;
                            return apiService.bookings.bookProduct({
                                stripeEmail: stripeEmail,
                                borrowerId: Number(appStateManager.getUserId()),
                                lenderId: product.Lender_UserId,
                                productId: product.Product_Id,
                                startDate: moment(rentStartDate).format('MM/DD/YYYY'),
                                endDate: moment(rentEndDate).format('MM/DD/YYYY'),
                                stripeCustomerId: customerId,
                                noOfDays: rentalDays,
                                isSaveCard: ccModel.isSaveCardForFutureTransactions,
                                isPickUp: !ccModel.isDelivery,
                                deliveryAddress: ccModel.isDelivery ? ccModel.deliveryAddress : undefined,
                                deliveryLat: ccModel.isDelivery ? ccModel.productLat : undefined,
                                deliveryLng: ccModel.isDelivery ? ccModel.productLng : undefined,
                                deliveryName: ccModel.isDelivery ? ccModel.deliveryName : undefined,
                                deliveryPhone: ccModel.isDelivery ? ccModel.deliveryPhone : undefined,
                                deliveryBell: ccModel.isDelivery ? ccModel.deliveryBell : undefined,
                                coupon: coupon != undefined ? coupon.Coupon : undefined,
                                idVerified: appStateManager.user.User_IsVerfied,
                                isTryAndBuy: product.Product_TryAndBuy
                            });

                        case 5:
                            return _context4.abrupt('return', _context4.sent);

                        case 8:
                            _context4.next = 10;
                            return apiService.purchase.buyProduct({
                                stripeEmail: stripeEmail,
                                bookingId: $scope.bookingId || undefined,
                                borrowerId: Number(appStateManager.getUserId()),
                                purchaseAmount: product.Product_PurchasePrice + product.Product_Process_Fee,
                                lenderId: product.Lender_UserId,
                                productId: product.Product_Id,
                                stripeCustomerId: customerId,
                                isSaveCard: ccModel.isSaveCardForFutureTransactions,
                                isPickUp: !ccModel.isDelivery,
                                deliveryAddress: ccModel.isDelivery ? ccModel.deliveryAddress : undefined,
                                deliveryLat: ccModel.isDelivery ? ccModel.productLat : undefined,
                                deliveryLng: ccModel.isDelivery ? ccModel.productLng : undefined,
                                deliveryName: ccModel.isDelivery ? ccModel.deliveryName : undefined,
                                deliveryPhone: ccModel.isDelivery ? ccModel.deliveryPhone : undefined,
                                deliveryBell: ccModel.isDelivery ? ccModel.deliveryBell : undefined
                            });

                        case 10:
                            return _context4.abrupt('return', _context4.sent);

                        case 11:
                        case 'end':
                            return _context4.stop();
                    }
                }
            }, _callee4, _this10);
        }));

        return function (_x29, _x30) {
            return _ref62.apply(this, arguments);
        };
    }();

    var deregs = [];

    deregs.push($rootScope.$on(enums.busEvents.googlePlacesAutocompletePlaceChanged, function (event, data) {
        if (data.elementId == 'productDeliveryAddress') {
            var place = data.place,
                geometry = place.geometry;
            $scope.ccModel.productLat = geometry.location.lat();
            $scope.ccModel.productLng = geometry.location.lng();
            $scope.ccModel.productLocationId = place.id;
        }
    }));

    var unsavedChanges = function unsavedChanges(e) {
        event.returnValue = 'are you sure?';
    };

    window.addEventListener('beforeunload', unsavedChanges);

    $scope.$on('$destroy', function () {
        while (deregs.length) {
            deregs.pop()();
        }window.removeEventListener('beforeunload', unsavedChanges);
    });
}]);

'use strict';
angular.module('paladinApp').controller('userVerificationController', ['$rootScope', '$scope', 'enums', 'apiService', 'appStateManager', 'toastService', 'uploadHandler', '$timeout', 'ptUtils', 'acuantService', 'dataService', '$stateParams', 'popupService', '$base64', '$translate', 'gtmService', function ($rootScope, $scope, enums, apiService, appStateManager, toastService, uploadHandler, $timeout, ptUtils, acuantService, dataService, $stateParams, popupService, $base64, $translate, gtmService) {
    var _this11 = this;

    if ($stateParams.bookingId) {
        $scope.bookingId = $stateParams.bookingId;
    }
    $scope.isLoading = false;
    $scope.statusError = null;
    $scope.selectedUploadMethod = enums.idVerificationMethod.passport;

    $scope.uploadMethods = [{
        title: 'UPLOAD_METHOD_PASS',
        value: enums.idVerificationMethod.passport
    }, {
        title: 'UPLOAD_METHOD_DL',
        value: enums.idVerificationMethod.driverLicense
    }, {
        title: 'UPLOAD_METHOD_NATIONAL_ID',
        value: enums.idVerificationMethod.id
    }];

    $scope.uploadData = {};

    var idVerificationMethodPassportTmpl = [{
        elementId: 'passportUpload',
        title: 'TAP_TO_UPLOAD_PASS',
        imgData: null,
        isProcessingImg: false,
        cardType: 'Passport'
    }, {
        elementId: 'idSelfie',
        title: 'TAKE_SELFIE',
        imgData: null,
        isProcessingImg: false,
        cardType: ''
    }];

    var idVerificationMethodDriverLicenceTmpl = [{
        elementId: 'driverLicenseFront',
        title: 'DL_FRONT',
        imgData: null,
        isProcessingImg: false,
        cardType: 'DriversLicenseDuplex'
    }, {
        elementId: 'driverLicenseBack',
        title: 'DL_BACK',
        imgData: null,
        isProcessingImg: false,
        cardType: 'DriversLicenseDuplex'
    }, {
        elementId: 'driverLicenseSelfie',
        title: 'TAKE_SELFIE',
        imgData: null,
        isProcessingImg: false,
        cardType: ''
    }];

    var idVerificationMethodIdTmpl = [{
        elementId: 'idFront',
        title: 'NATIONAL_ID_FRONT',
        imgData: null,
        isProcessingImg: false,
        cardType: 'DriversLicenseDuplex'
    }, {
        elementId: 'idBack',
        title: 'NATIONAL_ID_BACK',
        imgData: null,
        isProcessingImg: false,
        cardType: 'DriversLicenseDuplex'
    }, {
        elementId: 'idSelfie',
        title: 'TAKE_SELFIE',
        imgData: null,
        isProcessingImg: false,
        cardType: ''
    }];

    $scope.selectUploadMethod = function (method) {
        $scope.selectedUploadMethod = method;
    };

    $scope.clickToUpload = function (elementId) {
        $scope.$$postDigest(function () {
            angular.element(document.getElementById(elementId))[0].click();
        });
    };

    var setFreshForm = function setFreshForm() {
        // remove selected images
        $scope.uploadData[enums.idVerificationMethod.passport] = angular.copy(idVerificationMethodPassportTmpl);
        $scope.uploadData[enums.idVerificationMethod.driverLicense] = angular.copy(idVerificationMethodDriverLicenceTmpl);
        $scope.uploadData[enums.idVerificationMethod.id] = angular.copy(idVerificationMethodIdTmpl);
    };
    setFreshForm();

    $scope.verifyId = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
        var uploadData, selectedUploadMethod, isValid, selfie, acuantPassUploadRes, _acuantPassUploadRes$, WebResponseCode, WebResponseDescription, FaceImage, base64FaceImage, faceImgBlob, facialMatchRes, _facialMatchRes$data, ResponseCodeAuthorization, ResponseMessageAuthorization, _WebResponseCode, _WebResponseDescription, frontImage, backImage, _selfie, acuantDuplexUpload, _acuantDuplexUpload$d, _ResponseCodeAuthorization, _ResponseMessageAuthorization, ResponseCodeAutoDetectState, ResponseCodeAutoDetectStateDesc, ResponseCodeProcState, ResponseCodeProcessStateDesc, _WebResponseCode2, _WebResponseDescription2, _FaceImage, _base64FaceImage, _faceImgBlob, _facialMatchRes, _facialMatchRes$data2, _ResponseCodeAuthorization2, _ResponseMessageAuthorization2, _WebResponseCode3, _WebResponseDescription3;

        return regeneratorRuntime.wrap(function _callee5$(_context5) {
            while (1) {
                switch (_context5.prev = _context5.next) {
                    case 0:
                        uploadData = $scope.uploadData, selectedUploadMethod = $scope.selectedUploadMethod;
                        isValid = true;

                        uploadData[selectedUploadMethod].forEach(function (item) {
                            isValid = isValid && item.imgData != undefined && item.imgBlob != undefined;
                        });

                        if (isValid) {
                            _context5.next = 6;
                            break;
                        }

                        toastService.simpleToast($translate.instant('UPLOAD_MISSING_DOCS'));
                        return _context5.abrupt('return');

                    case 6:
                        $scope.isLoading = true;
                        $scope.statusError = null;
                        _context5.prev = 8;

                        if (!(selectedUploadMethod === enums.idVerificationMethod.passport)) {
                            _context5.next = 44;
                            break;
                        }

                        selfie = uploadData[selectedUploadMethod][1].imgBlob;
                        _context5.next = 13;
                        return acuantService.processPassportImage({
                            imageToProcess: uploadData[selectedUploadMethod][0].imgBlob,
                            imageSource: enums.acuantImageSource.Other,
                            usePreprocessing: true
                        });

                    case 13:
                        acuantPassUploadRes = _context5.sent;

                        if (!(acuantPassUploadRes && acuantPassUploadRes.data)) {
                            _context5.next = 41;
                            break;
                        }

                        _acuantPassUploadRes$ = acuantPassUploadRes.data, WebResponseCode = _acuantPassUploadRes$.WebResponseCode, WebResponseDescription = _acuantPassUploadRes$.WebResponseDescription, FaceImage = _acuantPassUploadRes$.FaceImage;

                        if (!(WebResponseCode == 1)) {
                            _context5.next = 38;
                            break;
                        }

                        if (!(FaceImage == null || FaceImage == '')) {
                            _context5.next = 21;
                            break;
                        }

                        throw new Error('COULD_NOT_EXTRACT_IMAGE_FROM_DATA');

                    case 21:
                        base64FaceImage = goog.crypt.base64.encodeByteArray(FaceImage);
                        faceImgBlob = ptUtils.dataUrlToBlob('data:image/jpg;base64,' + base64FaceImage);
                        _context5.next = 25;
                        return acuantService.processFacialMatch({
                            idFaceImage: faceImgBlob,
                            selfie: selfie
                        });

                    case 25:
                        facialMatchRes = _context5.sent;
                        _facialMatchRes$data = facialMatchRes.data, ResponseCodeAuthorization = _facialMatchRes$data.ResponseCodeAuthorization, ResponseMessageAuthorization = _facialMatchRes$data.ResponseMessageAuthorization, _WebResponseCode = _facialMatchRes$data.WebResponseCode, _WebResponseDescription = _facialMatchRes$data.WebResponseDescription;

                        if (!(ResponseCodeAuthorization < 0)) {
                            _context5.next = 31;
                            break;
                        }

                        throw new Error(ResponseMessageAuthorization);

                    case 31:
                        if (!(_WebResponseCode < 0)) {
                            _context5.next = 35;
                            break;
                        }

                        throw new Error(_WebResponseDescription);

                    case 35:
                        $scope.uploadVerifiedImageToPaladinServers();

                    case 36:
                        _context5.next = 39;
                        break;

                    case 38:
                        throw new Error(WebResponseDescription);

                    case 39:
                        _context5.next = 42;
                        break;

                    case 41:
                        throw new Error('DEFAULT_ERROR');

                    case 42:
                        _context5.next = 91;
                        break;

                    case 44:
                        if (!(selectedUploadMethod === enums.idVerificationMethod.driverLicense || selectedUploadMethod === enums.idVerificationMethod.id)) {
                            _context5.next = 90;
                            break;
                        }

                        frontImage = uploadData[selectedUploadMethod][0].imgBlob;
                        backImage = uploadData[selectedUploadMethod][1].imgBlob;
                        _selfie = uploadData[selectedUploadMethod][2].imgBlob;
                        _context5.next = 50;
                        return acuantService.processNICDLDuplexImage({
                            frontImage: frontImage,
                            backImage: backImage,
                            selectedRegion: enums.acuantRegions.Europe,
                            imageSource: enums.acuantImageSource.Other,
                            usePreprocessing: true
                        });

                    case 50:
                        acuantDuplexUpload = _context5.sent;


                        // const acuantDuplexUpload = await acuantService.processDriversLicense({
                        //     imageToProcess: frontImage,
                        //     selectedRegion: enums.acuantRegions.Europe,
                        //     imageSource: enums.acuantImageSource.Other,
                        //     usePreprocessing: true,
                        // });

                        _acuantDuplexUpload$d = acuantDuplexUpload.data, _ResponseCodeAuthorization = _acuantDuplexUpload$d.ResponseCodeAuthorization, _ResponseMessageAuthorization = _acuantDuplexUpload$d.ResponseMessageAuthorization, ResponseCodeAutoDetectState = _acuantDuplexUpload$d.ResponseCodeAutoDetectState, ResponseCodeAutoDetectStateDesc = _acuantDuplexUpload$d.ResponseCodeAutoDetectStateDesc, ResponseCodeProcState = _acuantDuplexUpload$d.ResponseCodeProcState, ResponseCodeProcessStateDesc = _acuantDuplexUpload$d.ResponseCodeProcessStateDesc, _WebResponseCode2 = _acuantDuplexUpload$d.WebResponseCode, _WebResponseDescription2 = _acuantDuplexUpload$d.WebResponseDescription, _FaceImage = _acuantDuplexUpload$d.FaceImage;

                        if (!(_ResponseCodeAuthorization < 0)) {
                            _context5.next = 56;
                            break;
                        }

                        throw new Error(_ResponseMessageAuthorization);

                    case 56:
                        if (!(ResponseCodeAutoDetectState < 0)) {
                            _context5.next = 60;
                            break;
                        }

                        throw new Error(ResponseCodeAutoDetectStateDesc);

                    case 60:
                        if (!(ResponseCodeProcState < 0)) {
                            _context5.next = 64;
                            break;
                        }

                        throw new Error(ResponseCodeProcessStateDesc);

                    case 64:
                        if (!(_WebResponseCode2 < 0)) {
                            _context5.next = 68;
                            break;
                        }

                        throw new Error(_WebResponseDescription2);

                    case 68:
                        if (!(_FaceImage == null || _FaceImage == '')) {
                            _context5.next = 72;
                            break;
                        }

                        throw new Error('COULD_NOT_EXTRACT_IMAGE_FROM_DATA');

                    case 72:
                        _base64FaceImage = goog.crypt.base64.encodeByteArray(_FaceImage);
                        _faceImgBlob = ptUtils.dataUrlToBlob('data:image/jpg;base64,' + _base64FaceImage);
                        _context5.next = 76;
                        return acuantService.processFacialMatch({
                            idFaceImage: _faceImgBlob,
                            selfie: _selfie
                        });

                    case 76:
                        _facialMatchRes = _context5.sent;
                        _facialMatchRes$data2 = _facialMatchRes.data, _ResponseCodeAuthorization2 = _facialMatchRes$data2.ResponseCodeAuthorization, _ResponseMessageAuthorization2 = _facialMatchRes$data2.ResponseMessageAuthorization, _WebResponseCode3 = _facialMatchRes$data2.WebResponseCode, _WebResponseDescription3 = _facialMatchRes$data2.WebResponseDescription;

                        if (!(_ResponseCodeAuthorization2 < 0)) {
                            _context5.next = 82;
                            break;
                        }

                        throw new Error(_ResponseMessageAuthorization2);

                    case 82:
                        if (!(_WebResponseCode3 < 0)) {
                            _context5.next = 86;
                            break;
                        }

                        throw new Error(_WebResponseDescription3);

                    case 86:
                        $scope.uploadVerifiedImageToPaladinServers();
                        gtmService.trackEvent('id-verification', 'id-verification-successful');

                    case 88:
                        _context5.next = 91;
                        break;

                    case 90:
                        // toastService.simpleToast('upload shit');
                        new Error('Operation not supported'); // will never happen

                    case 91:
                        _context5.next = 100;
                        break;

                    case 93:
                        _context5.prev = 93;
                        _context5.t0 = _context5['catch'](8);

                        $scope.isLoading = false;
                        gtmService.trackEvent('id-verification', 'id-verification-failed');

                        // let requestManualVerification = () => {
                        // make api call with same documents
                        console.log('requestManualVerification ', $scope);
                        if (selectedUploadMethod === enums.idVerificationMethod.passport) {
                            apiService.verification.sendToManualVerification({
                                passportImage: uploadData[selectedUploadMethod][0].imgData.split(',')[1],
                                selfie: uploadData[selectedUploadMethod][1].imgData.split(',')[1],
                                userId: appStateManager.getUserId(),
                                bookingId: $scope.bookingId
                            }).then(function (result) {
                                // redirect to rental status page
                                $scope.finishVerificationManual();
                                toastService.simpleToast($translate.instant('ID_VERIFY_FAIL_POPUP_ON_SUCCESS'));
                            }, function (err) {
                                console.log('sendToManualVerification error', err);
                                setFreshForm();
                                toastService.simpleToast($translate.instant('ID_VERIFY_FAIL_POPUP_ON_FAIL'));
                            });
                        } else if (selectedUploadMethod === enums.idVerificationMethod.driverLicense || selectedUploadMethod === enums.idVerificationMethod.id) {

                            apiService.verification.sendToManualVerification({
                                NICDLFront: uploadData[selectedUploadMethod][0].imgData.split(',')[1],
                                NICDLBack: uploadData[selectedUploadMethod][1].imgData.split(',')[1],
                                selfie: uploadData[selectedUploadMethod][2].imgData.split(',')[1],
                                userId: appStateManager.getUserId(),
                                bookingId: $scope.bookingId
                            }).then(function (result) {
                                // redirect to rental status page
                                $scope.finishVerificationManual();
                                toastService.simpleToast($translate.instant('ID_VERIFY_FAIL_POPUP_ON_SUCCESS'));
                            }, function (err) {
                                console.log('sendToManualVerification err', err);
                                setFreshForm();
                                toastService.simpleToast($translate.instant('ID_VERIFY_FAIL_POPUP_ON_FAIL'));
                            });
                        }
                        // };

                        // console.log('??????????? ', err.data, ' ... ', err.message, ' ... ', 'DEFAULT_ERROR')
                        // $scope.statusError = (err.data || {}).Message || err.message || $translate.instant('DEFAULT_ERROR');
                        // popupService.showIdVerificationFailureHandler({
                        //     message: $scope.statusError,
                        //     retryClb: () => {
                        //         setFreshForm();
                        //     },
                        //     sendToManualClb: requestManualVerification
                        // });
                        // $rootScope.$emit(enums.busNavigation.transactionDetailed,{ bookingId: $scope.bookingId, replace: true  });
                        $scope.$apply();

                    case 100:
                    case 'end':
                        return _context5.stop();
                }
            }
        }, _callee5, _this11, [[8, 93]]);
    }));

    $scope.uploadVerifiedImageToPaladinServers = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
        var uploadData, selectedUploadMethod, passportImage, selfie, passUploadRes, NICDLFront, NICDLBack, _selfie2, NICDLUploadRes;

        return regeneratorRuntime.wrap(function _callee6$(_context6) {
            while (1) {
                switch (_context6.prev = _context6.next) {
                    case 0:
                        uploadData = $scope.uploadData, selectedUploadMethod = $scope.selectedUploadMethod;

                        if (!(selectedUploadMethod === enums.idVerificationMethod.passport)) {
                            _context6.next = 14;
                            break;
                        }

                        passportImage = uploadData[selectedUploadMethod][0].imgData.split(',')[1];
                        selfie = uploadData[selectedUploadMethod][1].imgData.split(',')[1];
                        _context6.next = 6;
                        return apiService.verification.uploadPassport({
                            passportImage: passportImage,
                            selfie: selfie,
                            userId: appStateManager.getUserId()
                        });

                    case 6:
                        passUploadRes = _context6.sent;

                        if (!(passUploadRes && passUploadRes.Status === 'success')) {
                            _context6.next = 11;
                            break;
                        }

                        $scope.finishVerification();
                        _context6.next = 12;
                        break;

                    case 11:
                        throw new Error(passUploadRes.Message || 'DEFAULT_ERROR');

                    case 12:
                        _context6.next = 26;
                        break;

                    case 14:
                        if (!(selectedUploadMethod === enums.idVerificationMethod.driverLicense || selectedUploadMethod === enums.idVerificationMethod.id)) {
                            _context6.next = 26;
                            break;
                        }

                        NICDLFront = uploadData[selectedUploadMethod][0].imgData.split(',')[1];
                        NICDLBack = uploadData[selectedUploadMethod][1].imgData.split(',')[1];
                        _selfie2 = uploadData[selectedUploadMethod][2].imgData.split(',')[1];
                        _context6.next = 20;
                        return apiService.verification.uploadNICDL({
                            NICDLFront: NICDLFront,
                            NICDLBack: NICDLBack,
                            selfie: _selfie2,
                            userId: appStateManager.getUserId()
                        });

                    case 20:
                        NICDLUploadRes = _context6.sent;

                        if (!(NICDLUploadRes && NICDLUploadRes.Status === 'success')) {
                            _context6.next = 25;
                            break;
                        }

                        $scope.finishVerification();
                        _context6.next = 26;
                        break;

                    case 25:
                        throw new Error(NICDLUploadRes.Message || 'DEFAULT_ERROR');

                    case 26:
                    case 'end':
                        return _context6.stop();
                }
            }
        }, _callee6, _this11);
    }));

    $scope.finishVerification = function () {
        $scope.isLoading = false;
        $scope.statusError = null;

        popupService.showAlert('SUCCESS', 'ID_SUCCESSFULLY_VERIFIED').finally(function () {
            if ($scope.bookingId) $rootScope.$emit(enums.busNavigation.transactionDetailed, { bookingId: $scope.bookingId, replace: true });else $rootScope.$emit(enums.busNavigation.userProfile, { userId: appStateManager.getUserId() });
        });
    };

    $scope.finishVerificationManual = function () {
        $scope.isLoading = false;
        $scope.statusError = null;
        //show popup only for Desktop
        if (ptUtils.isMobile.any()) {
            if ($scope.bookingId) $rootScope.$emit(enums.busNavigation.transactionDetailed, { bookingId: $scope.bookingId, replace: true });else $rootScope.$emit(enums.busNavigation.userProfile, { userId: appStateManager.getUserId() });
        } else {
            popupService.showAlert('ID_VER_MANUAL_POPUP', 'ID_VER_MANUAL_POPUP_TEXT').finally(function () {
                if ($scope.bookingId) $rootScope.$emit(enums.busNavigation.transactionDetailed, { bookingId: $scope.bookingId, replace: true });else $rootScope.$emit(enums.busNavigation.userProfile, { userId: appStateManager.getUserId() });
            });
        }
    };

    $scope.skipVerification = function () {
        $rootScope.$emit(enums.busNavigation.transactionDetailed, { bookingId: $scope.bookingId, replace: true });
    };

    $scope.onUploaded = function (inputElement) {
        if (inputElement.files && inputElement.files.length > 0) {
            var uploadData = $scope.uploadData,
                selectedUploadMethod = $scope.selectedUploadMethod;

            var photoIndex = uploadData[selectedUploadMethod].findIndex(function (item) {
                return item.elementId === inputElement.id;
            });
            if (photoIndex != undefined) {
                $scope.$evalAsync(function () {
                    uploadData[selectedUploadMethod][photoIndex].isProcessingImg = true;
                    // Resize
                    canvasResize(inputElement.files[0], {
                        quality: 75,
                        isPreprocessing: true,
                        cardType: uploadData[selectedUploadMethod][photoIndex].cardType,
                        maxW: 2048,
                        maxH: 2008,
                        isiOS: ptUtils.isMobile.iOS(),
                        callback: function callback(data, width, height) {
                            $scope.$evalAsync(function () {
                                uploadData[selectedUploadMethod][photoIndex].imgData = data;
                                uploadData[selectedUploadMethod][photoIndex].imgBlob = ptUtils.dataUrlToBlob(data);
                                uploadData[selectedUploadMethod][photoIndex].isProcessingImg = false;
                            });
                        }
                    });
                    // uploadHandler.convertInputElementToBas64(inputElement)
                    //     .then((data) => {
                    //         $scope.$evalAsync(() => {
                    //             uploadData[selectedUploadMethod][photoIndex].imgData = data.original64;
                    //             uploadData[selectedUploadMethod][photoIndex].imgBlob = ptUtils.dataUrlToBlob(data.original64);
                    //             uploadData[selectedUploadMethod][photoIndex].isProcessingImg = false;
                    //         })
                    //     })
                    //     .catch((err) => {
                    //         toastService.simpleToast(JSON.stringify(err));
                    //         console.error(err);
                    //     })
                });
            }
        }
    };

    $scope.showToast = function (message) {
        var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3000;

        $mdToast.show($mdToast.simple().textContent(message).hideDelay(delay));
    };
}]);
'use strict';
angular.module('paladinApp').controller('chatController', ['$rootScope', '$scope', '$mdMedia', '$mdSidenav', 'appStateManager', 'enums', '$stateParams', 'chatService', '$mdMedia', function ($rootScope, $scope, $mdMedia, $mdSidenav, appStateManager, enums, $stateParams, chatService) {

    $scope.isLoading = false;
    $scope.isChatCollapsed = false;
    $scope.preSelectedchat = { value: undefined };
    $scope.isGtMd = $mdMedia('gt-md');
    $scope.isGtSM = $mdMedia('gt-sm');
    if ($stateParams.chatId) chatService.activateChatWhenReady($stateParams.chatId);

    $scope.toggleNav = function () {
        $mdSidenav('chat-list-side-nav').toggle();
    };

    var deregs = [];

    deregs.push($scope.$watch(function () {
        return $mdMedia('gt-md');
    }, function (mgMd) {
        $scope.isGtMd = mgMd;
        $scope.isChatCollapsed = mgMd;
    }));
    deregs.push($scope.$watch(function () {
        return $mdMedia('gt-sm');
    }, function (mgSm) {
        $scope.isGtSM = mgSm;
    }));

    $scope.$on('$destroy', function () {
        while (deregs.length) {
            deregs.pop()();
        }
    });
}]);
//# sourceMappingURL=body.js.map
