namespace DataSense {
export type PropsObservableAccessorContract = PropsAccessorContract & RegisterPropRequestContract<SimplePropsAccessorContract, SimpleValueAccessorContract<any>>;

export interface PropsFurtherEventsContract {
    propBroadcastReceived: EventObservable;
    broadcastReceived: SingleEventObservable<any>;
    propNotifyReceived: EventObservable;
    notifyReceived: SingleEventObservable<any>;
    emptyPropRequested: SingleEventObservable<{ key: string }>;
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
        get(key: string, options?: GetterOptionsContract): any,
        getDetails<T>(key: string): PropDetailsContract<T>,
        getUpdateTime(key: string): Date | undefined,
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

    public readonly emptyPropRequested: SingleEventObservable<{ key: string }>;

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
                removeDisposable(...items) {
                    return disposable.removeDisposable(...items);
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
            this.emptyPropRequested = changer.emptyPropRequested.createObservable();
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
                this.emptyPropRequested,
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
        this.emptyPropRequested = obj.emptyPropRequested;
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
            this.emptyPropRequested,
            this.propsChanged,
            this.broadcastReceived,
            this.notifyReceived
        );

        let simpleAccessor: SimplePropsAccessorContract = {
            hasProp(key) {
                return obj.accessor.hasProp(key)
            },
            getProp(key, options) {
                return obj.accessor.getProp(key, options);
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
                get(options) {
                    return obj.accessor.getProp(key, options);
                },
                set(value, message?) {
                    return obj.accessor.setProp(key, value, message);
                },
                forceUpdate() {
                    obj.accessor.forceUpdateProp(key);
                }
            } as SimpleValueAccessorContract<any>;
        };
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
            get(key, options) {
                return obj.accessor.getProp(key, options);
            },
            getDetails(key) {
                return obj.accessor.getPropDetails(key);
            },
            getUpdateTime(key) {
                return obj.accessor.getPropUpdateTime(key);
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
            removeDisposable(...items) {
                return disposable.removeDisposable(...items);
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
    public getProp(key: string, options?: GetterOptionsContract) {
        return this._instance.get(key, options);
    }

    /**
     * Gets the update time of the specific key.
     * @param key  The property key.
     */
    public getPropUpdateTime(key: string): Date | undefined {
        return this._instance.getUpdateTime(key);
    }

    /**
     * Gets the details information of the specific key.
     * @param key  The property key.
     * @returns  The prop details.
     */
    public getPropDetails<T>(key: string) {
        return this._instance.getDetails<T>(key);
    }

    /**
     * Gets a set of property values.
     * @param keys  The property keys.
     * @returns  The property values in an array.
     */
    public getPropsArray(keys: string[]) {
        let arr = [];
        for (var key in keys) {
            arr.push(this._instance.get(key));
        }

        return arr;
    }

    /**
     * Gets a set of property values.
     * @param keys  The property keys.
     * @returns  The property values in an array.
     */
    public getPropsObject(keys: string[]) {
        let obj = {} as any as { [property: string]: any };
        for (var key in keys) {
            let v = this._instance.get(key);
            if (v !== undefined) obj[key] = v;
        }

        return obj;
    }

    /**
     * Gets a set of property values.
     * @param obj  The target object to set properties.
     * @param keys  The property keys.
     * @param ignoreIfExists  true if ignore to set property if already have one; otherwise, false.
     * @returns  The count of property to set.
     */
    public fillPropsObject(obj: any, keys: string[], ignoreIfExists = false) {
        if (!obj) return;
        let i = 0;
        if (!ignoreIfExists) {
            for (var key in keys) {
                let v = this._instance.get(key);
                if (v === undefined) continue;
                obj[key] = v;
                i++;
            }
    
            return i;
        }

        let props = Object.getOwnPropertyNames(obj);
        for (var key in keys) {
            if (props.indexOf(key) >= 0) continue;
            let v = this._instance.get(key);
            if (v === undefined) continue;
            obj[key] = v;
            i++;
        }

        return i;
    }

    /**
     * Gets the details information of the specific key.
     * @param keys  The property keys.
     * @returns  The prop details array.
     */
    public getPropsDetails(keys: string[]) {
        let arr: PropDetailsContract<any>[] = [];
        for (var key in keys) {
            arr.push(this._instance.getDetails(key))
        }
        
        return arr;
    }

    /**
     * Registers a flow so that it will be occurred as a pipeline when the property is changed.
     * @param key  The property key.
     * @param value  The flows.
     * @returns  The state of register.
     */
    public registerChangeFlow(key: string, ...value: ValueModifierContract<any>[]) {
        return this._instance.pushFlows(key, ...value);
    }

    /**
     * Clears all flow of the specific property changing.
     * @param key  The property key.
     * @returns  The count of flow removed.
     */
    public clearChangeFlow(key: string) {
        return this._instance.clearFlows(key);
    }

    /**
     * Registers an event listener on the speicific property is changing.
     * @param key  The property key.
     * @param h  The handler or handlers of the event listener.
     * @param thisArg  this arg.
     * @param options  The event listener options.
     * @param disposableArray  An additional disposable array instance for push current event handler.
     */
    public onPropChanging<T>(
        key: string,
        h: EventHandlerContract<ChangingInfo<T>> | EventHandlerContract<ChangingInfo<T>>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.propChanging.on(key, h, thisArg, options, disposableArray);
    }

    /**
     * Registers an event listener on the speicific property has been changed.
     * @param key  The property key.
     * @param h  The handler or handlers of the event listener.
     * @param thisArg  this arg.
     * @param options  The event listener options.
     * @param disposableArray  An additional disposable array instance for push current event handler.
     */
    public onPropChanged<T>(
        key: string,
        h: EventHandlerContract<ChangedInfo<T>> | EventHandlerContract<ChangedInfo<T>>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.propChanged.on(key, h, thisArg, options, disposableArray);
    }

    /**
     * Registers an event listener on the speicific property is failed to change.
     * @param key  The property key.
     * @param h  The handler or handlers of the event listener.
     * @param thisArg  this arg.
     * @param options  The event listener options.
     * @param disposableArray  An additional disposable array instance for push current event handler.
     */
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

    /**
     * Registers an event listener on one or more properties have been changed.
     * @param h  The handler or handlers of the event listener.
     * @param thisArg  this arg.
     * @param options  The event listener options.
     * @param disposableArray  An additional disposable array instance for push current event handler.
     */
    public onPropsChanged(
        h: EventHandlerContract<ChangedInfoSetContract> | EventHandlerContract<ChangedInfoSetContract>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.propsChanged.on(h, thisArg, options, disposableArray);
    }

    /**
     * Registers an event listener on a broadcast message of a specific property is received.
     * @param key  The property key.
     * @param h  The handler or handlers of the event listener.
     * @param thisArg  this arg.
     * @param options  The event listener options.
     * @param disposableArray  An additional disposable array instance for push current event handler.
     */
    public onPropBroadcastReceived(
        key: string,
        h: EventHandlerContract<any> | EventHandlerContract<any>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.propBroadcastReceived.on(key, h, thisArg, options, disposableArray);
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
     * Registers an event listener on a notification of a specific property is received.
     * @param key  The property key.
     * @param h  The handler or handlers of the event listener.
     * @param thisArg  this arg.
     * @param options  The event listener options.
     * @param disposableArray  An additional disposable array instance for push current event handler.
     */
    public onPropNotifyReceived(
        key: string,
        h: EventHandlerContract<any> | EventHandlerContract<any>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ) {
        return this.propNotifyReceived.on<any>(key, h, thisArg, options, disposableArray);
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
     * Subscribes for what a specific property has been changed.
     * @param key  The property key.
     * @param h  The callback.
     * @param thisArg  this arg.
     */
    public subscribeProp<T>(key: string, h: (newValue: T) => void, thisArg?: any) {
        return this.propChanged.subscribeSingle(key, h, thisArg, (newValue: ChangedInfo<T>) => newValue.value);
    }

    /**
     * Subscribes for what one or more properties have been changed.
     * @param h  The callback.
     * @param thisArg  this arg.
     */
    public subscribeProps(h: (changeSet: ChangedInfo<any>[]) => void, thisArg?: any) {
        return this.propsChanged.subscribeWithConvertor(h, thisArg, (changeSet: ChangedInfoSetContract) => changeSet.changes);
    }

    /**
     * Sends a request message for a property.
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

    /**
     * Sends a broadcast message for a property.
     * @param key  The property key.
     * @param data  The data.
     * @param message  The additional information which will pass to the event listener handler.
     */
    public sendPropBroadcast(key: string, data: any, message?: FireInfoContract | string) {
        this._instance.sendPropBroadcast(key, data, message);
    }

    /**
     * Sends a broadcast message.
     * @param data  The data.
     * @param message  The additional information which will pass to the event listener handler.
     */
    public sendBroadcast(data: any, message?: FireInfoContract | string) {
        this._instance.sendBroadcast(data, message);
    }

    /**
     * Creates an observable instance for a property.
     * @param key  The property key.
     */
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

    /**
     * Creates an observable instance.
     */
    public createObservable() {
        return new PropsObservable(this);
    }

    /**
     * Creates an object with properties copied from this.
     */
    public copyModel() {
        let obj: any = {};
        this.getKeys().forEach(key => {
            obj[key] = this.getProp(key);
        });
        return obj;
    }

    /**
     * Converts to the source object for JSON stringifying.
     * @returns The JSON object used to stringify.
     */
    public toJSON() {
        return this.copyModel();
    }

    /**
     * Converts to a JSON string.
     * @returns The JSON string.
     */
    public stringify() {
        let obj = this.copyModel();
        return JSON.stringify(obj);
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

    private readonly _propSetter: (key: string, value: any, message?: SetterOptionsContract | string) => ChangedInfo<any>;
    private readonly _sendPropNotify: (key: string, data: any, message?: FireInfoContract | string) => void;
    private readonly _sendNotify: (data: any, message?: FireInfoContract | string) => void;
    private readonly _registerPropRequestHandler: (key: string, type: string, h: (owner: SimpleValueAccessorContract<any>, value: any) => void) => boolean;
    private readonly _registerRequestHandler: (type: string, h: (owner: SimplePropsAccessorContract, value: any) => void) => boolean;

    /**
     * Gets the data model with two-way bindings for its properties.
     */
    public readonly proxy: any;

    /**
     * Initializes a new instance of the PropsClient class.
     */
    constructor(
        defaultValue: any,
        modifier: (setter: (key: string, newValue: any, message?: SetterOptionsContract | string) => ValueResolveContract<any>) => void,
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
            }
        });
    }

    /**
     * Sets a value of the specific key.
     * @param key  The property key.
     * @param value  The value of the property to set.
     * @param message  A message for the setting event.
     */
    public setProp(key: string, value: any, message?: SetterOptionsContract | string): boolean {
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
    public setPropForDetails<T>(key: string, value: T, message?: SetterOptionsContract | string): ChangedInfo<T> {
        if (typeof this._propSetter !== "function") return ChangedInfo.fail(null, undefined, value, "not implemented");
        return this._propSetter(key, value, message);
    }

    /**
     * Sets a value of the specific key by a Promise.
     * @param key  The property key.
     * @param value  A Promise of the property to set.
     * @param compatible  true if the value can also be a non-Promise; otherwise, false.
     * @param message  A message for the setting event.
     */
    public setPromiseProp<T>(key: string, value: Promise<T>, compatible?: boolean, message?: SetterOptionsContract | string): Promise<T> {
        return Access.setPromise((value, message?) => {
            return this.setPropForDetails(key, value, message);
        }, value, compatible, message);
    }

    /**
     * Sets a value of the specific key by an observable which can be subscribed.
     * @param key  The property key.
     * @param value  A Promise of the property to set.
     * @param message  A message for the setting event.
     * @param callbackfn  A function will be called on subscribed.
     */
    public setSubscribeProp<T>(key: string, value: SubscriberContract<T>, message?: SetterOptionsContract | string, callbackfn?: (ev: ChangedInfo<T>, message: FireInfoContract) => void, thisArg?: any) {
        return Access.setSubscribe((value, message?) => {
            return this.setPropForDetails(key, value, message);
        }, value, message, callbackfn, thisArg);
    }

    /**
     * Send a notification for a speicific property.
     * @param key  The property key.
     * @param data  The data.
     * @param message  A message for the setting event.
     */
    public sendPropNotify(key: string, data: any, message?: FireInfoContract | string) {
        if (typeof this._sendPropNotify !== "function") return;
        this._sendPropNotify(key, data, message);
    }

    /**
     * Send a notification.
     * @param data  The data.
     * @param message  A message for the setting event.
     */
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

    /**
     * Gets an object with properties which are two-way binding with this.
     */
    public readonly proxy: any;

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
     * Initializes a new instance of the PropsController class.
     */
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
            }
        });
    }

