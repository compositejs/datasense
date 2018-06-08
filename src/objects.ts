namespace DataSense {
export type PropsObservableAccessorContract = PropsAccessorContract & RegisterPropRequestContract<SimplePropsAccessorContract, SimpleValueAccessorContract<any>>;

export interface PropsFurtherEventsContract {
    propBroadcastReceived: EventObservable;
    broadcastReceived: SingleEventObservable<any>;
    propNotifyReceived: EventObservable;
    notifyReceived: SingleEventObservable<any>;
    sendPropRequest(key: string, type: string, value: any): void;
    sendRequest(type: string, value: any): void;
    sendPropBroadcast(key: string, data: any, message?: FireInfoContract | string): void;
    sendBroadcast(data: any, message?: FireInfoContract | string): void;
}

/**
 * The observable for object properties.
 */
export class PropsObservable implements DisposableArrayContract {
    private _instance: {
        has(key: string): boolean,
        get(key: string): any,
        keys(): string[],
        pushFlows(key: string, ...flows: ValueModifierContract<any>[]): ChangeFlowRegisteredContract,
        clearFlows(key: string): number,
        sendPropRequest(key: string, type: string, value: any): void,
        sendRequest(type: string, value: any): void,
        sendPropBroadcast(key: string, data: any, message?: FireInfoContract | string): void,
        sendBroadcast(data: any, message?: FireInfoContract | string): void
    } & DisposableArrayContract;

    /**
     * The event raised before a property is changing.
     */
    public readonly propChanging: EventObservable;

    /**
     * The event raised after a property has changed.
     */
    public readonly propChanged: EventObservable;

    /**
     * The event raised when a property is changed failed.
     */
    public readonly propChangeFailed: EventObservable;

    /**
     * The event raised when a property broadcast message is recieved.
     */
    public readonly propBroadcastReceived: EventObservable;

    /**
     * The event raised when a property notify message is recieved.
     */
    public readonly propNotifyReceived: EventObservable;

    public readonly anyPropChanging: SingleEventObservable<ChangingInfo<any>>;

    public readonly anyPropChanged: SingleEventObservable<ChangedInfo<any>>;

    public readonly anyPropChangeFailed: SingleEventObservable<ChangedInfo<any>>;

    /**
     * The event raised after a set of property have been changed.
     */
    public readonly propsChanged: SingleEventObservable<ChangedInfoSetContract>;

    /**
     * The event raised when a broadcast message is recieved.
     */
    public readonly broadcastReceived: SingleEventObservable<any>;

    /**
     * The event raised when a notify message is recieved.
     */
    public readonly notifyReceived: SingleEventObservable<any>;

    /**
     * Initializes a new instance of the PropsObservable class.
     * @param changer  A function to called that you can get the accessor of the properties and more by the argument.
     */
    constructor(changer: PropsObservable | ((accessor: PropsObservableAccessorContract) => void)) {
        let disposable = new DisposableArray();
        if ((changer instanceof PropsObservable) && changer._instance) {
            this._instance = {
                ...changer._instance,
                pushDisposable(...items) {
                    return disposable.pushDisposable(...items);
                },
                dispose() {
                    disposable.dispose();
                }
            };
            this.propChanging = changer.propChanging.createObservable();
            this.propChanged = changer.propChanged.createObservable();
            this.propChangeFailed = changer.propChangeFailed.createObservable();
            this.propBroadcastReceived = changer.propBroadcastReceived.createObservable();
            this.propNotifyReceived = changer.propNotifyReceived.createObservable();
            this.anyPropChanging = changer.anyPropChanging.createObservable();
            this.anyPropChanged = changer.anyPropChanged.createObservable();
            this.anyPropChangeFailed = changer.anyPropChangeFailed.createObservable();
            this.propsChanged = changer.propsChanged.createObservable();
            this.broadcastReceived = changer.broadcastReceived.createObservable();
            this.notifyReceived = changer.notifyReceived.createObservable();
            this.pushDisposable(
                this.propChanging,
                this.propChanged,
                this.propChangeFailed,
                this.propBroadcastReceived,
                this.propNotifyReceived,
                this.anyPropChanging,
                this.anyPropChanged,
                this.anyPropChangeFailed,
                this.propsChanged,
                this.broadcastReceived,
                this.notifyReceived
            );
            changer.pushDisposable(this);
            return;
        }

        let obj = Access.propsAccessor();
        this.propChanging = obj.propChanging;
        this.propChanged = obj.propChanged;
        this.propChangeFailed = obj.propChangeFailed;
        this.propBroadcastReceived = obj.propBroadcastReceived;
        this.propNotifyReceived = obj.propNotifyReceived;
        this.anyPropChanging = obj.anyPropChanging;
        this.anyPropChanged = obj.anyPropChanged;
        this.anyPropChangeFailed = obj.anyPropChangeFailed;
        this.propsChanged = obj.propsChanged;
        this.broadcastReceived = obj.broadcastReceived;
        this.notifyReceived = obj.notifyReceived;
        disposable.pushDisposable(
            this.propChanging,
            this.propChanged,
            this.propChangeFailed,
            this.propBroadcastReceived,
            this.propNotifyReceived,
            this.anyPropChanging,
            this.anyPropChanged,
            this.anyPropChangeFailed,
            this.propsChanged,
            this.broadcastReceived,
            this.notifyReceived
        );

        let simpleAccessor: SimplePropsAccessorContract = {
            hasProp(key) {
                return obj.accessor.hasProp(key)
            },
            getProp(key) {
                return obj.accessor.getProp(key);
            },
            getPropKeys() {
                return obj.accessor.getPropKeys();
            },
            setProp(key, value, message) {
                return obj.accessor.setProp(key, value, message);
            },
            removeProp(keys, message?) {
                return obj.accessor.removeProp(keys, message);
            },
            batchProp(changeSet, message?) {
                return obj.accessor.batchProp(changeSet, message);
            },
            forceUpdateProp(key) {
                obj.accessor.forceUpdateProp(key);
            }
        };
        let getSimplePropAccessor = (key: string) => {
            return {
                get() {
                    return obj.accessor.getProp(key);
                },
                set(value, message?) {
                    return obj.accessor.setProp(key, value, message);
                },
                forceUpdate() {
                    obj.accessor.forceUpdateProp(key);
                }
            } as SimpleValueAccessorContract<any>;
        }

        let sendPropRequestH = (key: string, type: string, value: any) => {
            obj.sendPropRequest(key, type, value, getSimplePropAccessor(key));
        };
        let sendRequestH = (type: string, value: any) => {
            obj.sendRequest(type, value, simpleAccessor);
        };
        let sendPropBroadcastH = (key: string, type: string, value: any) => {
            obj.sendPropBroadcast(key, type, value);
        };
        let sendBroadcastH = (type: string, value: any) => {
            obj.sendBroadcast(type, value);
        };

        this._instance = {
            has(key) {
                return obj.accessor.hasProp(key)
            },
            get(key) {
                return obj.accessor.getProp(key);
            },
            keys() {
                return obj.accessor.getPropKeys();
            },
            pushFlows(key, ...flows) {
                return obj.pushFlows(key, ...flows);
            },
            clearFlows(key) {
                return obj.clearFlows(key);
            },
            sendPropRequest(key, type, value) {
                sendPropRequestH(key, type, value);
            },
            sendRequest(type, value) {
                sendRequestH(type, value);
            },
            sendPropBroadcast(key, data, message?) {
                sendPropBroadcastH(key, data, message);
            },
            sendBroadcast(data, message?) {
                sendBroadcastH(data, message);
            },
            pushDisposable(...items) {
                return disposable.pushDisposable(...items);
            },
            dispose() {
                disposable.dispose();
            }
        };
        if (typeof changer !== "function") return;
        let eventsMore: PropsFurtherEventsContract = (changer as any).additionalEvents;
        if (eventsMore) {
            if (eventsMore.broadcastReceived instanceof SingleEventObservable) {
                this.broadcastReceived = eventsMore.broadcastReceived;
                this.pushDisposable(this.broadcastReceived);
            }

            if (eventsMore.propBroadcastReceived instanceof EventObservable) {
                this.propBroadcastReceived = eventsMore.propBroadcastReceived;
                this.pushDisposable(this.propBroadcastReceived);
            }

            if (eventsMore.notifyReceived instanceof SingleEventObservable) {
                this.notifyReceived = eventsMore.notifyReceived;
                this.pushDisposable(this.notifyReceived);
            }

            if (eventsMore.propNotifyReceived instanceof EventObservable) {
                this.propNotifyReceived = eventsMore.propNotifyReceived;
                this.pushDisposable(this.propNotifyReceived);
            }

            if (typeof eventsMore.sendRequest === "function") sendRequestH = eventsMore.sendRequest;
            if (typeof eventsMore.sendPropRequest === "function") sendPropRequestH = eventsMore.sendPropRequest;
            if (typeof eventsMore.sendBroadcast === "function") sendBroadcastH = eventsMore.sendBroadcast;
            if (typeof eventsMore.sendPropBroadcast === "function") sendPropBroadcastH = eventsMore.sendPropBroadcast;
        }

        changer(obj.accessor);
    }

    public pushDisposable(...items: DisposableContract[]) {
        return this._instance.pushDisposable(...items);
    }

    /**
     * Gets all property keys.
     */
    public getKeys() {
        return this._instance.keys();
    }

    /**
     * Checks if the specific key is existed.
     * @param key  The property key.
     */
    public hasProp(key: string) {
        return this._instance.has(key);
    }

    /**
     * Gets a value of the specific key.
     * @param key  The property key.
     */
    public getProp(key: string) {
        return this._instance.get(key);
    }

    public registerChangeFlow(key: string, ...value: ValueModifierContract<any>[]) {
        return this._instance.pushFlows(key, ...value);
    }

    public clearChangeFlow(key: string) {
        return this._instance.clearFlows(key);
    }

    public onPropChanging<T>(
        key: string,
        h: EventHandlerContract<ChangingInfo<T>> | EventHandlerContract<ChangingInfo<T>>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.propChanging.on(key, h, thisArg, options, disposableArray);
    }

    public onPropChanged<T>(
        key: string,
        h: EventHandlerContract<ChangedInfo<T>> | EventHandlerContract<ChangedInfo<T>>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.propChanged.on(key, h, thisArg, options, disposableArray);
    }

    public onPropChangeFailed<T>(
        key: string,
        h: EventHandlerContract<ChangedInfo<T>> | EventHandlerContract<ChangedInfo<T>>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        if (!key || typeof key !== "string") return EventObservable.createFailedOnResult(null);
        return this.propChangeFailed.on(key, h, thisArg, options, disposableArray);
    }

    public onAnyPropChanging(
        h: EventHandlerContract<ChangingInfo<any>> | EventHandlerContract<ChangingInfo<any>>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.anyPropChanging.on(h, thisArg, options, disposableArray);
    }

    public onAnyPropChanged(
        h: EventHandlerContract<ChangedInfo<any>> | EventHandlerContract<ChangedInfo<any>>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.anyPropChanged.on(h, thisArg, options, disposableArray);
    }

    public onAnyPropChangeFailed(
        h: EventHandlerContract<ChangedInfo<any>> | EventHandlerContract<ChangedInfo<any>>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.anyPropChangeFailed.on(h, thisArg, options, disposableArray);
    }

    public onPropsChanged(
        h: EventHandlerContract<ChangedInfoSetContract> | EventHandlerContract<ChangedInfoSetContract>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.propsChanged.on(h, thisArg, options, disposableArray);
    }

    public onPropBroadcastReceived(
        key: string,
        h: EventHandlerContract<any> | EventHandlerContract<any>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.propBroadcastReceived.on(key, h, thisArg, options, disposableArray);
    }

    public onBroadcastReceived(
        h: EventHandlerContract<any> | EventHandlerContract<any>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.broadcastReceived.on(h, thisArg, options, disposableArray);
    }

    public onPropNotifyReceived(
        key: string,
        h: EventHandlerContract<any> | EventHandlerContract<any>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.propNotifyReceived.on<any>(key, h, thisArg, options, disposableArray);
    }

    public onNotifyReceived(
        h: EventHandlerContract<any> | EventHandlerContract<any>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.notifyReceived.on(h, thisArg, options, disposableArray);
    }

    public subscribeProp<T>(key: string, h: (newValue: T) => void, thisArg?: any) {
        return this.propChanged.subscribeSingle(key, h, thisArg, (newValue: ChangedInfo<T>) => newValue.value);
    }

    public subscribeProps(h: (changeSet: ChangedInfo<any>[]) => void, thisArg?: any) {
        return this.propsChanged.subscribeWithConvertor(h, thisArg, (changeSet: ChangedInfoSetContract) => changeSet.changes);
    }

    /**
     * Sends a property request message.
     * @param key  The property key.
     * @param type  The request type.
     * @param value  The data.
     */
    public sendPropRequest(key: string, type: string, value: any) {
        this._instance.sendPropRequest(key, type, value);
    }

    /**
     * Sends a request message.
     * @param type  The request type.
     * @param value  The data.
     */
    public sendRequest(type: string, value: any) {
        this._instance.sendRequest(type, value);
    }

    public sendPropBroadcast(key: string, data: any, message?: FireInfoContract | string) {
        this._instance.sendPropBroadcast(key, data, message);
    }

    public sendBroadcast(data: any, message?: FireInfoContract | string) {
        this._instance.sendBroadcast(data, message);
    }

    public createPropObservable<T>(key: string) {
        let obj: {
            accessor?: ValueAccessorContract<T>
        } = {};
        let sendBroadcast = (data: any, message?: FireInfoContract | string) => {
            this.sendPropBroadcast(key, data, message);
        };
        let h = (accessor: ValueAccessorContract<T>) => {
            obj.accessor = accessor;
        };
        (h as any) = {
            broadcastReceived: this.propBroadcastReceived.createSingleObservable(key),
            notifyReceived: this.propNotifyReceived.createSingleObservable(key),
            sendBroadcast
        } as ValueFurtherEventsContract;
        let result = new ValueObservable<T>(accessor => {
            accessor.set(this.getProp(key));
            obj.accessor = accessor;
        });
        let onToken = this.onPropChanging<T>(key, (ev, evController) => {
            let changeToken = obj.accessor.customizedSet(ev.currentValue, evController.message);
            if (!ev.observable) return;
            ev.observable.onResolved(newValue => {
                changeToken.resolve(newValue);
            });
            ev.observable.onRejected(err => {
                changeToken.reject(err);
            });
        });
        result.pushDisposable(onToken);
        return result;
    }

    public createObservable() {
        return new PropsObservable(this);
    }

    public copyModel() {
        let obj: any = {};
        this.getKeys().forEach(key => {
            obj[key] = this.getProp(key);
        });
        return obj;
    }

    public toJSON() {
        let value = this.copyModel();
        try {
            if (value != null) return JSON.stringify(value);
        } catch (ex) {}
        return (new String(value)).toString();
    }

    /**
     * Disposes the instance.
     */
    public dispose() {
        this._instance.dispose();
    }
}

/**
 * Object property accessing and observing client.
 */
export class PropsClient extends PropsObservable {
    public readonly proxy: any;

    private readonly _propSetter: (key: string, value: any, message?: FireInfoContract | string) => ChangedInfo<any>;
    private readonly _sendPropNotify: (key: string, data: any, message?: FireInfoContract | string) => void;
    private readonly _sendNotify: (data: any, message?: FireInfoContract | string) => void;
    private readonly _registerPropRequestHandler: (key: string, type: string, h: (owner: SimpleValueAccessorContract<any>, value: any) => void) => boolean;
    private readonly _registerRequestHandler: (type: string, h: (owner: SimplePropsAccessorContract, value: any) => void) => boolean;

    constructor(
        defaultValue: any,
        modifier: (setter: (key: string, newValue: any, message?: FireInfoContract | string) => ValueResolveContract<any>) => void,
        propSetter: (key: string, value: any, message?: FireInfoContract | string) => ChangedInfo<any>,
        sendPropNotify: (key: string, data: any, message?: FireInfoContract | string) => void,
        sendNotify: (data: any, message?: FireInfoContract | string) => void,
        registerPropRequestHandler: (key: string, type: string, h: (owner: SimpleValueAccessorContract<any>, value: any) => void) => boolean,
        registerRequestHandler: (type: string, h: (owner: SimplePropsAccessorContract, value: any) => void) => boolean,
        additionalEvents: PropsFurtherEventsContract
    ) {
        let h = (acc: PropsObservableAccessorContract) => {
            acc.batchProp(defaultValue);
            modifier(acc.customizedSetProp);
        };
        if (additionalEvents) (h as any).additionalEvents = additionalEvents;
        super(h);

        if (typeof propSetter === "function") this._propSetter = propSetter;
        if (typeof sendPropNotify === "function") this._sendPropNotify = sendPropNotify;
        if (typeof sendNotify === "function") this._sendNotify = sendNotify;
        if (typeof registerPropRequestHandler === "function") this._registerPropRequestHandler = registerPropRequestHandler;
        if (typeof registerRequestHandler === "function") this._registerRequestHandler = registerRequestHandler;

        if (typeof Proxy === "undefined") return;
        this.proxy = new Proxy({}, {
            has: (target, p) => {
                if (!p || typeof p !== "string") return false;
                return this.hasProp(p);
            },
            get: (target, p, receiver) => {
                if (!p || typeof p !== "string") return undefined;
                return this.getProp(p);
            },
            set: (target, p, value, receiver) => {
                if (!p || typeof p !== "string") throw new TypeError("the property key should be a string");
                return this.setProp(p, value);
            },
            ownKeys: (target) => {
                return this.getKeys();
            },
            enumerate: (target) => {
                return this.getKeys();                    
            }
        });
    }

    /**
     * Sets a value of the specific key.
     * @param key  The property key.
     * @param value  The value of the property to set.
     * @param message  A message for the setting event.
     */
    public setProp(key: string, value: any, message?: FireInfoContract | string): boolean {
        if (typeof this._propSetter !== "function") return false;
        let info = this._propSetter(key, value, message)
        return info ? info.success : false;
    }

    /**
     * Sets a value of the specific key. A status and further information will be returned.
     * @param key  The property key.
     * @param value  The value of the property to set.
     * @param message  A message for the setting event.
     */
    public setPropForDetails<T>(key: string, value: T, message?: FireInfoContract | string): ChangedInfo<T> {
        if (typeof this._propSetter !== "function") return ChangedInfo.fail(null, undefined, value, "not implemented");
        return this._propSetter(key, value, message);
    }

    public setPromiseProp<T>(key: string, value: Promise<T>, compatible?: boolean, message?: FireInfoContract | string): Promise<T> {
        return Access.setPromise((value, message?) => {
            return this.setPropForDetails(key, value, message);
        }, value, compatible, message);
    }

    public setSubscribeProp<T>(key: string, value: SubscriberContract<T>, message?: FireInfoContract | string, callbackfn?: (ev: ChangedInfo<T>, message: FireInfoContract) => void, thisArg?: any) {
        return Access.setSubscribe((value, message?) => {
            return this.setPropForDetails(key, value, message);
        }, value, message, callbackfn, thisArg);
    }

    public sendPropNotify(key: string, data: any, message?: FireInfoContract | string) {
        if (typeof this._sendPropNotify !== "function") return;
        this._sendPropNotify(key, data, message);
    }

    public sendNotify(data: any, message?: FireInfoContract | string) {
        if (typeof this._sendNotify !== "function") return;
        this._sendNotify(data, message);
    }

    /**
     * Registers a handler to respond the request message for a property.
     * @param key  The property key.
     * @param type  The request type.
     * @param h  The handler to respond the request message.
     */
    public registerPropRequestHandler(key: string, type: string, h: (owner: SimpleValueAccessorContract<any>, value: any) => void) {
        if (typeof this._registerPropRequestHandler !== "function") return false;
        return this._registerPropRequestHandler(key, type, h);
    }

    /**
     * Registers a handler to respond the request message.
     * @param type  The request type.
     * @param h  The handler to respond the request message.
     */
    public registerRequestHandler(type: string, h: (owner: SimplePropsAccessorContract, value: any) => void) {
        if (typeof this._registerRequestHandler !== "function") return false;
        return this._registerRequestHandler(type, h);
    }
}

/**
 * Object observable and controller.
 */
export class PropsController extends PropsObservable {
    private _accessor: PropsObservableAccessorContract;

    public readonly proxy: any;

    public get formatter() {
        return this._accessor.getFormatter();
    }

    public set formatter(h) {
        this._accessor.setFormatter(h);
    }

    public get validator() {
        return this._accessor.getValidator();
    }

    public set validator(h) {
        this._accessor.setValidator(h);
    }

    constructor() {
        let a: PropsObservableAccessorContract;
        super(acc => a = acc);
        this._accessor = a;

        if (typeof Proxy === "undefined") return;
        this.proxy = new Proxy({}, {
            has: (target, p) => {
                if (!p || typeof p !== "string") return false;
                return this.hasProp(p);
            },
            get: (target, p, receiver) => {
                if (!p || typeof p !== "string") return undefined;
                return this.getProp(p);
            },
            set: (target, p, value, receiver) => {
                if (!p || typeof p !== "string") throw new TypeError("the property key should be a string");
                return this.setProp(p, value);
            },
            ownKeys: (target) => {
                return this.getKeys();
            },
            enumerate: (target) => {
                return this.getKeys();                    
            }
        });
    }

    public forceUpdateProp(key: string, message?: FireInfoContract | string) {
        this._accessor.forceUpdateProp(key, message);
    }

    /**
     * Sets a value of the specific key.
     * @param key  The property key.
     * @param value  The value of the property to set.
     * @param message  A message for the setting event.
     */
    public setProp(key: string, value: any, message?: FireInfoContract | string) {
        let info = this._accessor.setProp(key, value, message);
        return info ? info.success : false;
    }

    /**
     * Sets a value of the specific key. A status and further information will be returned.
     * @param key  The property key.
     * @param value  The value of the property to set.
     * @param message  A message for the setting event.
     */
    public setPropForDetails<T>(key: string, value: T, message?: FireInfoContract | string): ChangedInfo<T> {
        return this._accessor.setProp(key, value, message);
    }

    public setPromiseProp<T>(key: string, value: Promise<T>, compatible?: boolean, message?: FireInfoContract | string): Promise<T> {
        return Access.setPromise((value, message?) => {
            return this.setPropForDetails(key, value, message);
        }, value, compatible, message);
    }

    public setSubscribeProp<T>(key: string, value: SubscriberContract<T>, message?: FireInfoContract | string, callbackfn?: (ev: ChangedInfo<T>, message: FireInfoContract) => void, thisArg?: any) {
        return Access.setSubscribe((value, message?) => {
            return this.setPropForDetails(key, value, message);
        }, value, message, callbackfn, thisArg);
    }

    /**
     * Removes a property.
     * @param key  The property key.
     * @param message  A message for the setting event.
     */
    public removeProp(key: string | string[], message?: FireInfoContract | string) {
        return this._accessor.removeProp(key, message);
    }

    /**
     * Batch sets properties.
     * @param obj  The data with properties to override current ones.
     * @param message  A message for the setting event.
     */
    public setProps(obj: any | PropUpdateActionContract<any>[], message?: FireInfoContract | string) {
        return this._accessor.batchProp(obj, message);
    }

    public sendPropNotify(key: string, data: any, message?: FireInfoContract | string) {
        this._accessor.sendPropNotify(key, data, message);
    }

    public sendNotify(data: any, message?: FireInfoContract | string) {
        this._accessor.sendNotify(data, message);
    }

    /**
     * Registers a handler to respond the request message for a property.
     * @param key  The property key.
     * @param type  The request type.
     * @param h  The handler to respond the request message.
     */
    public registerPropRequestHandler(key: string, type: string, h: (owner: SimpleValueAccessorContract<any>, value: any) => void) {
        return this._accessor.registerPropRequestHandler(key, type, h);
    }

    /**
     * Registers a handler to respond the request message.
     * @param type  The request type.
     * @param h  The handler to respond the request message.
     */
    public registerRequestHandler(type: string, h: (owner: SimplePropsAccessorContract, value: any) => void) {
        return this._accessor.registerRequestHandler(type, h);
    }

    public createPropClient<T>(key: string) {
        let token: DisposableContract;
        let sendBroadcast = (data: any, message?: FireInfoContract | string) => {
            this.sendPropBroadcast(key, data, message);
        };
        let sendRequest = (type: string, value: any) => {
            this.sendPropRequest(key, type, value);
        };
        let client = new ValueClient<T>(this.getProp(key), modifier => {
            token = this.onPropChanging<T>(key, (ev, evController) => {
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
            return this.setPropForDetails(key, value, message);
        }, (data, message?) => {
            this._accessor.sendPropNotify(key, data, message);
        }, (type, h) => {
            return this._accessor.registerPropRequestHandler(key, type, h);
        }, {
            broadcastReceived: this.propBroadcastReceived.createSingleObservable(key),
            notifyReceived: this.propNotifyReceived.createSingleObservable(key),
            sendRequest,
            sendBroadcast
        });
        client.pushDisposable(token);
        return client;
    }

    public createClient() {
        let token: DisposableContract;
        var sendRequest = (type: string, value: any) => {
            this.sendRequest(type, value);
        };
        var sendPropRequest = (key: string, type: string, value: any) => {
            this.sendPropRequest(key, type, value);
        };
        var sendBroadcast = (data: any, message?: FireInfoContract | string) => {
            this.sendBroadcast(data, message);
        };
        var sendPropBroadcast = (key: string, data: any, message?: FireInfoContract | string) => {
            this.sendPropBroadcast(key, data, message);
        };
        let client = new PropsClient(this.copyModel(), modifier => {
            token = this.onAnyPropChanging((ev, evController) => {
                let updateToken = modifier(ev.key, ev.valueRequest, evController.message);
                if (!ev.observable) return;
                ev.observable.onResolved(newValue => {
                    updateToken.resolve(newValue);
                });
                ev.observable.onRejected(err => {
                    updateToken.reject(err);
                });
            });
        }, (key, value, message?) => {
            return this.setPropForDetails(key, value, message);
        }, this._accessor.sendPropNotify, this._accessor.sendNotify, this.registerPropRequestHandler, this.registerRequestHandler, {
            propBroadcastReceived: this.propBroadcastReceived.createObservable(),
            broadcastReceived: this.broadcastReceived.createObservable(),
            propNotifyReceived: this.propNotifyReceived.createObservable(),
            notifyReceived: this.notifyReceived.createObservable(),
            sendPropRequest,
            sendRequest,
            sendPropBroadcast,
            sendBroadcast
        });
        client.pushDisposable(token);
        this.pushDisposable(client);
        return client;
    }
}
}