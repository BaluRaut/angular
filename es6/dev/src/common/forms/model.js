import { isPresent, isBlank, normalizeBool } from 'angular2/src/facade/lang';
import { EventEmitter, ObservableWrapper } from 'angular2/src/facade/async';
import { PromiseWrapper } from 'angular2/src/facade/promise';
import { StringMapWrapper, ListWrapper } from 'angular2/src/facade/collection';
/**
 * Indicates that a Control is valid, i.e. that no errors exist in the input value.
 */
export const VALID = "VALID";
/**
 * Indicates that a Control is invalid, i.e. that an error exists in the input value.
 */
export const INVALID = "INVALID";
/**
 * Indicates that a Control is pending, i.e. that async validation is occurring and
 * errors are not yet available for the input value.
 */
export const PENDING = "PENDING";
export function isControl(control) {
    return control instanceof AbstractControl;
}
function _find(control, path) {
    if (isBlank(path))
        return null;
    if (!(path instanceof Array)) {
        path = path.split("/");
    }
    if (path instanceof Array && ListWrapper.isEmpty(path))
        return null;
    return path
        .reduce((v, name) => {
        if (v instanceof ControlGroup) {
            return isPresent(v.controls[name]) ? v.controls[name] : null;
        }
        else if (v instanceof ControlArray) {
            var index = name;
            return isPresent(v.at(index)) ? v.at(index) : null;
        }
        else {
            return null;
        }
    }, control);
}
function toObservable(r) {
    return PromiseWrapper.isPromise(r) ? ObservableWrapper.fromPromise(r) : r;
}
/**
 *
 */
export class AbstractControl {
    constructor(validator, asyncValidator) {
        this.validator = validator;
        this.asyncValidator = asyncValidator;
        this._pristine = true;
        this._touched = false;
    }
    get value() { return this._value; }
    get status() { return this._status; }
    get valid() { return this._status === VALID; }
    /**
     * Returns the errors of this control.
     */
    get errors() { return this._errors; }
    get pristine() { return this._pristine; }
    get dirty() { return !this.pristine; }
    get touched() { return this._touched; }
    get untouched() { return !this._touched; }
    get valueChanges() { return this._valueChanges; }
    get statusChanges() { return this._statusChanges; }
    get pending() { return this._status == PENDING; }
    markAsTouched() { this._touched = true; }
    markAsDirty({ onlySelf } = {}) {
        onlySelf = normalizeBool(onlySelf);
        this._pristine = false;
        if (isPresent(this._parent) && !onlySelf) {
            this._parent.markAsDirty({ onlySelf: onlySelf });
        }
    }
    markAsPending({ onlySelf } = {}) {
        onlySelf = normalizeBool(onlySelf);
        this._status = PENDING;
        if (isPresent(this._parent) && !onlySelf) {
            this._parent.markAsPending({ onlySelf: onlySelf });
        }
    }
    setParent(parent) { this._parent = parent; }
    updateValueAndValidity({ onlySelf, emitEvent } = {}) {
        onlySelf = normalizeBool(onlySelf);
        emitEvent = isPresent(emitEvent) ? emitEvent : true;
        this._updateValue();
        this._errors = this._runValidator();
        this._status = this._calculateStatus();
        if (this._status == VALID || this._status == PENDING) {
            this._runAsyncValidator(emitEvent);
        }
        if (emitEvent) {
            ObservableWrapper.callEmit(this._valueChanges, this._value);
            ObservableWrapper.callEmit(this._statusChanges, this._status);
        }
        if (isPresent(this._parent) && !onlySelf) {
            this._parent.updateValueAndValidity({ onlySelf: onlySelf, emitEvent: emitEvent });
        }
    }
    _runValidator() {
        return isPresent(this.validator) ? this.validator(this) : null;
    }
    _runAsyncValidator(emitEvent) {
        if (isPresent(this.asyncValidator)) {
            this._status = PENDING;
            this._cancelExistingSubscription();
            var obs = toObservable(this.asyncValidator(this));
            this._asyncValidationSubscription = ObservableWrapper.subscribe(obs, (res) => this.setErrors(res, { emitEvent: emitEvent }));
        }
    }
    _cancelExistingSubscription() {
        if (isPresent(this._asyncValidationSubscription)) {
            ObservableWrapper.dispose(this._asyncValidationSubscription);
        }
    }
    /**
     * Sets errors on a control.
     *
     * This is used when validations are run not automatically, but manually by the user.
     *
     * Calling `setErrors` will also update the validity of the parent control.
     *
     * ## Usage
     *
     * ```
     * var login = new Control("someLogin");
     * login.setErrors({
     *   "notUnique": true
     * });
     *
     * expect(login.valid).toEqual(false);
     * expect(login.errors).toEqual({"notUnique": true});
     *
     * login.updateValue("someOtherLogin");
     *
     * expect(login.valid).toEqual(true);
     * ```
     */
    setErrors(errors, { emitEvent } = {}) {
        emitEvent = isPresent(emitEvent) ? emitEvent : true;
        this._errors = errors;
        this._status = this._calculateStatus();
        if (emitEvent) {
            ObservableWrapper.callEmit(this._statusChanges, this._status);
        }
        if (isPresent(this._parent)) {
            this._parent._updateControlsErrors();
        }
    }
    find(path) { return _find(this, path); }
    getError(errorCode, path = null) {
        var control = isPresent(path) && !ListWrapper.isEmpty(path) ? this.find(path) : this;
        if (isPresent(control) && isPresent(control._errors)) {
            return StringMapWrapper.get(control._errors, errorCode);
        }
        else {
            return null;
        }
    }
    hasError(errorCode, path = null) {
        return isPresent(this.getError(errorCode, path));
    }
    get root() {
        let x = this;
        while (isPresent(x._parent)) {
            x = x._parent;
        }
        return x;
    }
    /** @internal */
    _updateControlsErrors() {
        this._status = this._calculateStatus();
        if (isPresent(this._parent)) {
            this._parent._updateControlsErrors();
        }
    }
    /** @internal */
    _initObservables() {
        this._valueChanges = new EventEmitter();
        this._statusChanges = new EventEmitter();
    }
    _calculateStatus() {
        if (isPresent(this._errors))
            return INVALID;
        if (this._anyControlsHaveStatus(PENDING))
            return PENDING;
        if (this._anyControlsHaveStatus(INVALID))
            return INVALID;
        return VALID;
    }
}
/**
 * Defines a part of a form that cannot be divided into other controls. `Control`s have values and
 * validation state, which is determined by an optional validation function.
 *
 * `Control` is one of the three fundamental building blocks used to define forms in Angular, along
 * with {@link ControlGroup} and {@link ControlArray}.
 *
 * ## Usage
 *
 * By default, a `Control` is created for every `<input>` or other form component.
 * With {@link NgFormControl} or {@link NgFormModel} an existing {@link Control} can be
 * bound to a DOM element instead. This `Control` can be configured with a custom
 * validation function.
 *
 * ### Example ([live demo](http://plnkr.co/edit/23DESOpbNnBpBHZt1BR4?p=preview))
 */
export class Control extends AbstractControl {
    constructor(value = null, validator = null, asyncValidator = null) {
        super(validator, asyncValidator);
        this._value = value;
        this.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        this._initObservables();
    }
    /**
     * Set the value of the control to `value`.
     *
     * If `onlySelf` is `true`, this change will only affect the validation of this `Control`
     * and not its parent component. If `emitEvent` is `true`, this change will cause a
     * `valueChanges` event on the `Control` to be emitted. Both of these options default to
     * `false`.
     *
     * If `emitModelToViewChange` is `true`, the view will be notified about the new value
     * via an `onChange` event. This is the default behavior if `emitModelToViewChange` is not
     * specified.
     */
    updateValue(value, { onlySelf, emitEvent, emitModelToViewChange } = {}) {
        emitModelToViewChange = isPresent(emitModelToViewChange) ? emitModelToViewChange : true;
        this._value = value;
        if (isPresent(this._onChange) && emitModelToViewChange)
            this._onChange(this._value);
        this.updateValueAndValidity({ onlySelf: onlySelf, emitEvent: emitEvent });
    }
    /**
     * @internal
     */
    _updateValue() { }
    /**
     * @internal
     */
    _anyControlsHaveStatus(status) { return false; }
    /**
     * Register a listener for change events.
     */
    registerOnChange(fn) { this._onChange = fn; }
}
/**
 * Defines a part of a form, of fixed length, that can contain other controls.
 *
 * A `ControlGroup` aggregates the values of each {@link Control} in the group.
 * The status of a `ControlGroup` depends on the status of its children.
 * If one of the controls in a group is invalid, the entire group is invalid.
 * Similarly, if a control changes its value, the entire group changes as well.
 *
 * `ControlGroup` is one of the three fundamental building blocks used to define forms in Angular,
 * along with {@link Control} and {@link ControlArray}. {@link ControlArray} can also contain other
 * controls, but is of variable length.
 *
 * ### Example ([live demo](http://plnkr.co/edit/23DESOpbNnBpBHZt1BR4?p=preview))
 */