    public getPropWithFallback<T>(key: string, resolver: (details: PropDetailsContract<T>) => Promise<T>, options?: {
        testBeforeSet?: boolean;
        callback?: (details: PropDetailsContract<T>) => void;
    }) {
        let prop = this._accessor.getPropDetails<T>(key);
        if (!options) options = {};
        if (typeof options.callback === "function") options.callback(prop);
        if (prop.hasValue) return Promise.resolve(prop.value);
        return resolver(prop).then(value => {
            if (options.testBeforeSet) {
                prop = this._accessor.getPropDetails(key);
                if (prop.hasValue) return prop.value;
            }

            this._accessor.setProp(key, value);
            return value;
        });
    }

    /**
     * Force to update a property.
     * @param key  The property key.
     * @param message  A message for the setting event.
     */
    public forceUpdateProp(key: string, message?: FireInfoContract | string) {
        this._accessor.forceUpdateProp(key, message);
    }

    /**
     * Sets a value of the specific key.
     * @param key  The property key.
     * @param value  The value of the property to set.
     * @param message  A message for the setting event.
     */
    public setProp(key: string, value: any, message?: SetterOptionsContract | string) {
        let info = this._accessor.setProp(key, value, message);
        return info ? info.success : false;
    }

    /**
     * Sets a value of the specific key. A status and further information will be returned.
     * @param key  The property key.
     * @param value  The value of the property to set.
     * @param message  A message for the setting event.
     */
    public setPropForDetails<T>(key: string, value: T, message?: SetterOptionsContract | string): ChangedInfo<T> {
        return this._accessor.setProp(key, value, message);
    }

