var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BaseException } from 'angular2/src/facade/exceptions';
import { EventEmitter, ObservableWrapper } from 'angular2/src/facade/async';
import { StringMapWrapper } from 'angular2/src/facade/collection';
import { Injectable } from "angular2/src/core/di";
export class PostMessageBusSink {
    constructor(_postMessageTarget) {
        this._postMessageTarget = _postMessageTarget;
        this._channels = StringMapWrapper.create();
        this._messageBuffer = [];
    }
    attachToZone(zone) {
        this._zone = zone;
        this._zone.runOutsideAngular(() => {
            ObservableWrapper.subscribe(this._zone.onStable, (_) => { this._handleOnEventDone(); });
        });
    }
    initChannel(channel, runInZone = true) {
        if (StringMapWrapper.contains(this._channels, channel)) {
            throw new BaseException(`${channel} has already been initialized`);
        }
        var emitter = new EventEmitter(false);
        var channelInfo = new _Channel(emitter, runInZone);
        this._channels[channel] = channelInfo;
        emitter.subscribe((data) => {
            var message = { channel: channel, message: data };
            if (runInZone) {
                this._messageBuffer.push(message);
            }
            else {
                this._sendMessages([message]);
            }
        });
    }
    to(channel) {
        if (StringMapWrapper.contains(this._channels, channel)) {
            return this._channels[channel].emitter;
        }
        else {
            throw new BaseException(`${channel} is not set up. Did you forget to call initChannel?`);
        }
    }
    _handleOnEventDone() {
        if (this._messageBuffer.length > 0) {
            this._sendMessages(this._messageBuffer);
            this._messageBuffer = [];
        }
    }
    _sendMessages(messages) { this._postMessageTarget.postMessage(messages); }
}
export class PostMessageBusSource {
    constructor(eventTarget) {
        this._channels = StringMapWrapper.create();
        if (eventTarget) {
            eventTarget.addEventListener("message", (ev) => this._handleMessages(ev));
        }
        else {
            // if no eventTarget is given we assume we're in a WebWorker and listen on the global scope
            addEventListener("message", (ev) => this._handleMessages(ev));
        }
    }
    attachToZone(zone) { this._zone = zone; }
    initChannel(channel, runInZone = true) {
        if (StringMapWrapper.contains(this._channels, channel)) {
            throw new BaseException(`${channel} has already been initialized`);
        }
        var emitter = new EventEmitter(false);
        var channelInfo = new _Channel(emitter, runInZone);
        this._channels[channel] = channelInfo;
    }
    from(channel) {
        if (StringMapWrapper.contains(this._channels, channel)) {
            return this._channels[channel].emitter;
        }
        else {
            throw new BaseException(`${channel} is not set up. Did you forget to call initChannel?`);
        }
    }
    _handleMessages(ev) {
        var messages = ev.data;
        for (var i = 0; i < messages.length; i++) {
            this._handleMessage(messages[i]);
        }
    }
    _handleMessage(data) {
        var channel = data.channel;
        if (StringMapWrapper.contains(this._channels, channel)) {
            var channelInfo = this._channels[channel];
            if (channelInfo.runInZone) {
                this._zone.run(() => { channelInfo.emitter.emit(data.message); });
            }
            else {
                channelInfo.emitter.emit(data.message);
            }
        }
    }
}
/**
 * A TypeScript implementation of {@link MessageBus} for communicating via JavaScript's
 * postMessage API.
 */
export let PostMessageBus = class {
    constructor(sink, source) {
        this.sink = sink;
        this.source = source;
    }
    attachToZone(zone) {
        this.source.attachToZone(zone);
        this.sink.attachToZone(zone);
    }
    initChannel(channel, runInZone = true) {
        this.source.initChannel(channel, runInZone);
        this.sink.initChannel(channel, runInZone);
    }
    from(channel) { return this.source.from(channel); }
    to(channel) { return this.sink.to(channel); }
};
PostMessageBus = __decorate([
    Injectable(), 
    __metadata('design:paramtypes', [PostMessageBusSink, PostMessageBusSource])
], PostMessageBus);
/**
 * Helper class that wraps a channel's {@link EventEmitter} and
 * keeps track of if it should run in the zone.
 */