export class ControlGroup extends AbstractControl {
    constructor(controls, optionals = null, validator = null, asyncValidator = null) {
        super(validator, asyncValidator);
        this.controls = controls;
        this._optionals = isPresent(optionals) ? optionals : {};
        this._initObservables();
        this._setParentForControls();
        this.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    }
    /**
     * Add a control to this group.
     */
    addControl(name, control) {
        this.controls[name] = control;
        control.setParent(this);
    }
    /**
     * Remove a control from this group.
     */
    removeControl(name) { StringMapWrapper.delete(this.controls, name); }
    /**
     * Mark the named control as non-optional.
     */
    include(controlName) {
        StringMapWrapper.set(this._optionals, controlName, true);
        this.updateValueAndValidity();
    }
    /**
     * Mark the named control as optional.
     */
    exclude(controlName) {
        StringMapWrapper.set(this._optionals, controlName, false);
        this.updateValueAndValidity();
    }
    /**
     * Check whether there is a control with the given name in the group.
     */
    contains(controlName) {
        var c = StringMapWrapper.contains(this.controls, controlName);
        return c && this._included(controlName);
    }
    /** @internal */
    _setParentForControls() {
        StringMapWrapper.forEach(this.controls, (control, name) => { control.setParent(this); });
    }
    /** @internal */
    _updateValue() { this._value = this._reduceValue(); }
    /** @internal */
    _anyControlsHaveStatus(status) {
        var res = false;
        StringMapWrapper.forEach(this.controls, (control, name) => {
            res = res || (this.contains(name) && control.status == status);
        });
        return res;
    }
    /** @internal */
    _reduceValue() {
        return this._reduceChildren({}, (acc, control, name) => {
            acc[name] = control.value;
            return acc;
        });
    }
    /** @internal */
    _reduceChildren(initValue, fn) {
        var res = initValue;
        StringMapWrapper.forEach(this.controls, (control, name) => {
            if (this._included(name)) {
                res = fn(res, control, name);
            }
        });
        return res;
    }
    /** @internal */
    _included(controlName) {
        var isOptional = StringMapWrapper.contains(this._optionals, controlName);
        return !isOptional || StringMapWrapper.get(this._optionals, controlName);
    }
}
/**
 * Defines a part of a form, of variable length, that can contain other controls.
 *
 * A `ControlArray` aggregates the values of each {@link Control} in the group.
 * The status of a `ControlArray` depends on the status of its children.
 * If one of the controls in a group is invalid, the entire array is invalid.
 * Similarly, if a control changes its value, the entire array changes as well.
 *
 * `ControlArray` is one of the three fundamental building blocks used to define forms in Angular,
 * along with {@link Control} and {@link ControlGroup}. {@link ControlGroup} can also contain
 * other controls, but is of fixed length.
 *
 * ## Adding or removing controls
 *
 * To change the controls in the array, use the `push`, `insert`, or `removeAt` methods
 * in `ControlArray` itself. These methods ensure the controls are properly tracked in the
 * form's hierarchy. Do not modify the array of `AbstractControl`s used to instantiate
 * the `ControlArray` directly, as that will result in strange and unexpected behavior such
 * as broken change detection.
 *
 * ### Example ([live demo](http://plnkr.co/edit/23DESOpbNnBpBHZt1BR4?p=preview))
 */