    /**
     * Sets a value of the specific key by a Promise.
     * @param key  The property key.
     * @param value  A Promise of the property to set.
     * @param compatible  true if the value can also be a non-Promise; otherwise, false.
     * @param message  A message for the setting event.
     */
    public setPromiseProp<T>(key: string, value: Promise<T>, compatible?: boolean, message?: SetterOptionsContract | string): Promise<T> {
        return Access.setPromise((value, message?) => {
            return this.setPropForDetails(key, value, message);
        }, value, compatible, message);
    }

    /**
     * Sets a value of the specific key by an observable which can be subscribed.
     * @param key  The property key.
     * @param value  A Promise of the property to set.
     * @param message  A message for the setting event.
     * @param callbackfn  A function will be called on subscribed.
     */
    public setSubscribeProp<T>(key: string, value: SubscriberContract<T>, message?: SetterOptionsContract | string, callbackfn?: (ev: ChangedInfo<T>, message: FireInfoContract) => void, thisArg?: any) {
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

    /**
     * Gets additional store information.
     * @param key  The property key.
     * @param storePropKey  The key of additional information.
     */
    public getPropStore(key: string, storePropKey: string) {
        return this._accessor.getPropStore(key, storePropKey);
    }

    /**
     * Sets additional store information.
     * @param key  The property key.
     * @param storePropKey  The key of additional information.
     * @param value  The value of additonal information.
     */
    public setPropStore(key: string, storePropKey: string, value: any) {
        this._accessor.setPropStore(key, storePropKey, value);
    }

    /**
     * Removes the specific additional store information.
     * @param key  The property key.
     * @param storePropKeys  The key of additional information.
     */
    public removePropStore(key: string, ...storePropKeys: string[]) {
        this._accessor.removePropStore(key, ...storePropKeys);
    }

    /**
     * Send a notification for a speicific property.
     * @param key  The property key.
     * @param data  The data.
     * @param message  The additional information which will pass to the event listener handler.
     */
    public sendPropNotify(key: string, data: any, message?: FireInfoContract | string) {
        this._accessor.sendPropNotify(key, data, message);
    }

    /**
     * Send a notification.
     * @param data  The data.
     * @param message  The additional information which will pass to the event listener handler.
     */
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

    /**
     * Creates a controller client for a property.
     * @param key  The property key.
     */
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
        }, (message?) => {
            this.forceUpdateProp(key, message);
        });
        client.pushDisposable(token);
        return client;
    }

    /**
     * Creates a controller client.
     */
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
            emptyPropRequested: this.emptyPropRequested.createObservable(),
            sendPropRequest,
            sendRequest,
            sendPropBroadcast,
            sendBroadcast
        });
        client.pushDisposable(token);
        this.pushDisposable(client);
        client.emptyPropRequested.on(ev => this.getProp(ev.key));
        return client;
    }
}

/**
 * Creates a props controller with accessor and observable.
 * @param initObj  The optional initialized properties.
 * @returns  The props controller with accessor and observable.
 */
export function createProps(initObj?: { [property: string]: any }) {
    let p = new PropsController();
    if (initObj) p.setProps(initObj);
    return p;
}

}