class _Channel {
    constructor(emitter, runInZone) {
        this.emitter = emitter;
        this.runInZone = runInZone;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdF9tZXNzYWdlX2J1cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpZmZpbmdfcGx1Z2luX3dyYXBwZXItb3V0cHV0X3BhdGgtd1hJbk4wNjYudG1wL2FuZ3VsYXIyL3NyYy93ZWJfd29ya2Vycy9zaGFyZWQvcG9zdF9tZXNzYWdlX2J1cy50cyJdLCJuYW1lcyI6WyJQb3N0TWVzc2FnZUJ1c1NpbmsiLCJQb3N0TWVzc2FnZUJ1c1NpbmsuY29uc3RydWN0b3IiLCJQb3N0TWVzc2FnZUJ1c1NpbmsuYXR0YWNoVG9ab25lIiwiUG9zdE1lc3NhZ2VCdXNTaW5rLmluaXRDaGFubmVsIiwiUG9zdE1lc3NhZ2VCdXNTaW5rLnRvIiwiUG9zdE1lc3NhZ2VCdXNTaW5rLl9oYW5kbGVPbkV2ZW50RG9uZSIsIlBvc3RNZXNzYWdlQnVzU2luay5fc2VuZE1lc3NhZ2VzIiwiUG9zdE1lc3NhZ2VCdXNTb3VyY2UiLCJQb3N0TWVzc2FnZUJ1c1NvdXJjZS5jb25zdHJ1Y3RvciIsIlBvc3RNZXNzYWdlQnVzU291cmNlLmF0dGFjaFRvWm9uZSIsIlBvc3RNZXNzYWdlQnVzU291cmNlLmluaXRDaGFubmVsIiwiUG9zdE1lc3NhZ2VCdXNTb3VyY2UuZnJvbSIsIlBvc3RNZXNzYWdlQnVzU291cmNlLl9oYW5kbGVNZXNzYWdlcyIsIlBvc3RNZXNzYWdlQnVzU291cmNlLl9oYW5kbGVNZXNzYWdlIiwiUG9zdE1lc3NhZ2VCdXMiLCJQb3N0TWVzc2FnZUJ1cy5jb25zdHJ1Y3RvciIsIlBvc3RNZXNzYWdlQnVzLmF0dGFjaFRvWm9uZSIsIlBvc3RNZXNzYWdlQnVzLmluaXRDaGFubmVsIiwiUG9zdE1lc3NhZ2VCdXMuZnJvbSIsIlBvc3RNZXNzYWdlQnVzLnRvIiwiX0NoYW5uZWwiLCJfQ2hhbm5lbC5jb25zdHJ1Y3RvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O09BS08sRUFBQyxhQUFhLEVBQW1CLE1BQU0sZ0NBQWdDO09BQ3ZFLEVBQUMsWUFBWSxFQUFFLGlCQUFpQixFQUFDLE1BQU0sMkJBQTJCO09BQ2xFLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxnQ0FBZ0M7T0FDeEQsRUFBQyxVQUFVLEVBQUMsTUFBTSxzQkFBc0I7QUFNL0M7SUFLRUEsWUFBb0JBLGtCQUFxQ0E7UUFBckNDLHVCQUFrQkEsR0FBbEJBLGtCQUFrQkEsQ0FBbUJBO1FBSGpEQSxjQUFTQSxHQUE4QkEsZ0JBQWdCQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQTtRQUNqRUEsbUJBQWNBLEdBQWtCQSxFQUFFQSxDQUFDQTtJQUVpQkEsQ0FBQ0E7SUFFN0RELFlBQVlBLENBQUNBLElBQVlBO1FBQ3ZCRSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUNsQkEsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsaUJBQWlCQSxDQUFDQTtZQUMzQkEsaUJBQWlCQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxJQUFJQSxDQUFDQSxrQkFBa0JBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQzFGQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUNMQSxDQUFDQTtJQUVERixXQUFXQSxDQUFDQSxPQUFlQSxFQUFFQSxTQUFTQSxHQUFZQSxJQUFJQTtRQUNwREcsRUFBRUEsQ0FBQ0EsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN2REEsTUFBTUEsSUFBSUEsYUFBYUEsQ0FBQ0EsR0FBR0EsT0FBT0EsK0JBQStCQSxDQUFDQSxDQUFDQTtRQUNyRUEsQ0FBQ0E7UUFFREEsSUFBSUEsT0FBT0EsR0FBR0EsSUFBSUEsWUFBWUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7UUFDdENBLElBQUlBLFdBQVdBLEdBQUdBLElBQUlBLFFBQVFBLENBQUNBLE9BQU9BLEVBQUVBLFNBQVNBLENBQUNBLENBQUNBO1FBQ25EQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxXQUFXQSxDQUFDQTtRQUN0Q0EsT0FBT0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsSUFBWUE7WUFDN0JBLElBQUlBLE9BQU9BLEdBQUdBLEVBQUNBLE9BQU9BLEVBQUVBLE9BQU9BLEVBQUVBLE9BQU9BLEVBQUVBLElBQUlBLEVBQUNBLENBQUNBO1lBQ2hEQSxFQUFFQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDZEEsSUFBSUEsQ0FBQ0EsY0FBY0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7WUFDcENBLENBQUNBO1lBQUNBLElBQUlBLENBQUNBLENBQUNBO2dCQUNOQSxJQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNoQ0EsQ0FBQ0E7UUFDSEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDTEEsQ0FBQ0E7SUFFREgsRUFBRUEsQ0FBQ0EsT0FBZUE7UUFDaEJJLEVBQUVBLENBQUNBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDdkRBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLE9BQU9BLENBQUNBO1FBQ3pDQSxDQUFDQTtRQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUNOQSxNQUFNQSxJQUFJQSxhQUFhQSxDQUFDQSxHQUFHQSxPQUFPQSxxREFBcURBLENBQUNBLENBQUNBO1FBQzNGQSxDQUFDQTtJQUNIQSxDQUFDQTtJQUVPSixrQkFBa0JBO1FBQ3hCSyxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxjQUFjQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuQ0EsSUFBSUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsY0FBY0EsQ0FBQ0EsQ0FBQ0E7WUFDeENBLElBQUlBLENBQUNBLGNBQWNBLEdBQUdBLEVBQUVBLENBQUNBO1FBQzNCQSxDQUFDQTtJQUNIQSxDQUFDQTtJQUVPTCxhQUFhQSxDQUFDQSxRQUF1QkEsSUFBSU0sSUFBSUEsQ0FBQ0Esa0JBQWtCQSxDQUFDQSxXQUFXQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtBQUNuR04sQ0FBQ0E7QUFFRDtJQUlFTyxZQUFZQSxXQUF5QkE7UUFGN0JDLGNBQVNBLEdBQThCQSxnQkFBZ0JBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO1FBR3ZFQSxFQUFFQSxDQUFDQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNoQkEsV0FBV0EsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxTQUFTQSxFQUFFQSxDQUFDQSxFQUFnQkEsS0FBS0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDMUZBLENBQUNBO1FBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQ05BLDJGQUEyRkE7WUFDM0ZBLGdCQUFnQkEsQ0FBQ0EsU0FBU0EsRUFBRUEsQ0FBQ0EsRUFBZ0JBLEtBQUtBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1FBQzlFQSxDQUFDQTtJQUNIQSxDQUFDQTtJQUVERCxZQUFZQSxDQUFDQSxJQUFZQSxJQUFJRSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUVqREYsV0FBV0EsQ0FBQ0EsT0FBZUEsRUFBRUEsU0FBU0EsR0FBWUEsSUFBSUE7UUFDcERHLEVBQUVBLENBQUNBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDdkRBLE1BQU1BLElBQUlBLGFBQWFBLENBQUNBLEdBQUdBLE9BQU9BLCtCQUErQkEsQ0FBQ0EsQ0FBQ0E7UUFDckVBLENBQUNBO1FBRURBLElBQUlBLE9BQU9BLEdBQUdBLElBQUlBLFlBQVlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1FBQ3RDQSxJQUFJQSxXQUFXQSxHQUFHQSxJQUFJQSxRQUFRQSxDQUFDQSxPQUFPQSxFQUFFQSxTQUFTQSxDQUFDQSxDQUFDQTtRQUNuREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsV0FBV0EsQ0FBQ0E7SUFDeENBLENBQUNBO0lBRURILElBQUlBLENBQUNBLE9BQWVBO1FBQ2xCSSxFQUFFQSxDQUFDQSxDQUFDQSxnQkFBZ0JBLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLEVBQUVBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ3ZEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQTtRQUN6Q0EsQ0FBQ0E7UUFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDTkEsTUFBTUEsSUFBSUEsYUFBYUEsQ0FBQ0EsR0FBR0EsT0FBT0EscURBQXFEQSxDQUFDQSxDQUFDQTtRQUMzRkEsQ0FBQ0E7SUFDSEEsQ0FBQ0E7SUFFT0osZUFBZUEsQ0FBQ0EsRUFBZ0JBO1FBQ3RDSyxJQUFJQSxRQUFRQSxHQUFHQSxFQUFFQSxDQUFDQSxJQUFJQSxDQUFDQTtRQUN2QkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsUUFBUUEsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFDekNBLElBQUlBLENBQUNBLGNBQWNBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQ25DQSxDQUFDQTtJQUNIQSxDQUFDQTtJQUVPTCxjQUFjQSxDQUFDQSxJQUFTQTtRQUM5Qk0sSUFBSUEsT0FBT0EsR0FBR0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0E7UUFDM0JBLEVBQUVBLENBQUNBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDdkRBLElBQUlBLFdBQVdBLEdBQUdBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1lBQzFDQSxFQUFFQSxDQUFDQSxDQUFDQSxXQUFXQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDMUJBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEdBQUdBLENBQUNBLFFBQVFBLFdBQVdBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ3BFQSxDQUFDQTtZQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFDTkEsV0FBV0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7WUFDekNBLENBQUNBO1FBQ0hBLENBQUNBO0lBQ0hBLENBQUNBO0FBQ0hOLENBQUNBO0FBRUQ7OztHQUdHO0FBQ0g7SUFFRU8sWUFBbUJBLElBQXdCQSxFQUFTQSxNQUE0QkE7UUFBN0RDLFNBQUlBLEdBQUpBLElBQUlBLENBQW9CQTtRQUFTQSxXQUFNQSxHQUFOQSxNQUFNQSxDQUFzQkE7SUFBR0EsQ0FBQ0E7SUFFcEZELFlBQVlBLENBQUNBLElBQVlBO1FBQ3ZCRSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxZQUFZQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMvQkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7SUFDL0JBLENBQUNBO0lBRURGLFdBQVdBLENBQUNBLE9BQWVBLEVBQUVBLFNBQVNBLEdBQVlBLElBQUlBO1FBQ3BERyxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxXQUFXQSxDQUFDQSxPQUFPQSxFQUFFQSxTQUFTQSxDQUFDQSxDQUFDQTtRQUM1Q0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsT0FBT0EsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0E7SUFDNUNBLENBQUNBO0lBRURILElBQUlBLENBQUNBLE9BQWVBLElBQXVCSSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUU5RUosRUFBRUEsQ0FBQ0EsT0FBZUEsSUFBdUJLLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0FBQzFFTCxDQUFDQTtBQWpCRDtJQUFDLFVBQVUsRUFBRTs7bUJBaUJaO0FBRUQ7OztHQUdHO0FBQ0g7SUFDRU0sWUFBbUJBLE9BQTBCQSxFQUFTQSxTQUFrQkE7UUFBckRDLFlBQU9BLEdBQVBBLE9BQU9BLENBQW1CQTtRQUFTQSxjQUFTQSxHQUFUQSxTQUFTQSxDQUFTQTtJQUFHQSxDQUFDQTtBQUM5RUQsQ0FBQ0E7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIE1lc3NhZ2VCdXMsXG4gIE1lc3NhZ2VCdXNTb3VyY2UsXG4gIE1lc3NhZ2VCdXNTaW5rXG59IGZyb20gXCJhbmd1bGFyMi9zcmMvd2ViX3dvcmtlcnMvc2hhcmVkL21lc3NhZ2VfYnVzXCI7XG5pbXBvcnQge0Jhc2VFeGNlcHRpb24sIFdyYXBwZWRFeGNlcHRpb259IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvZXhjZXB0aW9ucyc7XG5pbXBvcnQge0V2ZW50RW1pdHRlciwgT2JzZXJ2YWJsZVdyYXBwZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvYXN5bmMnO1xuaW1wb3J0IHtTdHJpbmdNYXBXcmFwcGVyfSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2NvbGxlY3Rpb24nO1xuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tIFwiYW5ndWxhcjIvc3JjL2NvcmUvZGlcIjtcbmltcG9ydCB7Tmdab25lfSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS96b25lL25nX3pvbmUnO1xuXG4vLyBUT0RPKGp0ZXBsaXR6NjAyKSBSZXBsYWNlIHRoaXMgd2l0aCB0aGUgZGVmaW5pdGlvbiBpbiBsaWIud2Vid29ya2VyLmQudHMoIzM0OTIpXG5leHBvcnQgaW50ZXJmYWNlIFBvc3RNZXNzYWdlVGFyZ2V0IHsgcG9zdE1lc3NhZ2U6IChtZXNzYWdlOiBhbnksIHRyYW5zZmVyPzpbQXJyYXlCdWZmZXJdKSA9PiB2b2lkOyB9XG5cbmV4cG9ydCBjbGFzcyBQb3N0TWVzc2FnZUJ1c1NpbmsgaW1wbGVtZW50cyBNZXNzYWdlQnVzU2luayB7XG4gIHByaXZhdGUgX3pvbmU6IE5nWm9uZTtcbiAgcHJpdmF0ZSBfY2hhbm5lbHM6IHtba2V5OiBzdHJpbmddOiBfQ2hhbm5lbH0gPSBTdHJpbmdNYXBXcmFwcGVyLmNyZWF0ZSgpO1xuICBwcml2YXRlIF9tZXNzYWdlQnVmZmVyOiBBcnJheTxPYmplY3Q+ID0gW107XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfcG9zdE1lc3NhZ2VUYXJnZXQ6IFBvc3RNZXNzYWdlVGFyZ2V0KSB7fVxuXG4gIGF0dGFjaFRvWm9uZSh6b25lOiBOZ1pvbmUpOiB2b2lkIHtcbiAgICB0aGlzLl96b25lID0gem9uZTtcbiAgICB0aGlzLl96b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIE9ic2VydmFibGVXcmFwcGVyLnN1YnNjcmliZSh0aGlzLl96b25lLm9uU3RhYmxlLCAoXykgPT4geyB0aGlzLl9oYW5kbGVPbkV2ZW50RG9uZSgpOyB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGluaXRDaGFubmVsKGNoYW5uZWw6IHN0cmluZywgcnVuSW5ab25lOiBib29sZWFuID0gdHJ1ZSk6IHZvaWQge1xuICAgIGlmIChTdHJpbmdNYXBXcmFwcGVyLmNvbnRhaW5zKHRoaXMuX2NoYW5uZWxzLCBjaGFubmVsKSkge1xuICAgICAgdGhyb3cgbmV3IEJhc2VFeGNlcHRpb24oYCR7Y2hhbm5lbH0gaGFzIGFscmVhZHkgYmVlbiBpbml0aWFsaXplZGApO1xuICAgIH1cblxuICAgIHZhciBlbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcihmYWxzZSk7XG4gICAgdmFyIGNoYW5uZWxJbmZvID0gbmV3IF9DaGFubmVsKGVtaXR0ZXIsIHJ1bkluWm9uZSk7XG4gICAgdGhpcy5fY2hhbm5lbHNbY2hhbm5lbF0gPSBjaGFubmVsSW5mbztcbiAgICBlbWl0dGVyLnN1YnNjcmliZSgoZGF0YTogT2JqZWN0KSA9PiB7XG4gICAgICB2YXIgbWVzc2FnZSA9IHtjaGFubmVsOiBjaGFubmVsLCBtZXNzYWdlOiBkYXRhfTtcbiAgICAgIGlmIChydW5JblpvbmUpIHtcbiAgICAgICAgdGhpcy5fbWVzc2FnZUJ1ZmZlci5wdXNoKG1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc2VuZE1lc3NhZ2VzKFttZXNzYWdlXSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICB0byhjaGFubmVsOiBzdHJpbmcpOiBFdmVudEVtaXR0ZXI8YW55PiB7XG4gICAgaWYgKFN0cmluZ01hcFdyYXBwZXIuY29udGFpbnModGhpcy5fY2hhbm5lbHMsIGNoYW5uZWwpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY2hhbm5lbHNbY2hhbm5lbF0uZW1pdHRlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEJhc2VFeGNlcHRpb24oYCR7Y2hhbm5lbH0gaXMgbm90IHNldCB1cC4gRGlkIHlvdSBmb3JnZXQgdG8gY2FsbCBpbml0Q2hhbm5lbD9gKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9oYW5kbGVPbkV2ZW50RG9uZSgpIHtcbiAgICBpZiAodGhpcy5fbWVzc2FnZUJ1ZmZlci5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLl9zZW5kTWVzc2FnZXModGhpcy5fbWVzc2FnZUJ1ZmZlcik7XG4gICAgICB0aGlzLl9tZXNzYWdlQnVmZmVyID0gW107XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfc2VuZE1lc3NhZ2VzKG1lc3NhZ2VzOiBBcnJheTxPYmplY3Q+KSB7IHRoaXMuX3Bvc3RNZXNzYWdlVGFyZ2V0LnBvc3RNZXNzYWdlKG1lc3NhZ2VzKTsgfVxufVxuXG5leHBvcnQgY2xhc3MgUG9zdE1lc3NhZ2VCdXNTb3VyY2UgaW1wbGVtZW50cyBNZXNzYWdlQnVzU291cmNlIHtcbiAgcHJpdmF0ZSBfem9uZTogTmdab25lO1xuICBwcml2YXRlIF9jaGFubmVsczoge1trZXk6IHN0cmluZ106IF9DaGFubmVsfSA9IFN0cmluZ01hcFdyYXBwZXIuY3JlYXRlKCk7XG5cbiAgY29uc3RydWN0b3IoZXZlbnRUYXJnZXQ/OiBFdmVudFRhcmdldCkge1xuICAgIGlmIChldmVudFRhcmdldCkge1xuICAgICAgZXZlbnRUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgKGV2OiBNZXNzYWdlRXZlbnQpID0+IHRoaXMuX2hhbmRsZU1lc3NhZ2VzKGV2KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGlmIG5vIGV2ZW50VGFyZ2V0IGlzIGdpdmVuIHdlIGFzc3VtZSB3ZSdyZSBpbiBhIFdlYldvcmtlciBhbmQgbGlzdGVuIG9uIHRoZSBnbG9iYWwgc2NvcGVcbiAgICAgIGFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIChldjogTWVzc2FnZUV2ZW50KSA9PiB0aGlzLl9oYW5kbGVNZXNzYWdlcyhldikpO1xuICAgIH1cbiAgfVxuXG4gIGF0dGFjaFRvWm9uZSh6b25lOiBOZ1pvbmUpIHsgdGhpcy5fem9uZSA9IHpvbmU7IH1cblxuICBpbml0Q2hhbm5lbChjaGFubmVsOiBzdHJpbmcsIHJ1bkluWm9uZTogYm9vbGVhbiA9IHRydWUpIHtcbiAgICBpZiAoU3RyaW5nTWFwV3JhcHBlci5jb250YWlucyh0aGlzLl9jaGFubmVscywgY2hhbm5lbCkpIHtcbiAgICAgIHRocm93IG5ldyBCYXNlRXhjZXB0aW9uKGAke2NoYW5uZWx9IGhhcyBhbHJlYWR5IGJlZW4gaW5pdGlhbGl6ZWRgKTtcbiAgICB9XG5cbiAgICB2YXIgZW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoZmFsc2UpO1xuICAgIHZhciBjaGFubmVsSW5mbyA9IG5ldyBfQ2hhbm5lbChlbWl0dGVyLCBydW5JblpvbmUpO1xuICAgIHRoaXMuX2NoYW5uZWxzW2NoYW5uZWxdID0gY2hhbm5lbEluZm87XG4gIH1cblxuICBmcm9tKGNoYW5uZWw6IHN0cmluZyk6IEV2ZW50RW1pdHRlcjxhbnk+IHtcbiAgICBpZiAoU3RyaW5nTWFwV3JhcHBlci5jb250YWlucyh0aGlzLl9jaGFubmVscywgY2hhbm5lbCkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9jaGFubmVsc1tjaGFubmVsXS5lbWl0dGVyO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgQmFzZUV4Y2VwdGlvbihgJHtjaGFubmVsfSBpcyBub3Qgc2V0IHVwLiBEaWQgeW91IGZvcmdldCB0byBjYWxsIGluaXRDaGFubmVsP2ApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2hhbmRsZU1lc3NhZ2VzKGV2OiBNZXNzYWdlRXZlbnQpOiB2b2lkIHtcbiAgICB2YXIgbWVzc2FnZXMgPSBldi5kYXRhO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWVzc2FnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuX2hhbmRsZU1lc3NhZ2UobWVzc2FnZXNbaV0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2hhbmRsZU1lc3NhZ2UoZGF0YTogYW55KTogdm9pZCB7XG4gICAgdmFyIGNoYW5uZWwgPSBkYXRhLmNoYW5uZWw7XG4gICAgaWYgKFN0cmluZ01hcFdyYXBwZXIuY29udGFpbnModGhpcy5fY2hhbm5lbHMsIGNoYW5uZWwpKSB7XG4gICAgICB2YXIgY2hhbm5lbEluZm8gPSB0aGlzLl9jaGFubmVsc1tjaGFubmVsXTtcbiAgICAgIGlmIChjaGFubmVsSW5mby5ydW5JblpvbmUpIHtcbiAgICAgICAgdGhpcy5fem9uZS5ydW4oKCkgPT4geyBjaGFubmVsSW5mby5lbWl0dGVyLmVtaXQoZGF0YS5tZXNzYWdlKTsgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjaGFubmVsSW5mby5lbWl0dGVyLmVtaXQoZGF0YS5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBIFR5cGVTY3JpcHQgaW1wbGVtZW50YXRpb24gb2Yge0BsaW5rIE1lc3NhZ2VCdXN9IGZvciBjb21tdW5pY2F0aW5nIHZpYSBKYXZhU2NyaXB0J3NcbiAqIHBvc3RNZXNzYWdlIEFQSS5cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFBvc3RNZXNzYWdlQnVzIGltcGxlbWVudHMgTWVzc2FnZUJ1cyB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBzaW5rOiBQb3N0TWVzc2FnZUJ1c1NpbmssIHB1YmxpYyBzb3VyY2U6IFBvc3RNZXNzYWdlQnVzU291cmNlKSB7fVxuXG4gIGF0dGFjaFRvWm9uZSh6b25lOiBOZ1pvbmUpOiB2b2lkIHtcbiAgICB0aGlzLnNvdXJjZS5hdHRhY2hUb1pvbmUoem9uZSk7XG4gICAgdGhpcy5zaW5rLmF0dGFjaFRvWm9uZSh6b25lKTtcbiAgfVxuXG4gIGluaXRDaGFubmVsKGNoYW5uZWw6IHN0cmluZywgcnVuSW5ab25lOiBib29sZWFuID0gdHJ1ZSk6IHZvaWQge1xuICAgIHRoaXMuc291cmNlLmluaXRDaGFubmVsKGNoYW5uZWwsIHJ1bkluWm9uZSk7XG4gICAgdGhpcy5zaW5rLmluaXRDaGFubmVsKGNoYW5uZWwsIHJ1bkluWm9uZSk7XG4gIH1cblxuICBmcm9tKGNoYW5uZWw6IHN0cmluZyk6IEV2ZW50RW1pdHRlcjxhbnk+IHsgcmV0dXJuIHRoaXMuc291cmNlLmZyb20oY2hhbm5lbCk7IH1cblxuICB0byhjaGFubmVsOiBzdHJpbmcpOiBFdmVudEVtaXR0ZXI8YW55PiB7IHJldHVybiB0aGlzLnNpbmsudG8oY2hhbm5lbCk7IH1cbn1cblxuLyoqXG4gKiBIZWxwZXIgY2xhc3MgdGhhdCB3cmFwcyBhIGNoYW5uZWwncyB7QGxpbmsgRXZlbnRFbWl0dGVyfSBhbmRcbiAqIGtlZXBzIHRyYWNrIG9mIGlmIGl0IHNob3VsZCBydW4gaW4gdGhlIHpvbmUuXG4gKi9cbmNsYXNzIF9DaGFubmVsIHtcbiAgY29uc3RydWN0b3IocHVibGljIGVtaXR0ZXI6IEV2ZW50RW1pdHRlcjxhbnk+LCBwdWJsaWMgcnVuSW5ab25lOiBib29sZWFuKSB7fVxufVxuIl19