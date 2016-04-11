'use strict';/**
 * Stores error information; delivered via [NgZone.onError] stream.
 */
var NgZoneError = (function () {
    function NgZoneError(error, stackTrace) {
        this.error = error;
        this.stackTrace = stackTrace;
    }
    return NgZoneError;
})();
exports.NgZoneError = NgZoneError;
var NgZoneImpl = (function () {
    function NgZoneImpl(_a) {
        var _this = this;
        var trace = _a.trace, onEnter = _a.onEnter, onLeave = _a.onLeave, setMicrotask = _a.setMicrotask, setMacrotask = _a.setMacrotask, onError = _a.onError;
        this.onEnter = onEnter;
        this.onLeave = onLeave;
        this.setMicrotask = setMicrotask;
        this.setMacrotask = setMacrotask;
        this.onError = onError;
        if (Zone) {
            this.outer = this.inner = Zone.current;
            if (Zone['wtfZoneSpec']) {
                this.inner = this.inner.fork(Zone['wtfZoneSpec']);
            }
            if (trace && Zone['longStackTraceZoneSpec']) {
                this.inner = this.inner.fork(Zone['longStackTraceZoneSpec']);
            }
            this.inner = this.inner.fork({
                name: 'angular',
                properties: { 'isAngularZone': true },
                onInvokeTask: function (delegate, current, target, task, applyThis, applyArgs) {
                    try {
                        _this.onEnter();
                        return delegate.invokeTask(target, task, applyThis, applyArgs);
                    }
                    finally {
                        _this.onLeave();
                    }
                },
                onInvoke: function (delegate, current, target, callback, applyThis, applyArgs, source) {
                    try {
                        _this.onEnter();
                        return delegate.invoke(target, callback, applyThis, applyArgs, source);
                    }
                    finally {
                        _this.onLeave();
                    }
                },
                onHasTask: function (delegate, current, target, hasTaskState) {
                    delegate.hasTask(target, hasTaskState);
                    if (current == target) {
                        // We are only interested in hasTask events which originate from our zone
                        // (A child hasTask event is not interesting to us)
                        if (hasTaskState.change == 'microTask') {
                            _this.setMicrotask(hasTaskState.microTask);
                        }
                        else if (hasTaskState.change == 'macroTask') {
                            _this.setMacrotask(hasTaskState.macroTask);
                        }
                    }
                },
                onHandleError: function (delegate, current, target, error) {
                    delegate.handleError(target, error);
                    _this.onError(new NgZoneError(error, error.stack));
                    return false;
                }
            });
        }
        else {
            throw new Error('Angular2 needs to be run with Zone.js polyfill.');
        }
    }
    NgZoneImpl.isInAngularZone = function () { return Zone.current.get('isAngularZone') === true; };
    NgZoneImpl.prototype.runInner = function (fn) { return this.inner.runGuarded(fn); };
    ;
    NgZoneImpl.prototype.runOuter = function (fn) { return this.outer.run(fn); };
    ;
    return NgZoneImpl;
})();
exports.NgZoneImpl = NgZoneImpl;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZV9pbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGlmZmluZ19wbHVnaW5fd3JhcHBlci1vdXRwdXRfcGF0aC1ZRlRZQUt3US50bXAvYW5ndWxhcjIvc3JjL2NvcmUvem9uZS9uZ196b25lX2ltcGwudHMiXSwibmFtZXMiOlsiTmdab25lRXJyb3IiLCJOZ1pvbmVFcnJvci5jb25zdHJ1Y3RvciIsIk5nWm9uZUltcGwiLCJOZ1pvbmVJbXBsLmNvbnN0cnVjdG9yIiwiTmdab25lSW1wbC5pc0luQW5ndWxhclpvbmUiLCJOZ1pvbmVJbXBsLnJ1bklubmVyIiwiTmdab25lSW1wbC5ydW5PdXRlciJdLCJtYXBwaW5ncyI6IkFBRUE7O0dBRUc7QUFDSDtJQUNFQSxxQkFBbUJBLEtBQVVBLEVBQVNBLFVBQWVBO1FBQWxDQyxVQUFLQSxHQUFMQSxLQUFLQSxDQUFLQTtRQUFTQSxlQUFVQSxHQUFWQSxVQUFVQSxDQUFLQTtJQUFHQSxDQUFDQTtJQUMzREQsa0JBQUNBO0FBQURBLENBQUNBLEFBRkQsSUFFQztBQUZZLG1CQUFXLGNBRXZCLENBQUE7QUFHRDtJQWNFRSxvQkFBWUEsRUFPWEE7UUFyQkhDLGlCQXdGQ0E7WUExRWNBLEtBQUtBLGFBQUVBLE9BQU9BLGVBQUVBLE9BQU9BLGVBQUVBLFlBQVlBLG9CQUFFQSxZQUFZQSxvQkFBRUEsT0FBT0E7UUFRdkVBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLE9BQU9BLENBQUNBO1FBQ3ZCQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxPQUFPQSxDQUFDQTtRQUN2QkEsSUFBSUEsQ0FBQ0EsWUFBWUEsR0FBR0EsWUFBWUEsQ0FBQ0E7UUFDakNBLElBQUlBLENBQUNBLFlBQVlBLEdBQUdBLFlBQVlBLENBQUNBO1FBQ2pDQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxPQUFPQSxDQUFDQTtRQUV2QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDVEEsSUFBSUEsQ0FB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b2JhbH0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9sYW5nJztcblxuLyoqXG4gKiBTdG9yZXMgZXJyb3IgaW5mb3JtYXRpb247IGRlbGl2ZXJlZCB2aWEgW05nWm9uZS5vbkVycm9yXSBzdHJlYW0uXG4gKi9cbmV4cG9ydCBjbGFzcyBOZ1pvbmVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBlcnJvcjogYW55LCBwdWJsaWMgc3RhY2tUcmFjZTogYW55KSB7fVxufVxuXG5cbmV4cG9ydCBjbGFzcyBOZ1pvbmVJbXBsIHtcbiAgc3RhdGljIGlzSW5Bbmd1bGFyWm9uZSgpOiBib29sZWFuIHsgcmV0dXJuIFpvbmUuY3VycmVudC5nZXQoJ2lzQW5ndWxhclpvbmUnKSA9PT0gdHJ1ZTsgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJpdmF0ZSBvdXRlcjogWm9uZTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBwcml2YXRlIGlubmVyOiBab25lO1xuXG4gIHByaXZhdGUgb25FbnRlcjogKCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBvbkxlYXZlOiAoKSA9PiB2b2lkO1xuICBwcml2YXRlIHNldE1pY3JvdGFzazogKGhhc01pY3JvdGFza3M6IGJvb2xlYW4pID0+IHZvaWQ7XG4gIHByaXZhdGUgc2V0TWFjcm90YXNrOiAoaGFzTWFjcm90YXNrczogYm9vbGVhbikgPT4gdm9pZDtcbiAgcHJpdmF0ZSBvbkVycm9yOiAoZXJyb3I6IE5nWm9uZUVycm9yKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKHt0cmFjZSwgb25FbnRlciwgb25MZWF2ZSwgc2V0TWljcm90YXNrLCBzZXRNYWNyb3Rhc2ssIG9uRXJyb3J9OiB7XG4gICAgdHJhY2U6IGJvb2xlYW4sXG4gICAgb25FbnRlcjogKCkgPT4gdm9pZCxcbiAgICBvbkxlYXZlOiAoKSA9PiB2b2lkLFxuICAgIHNldE1pY3JvdGFzazogKGhhc01pY3JvdGFza3M6IGJvb2xlYW4pID0+IHZvaWQsXG4gICAgc2V0TWFjcm90YXNrOiAoaGFzTWFjcm90YXNrczogYm9vbGVhbikgPT4gdm9pZCxcbiAgICBvbkVycm9yOiAoZXJyb3I6IE5nWm9uZUVycm9yKSA9PiB2b2lkXG4gIH0pIHtcbiAgICB0aGlzLm9uRW50ZXIgPSBvbkVudGVyO1xuICAgIHRoaXMub25MZWF2ZSA9IG9uTGVhdmU7XG4gICAgdGhpcy5zZXRNaWNyb3Rhc2sgPSBzZXRNaWNyb3Rhc2s7XG4gICAgdGhpcy5zZXRNYWNyb3Rhc2sgPSBzZXRNYWNyb3Rhc2s7XG4gICAgdGhpcy5vbkVycm9yID0gb25FcnJvcjtcblxuICAgIGlmIChab25lKSB7XG4gICAgICB0aGlzLm91dGVyID0gdGhpcy5pbm5lciA9IFpvbmUuY3VycmVudDtcbiAgICAgIGlmIChab25lWyd3dGZab25lU3BlYyddKSB7XG4gICAgICAgIHRoaXMuaW5uZXIgPSB0aGlzLmlubmVyLmZvcmsoWm9uZVsnd3RmWm9uZVNwZWMnXSk7XG4gICAgICB9XG4gICAgICBpZiAodHJhY2UgJiYgWm9uZVsnbG9uZ1N0YWNrVHJhY2Vab25lU3BlYyddKSB7XG4gICAgICAgIHRoaXMuaW5uZXIgPSB0aGlzLmlubmVyLmZvcmsoWm9uZVsnbG9uZ1N0YWNrVHJhY2Vab25lU3BlYyddKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5uZXIgPSB0aGlzLmlubmVyLmZvcmsoe1xuICAgICAgICBuYW1lOiAnYW5ndWxhcicsXG4gICAgICAgIHByb3BlcnRpZXM6PGFueT57J2lzQW5ndWxhclpvbmUnOiB0cnVlfSxcbiAgICAgICAgb25JbnZva2VUYXNrOiAoZGVsZWdhdGU6IFpvbmVEZWxlZ2F0ZSwgY3VycmVudDogWm9uZSwgdGFyZ2V0OiBab25lLCB0YXNrOiBUYXNrLFxuICAgICAgICAgICAgICAgICAgICAgICBhcHBseVRoaXM6IGFueSwgYXBwbHlBcmdzOiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLm9uRW50ZXIoKTtcbiAgICAgICAgICAgIHJldHVybiBkZWxlZ2F0ZS5pbnZva2VUYXNrKHRhcmdldCwgdGFzaywgYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLm9uTGVhdmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cblxuICAgICAgICBvbkludm9rZTogKGRlbGVnYXRlOiBab25lRGVsZWdhdGUsIGN1cnJlbnQ6IFpvbmUsIHRhcmdldDogWm9uZSwgY2FsbGJhY2s6IEZ1bmN0aW9uLFxuICAgICAgICAgICAgICAgICAgIGFwcGx5VGhpczogYW55LCBhcHBseUFyZ3M6IGFueVtdLCBzb3VyY2U6IHN0cmluZyk6IGFueSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMub25FbnRlcigpO1xuICAgICAgICAgICAgcmV0dXJuIGRlbGVnYXRlLmludm9rZSh0YXJnZXQsIGNhbGxiYWNrLCBhcHBseVRoaXMsIGFwcGx5QXJncywgc291cmNlKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5vbkxlYXZlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG9uSGFzVGFzazpcbiAgICAgICAgICAgIChkZWxlZ2F0ZTogWm9uZURlbGVnYXRlLCBjdXJyZW50OiBab25lLCB0YXJnZXQ6IFpvbmUsIGhhc1Rhc2tTdGF0ZTogSGFzVGFza1N0YXRlKSA9PiB7XG4gICAgICAgICAgICAgIGRlbGVnYXRlLmhhc1Rhc2sodGFyZ2V0LCBoYXNUYXNrU3RhdGUpO1xuICAgICAgICAgICAgICBpZiAoY3VycmVudCA9PSB0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICAvLyBXZSBhcmUgb25seSBpbnRlcmVzdGVkIGluIGhhc1Rhc2sgZXZlbnRzIHdoaWNoIG9yaWdpbmF0ZSBmcm9tIG91ciB6b25lXG4gICAgICAgICAgICAgICAgLy8gKEEgY2hpbGQgaGFzVGFzayBldmVudCBpcyBub3QgaW50ZXJlc3RpbmcgdG8gdXMpXG4gICAgICAgICAgICAgICAgaWYgKGhhc1Rhc2tTdGF0ZS5jaGFuZ2UgPT0gJ21pY3JvVGFzaycpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuc2V0TWljcm90YXNrKGhhc1Rhc2tTdGF0ZS5taWNyb1Rhc2spO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaGFzVGFza1N0YXRlLmNoYW5nZSA9PSAnbWFjcm9UYXNrJykge1xuICAgICAgICAgICAgICAgICAgdGhpcy5zZXRNYWNyb3Rhc2soaGFzVGFza1N0YXRlLm1hY3JvVGFzayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgIG9uSGFuZGxlRXJyb3I6IChkZWxlZ2F0ZTogWm9uZURlbGVnYXRlLCBjdXJyZW50OiBab25lLCB0YXJnZXQ6IFpvbmUsIGVycm9yOiBhbnkpOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGVnYXRlLmhhbmRsZUVycm9yKHRhcmdldCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IobmV3IE5nWm9uZUVycm9yKGVycm9yLCBlcnJvci5zdGFjaykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBbmd1bGFyMiBuZWVkcyB0byBiZSBydW4gd2l0aCBab25lLmpzIHBvbHlmaWxsLicpO1xuICAgIH1cbiAgfVxuXG4gIHJ1bklubmVyKGZuOiAoKSA9PiBhbnkpOiBhbnkgeyByZXR1cm4gdGhpcy5pbm5lci5ydW5HdWFyZGVkKGZuKTsgfTtcbiAgcnVuT3V0ZXIoZm46ICgpID0+IGFueSk6IGFueSB7IHJldHVybiB0aGlzLm91dGVyLnJ1bihmbik7IH07XG59XG4iXX0=