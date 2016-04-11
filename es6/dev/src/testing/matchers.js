import { DOM } from 'angular2/src/platform/dom/dom_adapter';
import { global, isString } from 'angular2/src/facade/lang';
import { StringMapWrapper } from 'angular2/src/facade/collection';
var _global = (typeof window === 'undefined' ? global : window);
/**
 * Jasmine matching function with Angular matchers mixed in.
 *
 * ## Example
 *
 * {@example testing/ts/matchers.ts region='toHaveText'}
 */
export var expect = _global.expect;
// Some Map polyfills don't polyfill Map.toString correctly, which
// gives us bad error messages in tests.
// The only way to do this in Jasmine is to monkey patch a method
// to the object :-(
Map.prototype['jasmineToString'] = function () {
    var m = this;
    if (!m) {
        return '' + m;
    }
    var res = [];
    m.forEach((v, k) => { res.push(`${k}:${v}`); });
    return `{ ${res.join(',')} }`;
};
_global.beforeEach(function () {
    jasmine.addMatchers({
        // Custom handler for Map as Jasmine does not support it yet
        toEqual: function (util, customEqualityTesters) {
            return {
                compare: function (actual, expected) {
                    return { pass: util.equals(actual, expected, [compareMap]) };
                }
            };
            function compareMap(actual, expected) {
                if (actual instanceof Map) {
                    var pass = actual.size === expected.size;
                    if (pass) {
                        actual.forEach((v, k) => { pass = pass && util.equals(v, expected.get(k)); });
                    }
                    return pass;
                }
                else {
                    return undefined;
                }
            }
        },
        toBePromise: function () {
            return {
                compare: function (actual, expectedClass) {
                    var pass = typeof actual === 'object' && typeof actual.then === 'function';
                    return { pass: pass, get message() { return 'Expected ' + actual + ' to be a promise'; } };
                }
            };
        },
        toBeAnInstanceOf: function () {
            return {
                compare: function (actual, expectedClass) {
                    var pass = typeof actual === 'object' && actual instanceof expectedClass;
                    return {
                        pass: pass,
                        get message() {
                            return 'Expected ' + actual + ' to be an instance of ' + expectedClass;
                        }
                    };
                }
            };
        },
        toHaveText: function () {
            return {
                compare: function (actual, expectedText) {
                    var actualText = elementText(actual);
                    return {
                        pass: actualText == expectedText,
                        get message() { return 'Expected ' + actualText + ' to be equal to ' + expectedText; }
                    };
                }
            };
        },
        toHaveCssClass: function () {
            return { compare: buildError(false), negativeCompare: buildError(true) };
            function buildError(isNot) {
                return function (actual, className) {
                    return {
                        pass: DOM.hasClass(actual, className) == !isNot,
                        get message() {
                            return `Expected ${actual.outerHTML} ${isNot ? 'not ' : ''}to contain the CSS class "${className}"`;
                        }
                    };
                };
            }
        },
        toHaveCssStyle: function () {
            return {
                compare: function (actual, styles) {
                    var allPassed;
                    if (isString(styles)) {
                        allPassed = DOM.hasStyle(actual, styles);
                    }
                    else {
                        allPassed = !StringMapWrapper.isEmpty(styles);
                        StringMapWrapper.forEach(styles, (style, prop) => {
                            allPassed = allPassed && DOM.hasStyle(actual, prop, style);
                        });
                    }
                    return {
                        pass: allPassed,
                        get message() {
                            var expectedValueStr = isString(styles) ? styles : JSON.stringify(styles);
                            return `Expected ${actual.outerHTML} ${!allPassed ? ' ' : 'not '}to contain the
                      CSS ${isString(styles) ? 'property' : 'styles'} "${expectedValueStr}"`;
                        }
                    };
                }
            };
        },
        toContainError: function () {
            return {
                compare: function (actual, expectedText) {
                    var errorMessage = actual.toString();
                    return {
                        pass: errorMessage.indexOf(expectedText) > -1,
                        get message() { return 'Expected ' + errorMessage + ' to contain ' + expectedText; }
                    };
                }
            };
        },
        toThrowErrorWith: function () {
            return {
                compare: function (actual, expectedText) {
                    try {
                        actual();
                        return {
                            pass: false,
                            get message() { return "Was expected to throw, but did not throw"; }
                        };
                    }
                    catch (e) {
                        var errorMessage = e.toString();
                        return {
                            pass: errorMessage.indexOf(expectedText) > -1,
                            get message() { return 'Expected ' + errorMessage + ' to contain ' + expectedText; }
                        };
                    }
                }
            };
        },
        toMatchPattern() {
            return { compare: buildError(false), negativeCompare: buildError(true) };
            function buildError(isNot) {
                return function (actual, regex) {
                    return {
                        pass: regex.test(actual) == !isNot,
                        get message() {
                            return `Expected ${actual} ${isNot ? 'not ' : ''}to match ${regex.toString()}`;
                        }
                    };
                };
            }
        },
        toImplement: function () {
            return {
                compare: function (actualObject, expectedInterface) {
                    var objProps = Object.keys(actualObject.constructor.prototype);
                    var intProps = Object.keys(expectedInterface.prototype);
                    var missedMethods = [];
                    intProps.forEach((k) => {
                        if (!actualObject.constructor.prototype[k])
                            missedMethods.push(k);
                    });
                    return {
                        pass: missedMethods.length == 0,
                        get message() {
                            return 'Expected ' + actualObject + ' to have the following methods: ' +
                                missedMethods.join(", ");
                        }
                    };
                }
            };
        }
    });
});
function elementText(n) {
    var hasNodes = (n) => {
        var children = DOM.childNodes(n);
        return children && children.length > 0;
    };
    if (n instanceof Array) {
        return n.map(elementText).join("");
    }
    if (DOM.isCommentNode(n)) {
        return '';
    }
    if (DOM.isElementNode(n) && DOM.tagName(n) == 'CONTENT') {
        return elementText(Array.prototype.slice.apply(DOM.getDistributedNodes(n)));
    }
    if (DOM.hasShadowRoot(n)) {
        return elementText(DOM.childNodesAsList(DOM.getShadowRoot(n)));
    }
    if (hasNodes(n)) {
        return elementText(DOM.childNodesAsList(n));
    }
    return DOM.getText(n);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2hlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkaWZmaW5nX3BsdWdpbl93cmFwcGVyLW91dHB1dF9wYXRoLXdYSW5OMDY2LnRtcC9hbmd1bGFyMi9zcmMvdGVzdGluZy9tYXRjaGVycy50cyJdLCJuYW1lcyI6WyJjb21wYXJlTWFwIiwibWVzc2FnZSIsImJ1aWxkRXJyb3IiLCJ0b01hdGNoUGF0dGVybiIsInRvTWF0Y2hQYXR0ZXJuLmJ1aWxkRXJyb3IiLCJlbGVtZW50VGV4dCJdLCJtYXBwaW5ncyI6Ik9BQU8sRUFBQyxHQUFHLEVBQUMsTUFBTSx1Q0FBdUM7T0FDbEQsRUFBQyxNQUFNLEVBQUUsUUFBUSxFQUFDLE1BQU0sMEJBQTBCO09BQ2xELEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxnQ0FBZ0M7QUE2Ri9ELElBQUksT0FBTyxHQUFRLENBQUMsT0FBTyxNQUFNLEtBQUssV0FBVyxHQUFHLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQztBQUVyRTs7Ozs7O0dBTUc7QUFDSCxXQUFXLE1BQU0sR0FBcUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUdyRSxrRUFBa0U7QUFDbEUsd0NBQXdDO0FBQ3hDLGlFQUFpRTtBQUNqRSxvQkFBb0I7QUFDcEIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHO0lBQ2pDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztJQUNiLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNQLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2hCLENBQUM7SUFDRCxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDYixDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoRCxNQUFNLENBQUMsS0FBSyxH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QSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtBQUN4QkEsQ0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0RPTX0gZnJvbSAnYW5ndWxhcjIvc3JjL3BsYXRmb3JtL2RvbS9kb21fYWRhcHRlcic7XG5pbXBvcnQge2dsb2JhbCwgaXNTdHJpbmd9IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvbGFuZyc7XG5pbXBvcnQge1N0cmluZ01hcFdyYXBwZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvY29sbGVjdGlvbic7XG5cbi8qKlxuICogSmFzbWluZSBtYXRjaGVycyB0aGF0IGNoZWNrIEFuZ3VsYXIgc3BlY2lmaWMgY29uZGl0aW9ucy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZ01hdGNoZXJzIGV4dGVuZHMgamFzbWluZS5NYXRjaGVycyB7XG4gIC8qKlxuICAgKiBFeHBlY3QgdGhlIHZhbHVlIHRvIGJlIGEgYFByb21pc2VgLlxuICAgKlxuICAgKiAjIyBFeGFtcGxlXG4gICAqXG4gICAqIHtAZXhhbXBsZSB0ZXN0aW5nL3RzL21hdGNoZXJzLnRzIHJlZ2lvbj0ndG9CZVByb21pc2UnfVxuICAgKi9cbiAgdG9CZVByb21pc2UoKTogYm9vbGVhbjtcblxuICAvKipcbiAgICogRXhwZWN0IHRoZSB2YWx1ZSB0byBiZSBhbiBpbnN0YW5jZSBvZiBhIGNsYXNzLlxuICAgKlxuICAgKiAjIyBFeGFtcGxlXG4gICAqXG4gICAqIHtAZXhhbXBsZSB0ZXN0aW5nL3RzL21hdGNoZXJzLnRzIHJlZ2lvbj0ndG9CZUFuSW5zdGFuY2VPZid9XG4gICAqL1xuICB0b0JlQW5JbnN0YW5jZU9mKGV4cGVjdGVkOiBhbnkpOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBFeHBlY3QgdGhlIGVsZW1lbnQgdG8gaGF2ZSBleGFjdGx5IHRoZSBnaXZlbiB0ZXh0LlxuICAgKlxuICAgKiAjIyBFeGFtcGxlXG4gICAqXG4gICAqIHtAZXhhbXBsZSB0ZXN0aW5nL3RzL21hdGNoZXJzLnRzIHJlZ2lvbj0ndG9IYXZlVGV4dCd9XG4gICAqL1xuICB0b0hhdmVUZXh0KGV4cGVjdGVkOiBhbnkpOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBFeHBlY3QgdGhlIGVsZW1lbnQgdG8gaGF2ZSB0aGUgZ2l2ZW4gQ1NTIGNsYXNzLlxuICAgKlxuICAgKiAjIyBFeGFtcGxlXG4gICAqXG4gICAqIHtAZXhhbXBsZSB0ZXN0aW5nL3RzL21hdGNoZXJzLnRzIHJlZ2lvbj0ndG9IYXZlQ3NzQ2xhc3MnfVxuICAgKi9cbiAgdG9IYXZlQ3NzQ2xhc3MoZXhwZWN0ZWQ6IGFueSk6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEV4cGVjdCB0aGUgZWxlbWVudCB0byBoYXZlIHRoZSBnaXZlbiBDU1Mgc3R5bGVzLlxuICAgKlxuICAgKiAjIyBFeGFtcGxlXG4gICAqXG4gICAqIHtAZXhhbXBsZSB0ZXN0aW5nL3RzL21hdGNoZXJzLnRzIHJlZ2lvbj0ndG9IYXZlQ3NzU3R5bGUnfVxuICAgKi9cbiAgdG9IYXZlQ3NzU3R5bGUoZXhwZWN0ZWQ6IGFueSk6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEV4cGVjdCBhIGNsYXNzIHRvIGltcGxlbWVudCB0aGUgaW50ZXJmYWNlIG9mIHRoZSBnaXZlbiBjbGFzcy5cbiAgICpcbiAgICogIyMgRXhhbXBsZVxuICAgKlxuICAgKiB7QGV4YW1wbGUgdGVzdGluZy90cy9tYXRjaGVycy50cyByZWdpb249J3RvSW1wbGVtZW50J31cbiAgICovXG4gIHRvSW1wbGVtZW50KGV4cGVjdGVkOiBhbnkpOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBFeHBlY3QgYW4gZXhjZXB0aW9uIHRvIGNvbnRhaW4gdGhlIGdpdmVuIGVycm9yIHRleHQuXG4gICAqXG4gICAqICMjIEV4YW1wbGVcbiAgICpcbiAgICoge0BleGFtcGxlIHRlc3RpbmcvdHMvbWF0Y2hlcnMudHMgcmVnaW9uPSd0b0NvbnRhaW5FcnJvcid9XG4gICAqL1xuICB0b0NvbnRhaW5FcnJvcihleHBlY3RlZDogYW55KTogYm9vbGVhbjtcblxuICAvKipcbiAgICogRXhwZWN0IGEgZnVuY3Rpb24gdG8gdGhyb3cgYW4gZXJyb3Igd2l0aCB0aGUgZ2l2ZW4gZXJyb3IgdGV4dCB3aGVuIGV4ZWN1dGVkLlxuICAgKlxuICAgKiAjIyBFeGFtcGxlXG4gICAqXG4gICAqIHtAZXhhbXBsZSB0ZXN0aW5nL3RzL21hdGNoZXJzLnRzIHJlZ2lvbj0ndG9UaHJvd0Vycm9yV2l0aCd9XG4gICAqL1xuICB0b1Rocm93RXJyb3JXaXRoKGV4cGVjdGVkTWVzc2FnZTogYW55KTogYm9vbGVhbjtcblxuICAvKipcbiAgICogRXhwZWN0IGEgc3RyaW5nIHRvIG1hdGNoIHRoZSBnaXZlbiByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAqXG4gICAqICMjIEV4YW1wbGVcbiAgICpcbiAgICoge0BleGFtcGxlIHRlc3RpbmcvdHMvbWF0Y2hlcnMudHMgcmVnaW9uPSd0b01hdGNoUGF0dGVybid9XG4gICAqL1xuICB0b01hdGNoUGF0dGVybihleHBlY3RlZE1lc3NhZ2U6IGFueSk6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEludmVydCB0aGUgbWF0Y2hlcnMuXG4gICAqL1xuICBub3Q6IE5nTWF0Y2hlcnM7XG59XG5cbnZhciBfZ2xvYmFsID0gPGFueT4odHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB3aW5kb3cpO1xuXG4vKipcbiAqIEphc21pbmUgbWF0Y2hpbmcgZnVuY3Rpb24gd2l0aCBBbmd1bGFyIG1hdGNoZXJzIG1peGVkIGluLlxuICpcbiAqICMjIEV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgdGVzdGluZy90cy9tYXRjaGVycy50cyByZWdpb249J3RvSGF2ZVRleHQnfVxuICovXG5leHBvcnQgdmFyIGV4cGVjdDogKGFjdHVhbDogYW55KSA9PiBOZ01hdGNoZXJzID0gPGFueT5fZ2xvYmFsLmV4cGVjdDtcblxuXG4vLyBTb21lIE1hcCBwb2x5ZmlsbHMgZG9uJ3QgcG9seWZpbGwgTWFwLnRvU3RyaW5nIGNvcnJlY3RseSwgd2hpY2hcbi8vIGdpdmVzIHVzIGJhZCBlcnJvciBtZXNzYWdlcyBpbiB0ZXN0cy5cbi8vIFRoZSBvbmx5IHdheSB0byBkbyB0aGlzIGluIEphc21pbmUgaXMgdG8gbW9ua2V5IHBhdGNoIGEgbWV0aG9kXG4vLyB0byB0aGUgb2JqZWN0IDotKFxuTWFwLnByb3RvdHlwZVsnamFzbWluZVRvU3RyaW5nJ10gPSBmdW5jdGlvbigpIHtcbiAgdmFyIG0gPSB0aGlzO1xuICBpZiAoIW0pIHtcbiAgICByZXR1cm4gJycgKyBtO1xuICB9XG4gIHZhciByZXMgPSBbXTtcbiAgbS5mb3JFYWNoKCh2LCBrKSA9PiB7IHJlcy5wdXNoKGAke2t9OiR7dn1gKTsgfSk7XG4gIHJldHVybiBgeyAke3Jlcy5qb2luKCcsJyl9IH1gO1xufTtcblxuX2dsb2JhbC5iZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICBqYXNtaW5lLmFkZE1hdGNoZXJzKHtcbiAgICAvLyBDdXN0b20gaGFuZGxlciBmb3IgTWFwIGFzIEphc21pbmUgZG9lcyBub3Qgc3VwcG9ydCBpdCB5ZXRcbiAgICB0b0VxdWFsOiBmdW5jdGlvbih1dGlsLCBjdXN0b21FcXVhbGl0eVRlc3RlcnMpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbXBhcmU6IGZ1bmN0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4ge3Bhc3M6IHV0aWwuZXF1YWxzKGFjdHVhbCwgZXhwZWN0ZWQsIFtjb21wYXJlTWFwXSl9O1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiBjb21wYXJlTWFwKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgICAgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIE1hcCkge1xuICAgICAgICAgIHZhciBwYXNzID0gYWN0dWFsLnNpemUgPT09IGV4cGVjdGVkLnNpemU7XG4gICAgICAgICAgaWYgKHBhc3MpIHtcbiAgICAgICAgICAgIGFjdHVhbC5mb3JFYWNoKCh2LCBrKSA9PiB7IHBhc3MgPSBwYXNzICYmIHV0aWwuZXF1YWxzKHYsIGV4cGVjdGVkLmdldChrKSk7IH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcGFzcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIHRvQmVQcm9taXNlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbXBhcmU6IGZ1bmN0aW9uKGFjdHVhbCwgZXhwZWN0ZWRDbGFzcykge1xuICAgICAgICAgIHZhciBwYXNzID0gdHlwZW9mIGFjdHVhbCA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGFjdHVhbC50aGVuID09PSAnZnVuY3Rpb24nO1xuICAgICAgICAgIHJldHVybiB7cGFzczogcGFzcywgZ2V0IG1lc3NhZ2UoKSB7IHJldHVybiAnRXhwZWN0ZWQgJyArIGFjdHVhbCArICcgdG8gYmUgYSBwcm9taXNlJzsgfX07XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIHRvQmVBbkluc3RhbmNlT2Y6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29tcGFyZTogZnVuY3Rpb24oYWN0dWFsLCBleHBlY3RlZENsYXNzKSB7XG4gICAgICAgICAgdmFyIHBhc3MgPSB0eXBlb2YgYWN0dWFsID09PSAnb2JqZWN0JyAmJiBhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZENsYXNzO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwYXNzOiBwYXNzLFxuICAgICAgICAgICAgZ2V0IG1lc3NhZ2UoKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnRXhwZWN0ZWQgJyArIGFjdHVhbCArICcgdG8gYmUgYW4gaW5zdGFuY2Ugb2YgJyArIGV4cGVjdGVkQ2xhc3M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgdG9IYXZlVGV4dDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb21wYXJlOiBmdW5jdGlvbihhY3R1YWwsIGV4cGVjdGVkVGV4dCkge1xuICAgICAgICAgIHZhciBhY3R1YWxUZXh0ID0gZWxlbWVudFRleHQoYWN0dWFsKTtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcGFzczogYWN0dWFsVGV4dCA9PSBleHBlY3RlZFRleHQsXG4gICAgICAgICAgICBnZXQgbWVzc2FnZSgpIHsgcmV0dXJuICdFeHBlY3RlZCAnICsgYWN0dWFsVGV4dCArICcgdG8gYmUgZXF1YWwgdG8gJyArIGV4cGVjdGVkVGV4dDsgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIHRvSGF2ZUNzc0NsYXNzOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB7Y29tcGFyZTogYnVpbGRFcnJvcihmYWxzZSksIG5lZ2F0aXZlQ29tcGFyZTogYnVpbGRFcnJvcih0cnVlKX07XG5cbiAgICAgIGZ1bmN0aW9uIGJ1aWxkRXJyb3IoaXNOb3QpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGFjdHVhbCwgY2xhc3NOYW1lKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhc3M6IERPTS5oYXNDbGFzcyhhY3R1YWwsIGNsYXNzTmFtZSkgPT0gIWlzTm90LFxuICAgICAgICAgICAgZ2V0IG1lc3NhZ2UoKSB7XG4gICAgICAgICAgICAgIHJldHVybiBgRXhwZWN0ZWQgJHthY3R1YWwub3V0ZXJIVE1MfSAke2lzTm90ID8gJ25vdCAnIDogJyd9dG8gY29udGFpbiB0aGUgQ1NTIGNsYXNzIFwiJHtjbGFzc05hbWV9XCJgO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSxcblxuICAgIHRvSGF2ZUNzc1N0eWxlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbXBhcmU6IGZ1bmN0aW9uKGFjdHVhbCwgc3R5bGVzKSB7XG4gICAgICAgICAgdmFyIGFsbFBhc3NlZDtcbiAgICAgICAgICBpZiAoaXNTdHJpbmcoc3R5bGVzKSkge1xuICAgICAgICAgICAgYWxsUGFzc2VkID0gRE9NLmhhc1N0eWxlKGFjdHVhbCwgc3R5bGVzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWxsUGFzc2VkID0gIVN0cmluZ01hcFdyYXBwZXIuaXNFbXB0eShzdHlsZXMpO1xuICAgICAgICAgICAgU3RyaW5nTWFwV3JhcHBlci5mb3JFYWNoKHN0eWxlcywgKHN0eWxlLCBwcm9wKSA9PiB7XG4gICAgICAgICAgICAgIGFsbFBhc3NlZCA9IGFsbFBhc3NlZCAmJiBET00uaGFzU3R5bGUoYWN0dWFsLCBwcm9wLCBzdHlsZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcGFzczogYWxsUGFzc2VkLFxuICAgICAgICAgICAgZ2V0IG1lc3NhZ2UoKSB7XG4gICAgICAgICAgICAgIHZhciBleHBlY3RlZFZhbHVlU3RyID0gaXNTdHJpbmcoc3R5bGVzKSA/IHN0eWxlcyA6IEpTT04uc3RyaW5naWZ5KHN0eWxlcyk7XG4gICAgICAgICAgICAgIHJldHVybiBgRXhwZWN0ZWQgJHthY3R1YWwub3V0ZXJIVE1MfSAkeyFhbGxQYXNzZWQgPyAnICcgOiAnbm90ICd9dG8gY29udGFpbiB0aGVcbiAgICAgICAgICAgICAgICAgICAgICBDU1MgJHtpc1N0cmluZyhzdHlsZXMpID8gJ3Byb3BlcnR5JyA6ICdzdHlsZXMnfSBcIiR7ZXhwZWN0ZWRWYWx1ZVN0cn1cImA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgdG9Db250YWluRXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29tcGFyZTogZnVuY3Rpb24oYWN0dWFsLCBleHBlY3RlZFRleHQpIHtcbiAgICAgICAgICB2YXIgZXJyb3JNZXNzYWdlID0gYWN0dWFsLnRvU3RyaW5nKCk7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhc3M6IGVycm9yTWVzc2FnZS5pbmRleE9mKGV4cGVjdGVkVGV4dCkgPiAtMSxcbiAgICAgICAgICAgIGdldCBtZXNzYWdlKCkgeyByZXR1cm4gJ0V4cGVjdGVkICcgKyBlcnJvck1lc3NhZ2UgKyAnIHRvIGNvbnRhaW4gJyArIGV4cGVjdGVkVGV4dDsgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcblxuICAgIHRvVGhyb3dFcnJvcldpdGg6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29tcGFyZTogZnVuY3Rpb24oYWN0dWFsLCBleHBlY3RlZFRleHQpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYWN0dWFsKCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBwYXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgZ2V0IG1lc3NhZ2UoKSB7IHJldHVybiBcIldhcyBleHBlY3RlZCB0byB0aHJvdywgYnV0IGRpZCBub3QgdGhyb3dcIjsgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB2YXIgZXJyb3JNZXNzYWdlID0gZS50b1N0cmluZygpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgcGFzczogZXJyb3JNZXNzYWdlLmluZGV4T2YoZXhwZWN0ZWRUZXh0KSA+IC0xLFxuICAgICAgICAgICAgICBnZXQgbWVzc2FnZSgpIHsgcmV0dXJuICdFeHBlY3RlZCAnICsgZXJyb3JNZXNzYWdlICsgJyB0byBjb250YWluICcgKyBleHBlY3RlZFRleHQ7IH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG5cbiAgICB0b01hdGNoUGF0dGVybigpIHtcbiAgICAgIHJldHVybiB7Y29tcGFyZTogYnVpbGRFcnJvcihmYWxzZSksIG5lZ2F0aXZlQ29tcGFyZTogYnVpbGRFcnJvcih0cnVlKX07XG5cbiAgICAgIGZ1bmN0aW9uIGJ1aWxkRXJyb3IoaXNOb3QpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGFjdHVhbCwgcmVnZXgpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcGFzczogcmVnZXgudGVzdChhY3R1YWwpID09ICFpc05vdCxcbiAgICAgICAgICAgIGdldCBtZXNzYWdlKCkge1xuICAgICAgICAgICAgICByZXR1cm4gYEV4cGVjdGVkICR7YWN0dWFsfSAke2lzTm90ID8gJ25vdCAnIDogJyd9dG8gbWF0Y2ggJHtyZWdleC50b1N0cmluZygpfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgdG9JbXBsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29tcGFyZTogZnVuY3Rpb24oYWN0dWFsT2JqZWN0LCBleHBlY3RlZEludGVyZmFjZSkge1xuICAgICAgICAgIHZhciBvYmpQcm9wcyA9IE9iamVjdC5rZXlzKGFjdHVhbE9iamVjdC5jb25zdHJ1Y3Rvci5wcm90b3R5cGUpO1xuICAgICAgICAgIHZhciBpbnRQcm9wcyA9IE9iamVjdC5rZXlzKGV4cGVjdGVkSW50ZXJmYWNlLnByb3RvdHlwZSk7XG5cbiAgICAgICAgICB2YXIgbWlzc2VkTWV0aG9kcyA9IFtdO1xuICAgICAgICAgIGludFByb3BzLmZvckVhY2goKGspID0+IHtcbiAgICAgICAgICAgIGlmICghYWN0dWFsT2JqZWN0LmNvbnN0cnVjdG9yLnByb3RvdHlwZVtrXSkgbWlzc2VkTWV0aG9kcy5wdXNoKGspO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhc3M6IG1pc3NlZE1ldGhvZHMubGVuZ3RoID09IDAsXG4gICAgICAgICAgICBnZXQgbWVzc2FnZSgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdFeHBlY3RlZCAnICsgYWN0dWFsT2JqZWN0ICsgJyB0byBoYXZlIHRoZSBmb2xsb3dpbmcgbWV0aG9kczogJyArXG4gICAgICAgICAgICAgICAgICAgICBtaXNzZWRNZXRob2RzLmpvaW4oXCIsIFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgfSk7XG59KTtcblxuZnVuY3Rpb24gZWxlbWVudFRleHQobikge1xuICB2YXIgaGFzTm9kZXMgPSAobikgPT4ge1xuICAgIHZhciBjaGlsZHJlbiA9IERPTS5jaGlsZE5vZGVzKG4pO1xuICAgIHJldHVybiBjaGlsZHJlbiAmJiBjaGlsZHJlbi5sZW5ndGggPiAwO1xuICB9O1xuXG4gIGlmIChuIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICByZXR1cm4gbi5tYXAoZWxlbWVudFRleHQpLmpvaW4oXCJcIik7XG4gIH1cblxuICBpZiAoRE9NLmlzQ29tbWVudE5vZGUobikpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICBpZiAoRE9NLmlzRWxlbWVudE5vZGUobikgJiYgRE9NLnRhZ05hbWUobikgPT0gJ0NPTlRFTlQnKSB7XG4gICAgcmV0dXJuIGVsZW1lbnRUZXh0KEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShET00uZ2V0RGlzdHJpYnV0ZWROb2RlcyhuKSkpO1xuICB9XG5cbiAgaWYgKERPTS5oYXNTaGFkb3dSb290KG4pKSB7XG4gICAgcmV0dXJuIGVsZW1lbnRUZXh0KERPTS5jaGlsZE5vZGVzQXNMaXN0KERPTS5nZXRTaGFkb3dSb290KG4pKSk7XG4gIH1cblxuICBpZiAoaGFzTm9kZXMobikpIHtcbiAgICByZXR1cm4gZWxlbWVudFRleHQoRE9NLmNoaWxkTm9kZXNBc0xpc3QobikpO1xuICB9XG5cbiAgcmV0dXJuIERPTS5nZXRUZXh0KG4pO1xufVxuIl19