export class ControlArray extends AbstractControl {
    constructor(controls, validator = null, asyncValidator = null) {
        super(validator, asyncValidator);
        this.controls = controls;
        this._initObservables();
        this._setParentForControls();
        this.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    }
    /**
     * Get the {@link AbstractControl} at the given `index` in the array.
     */
    at(index) { return this.controls[index]; }
    /**
     * Insert a new {@link AbstractControl} at the end of the array.
     */
    push(control) {
        this.controls.push(control);
        control.setParent(this);
        this.updateValueAndValidity();
    }
    /**
     * Insert a new {@link AbstractControl} at the given `index` in the array.
     */
    insert(index, control) {
        ListWrapper.insert(this.controls, index, control);
        control.setParent(this);
        this.updateValueAndValidity();
    }
    /**
     * Remove the control at the given `index` in the array.
     */
    removeAt(index) {
        ListWrapper.removeAt(this.controls, index);
        this.updateValueAndValidity();
    }
    /**
     * Length of the control array.
     */
    get length() { return this.controls.length; }
    /** @internal */
    _updateValue() { this._value = this.controls.map((control) => control.value); }
    /** @internal */
    _anyControlsHaveStatus(status) {
        return this.controls.some(c => c.status == status);
    }
    /** @internal */
    _setParentForControls() {
        this.controls.forEach((control) => { control.setParent(this); });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkaWZmaW5nX3BsdWdpbl93cmFwcGVyLW91dHB1dF9wYXRoLXdYSW5OMDY2LnRtcC9hbmd1bGFyMi9zcmMvY29tbW9uL2Zvcm1zL21vZGVsLnRzIl0sIm5hbWVzIjpbImlzQ29udHJvbCIsIl9maW5kIiwidG9PYnNlcnZhYmxlIiwiQWJzdHJhY3RDb250cm9sIiwiQWJzdHJhY3RDb250cm9sLmNvbnN0cnVjdG9yIiwiQWJzdHJhY3RDb250cm9sLnZhbHVlIiwiQWJzdHJhY3RDb250cm9sLnN0YXR1cyIsIkFic3RyYWN0Q29udHJvbC52YWxpZCIsIkFic3RyYWN0Q29udHJvbC5lcnJvcnMiLCJBYnN0cmFjdENvbnRyb2wucHJpc3RpbmUiLCJBYnN0cmFjdENvbnRyb2wuZGlydHkiLCJBYnN0cmFjdENvbnRyb2wudG91Y2hlZCIsIkFic3RyYWN0Q29udHJvbC51bnRvdWNoZWQiLCJBYnN0cmFjdENvbnRyb2wudmFsdWVDaGFuZ2VzIiwiQWJzdHJhY3RDb250cm9sLnN0YXR1c0NoYW5nZXMiLCJBYnN0cmFjdENvbnRyb2wucGVuZGluZyIsIkFic3RyYWN0Q29udHJvbC5tYXJrQXNUb3VjaGVkIiwiQWJzdHJhY3RDb250cm9sLm1hcmtBc0RpcnR5IiwiQWJzdHJhY3RDb250cm9sLm1hcmtBc1BlbmRpbmciLCJBYnN0cmFjdENvbnRyb2wuc2V0UGFyZW50IiwiQWJzdHJhY3RDb250cm9sLnVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkiLCJBYnN0cmFjdENvbnRyb2wuX3J1blZhbGlkYXRvciIsIkFic3RyYWN0Q29udHJvbC5fcnVuQXN5bmNWYWxpZGF0b3IiLCJBYnN0cmFjdENvbnRyb2wuX2NhbmNlbEV4aXN0aW5nU3Vic2NyaXB0aW9uIiwiQWJzdHJhY3RDb250cm9sLnNldEVycm9ycyIsIkFic3RyYWN0Q29udHJvbC5maW5kIiwiQWJzdHJhY3RDb250cm9sLmdldEVycm9yIiwiQWJzdHJhY3RDb250cm9sLmhhc0Vycm9yIiwiQWJzdHJhY3RDb250cm9sLnJvb3QiLCJBYnN0cmFjdENvbnRyb2wuX3VwZGF0ZUNvbnRyb2xzRXJyb3JzIiwiQWJzdHJhY3RDb250cm9sLl9pbml0T2JzZXJ2YWJsZXMiLCJBYnN0cmFjdENvbnRyb2wuX2NhbGN1bGF0ZVN0YXR1cyIsIkNvbnRyb2wiLCJDb250cm9sLmNvbnN0cnVjdG9yIiwiQ29udHJvbC51cGRhdGVWYWx1ZSIsIkNvbnRyb2wuX3VwZGF0ZVZhbHVlIiwiQ29udHJvbC5fYW55Q29udHJvbHNIYXZlU3RhdHVzIiwiQ29udHJvbC5yZWdpc3Rlck9uQ2hhbmdlIiwiQ29udHJvbEdyb3VwIiwiQ29udHJvbEdyb3VwLmNvbnN0cnVjdG9yIiwiQ29udHJvbEdyb3VwLmFkZENvbnRyb2wiLCJDb250cm9sR3JvdXAucmVtb3ZlQ29udHJvbCIsIkNvbnRyb2xHcm91cC5pbmNsdWRlIiwiQ29udHJvbEdyb3VwLmV4Y2x1ZGUiLCJDb250cm9sR3JvdXAuY29udGFpbnMiLCJDb250cm9sR3JvdXAuX3NldFBhcmVudEZvckNvbnRyb2xzIiwiQ29udHJvbEdyb3VwLl91cGRhdGVWYWx1ZSIsIkNvbnRyb2xHcm91cC5fYW55Q29udHJvbHNIYXZlU3RhdHVzIiwiQ29udHJvbEdyb3VwLl9yZWR1Y2VWYWx1ZSIsIkNvbnRyb2xHcm91cC5fcmVkdWNlQ2hpbGRyZW4iLCJDb250cm9sR3JvdXAuX2luY2x1ZGVkIiwiQ29udHJvbEFycmF5IiwiQ29udHJvbEFycmF5LmNvbnN0cnVjdG9yIiwiQ29udHJvbEFycmF5LmF0IiwiQ29udHJvbEFycmF5LnB1c2giLCJDb250cm9sQXJyYXkuaW5zZXJ0IiwiQ29udHJvbEFycmF5LnJlbW92ZUF0IiwiQ29udHJvbEFycmF5Lmxlbmd0aCIsIkNvbnRyb2xBcnJheS5fdXBkYXRlVmFsdWUiLCJDb250cm9sQXJyYXkuX2FueUNvbnRyb2xzSGF2ZVN0YXR1cyIsIkNvbnRyb2xBcnJheS5fc2V0UGFyZW50Rm9yQ29udHJvbHMiXSwibWFwcGluZ3MiOiJPQUFPLEVBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUMsTUFBTSwwQkFBMEI7T0FDbkUsRUFBYSxZQUFZLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSwyQkFBMkI7T0FDOUUsRUFBQyxjQUFjLEVBQUMsTUFBTSw2QkFBNkI7T0FDbkQsRUFBQyxnQkFBZ0IsRUFBRSxXQUFXLEVBQUMsTUFBTSxnQ0FBZ0M7QUFHNUU7O0dBRUc7QUFDSCxhQUFhLEtBQUssR0FBRyxPQUFPLENBQUM7QUFFN0I7O0dBRUc7QUFDSCxhQUFhLE9BQU8sR0FBRyxTQUFTLENBQUM7QUFFakM7OztHQUdHO0FBQ0gsYUFBYSxPQUFPLEdBQUcsU0FBUyxDQUFDO0FBRWpDLDBCQUEwQixPQUFlO0lBQ3ZDQSxNQUFNQSxDQUFDQSxPQUFPQSxZQUFZQSxlQUFlQSxDQUFDQTtBQUM1Q0EsQ0FBQ0E7QUFFRCxlQUFlLE9BQXdCLEVBQUUsSUFBb0M7SUFDM0VDLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBRS9CQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxZQUFZQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsR0FBWUEsSUFBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7SUFDbkNBLENBQUNBO0lBQ0RBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLFlBQVlBLEtBQUtBLElBQUlBLFdBQVdBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBRXBFQSxNQUFNQSxDQUEwQkEsSUFBS0E7U0FDaENBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBO1FBQ2RBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLFlBQVlBLFlBQVlBLENBQUNBLENBQUNBLENBQUNBO1lBQzlCQSxNQUFNQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUMvREEsQ0FBQ0E7UUFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsWUFBWUEsWUFBWUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDckNBLElBQUlBLEtBQUtBLEdBQVdBLElBQUlBLENBQUNBO1lBQ3pCQSxNQUFNQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxLQUFLQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUNyREEsQ0FBQ0E7UUFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDTkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7UUFDZEEsQ0FBQ0E7SUFDSEEsQ0FBQ0EsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7QUFDbEJBLENBQUNBO0FBRUQsc0JBQXNCLENBQU07SUFDMUJDLE1BQU1BLENBQUNBLGNBQWNBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLGlCQUFpQkEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7QUFDNUVBLENBQUNBO0FBRUQ7O0dBRUc7QUFDSDtJQWFFQyxZQUFtQkEsU0FBc0JBLEVBQVNBLGNBQWdDQTtRQUEvREMsY0FBU0EsR0FBVEEsU0FBU0EsQ0FBYUE7UUFBU0EsbUJBQWNBLEdBQWRBLGNBQWNBLENBQWtCQTtRQUwxRUEsY0FBU0EsR0FBWUEsSUFBSUEsQ0FBQ0E7UUFDMUJBLGFBQVFBLEdBQVlBLEtBQUtBLENBQUNBO0lBSW1EQSxDQUFDQTtJQUV0RkQsSUFBSUEsS0FBS0EsS0FBVUUsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0Es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QUVBLENBQUNBO0lBQ2hDQSxDQUFDQTtJQUVETDs7T0FFR0E7SUFDSEEsSUFBSUEsTUFBTUEsS0FBYU0sTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFFckROLGdCQUFnQkE7SUFDaEJBLFlBQVlBLEtBQVdPLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLE9BQU9BLEtBQUtBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0lBRXJGUCxnQkFBZ0JBO0lBQ2hCQSxzQkFBc0JBLENBQUNBLE1BQWNBO1FBQ25DUSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxNQUFNQSxJQUFJQSxNQUFNQSxDQUFDQSxDQUFDQTtJQUNyREEsQ0FBQ0E7SUFHRFIsZ0JBQWdCQTtJQUNoQkEscUJBQXFCQTtRQUNuQlMsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsT0FBT0EsT0FBT0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDbkVBLENBQUNBO0FBQ0hULENBQUNBO0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2lzUHJlc2VudCwgaXNCbGFuaywgbm9ybWFsaXplQm9vbH0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9sYW5nJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgRXZlbnRFbWl0dGVyLCBPYnNlcnZhYmxlV3JhcHBlcn0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9hc3luYyc7XG5pbXBvcnQge1Byb21pc2VXcmFwcGVyfSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL3Byb21pc2UnO1xuaW1wb3J0IHtTdHJpbmdNYXBXcmFwcGVyLCBMaXN0V3JhcHBlcn0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9jb2xsZWN0aW9uJztcbmltcG9ydCB7VmFsaWRhdG9yRm4sIEFzeW5jVmFsaWRhdG9yRm59IGZyb20gJy4vZGlyZWN0aXZlcy92YWxpZGF0b3JzJztcblxuLyoqXG4gKiBJbmRpY2F0ZXMgdGhhdCBhIENvbnRyb2wgaXMgdmFsaWQsIGkuZS4gdGhhdCBubyBlcnJvcnMgZXhpc3QgaW4gdGhlIGlucHV0IHZhbHVlLlxuICovXG5leHBvcnQgY29uc3QgVkFMSUQgPSBcIlZBTElEXCI7XG5cbi8qKlxuICogSW5kaWNhdGVzIHRoYXQgYSBDb250cm9sIGlzIGludmFsaWQsIGkuZS4gdGhhdCBhbiBlcnJvciBleGlzdHMgaW4gdGhlIGlucHV0IHZhbHVlLlxuICovXG5leHBvcnQgY29uc3QgSU5WQUxJRCA9IFwiSU5WQUxJRFwiO1xuXG4vKipcbiAqIEluZGljYXRlcyB0aGF0IGEgQ29udHJvbCBpcyBwZW5kaW5nLCBpLmUuIHRoYXQgYXN5bmMgdmFsaWRhdGlvbiBpcyBvY2N1cnJpbmcgYW5kXG4gKiBlcnJvcnMgYXJlIG5vdCB5ZXQgYXZhaWxhYmxlIGZvciB0aGUgaW5wdXQgdmFsdWUuXG4gKi9cbmV4cG9ydCBjb25zdCBQRU5ESU5HID0gXCJQRU5ESU5HXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbnRyb2woY29udHJvbDogT2JqZWN0KTogYm9vbGVhbiB7XG4gIHJldHVybiBjb250cm9sIGluc3RhbmNlb2YgQWJzdHJhY3RDb250cm9sO1xufVxuXG5mdW5jdGlvbiBfZmluZChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIHBhdGg6IEFycmF5PHN0cmluZyB8IG51bWJlcj58IHN0cmluZykge1xuICBpZiAoaXNCbGFuayhwYXRoKSkgcmV0dXJuIG51bGw7XG5cbiAgaWYgKCEocGF0aCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgIHBhdGggPSAoPHN0cmluZz5wYXRoKS5zcGxpdChcIi9cIik7XG4gIH1cbiAgaWYgKHBhdGggaW5zdGFuY2VvZiBBcnJheSAmJiBMaXN0V3JhcHBlci5pc0VtcHR5KHBhdGgpKSByZXR1cm4gbnVsbDtcblxuICByZXR1cm4gKDxBcnJheTxzdHJpbmcgfCBudW1iZXI+PnBhdGgpXG4gICAgICAucmVkdWNlKCh2LCBuYW1lKSA9PiB7XG4gICAgICAgIGlmICh2IGluc3RhbmNlb2YgQ29udHJvbEdyb3VwKSB7XG4gICAgICAgICAgcmV0dXJuIGlzUHJlc2VudCh2LmNvbnRyb2xzW25hbWVdKSA/IHYuY29udHJvbHNbbmFtZV0gOiBudWxsO1xuICAgICAgICB9IGVsc2UgaWYgKHYgaW5zdGFuY2VvZiBDb250cm9sQXJyYXkpIHtcbiAgICAgICAgICB2YXIgaW5kZXggPSA8bnVtYmVyPm5hbWU7XG4gICAgICAgICAgcmV0dXJuIGlzUHJlc2VudCh2LmF0KGluZGV4KSkgPyB2LmF0KGluZGV4KSA6IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0sIGNvbnRyb2wpO1xufVxuXG5mdW5jdGlvbiB0b09ic2VydmFibGUocjogYW55KTogT2JzZXJ2YWJsZTxhbnk+IHtcbiAgcmV0dXJuIFByb21pc2VXcmFwcGVyLmlzUHJvbWlzZShyKSA/IE9ic2VydmFibGVXcmFwcGVyLmZyb21Qcm9taXNlKHIpIDogcjtcbn1cblxuLyoqXG4gKlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQWJzdHJhY3RDb250cm9sIHtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfdmFsdWU6IGFueTtcblxuICBwcml2YXRlIF92YWx1ZUNoYW5nZXM6IEV2ZW50RW1pdHRlcjxhbnk+O1xuICBwcml2YXRlIF9zdGF0dXNDaGFuZ2VzOiBFdmVudEVtaXR0ZXI8YW55PjtcbiAgcHJpdmF0ZSBfc3RhdHVzOiBzdHJpbmc7XG4gIHByaXZhdGUgX2Vycm9yczoge1trZXk6IHN0cmluZ106IGFueX07XG4gIHByaXZhdGUgX3ByaXN0aW5lOiBib29sZWFuID0gdHJ1ZTtcbiAgcHJpdmF0ZSBfdG91Y2hlZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIF9wYXJlbnQ6IENvbnRyb2xHcm91cCB8IENvbnRyb2xBcnJheTtcbiAgcHJpdmF0ZSBfYXN5bmNWYWxpZGF0aW9uU3Vic2NyaXB0aW9uOiBhbnk7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHZhbGlkYXRvcjogVmFsaWRhdG9yRm4sIHB1YmxpYyBhc3luY1ZhbGlkYXRvcjogQXN5bmNWYWxpZGF0b3JGbikge31cblxuICBnZXQgdmFsdWUoKTogYW55IHsgcmV0dXJuIHRoaXMuX3ZhbHVlOyB9XG5cbiAgZ2V0IHN0YXR1cygpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5fc3RhdHVzOyB9XG5cbiAgZ2V0IHZhbGlkKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fc3RhdHVzID09PSBWQUxJRDsgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBlcnJvcnMgb2YgdGhpcyBjb250cm9sLlxuICAgKi9cbiAgZ2V0IGVycm9ycygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7IHJldHVybiB0aGlzLl9lcnJvcnM7IH1cblxuICBnZXQgcHJpc3RpbmUoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl9wcmlzdGluZTsgfVxuXG4gIGdldCBkaXJ0eSgpOiBib29sZWFuIHsgcmV0dXJuICF0aGlzLnByaXN0aW5lOyB9XG5cbiAgZ2V0IHRvdWNoZWQoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl90b3VjaGVkOyB9XG5cbiAgZ2V0IHVudG91Y2hlZCgpOiBib29sZWFuIHsgcmV0dXJuICF0aGlzLl90b3VjaGVkOyB9XG5cbiAgZ2V0IHZhbHVlQ2hhbmdlcygpOiBPYnNlcnZhYmxlPGFueT4geyByZXR1cm4gdGhpcy5fdmFsdWVDaGFuZ2VzOyB9XG5cbiAgZ2V0IHN0YXR1c0NoYW5nZXMoKTogT2JzZXJ2YWJsZTxhbnk+IHsgcmV0dXJuIHRoaXMuX3N0YXR1c0NoYW5nZXM7IH1cblxuICBnZXQgcGVuZGluZygpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX3N0YXR1cyA9PSBQRU5ESU5HOyB9XG5cbiAgbWFya0FzVG91Y2hlZCgpOiB2b2lkIHsgdGhpcy5fdG91Y2hlZCA9IHRydWU7IH1cblxuICBtYXJrQXNEaXJ0eSh7b25seVNlbGZ9OiB7b25seVNlbGY/OiBib29sZWFufSA9IHt9KTogdm9pZCB7XG4gICAgb25seVNlbGYgPSBub3JtYWxpemVCb29sKG9ubHlTZWxmKTtcbiAgICB0aGlzLl9wcmlzdGluZSA9IGZhbHNlO1xuXG4gICAgaWYgKGlzUHJlc2VudCh0aGlzLl9wYXJlbnQpICYmICFvbmx5U2VsZikge1xuICAgICAgdGhpcy5fcGFyZW50Lm1hcmtBc0RpcnR5KHtvbmx5U2VsZjogb25seVNlbGZ9KTtcbiAgICB9XG4gIH1cblxuICBtYXJrQXNQZW5kaW5nKHtvbmx5U2VsZn06IHtvbmx5U2VsZj86IGJvb2xlYW59ID0ge30pOiB2b2lkIHtcbiAgICBvbmx5U2VsZiA9IG5vcm1hbGl6ZUJvb2wob25seVNlbGYpO1xuICAgIHRoaXMuX3N0YXR1cyA9IFBFTkRJTkc7XG5cbiAgICBpZiAoaXNQcmVzZW50KHRoaXMuX3BhcmVudCkgJiYgIW9ubHlTZWxmKSB7XG4gICAgICB0aGlzLl9wYXJlbnQubWFya0FzUGVuZGluZyh7b25seVNlbGY6IG9ubHlTZWxmfSk7XG4gICAgfVxuICB9XG5cbiAgc2V0UGFyZW50KHBhcmVudDogQ29udHJvbEdyb3VwIHwgQ29udHJvbEFycmF5KTogdm9pZCB7IHRoaXMuX3BhcmVudCA9IHBhcmVudDsgfVxuXG4gIHVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkoXG4gICAgICB7b25seVNlbGYsIGVtaXRFdmVudH06IHtvbmx5U2VsZj86IGJvb2xlYW4sIGVtaXRFdmVudD86IGJvb2xlYW59ID0ge30pOiB2b2lkIHtcbiAgICBvbmx5U2VsZiA9IG5vcm1hbGl6ZUJvb2wob25seVNlbGYpO1xuICAgIGVtaXRFdmVudCA9IGlzUHJlc2VudChlbWl0RXZlbnQpID8gZW1pdEV2ZW50IDogdHJ1ZTtcblxuICAgIHRoaXMuX3VwZGF0ZVZhbHVlKCk7XG5cbiAgICB0aGlzLl9lcnJvcnMgPSB0aGlzLl9ydW5WYWxpZGF0b3IoKTtcbiAgICB0aGlzLl9zdGF0dXMgPSB0aGlzLl9jYWxjdWxhdGVTdGF0dXMoKTtcblxuICAgIGlmICh0aGlzLl9zdGF0dXMgPT0gVkFMSUQgfHwgdGhpcy5fc3RhdHVzID09IFBFTkRJTkcpIHtcbiAgICAgIHRoaXMuX3J1bkFzeW5jVmFsaWRhdG9yKGVtaXRFdmVudCk7XG4gICAgfVxuXG4gICAgaWYgKGVtaXRFdmVudCkge1xuICAgICAgT2JzZXJ2YWJsZVdyYXBwZXIuY2FsbEVtaXQodGhpcy5fdmFsdWVDaGFuZ2VzLCB0aGlzLl92YWx1ZSk7XG4gICAgICBPYnNlcnZhYmxlV3JhcHBlci5jYWxsRW1pdCh0aGlzLl9zdGF0dXNDaGFuZ2VzLCB0aGlzLl9zdGF0dXMpO1xuICAgIH1cblxuICAgIGlmIChpc1ByZXNlbnQodGhpcy5fcGFyZW50KSAmJiAhb25seVNlbGYpIHtcbiAgICAgIHRoaXMuX3BhcmVudC51cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KHtvbmx5U2VsZjogb25seVNlbGYsIGVtaXRFdmVudDogZW1pdEV2ZW50fSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfcnVuVmFsaWRhdG9yKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgICByZXR1cm4gaXNQcmVzZW50KHRoaXMudmFsaWRhdG9yKSA/IHRoaXMudmFsaWRhdG9yKHRoaXMpIDogbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgX3J1bkFzeW5jVmFsaWRhdG9yKGVtaXRFdmVudDogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmIChpc1ByZXNlbnQodGhpcy5hc3luY1ZhbGlkYXRvcikpIHtcbiAgICAgIHRoaXMuX3N0YXR1cyA9IFBFTkRJTkc7XG4gICAgICB0aGlzLl9jYW5jZWxFeGlzdGluZ1N1YnNjcmlwdGlvbigpO1xuICAgICAgdmFyIG9icyA9IHRvT2JzZXJ2YWJsZSh0aGlzLmFzeW5jVmFsaWRhdG9yKHRoaXMpKTtcbiAgICAgIHRoaXMuX2FzeW5jVmFsaWRhdGlvblN1YnNjcmlwdGlvbiA9IE9ic2VydmFibGVXcmFwcGVyLnN1YnNjcmliZShcbiAgICAgICAgICBvYnMsIChyZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9KSA9PiB0aGlzLnNldEVycm9ycyhyZXMsIHtlbWl0RXZlbnQ6IGVtaXRFdmVudH0pKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9jYW5jZWxFeGlzdGluZ1N1YnNjcmlwdGlvbigpOiB2b2lkIHtcbiAgICBpZiAoaXNQcmVzZW50KHRoaXMuX2FzeW5jVmFsaWRhdGlvblN1YnNjcmlwdGlvbikpIHtcbiAgICAgIE9ic2VydmFibGVXcmFwcGVyLmRpc3Bvc2UodGhpcy5fYXN5bmNWYWxpZGF0aW9uU3Vic2NyaXB0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBlcnJvcnMgb24gYSBjb250cm9sLlxuICAgKlxuICAgKiBUaGlzIGlzIHVzZWQgd2hlbiB2YWxpZGF0aW9ucyBhcmUgcnVuIG5vdCBhdXRvbWF0aWNhbGx5LCBidXQgbWFudWFsbHkgYnkgdGhlIHVzZXIuXG4gICAqXG4gICAqIENhbGxpbmcgYHNldEVycm9yc2Agd2lsbCBhbHNvIHVwZGF0ZSB0aGUgdmFsaWRpdHkgb2YgdGhlIHBhcmVudCBjb250cm9sLlxuICAgKlxuICAgKiAjIyBVc2FnZVxuICAgKlxuICAgKiBgYGBcbiAgICogdmFyIGxvZ2luID0gbmV3IENvbnRyb2woXCJzb21lTG9naW5cIik7XG4gICAqIGxvZ2luLnNldEVycm9ycyh7XG4gICAqICAgXCJub3RVbmlxdWVcIjogdHJ1ZVxuICAgKiB9KTtcbiAgICpcbiAgICogZXhwZWN0KGxvZ2luLnZhbGlkKS50b0VxdWFsKGZhbHNlKTtcbiAgICogZXhwZWN0KGxvZ2luLmVycm9ycykudG9FcXVhbCh7XCJub3RVbmlxdWVcIjogdHJ1ZX0pO1xuICAgKlxuICAgKiBsb2dpbi51cGRhdGVWYWx1ZShcInNvbWVPdGhlckxvZ2luXCIpO1xuICAgKlxuICAgKiBleHBlY3QobG9naW4udmFsaWQpLnRvRXF1YWwodHJ1ZSk7XG4gICAqIGBgYFxuICAgKi9cbiAgc2V0RXJyb3JzKGVycm9yczoge1trZXk6IHN0cmluZ106IGFueX0sIHtlbWl0RXZlbnR9OiB7ZW1pdEV2ZW50PzogYm9vbGVhbn0gPSB7fSk6IHZvaWQge1xuICAgIGVtaXRFdmVudCA9IGlzUHJlc2VudChlbWl0RXZlbnQpID8gZW1pdEV2ZW50IDogdHJ1ZTtcblxuICAgIHRoaXMuX2Vycm9ycyA9IGVycm9ycztcbiAgICB0aGlzLl9zdGF0dXMgPSB0aGlzLl9jYWxjdWxhdGVTdGF0dXMoKTtcblxuICAgIGlmIChlbWl0RXZlbnQpIHtcbiAgICAgIE9ic2VydmFibGVXcmFwcGVyLmNhbGxFbWl0KHRoaXMuX3N0YXR1c0NoYW5nZXMsIHRoaXMuX3N0YXR1cyk7XG4gICAgfVxuXG4gICAgaWYgKGlzUHJlc2VudCh0aGlzLl9wYXJlbnQpKSB7XG4gICAgICB0aGlzLl9wYXJlbnQuX3VwZGF0ZUNvbnRyb2xzRXJyb3JzKCk7XG4gICAgfVxuICB9XG5cbiAgZmluZChwYXRoOiBBcnJheTxzdHJpbmcgfCBudW1iZXI+fCBzdHJpbmcpOiBBYnN0cmFjdENvbnRyb2wgeyByZXR1cm4gX2ZpbmQodGhpcywgcGF0aCk7IH1cblxuICBnZXRFcnJvcihlcnJvckNvZGU6IHN0cmluZywgcGF0aDogc3RyaW5nW10gPSBudWxsKTogYW55IHtcbiAgICB2YXIgY29udHJvbCA9IGlzUHJlc2VudChwYXRoKSAmJiAhTGlzdFdyYXBwZXIuaXNFbXB0eShwYXRoKSA/IHRoaXMuZmluZChwYXRoKSA6IHRoaXM7XG4gICAgaWYgKGlzUHJlc2VudChjb250cm9sKSAmJiBpc1ByZXNlbnQoY29udHJvbC5fZXJyb3JzKSkge1xuICAgICAgcmV0dXJuIFN0cmluZ01hcFdyYXBwZXIuZ2V0KGNvbnRyb2wuX2Vycm9ycywgZXJyb3JDb2RlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgaGFzRXJyb3IoZXJyb3JDb2RlOiBzdHJpbmcsIHBhdGg6IHN0cmluZ1tdID0gbnVsbCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBpc1ByZXNlbnQodGhpcy5nZXRFcnJvcihlcnJvckNvZGUsIHBhdGgpKTtcbiAgfVxuXG4gIGdldCByb290KCk6IEFic3RyYWN0Q29udHJvbCB7XG4gICAgbGV0IHg6IEFic3RyYWN0Q29udHJvbCA9IHRoaXM7XG5cbiAgICB3aGlsZSAoaXNQcmVzZW50KHguX3BhcmVudCkpIHtcbiAgICAgIHggPSB4Ll9wYXJlbnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHg7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF91cGRhdGVDb250cm9sc0Vycm9ycygpOiB2b2lkIHtcbiAgICB0aGlzLl9zdGF0dXMgPSB0aGlzLl9jYWxjdWxhdGVTdGF0dXMoKTtcblxuICAgIGlmIChpc1ByZXNlbnQodGhpcy5fcGFyZW50KSkge1xuICAgICAgdGhpcy5fcGFyZW50Ll91cGRhdGVDb250cm9sc0Vycm9ycygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2luaXRPYnNlcnZhYmxlcygpIHtcbiAgICB0aGlzLl92YWx1ZUNoYW5nZXMgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgdGhpcy5fc3RhdHVzQ2hhbmdlcyA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgfVxuXG5cbiAgcHJpdmF0ZSBfY2FsY3VsYXRlU3RhdHVzKCk6IHN0cmluZyB7XG4gICAgaWYgKGlzUHJlc2VudCh0aGlzLl9lcnJvcnMpKSByZXR1cm4gSU5WQUxJRDtcbiAgICBpZiAodGhpcy5fYW55Q29udHJvbHNIYXZlU3RhdHVzKFBFTkRJTkcpKSByZXR1cm4gUEVORElORztcbiAgICBpZiAodGhpcy5fYW55Q29udHJvbHNIYXZlU3RhdHVzKElOVkFMSUQpKSByZXR1cm4gSU5WQUxJRDtcbiAgICByZXR1cm4gVkFMSUQ7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIGFic3RyYWN0IF91cGRhdGVWYWx1ZSgpOiB2b2lkO1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgYWJzdHJhY3QgX2FueUNvbnRyb2xzSGF2ZVN0YXR1cyhzdGF0dXM6IHN0cmluZyk6IGJvb2xlYW47XG59XG5cbi8qKlxuICogRGVmaW5lcyBhIHBhcnQgb2YgYSBmb3JtIHRoYXQgY2Fubm90IGJlIGRpdmlkZWQgaW50byBvdGhlciBjb250cm9scy4gYENvbnRyb2xgcyBoYXZlIHZhbHVlcyBhbmRcbiAqIHZhbGlkYXRpb24gc3RhdGUsIHdoaWNoIGlzIGRldGVybWluZWQgYnkgYW4gb3B0aW9uYWwgdmFsaWRhdGlvbiBmdW5jdGlvbi5cbiAqXG4gKiBgQ29udHJvbGAgaXMgb25lIG9mIHRoZSB0aHJlZSBmdW5kYW1lbnRhbCBidWlsZGluZyBibG9ja3MgdXNlZCB0byBkZWZpbmUgZm9ybXMgaW4gQW5ndWxhciwgYWxvbmdcbiAqIHdpdGgge0BsaW5rIENvbnRyb2xHcm91cH0gYW5kIHtAbGluayBDb250cm9sQXJyYXl9LlxuICpcbiAqICMjIFVzYWdlXG4gKlxuICogQnkgZGVmYXVsdCwgYSBgQ29udHJvbGAgaXMgY3JlYXRlZCBmb3IgZXZlcnkgYDxpbnB1dD5gIG9yIG90aGVyIGZvcm0gY29tcG9uZW50LlxuICogV2l0aCB7QGxpbmsgTmdGb3JtQ29udHJvbH0gb3Ige0BsaW5rIE5nRm9ybU1vZGVsfSBhbiBleGlzdGluZyB7QGxpbmsgQ29udHJvbH0gY2FuIGJlXG4gKiBib3VuZCB0byBhIERPTSBlbGVtZW50IGluc3RlYWQuIFRoaXMgYENvbnRyb2xgIGNhbiBiZSBjb25maWd1cmVkIHdpdGggYSBjdXN0b21cbiAqIHZhbGlkYXRpb24gZnVuY3Rpb24uXG4gKlxuICogIyMjIEV4YW1wbGUgKFtsaXZlIGRlbW9dKGh0dHA6Ly9wbG5rci5jby9lZGl0LzIzREVTT3BiTm5CcEJIWnQxQlI0P3A9cHJldmlldykpXG4gKi9cbmV4cG9ydCBjbGFzcyBDb250cm9sIGV4dGVuZHMgQWJzdHJhY3RDb250cm9sIHtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfb25DaGFuZ2U6IEZ1bmN0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKHZhbHVlOiBhbnkgPSBudWxsLCB2YWxpZGF0b3I6IFZhbGlkYXRvckZuID0gbnVsbCxcbiAgICAgICAgICAgICAgYXN5bmNWYWxpZGF0b3I6IEFzeW5jVmFsaWRhdG9yRm4gPSBudWxsKSB7XG4gICAgc3VwZXIodmFsaWRhdG9yLCBhc3luY1ZhbGlkYXRvcik7XG4gICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLnVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkoe29ubHlTZWxmOiB0cnVlLCBlbWl0RXZlbnQ6IGZhbHNlfSk7XG4gICAgdGhpcy5faW5pdE9ic2VydmFibGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSB2YWx1ZSBvZiB0aGUgY29udHJvbCB0byBgdmFsdWVgLlxuICAgKlxuICAgKiBJZiBgb25seVNlbGZgIGlzIGB0cnVlYCwgdGhpcyBjaGFuZ2Ugd2lsbCBvbmx5IGFmZmVjdCB0aGUgdmFsaWRhdGlvbiBvZiB0aGlzIGBDb250cm9sYFxuICAgKiBhbmQgbm90IGl0cyBwYXJlbnQgY29tcG9uZW50LiBJZiBgZW1pdEV2ZW50YCBpcyBgdHJ1ZWAsIHRoaXMgY2hhbmdlIHdpbGwgY2F1c2UgYVxuICAgKiBgdmFsdWVDaGFuZ2VzYCBldmVudCBvbiB0aGUgYENvbnRyb2xgIHRvIGJlIGVtaXR0ZWQuIEJvdGggb2YgdGhlc2Ugb3B0aW9ucyBkZWZhdWx0IHRvXG4gICAqIGBmYWxzZWAuXG4gICAqXG4gICAqIElmIGBlbWl0TW9kZWxUb1ZpZXdDaGFuZ2VgIGlzIGB0cnVlYCwgdGhlIHZpZXcgd2lsbCBiZSBub3RpZmllZCBhYm91dCB0aGUgbmV3IHZhbHVlXG4gICAqIHZpYSBhbiBgb25DaGFuZ2VgIGV2ZW50LiBUaGlzIGlzIHRoZSBkZWZhdWx0IGJlaGF2aW9yIGlmIGBlbWl0TW9kZWxUb1ZpZXdDaGFuZ2VgIGlzIG5vdFxuICAgKiBzcGVjaWZpZWQuXG4gICAqL1xuICB1cGRhdGVWYWx1ZSh2YWx1ZTogYW55LCB7b25seVNlbGYsIGVtaXRFdmVudCwgZW1pdE1vZGVsVG9WaWV3Q2hhbmdlfToge1xuICAgIG9ubHlTZWxmPzogYm9vbGVhbixcbiAgICBlbWl0RXZlbnQ/OiBib29sZWFuLFxuICAgIGVtaXRNb2RlbFRvVmlld0NoYW5nZT86IGJvb2xlYW5cbiAgfSA9IHt9KTogdm9pZCB7XG4gICAgZW1pdE1vZGVsVG9WaWV3Q2hhbmdlID0gaXNQcmVzZW50KGVtaXRNb2RlbFRvVmlld0NoYW5nZSkgPyBlbWl0TW9kZWxUb1ZpZXdDaGFuZ2UgOiB0cnVlO1xuICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgaWYgKGlzUHJlc2VudCh0aGlzLl9vbkNoYW5nZSkgJiYgZW1pdE1vZGVsVG9WaWV3Q2hhbmdlKSB0aGlzLl9vbkNoYW5nZSh0aGlzLl92YWx1ZSk7XG4gICAgdGhpcy51cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KHtvbmx5U2VsZjogb25seVNlbGYsIGVtaXRFdmVudDogZW1pdEV2ZW50fSk7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfdXBkYXRlVmFsdWUoKSB7fVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9hbnlDb250cm9sc0hhdmVTdGF0dXMoc3RhdHVzOiBzdHJpbmcpOiBib29sZWFuIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbGlzdGVuZXIgZm9yIGNoYW5nZSBldmVudHMuXG4gICAqL1xuICByZWdpc3Rlck9uQ2hhbmdlKGZuOiBGdW5jdGlvbik6IHZvaWQgeyB0aGlzLl9vbkNoYW5nZSA9IGZuOyB9XG59XG5cbi8qKlxuICogRGVmaW5lcyBhIHBhcnQgb2YgYSBmb3JtLCBvZiBmaXhlZCBsZW5ndGgsIHRoYXQgY2FuIGNvbnRhaW4gb3RoZXIgY29udHJvbHMuXG4gKlxuICogQSBgQ29udHJvbEdyb3VwYCBhZ2dyZWdhdGVzIHRoZSB2YWx1ZXMgb2YgZWFjaCB7QGxpbmsgQ29udHJvbH0gaW4gdGhlIGdyb3VwLlxuICogVGhlIHN0YXR1cyBvZiBhIGBDb250cm9sR3JvdXBgIGRlcGVuZHMgb24gdGhlIHN0YXR1cyBvZiBpdHMgY2hpbGRyZW4uXG4gKiBJZiBvbmUgb2YgdGhlIGNvbnRyb2xzIGluIGEgZ3JvdXAgaXMgaW52YWxpZCwgdGhlIGVudGlyZSBncm91cCBpcyBpbnZhbGlkLlxuICogU2ltaWxhcmx5LCBpZiBhIGNvbnRyb2wgY2hhbmdlcyBpdHMgdmFsdWUsIHRoZSBlbnRpcmUgZ3JvdXAgY2hhbmdlcyBhcyB3ZWxsLlxuICpcbiAqIGBDb250cm9sR3JvdXBgIGlzIG9uZSBvZiB0aGUgdGhyZWUgZnVuZGFtZW50YWwgYnVpbGRpbmcgYmxvY2tzIHVzZWQgdG8gZGVmaW5lIGZvcm1zIGluIEFuZ3VsYXIsXG4gKiBhbG9uZyB3aXRoIHtAbGluayBDb250cm9sfSBhbmQge0BsaW5rIENvbnRyb2xBcnJheX0uIHtAbGluayBDb250cm9sQXJyYXl9IGNhbiBhbHNvIGNvbnRhaW4gb3RoZXJcbiAqIGNvbnRyb2xzLCBidXQgaXMgb2YgdmFyaWFibGUgbGVuZ3RoLlxuICpcbiAqICMjIyBFeGFtcGxlIChbbGl2ZSBkZW1vXShodHRwOi8vcGxua3IuY28vZWRpdC8yM0RFU09wYk5uQnBCSFp0MUJSND9wPXByZXZpZXcpKVxuICovXG5leHBvcnQgY2xhc3MgQ29udHJvbEdyb3VwIGV4dGVuZHMgQWJzdHJhY3RDb250cm9sIHtcbiAgcHJpdmF0ZSBfb3B0aW9uYWxzOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn07XG5cbiAgY29uc3RydWN0b3IocHVibGljIGNvbnRyb2xzOiB7W2tleTogc3RyaW5nXTogQWJzdHJhY3RDb250cm9sfSxcbiAgICAgICAgICAgICAgb3B0aW9uYWxzOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn0gPSBudWxsLCB2YWxpZGF0b3I6IFZhbGlkYXRvckZuID0gbnVsbCxcbiAgICAgICAgICAgICAgYXN5bmNWYWxpZGF0b3I6IEFzeW5jVmFsaWRhdG9yRm4gPSBudWxsKSB7XG4gICAgc3VwZXIodmFsaWRhdG9yLCBhc3luY1ZhbGlkYXRvcik7XG4gICAgdGhpcy5fb3B0aW9uYWxzID0gaXNQcmVzZW50KG9wdGlvbmFscykgPyBvcHRpb25hbHMgOiB7fTtcbiAgICB0aGlzLl9pbml0T2JzZXJ2YWJsZXMoKTtcbiAgICB0aGlzLl9zZXRQYXJlbnRGb3JDb250cm9scygpO1xuICAgIHRoaXMudXBkYXRlVmFsdWVBbmRWYWxpZGl0eSh7b25seVNlbGY6IHRydWUsIGVtaXRFdmVudDogZmFsc2V9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSBjb250cm9sIHRvIHRoaXMgZ3JvdXAuXG4gICAqL1xuICBhZGRDb250cm9sKG5hbWU6IHN0cmluZywgY29udHJvbDogQWJzdHJhY3RDb250cm9sKTogdm9pZCB7XG4gICAgdGhpcy5jb250cm9sc1tuYW1lXSA9IGNvbnRyb2w7XG4gICAgY29udHJvbC5zZXRQYXJlbnQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGEgY29udHJvbCBmcm9tIHRoaXMgZ3JvdXAuXG4gICAqL1xuICByZW1vdmVDb250cm9sKG5hbWU6IHN0cmluZyk6IHZvaWQgeyBTdHJpbmdNYXBXcmFwcGVyLmRlbGV0ZSh0aGlzLmNvbnRyb2xzLCBuYW1lKTsgfVxuXG4gIC8qKlxuICAgKiBNYXJrIHRoZSBuYW1lZCBjb250cm9sIGFzIG5vbi1vcHRpb25hbC5cbiAgICovXG4gIGluY2x1ZGUoY29udHJvbE5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIFN0cmluZ01hcFdyYXBwZXIuc2V0KHRoaXMuX29wdGlvbmFscywgY29udHJvbE5hbWUsIHRydWUpO1xuICAgIHRoaXMudXBkYXRlVmFsdWVBbmRWYWxpZGl0eSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hcmsgdGhlIG5hbWVkIGNvbnRyb2wgYXMgb3B0aW9uYWwuXG4gICAqL1xuICBleGNsdWRlKGNvbnRyb2xOYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBTdHJpbmdNYXBXcmFwcGVyLnNldCh0aGlzLl9vcHRpb25hbHMsIGNvbnRyb2xOYW1lLCBmYWxzZSk7XG4gICAgdGhpcy51cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgd2hldGhlciB0aGVyZSBpcyBhIGNvbnRyb2wgd2l0aCB0aGUgZ2l2ZW4gbmFtZSBpbiB0aGUgZ3JvdXAuXG4gICAqL1xuICBjb250YWlucyhjb250cm9sTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgdmFyIGMgPSBTdHJpbmdNYXBXcmFwcGVyLmNvbnRhaW5zKHRoaXMuY29udHJvbHMsIGNvbnRyb2xOYW1lKTtcbiAgICByZXR1cm4gYyAmJiB0aGlzLl9pbmNsdWRlZChjb250cm9sTmFtZSk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9zZXRQYXJlbnRGb3JDb250cm9scygpIHtcbiAgICBTdHJpbmdNYXBXcmFwcGVyLmZvckVhY2goXG4gICAgICAgIHRoaXMuY29udHJvbHMsIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIG5hbWU6IHN0cmluZykgPT4geyBjb250cm9sLnNldFBhcmVudCh0aGlzKTsgfSk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF91cGRhdGVWYWx1ZSgpIHsgdGhpcy5fdmFsdWUgPSB0aGlzLl9yZWR1Y2VWYWx1ZSgpOyB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfYW55Q29udHJvbHNIYXZlU3RhdHVzKHN0YXR1czogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgdmFyIHJlcyA9IGZhbHNlO1xuICAgIFN0cmluZ01hcFdyYXBwZXIuZm9yRWFjaCh0aGlzLmNvbnRyb2xzLCAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBuYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgIHJlcyA9IHJlcyB8fCAodGhpcy5jb250YWlucyhuYW1lKSAmJiBjb250cm9sLnN0YXR1cyA9PSBzdGF0dXMpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXM7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9yZWR1Y2VWYWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVkdWNlQ2hpbGRyZW4oXG4gICAgICAgIHt9LCAoYWNjOiB7W2s6IHN0cmluZ106IEFic3RyYWN0Q29udHJvbH0sIGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCwgbmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgYWNjW25hbWVdID0gY29udHJvbC52YWx1ZTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9KTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3JlZHVjZUNoaWxkcmVuKGluaXRWYWx1ZTogYW55LCBmbjogRnVuY3Rpb24pIHtcbiAgICB2YXIgcmVzID0gaW5pdFZhbHVlO1xuICAgIFN0cmluZ01hcFdyYXBwZXIuZm9yRWFjaCh0aGlzLmNvbnRyb2xzLCAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBuYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgIGlmICh0aGlzLl9pbmNsdWRlZChuYW1lKSkge1xuICAgICAgICByZXMgPSBmbihyZXMsIGNvbnRyb2wsIG5hbWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXM7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9pbmNsdWRlZChjb250cm9sTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgdmFyIGlzT3B0aW9uYWwgPSBTdHJpbmdNYXBXcmFwcGVyLmNvbnRhaW5zKHRoaXMuX29wdGlvbmFscywgY29udHJvbE5hbWUpO1xuICAgIHJldHVybiAhaXNPcHRpb25hbCB8fCBTdHJpbmdNYXBXcmFwcGVyLmdldCh0aGlzLl9vcHRpb25hbHMsIGNvbnRyb2xOYW1lKTtcbiAgfVxufVxuXG4vKipcbiAqIERlZmluZXMgYSBwYXJ0IG9mIGEgZm9ybSwgb2YgdmFyaWFibGUgbGVuZ3RoLCB0aGF0IGNhbiBjb250YWluIG90aGVyIGNvbnRyb2xzLlxuICpcbiAqIEEgYENvbnRyb2xBcnJheWAgYWdncmVnYXRlcyB0aGUgdmFsdWVzIG9mIGVhY2gge0BsaW5rIENvbnRyb2x9IGluIHRoZSBncm91cC5cbiAqIFRoZSBzdGF0dXMgb2YgYSBgQ29udHJvbEFycmF5YCBkZXBlbmRzIG9uIHRoZSBzdGF0dXMgb2YgaXRzIGNoaWxkcmVuLlxuICogSWYgb25lIG9mIHRoZSBjb250cm9scyBpbiBhIGdyb3VwIGlzIGludmFsaWQsIHRoZSBlbnRpcmUgYXJyYXkgaXMgaW52YWxpZC5cbiAqIFNpbWlsYXJseSwgaWYgYSBjb250cm9sIGNoYW5nZXMgaXRzIHZhbHVlLCB0aGUgZW50aXJlIGFycmF5IGNoYW5nZXMgYXMgd2VsbC5cbiAqXG4gKiBgQ29udHJvbEFycmF5YCBpcyBvbmUgb2YgdGhlIHRocmVlIGZ1bmRhbWVudGFsIGJ1aWxkaW5nIGJsb2NrcyB1c2VkIHRvIGRlZmluZSBmb3JtcyBpbiBBbmd1bGFyLFxuICogYWxvbmcgd2l0aCB7QGxpbmsgQ29udHJvbH0gYW5kIHtAbGluayBDb250cm9sR3JvdXB9LiB7QGxpbmsgQ29udHJvbEdyb3VwfSBjYW4gYWxzbyBjb250YWluXG4gKiBvdGhlciBjb250cm9scywgYnV0IGlzIG9mIGZpeGVkIGxlbmd0aC5cbiAqXG4gKiAjIyBBZGRpbmcgb3IgcmVtb3ZpbmcgY29udHJvbHNcbiAqXG4gKiBUbyBjaGFuZ2UgdGhlIGNvbnRyb2xzIGluIHRoZSBhcnJheSwgdXNlIHRoZSBgcHVzaGAsIGBpbnNlcnRgLCBvciBgcmVtb3ZlQXRgIG1ldGhvZHNcbiAqIGluIGBDb250cm9sQXJyYXlgIGl0c2VsZi4gVGhlc2UgbWV0aG9kcyBlbnN1cmUgdGhlIGNvbnRyb2xzIGFyZSBwcm9wZXJseSB0cmFja2VkIGluIHRoZVxuICogZm9ybSdzIGhpZXJhcmNoeS4gRG8gbm90IG1vZGlmeSB0aGUgYXJyYXkgb2YgYEFic3RyYWN0Q29udHJvbGBzIHVzZWQgdG8gaW5zdGFudGlhdGVcbiAqIHRoZSBgQ29udHJvbEFycmF5YCBkaXJlY3RseSwgYXMgdGhhdCB3aWxsIHJlc3VsdCBpbiBzdHJhbmdlIGFuZCB1bmV4cGVjdGVkIGJlaGF2aW9yIHN1Y2hcbiAqIGFzIGJyb2tlbiBjaGFuZ2UgZGV0ZWN0aW9uLlxuICpcbiAqICMjIyBFeGFtcGxlIChbbGl2ZSBkZW1vXShodHRwOi8vcGxua3IuY28vZWRpdC8yM0RFU09wYk5uQnBCSFp0MUJSND9wPXByZXZpZXcpKVxuICovXG5leHBvcnQgY2xhc3MgQ29udHJvbEFycmF5IGV4dGVuZHMgQWJzdHJhY3RDb250cm9sIHtcbiAgY29uc3RydWN0b3IocHVibGljIGNvbnRyb2xzOiBBYnN0cmFjdENvbnRyb2xbXSwgdmFsaWRhdG9yOiBWYWxpZGF0b3JGbiA9IG51bGwsXG4gICAgICAgICAgICAgIGFzeW5jVmFsaWRhdG9yOiBBc3luY1ZhbGlkYXRvckZuID0gbnVsbCkge1xuICAgIHN1cGVyKHZhbGlkYXRvciwgYXN5bmNWYWxpZGF0b3IpO1xuICAgIHRoaXMuX2luaXRPYnNlcnZhYmxlcygpO1xuICAgIHRoaXMuX3NldFBhcmVudEZvckNvbnRyb2xzKCk7XG4gICAgdGhpcy51cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KHtvbmx5U2VsZjogdHJ1ZSwgZW1pdEV2ZW50OiBmYWxzZX0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUge0BsaW5rIEFic3RyYWN0Q29udHJvbH0gYXQgdGhlIGdpdmVuIGBpbmRleGAgaW4gdGhlIGFycmF5LlxuICAgKi9cbiAgYXQoaW5kZXg6IG51bWJlcik6IEFic3RyYWN0Q29udHJvbCB7IHJldHVybiB0aGlzLmNvbnRyb2xzW2luZGV4XTsgfVxuXG4gIC8qKlxuICAgKiBJbnNlcnQgYSBuZXcge0BsaW5rIEFic3RyYWN0Q29udHJvbH0gYXQgdGhlIGVuZCBvZiB0aGUgYXJyYXkuXG4gICAqL1xuICBwdXNoKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCk6IHZvaWQge1xuICAgIHRoaXMuY29udHJvbHMucHVzaChjb250cm9sKTtcbiAgICBjb250cm9sLnNldFBhcmVudCh0aGlzKTtcbiAgICB0aGlzLnVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnNlcnQgYSBuZXcge0BsaW5rIEFic3RyYWN0Q29udHJvbH0gYXQgdGhlIGdpdmVuIGBpbmRleGAgaW4gdGhlIGFycmF5LlxuICAgKi9cbiAgaW5zZXJ0KGluZGV4OiBudW1iZXIsIGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCk6IHZvaWQge1xuICAgIExpc3RXcmFwcGVyLmluc2VydCh0aGlzLmNvbnRyb2xzLCBpbmRleCwgY29udHJvbCk7XG4gICAgY29udHJvbC5zZXRQYXJlbnQodGhpcyk7XG4gICAgdGhpcy51cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIHRoZSBjb250cm9sIGF0IHRoZSBnaXZlbiBgaW5kZXhgIGluIHRoZSBhcnJheS5cbiAgICovXG4gIHJlbW92ZUF0KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgICBMaXN0V3JhcHBlci5yZW1vdmVBdCh0aGlzLmNvbnRyb2xzLCBpbmRleCk7XG4gICAgdGhpcy51cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KCk7XG4gIH1cblxuICAvKipcbiAgICogTGVuZ3RoIG9mIHRoZSBjb250cm9sIGFycmF5LlxuICAgKi9cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5jb250cm9scy5sZW5ndGg7IH1cblxuICAvKiogQGludGVybmFsICovXG4gIF91cGRhdGVWYWx1ZSgpOiB2b2lkIHsgdGhpcy5fdmFsdWUgPSB0aGlzLmNvbnRyb2xzLm1hcCgoY29udHJvbCkgPT4gY29udHJvbC52YWx1ZSk7IH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9hbnlDb250cm9sc0hhdmVTdGF0dXMoc3RhdHVzOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5jb250cm9scy5zb21lKGMgPT4gYy5zdGF0dXMgPT0gc3RhdHVzKTtcbiAgfVxuXG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfc2V0UGFyZW50Rm9yQ29udHJvbHMoKTogdm9pZCB7XG4gICAgdGhpcy5jb250cm9scy5mb3JFYWNoKChjb250cm9sKSA9PiB7IGNvbnRyb2wuc2V0UGFyZW50KHRoaXMpOyB9KTtcbiAgfVxufVxuIl19