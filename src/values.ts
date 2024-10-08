namespace DataSense {

export type ValueObservableAccessorContract<T> = ValueAccessorContract<T> & RegisterRequestContract<SimpleValueAccessorContract<T>>;

export interface ValueFurtherEventsContract {
    broadcastReceived: SingleEventObservable<any>;
    notifyReceived: SingleEventObservable<any>;
    sendRequest(type: string, value: any): void;
    sendBroadcast(data: any, message?: FireInfoContract | string): void;
}

/**
 * The observable for data value.
 */
export class ValueObservable<T> implements DisposableArrayContract {
    private _instance: {
        get(options?: GetterOptionsContract): T,
        pushFlows(...flows: ValueModifierContract<any>[]): ChangeFlowRegisteredContract,
        clearFlows(): number,
        sendRequest(type: string, value: any): void,
        sendBroadcast(data: any, message?: FireInfoContract | string): void,
    } & DisposableArrayContract;

    /**
     * The event raised before the value is changing.
     */
    public readonly changing: SingleEventObservable<ChangingInfo<T>>;

    /**
     * The event raised after the value has changed.
     */
    public readonly changed: SingleEventObservable<ChangedInfo<T>>;

    /**
     * The event raised when the value is changed failed.
     */
    public readonly changeFailed: SingleEventObservable<ChangedInfo<T>>;

    /**
     * The event raised when a broadcast message is recieved.
     */
    public readonly broadcastReceived: SingleEventObservable<any>;

    /**
     * The event raised when a notify message is recieved.
     */
    public readonly notifyReceived: SingleEventObservable<any>;

    /**
     * Initializes a new instance of the ValueObservable class.
     * @param changer  A function to called that you can get the accessor of the value by the argument.
     */
    constructor(changer: ValueObservable<T> | ((changed: ValueObservableAccessorContract<T>) => void)) {
        let disposable = new DisposableArray();
        let accessKey = "value";
        if ((changer instanceof ValueObservable) && changer._instance) {
            this._instance = {
                ...changer._instance,
                pushDisposable(...items) {
                    return disposable.pushDisposable(...items);
                },
                removeDisposable(...items) {
                    return disposable.removeDisposable(...items);
                },
                dispose() {
                    disposable.dispose();
                }
            };
            this.changing = changer.changing.createObservable();
            this.changed = changer.changed.createObservable();
            this.changeFailed = changer.changeFailed.createObservable();
            this.broadcastReceived = changer.broadcastReceived.createObservable();
            this.notifyReceived = changer.notifyReceived.createObservable();
            this.pushDisposable(this.changing, this.changed, this.changeFailed, this.broadcastReceived, this.notifyReceived);
            changer.pushDisposable(this);
            return;
        }

        let formatter: (value: any) => T;
        let validator: (value: T) => boolean;
        let obj = Access.propsAccessor();
        obj.accessor.setFormatter((key, value) => {
            if (typeof formatter !== "function" || key !== accessKey) return value;
            return formatter(value);
        });
        obj.accessor.setValidator((key, value) => {
            if (typeof validator !== "function" || key !== accessKey) return true;
            return validator(value);
        });
        this.changing = obj.propChanging.createSingleObservable(accessKey);
        this.changed = obj.propChanged.createSingleObservable(accessKey);
        this.changeFailed = obj.propChangeFailed.createSingleObservable(accessKey);
        this.broadcastReceived = obj.propBroadcastReceived.createSingleObservable(accessKey);
        this.notifyReceived = obj.propNotifyReceived.createSingleObservable(accessKey);
        disposable.pushDisposable(this.changing, this.changed, this.changeFailed, this.broadcastReceived, this.notifyReceived);

        let simpleAccessor: SimpleValueAccessorContract<T> = {
            get(options) {
                return obj.accessor.getProp(accessKey, options);
            },
            set(value, message?) {
                return obj.accessor.setProp(accessKey, value, message);
            },
            forceUpdate(message?: FireInfoContract | string) {
                obj.accessor.forceUpdateProp(accessKey, message);
            }
        };

        let sendRequestH = (type: string, value: any) => {
            obj.sendPropRequest(accessKey, type, value, simpleAccessor);
        };
        let sendBroadcastH = (type: string, value: any) => {
            obj.sendPropBroadcast(accessKey, type, value);
        };

        this._instance = {
            get(options?: GetterOptionsContract) {
                return obj.accessor.getProp(accessKey, options);
            },
            pushFlows(...flows) {
                return obj.pushFlows(accessKey, ...flows);
            },
            clearFlows() {
                return obj.clearFlows(accessKey);
            },
            sendRequest(type, value) {
                sendRequestH(type, value);
            },
            sendBroadcast(data, message?) {
                sendBroadcastH(data, message);
            },
            pushDisposable(...items) {
                return disposable.pushDisposable(...items);
            },
            removeDisposable(...items) {
                return disposable.removeDisposable(...items);
            },
            dispose() {
                disposable.dispose();
            }
        };

        if (typeof changer !== "function") return;
        let eventsMore: ValueFurtherEventsContract = (changer as any).additionalEvents;
        if (eventsMore) {
            if (eventsMore.broadcastReceived instanceof SingleEventObservable) {
                this.broadcastReceived = eventsMore.broadcastReceived;
                this.pushDisposable(this.broadcastReceived);
            }

            if (eventsMore.notifyReceived instanceof SingleEventObservable) {
                this.notifyReceived = eventsMore.notifyReceived;
                this.pushDisposable(this.notifyReceived);
            }

            if (typeof eventsMore.sendRequest === "function") sendRequestH = eventsMore.sendRequest;
            if (typeof eventsMore.sendBroadcast === "function") sendBroadcastH = eventsMore.sendBroadcast;
        }
        changer({
            get(options) {
                return obj.accessor.getProp(accessKey, options)
            },
            set(value, message?) {
                return obj.accessor.setProp(accessKey, value, message);
            },
            customizedSet(valueRequested, message?) {
                return obj.accessor.customizedSetProp(accessKey, valueRequested, message);
            },
            forceUpdate(message?) {
                obj.accessor.forceUpdateProp(accessKey, message);
            },
            getFormatter() {
                return formatter;
            },
            setFormatter(h) {
                formatter = h;
            },
            getValidator() {
                return validator;
            },
            setValidator(h) {
                validator = h;
            },
            getStore(storePropKey) {
                return obj.accessor.getPropStore(accessKey, storePropKey);
            },
            setStore(storePropKey, value) {
                obj.accessor.setPropStore(accessKey, storePropKey, value);
            },
            removeStore(...storePropKey) {
                obj.accessor.removePropStore(accessKey, ...storePropKey);
            },
            sendNotify(data, message?) {
                obj.accessor.sendPropNotify(accessKey, data, message);
            },
            registerRequestHandler(type, h) {
                return obj.accessor.registerPropRequestHandler(accessKey, type, h);
            }
        });
    }

    /**
     * Adds disposable objects so that they will be disposed when this instance is disposed.
     * @param items  The objects to add.
     */
    public pushDisposable(...items: DisposableContract[]) {
        return this._instance.pushDisposable(...items);
    }

    /**
     * Removes the ones added here.
     * @param items  The objects to remove.
     */
    public removeDisposable(...items: DisposableContract[]) {
        return this._instance.removeDisposable(...items);
    }

    /**
     * Gets the value.
     */
    public get(options?: GetterOptionsContract) {
        return this._instance.get(options);
    }

    /**
     * Gets the type of value.
     */
    public getType() {
        return typeof this._instance.get();
    }

    /**
     * Checks if the value is instance of a specific type.
     */
    public instanceOf(c: any) {
        return this._instance.get() instanceof c;
    }

    public registerChangeFlow(...value: ValueModifierContract<T>[]) {
        return this._instance.pushFlows(...value);
    }

    public clearChangeFlow() {
        return this._instance.clearFlows();
    }

    /**
     * Registers an event listener on the value is changing.
     * @param h  The handler or handlers of the event listener.
     * @param thisArg  this arg.
     * @param options  The event listener options.
     * @param disposableArray  An additional disposable array instance for push current event handler.
     */
    public onChanging(
        h: EventHandlerContract<ChangingInfo<T>> | EventHandlerContract<ChangingInfo<T>>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.changing.on(h, thisArg, options, disposableArray);
    }

    /**
     * Registers an event listener on the value has been changed.
     * @param h  The handler or handlers of the event listener.
     * @param thisArg  this arg.
     * @param options  The event listener options.
     * @param disposableArray  An additional disposable array instance for push current event handler.
     */
    public onChanged(
        h: EventHandlerContract<ChangedInfo<T>> | EventHandlerContract<ChangedInfo<T>>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.changed.on(h, thisArg, options, disposableArray);
    }

    /**
     * Registers an event listener on the value is failed to change.
     * @param h  The handler or handlers of the event listener.
     * @param thisArg  this arg.
     * @param options  The event listener options.
     * @param disposableArray  An additional disposable array instance for push current event handler.
     */
    public onChangeFailed(
        h: EventHandlerContract<ChangedInfo<T>> | EventHandlerContract<ChangedInfo<T>>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.changeFailed.on(h, thisArg, options, disposableArray);
    }

    /**
     * Registers an event listener on a broadcast message is received.
     * @param h  The handler or handlers of the event listener.
     * @param thisArg  this arg.
     * @param options  The event listener options.
     * @param disposableArray  An additional disposable array instance for push current event handler.
     */
    public onBroadcastReceived(
        h: EventHandlerContract<any> | EventHandlerContract<any>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.broadcastReceived.on(h, thisArg, options, disposableArray);
    }

    /**
     * Registers an event listener on a notification is received.
     * @param h  The handler or handlers of the event listener.
     * @param thisArg  this arg.
     * @param options  The event listener options.
     * @param disposableArray  An additional disposable array instance for push current event handler.
     */
    public onNotifyReceived(
        h: EventHandlerContract<any> | EventHandlerContract<any>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.notifyReceived.on(h, thisArg, options, disposableArray);
    }

    /**
     * Subscribes for what the value has been changed.
     * @param h  The callback.
     * @param thisArg  this arg.
     */
    public subscribe(h: (newValue: T) => void, thisArg?: any): SubscriberCompatibleResultContract {
        return this.changed.subscribeWithConvertor<T>(h, thisArg, newValue => newValue.value);
    }

    /**
     * Sends a request message.
     * @param data  The data.
     * @param message  The additional information.
     */
    public sendRequest(type: string, value: any) {
        this._instance.sendRequest(type, value);
    }

    /**
     * Sends a broadcast message.
     * @param data  The data.
     * @param message  The additional information which will pass to the event listener handler.
     */
    public sendBroadcast(data: any, message?: FireInfoContract | string) {
        this._instance.sendBroadcast(data, message);
    }

    public createObservable() {
        return new ValueObservable<T>(this);
    }

    /**
     * Disposes the instance.
     */
    public dispose() {
        this._instance.dispose();
    }

    public toJSON() {
        let value = this._instance.get();
        try {
            if (value != null) return JSON.stringify(value);
        } catch (ex) {}
        return (new String(value)).toString();
    }
}

/**
 * Data property accessing and observing client.
 */
export class ValueClient<T> extends ValueObservable<T> {
    private readonly _setter: (value: T, message?: SetterOptionsContract | string) => ChangedInfo<T>;
    private readonly _forceUpdate: (message?: FireInfoContract | string) => void;
    private readonly _sendNotify: (data: any, message?: FireInfoContract | string) => void;
    private readonly _registerRequestHandler: (type: string, h: (owner: SimpleValueAccessorContract<T>, value: any) => void) => boolean;

    /**
     * Initializes a new instance of the ValueClient class.
     */
    constructor(
        defaultValue: T,
        modifier: (setter: ValueModifierContract<T>) => void,
        setter: (value: T, message?: SetterOptionsContract | string) => ChangedInfo<T>,
        sendNotify: (data: any, message?: FireInfoContract | string) => void,
        registerRequestHandler: (type: string, h: (owner: SimpleValueAccessorContract<T>, value: any) => void) => boolean,
        additionalEvents: ValueFurtherEventsContract,
        forceUpdate?: (message?: FireInfoContract | string) => void
    ) {
        let h = (acc: ValueObservableAccessorContract<T>) => {
            acc.set(defaultValue);
            modifier(acc.customizedSet);
        };
        if (additionalEvents) (h as any).additionalEvents = additionalEvents;
        super(h);

        if (typeof setter === "function") this._setter = setter;
        if (typeof sendNotify === "function") this._sendNotify = sendNotify;
        if (typeof registerRequestHandler === "function") this._registerRequestHandler = registerRequestHandler;
        if (typeof forceUpdate === "function") this._forceUpdate = forceUpdate;
    }

    /**
     * Sets value.
     * @param value  The value of the property to set.
     * @param message  A message for the setting event.
     */
    public set(value: T, message?: SetterOptionsContract | string): boolean {
        if (typeof this._setter !== "function") return false;
        let info = this._setter(value, message)
        return info ? info.success : false;
    }

    /**
     * Sets the value. A status and further information will be returned.
     * @param value  The value of the property to set.
     * @param message  A message for the setting event.
     */
    public setForDetails(value: T, message?: FireInfoContract | string): ChangedInfo<T> {
        if (typeof this._setter !== "function") return ChangedInfo.fail(null, undefined, value, "not implemented");
        return this._setter(value, message);
    }

    /**
     * Sets a value by a Promise.
     * @param value  A Promise of the property to set.
     * @param compatible  true if the value can also be a non-Promise; otherwise, false.
     * @param message  A message for the setting event.
     */
    public setPromise(value: Promise<T>, compatible?: boolean, message?: FireInfoContract | string): Promise<T> {
        return Access.setPromise((value, message?) => {
            return this.setForDetails(value, message);
        }, value, compatible, message);
    }

    /**
     * Sets a value by an observable which can be subscribed.
     * @param value  A Promise of the property to set.
     * @param message  A message for the setting event.
     * @param callbackfn  A function will be called on subscribed.
     */
    public setSubscribe(value: SubscriberContract<T>, message?: FireInfoContract | string, callbackfn?: (ev: ChangedInfo<T>, message: FireInfoContract) => void, thisArg?: any) {
        return Access.setSubscribe((value, message?) => {
            return this.setForDetails(value, message);
        }, value, message, callbackfn, thisArg);
    }

    /**
     * Forces to notify the update event.
     * @param message  A message for the setting event.
     */
    public forceUpdate(message?: FireInfoContract | string) {
        if (typeof this._forceUpdate !== "function") return;
        this._forceUpdate(message);
    }

    /**
     * Send a notification.
     * @param data  The data.
     * @param message  A message for the setting event.
     */
    public sendNotify(data: any, message?: FireInfoContract | string) {
        this._sendNotify(data, message);
    }

    /**
     * Registers a handler to respond the request message.
     * @param type  The request type.
     * @param h  The handler to respond the request message.
     */
    public registerRequestHandler(type: string, h: (owner: SimpleValueAccessorContract<T>, value: any) => void) {
        if (typeof this._registerRequestHandler !== "function") return false;
        return this._registerRequestHandler(type, h);
    }
}

/**
 * Data observable and controller.
 */
export class ValueController<T> extends ValueObservable<T> {
    private _accessor: ValueObservableAccessorContract<T>;
    private _observing: ChangeFlowRegisteredContract;

    /**
     * Gets the formatter/convertor.
     */
    public get formatter() {
        return this._accessor.getFormatter();
    }

    /**
     * Sets the formatter/convertor.
     */
    public set formatter(h) {
        this._accessor.setFormatter(h);
    }

    /**
     * Gets the validator.
     */
    public get validator() {
        return this._accessor.getValidator();
    }

    /**
     * Sets the validator.
     */
    public set validator(h) {
        this._accessor.setValidator(h);
    }

    /**
     * Initializes a new instance of the ValueController class.
     */
    constructor() {
        let a: ValueObservableAccessorContract<T>;
        super(acc => a = acc);
        this._accessor = a;
    }

    /**
     * Sets value.
     * @param value  The value of the property to set.
     * @param message  A message for the setting event.
     */
    public set(value: T, message?: SetterOptionsContract | string): boolean {
        let info = this._accessor.set(value, message);
        return info ? info.success : false;
    }

    /**
     * Sets the value. A status and further information will be returned.
     * @param value  The value of the property to set.
     * @param message  A message for the setting event.
     */
    public setForDetails(value: T, message?: SetterOptionsContract | string): ChangedInfo<T> {
        return this._accessor.set(value, message);
    }

    /**
     * Sets a value by a Promise.
     * @param value  A Promise of the property to set.
     * @param compatible  true if the value can also be a non-Promise; otherwise, false.
     * @param message  A message for the setting event.
     */
    public setPromise(value: Promise<T>, compatible?: boolean, message?: SetterOptionsContract | string): Promise<T> {
        return Access.setPromise((value, message?) => {
            return this.setForDetails(value, message);
        }, value, compatible, message);
    }

    /**
     * Sets a value by an observable which can be subscribed.
     * @param value  A Promise of the property to set.
     * @param message  A message for the setting event.
     * @param callbackfn  A function will be called on subscribed.
     */
    public setSubscribe(value: SubscriberContract<T>, message?: SetterOptionsContract | string, callbackfn?: (ev: ChangedInfo<T>, message: FireInfoContract) => void, thisArg?: any) {
        return Access.setSubscribe((value, message?) => {
            return this.setForDetails(value, message);
        }, value, message, callbackfn, thisArg);
    }

    /**
     * Forces to notify the update event.
     * @param message  A message for the setting event.
     */
    public forceUpdate(message?: FireInfoContract | string) {
        this._accessor.forceUpdate(message);
    }

    /**
     * Registers a handler to respond the request message.
     * @param type  The request type.
     * @param h  The handler to respond the request message.
     */
    public registerRequestHandler(type: string, h: (owner: SimpleValueAccessorContract<T>, value: any) => void) {
        return this._accessor.registerRequestHandler(type, h);
    }

    /**
     * Start to observe an observable value.
     * @param notSyncNow  true if keep current value unless call syncFromObserved member method of this or the observable value is changed; otherwise false.
     * @param message  A message for the setting event.
     */
    public observe(value: ValueObservable<T>, notSyncNow?: boolean, message?: FireInfoContract | string) {
        if (!(value instanceof ValueObservable)) return {
            sync() {},
            dispose() {}
        };
        this._observing = value.registerChangeFlow(this._accessor.customizedSet);
        if (!notSyncNow) this._accessor.customizedSet(value.get(), message).resolve();
        return this._observing;
    }

    /**
     * Stops observing.
     */
    public stopObserving() {
        let disposeObserving = this._observing;
        if (!disposeObserving) return;
        delete this._observing;
        if (typeof disposeObserving.dispose === "function") disposeObserving.dispose();
    }

    /**
     * Updates the value from the observed value.
     * @param message  A message for the setting event.
     */
    public syncFromObserved(message?: FireInfoContract | string) {
        let disposeObserving = this._observing;
        if (!disposeObserving || typeof disposeObserving.sync !== "function") return false;
        disposeObserving.sync(message);
        return true;
    }

    /**
     * Gets a value indicating whether it is observing another observable value.
     */
    public isObserving() {
        return !!this._observing;
    }

    /**
     * Creates a controller client.
     */
    public createClient() {
        let token: DisposableContract;
        var sendRequest = (type: string, value: any) => {
            this.sendRequest(type, value);
        };
        var sendBroadcast = (data: any, message?: FireInfoContract | string) => {
            this.sendBroadcast(data, message);
        };
        let client = new ValueClient<T>(this.get(), modifier => {
            token = this.onChanging((ev, evController) => {
                let updateToken = modifier(ev.valueRequest, evController.message);
                if (!ev.observable) return;
                ev.observable.onResolved(newValue => {
                    updateToken.resolve(newValue);
                });
                ev.observable.onRejected(err => {
                    updateToken.reject(err);
                });
            });
        }, (value, message?) => {
            return this.setForDetails(value, message);
        }, this._accessor.sendNotify, this._accessor.registerRequestHandler, {
            broadcastReceived: this.broadcastReceived.createObservable(),
            notifyReceived: this.notifyReceived.createObservable(),
            sendRequest,
            sendBroadcast
        }, (message?) => {
            this.forceUpdate(message);
        });
        client.pushDisposable(token);
        this.pushDisposable(client);
        return client;
    }

    /**
     * Send a notification.
     * @param data  The data.
     * @param message  The additional information which will pass to the event listener handler.
     */
    public sendNotify(data: any, message?: FireInfoContract | string) {
        this._accessor.sendNotify(data, message);
    }
}

/**
 * Creates a value controller with accessor and observable.
 * @param value  The optional initialized value.
 * @returns  The value controller with accessor and observable.
 */
export function createValue<T>(value?: T) {
    let p = new ValueController<T>();
    if (arguments.length > 0) p.set(value);
    return p;
}

}