import * as Collection from "./collection";
import * as CoreLib from "./core";
import * as EventsLib from "./events";
import * as AccessorLib from "./accessor";

export type ValueObservableAccessorContract<T> = AccessorLib.ValueAccessorContract<T> & AccessorLib.RegisterRequestContract<AccessorLib.SimpleValueAccessorContract<T>>;

export interface ValueFurtherEventsContract {
    broadcastReceived: EventsLib.SingleEventObservable<any>;
    notifyReceived: EventsLib.SingleEventObservable<any>;
    sendRequest(type: string, value: any): void;
    sendBroadcast(data: any, message?: EventsLib.FireInfoContract | string): void;
}

/**
 * The observable for value.
 */
export class ValueObservable<T> implements CoreLib.DisposableArrayContract {
    private _instance: {
        get(): T,
        pushFlows(...flows: AccessorLib.ValueModifierContract<any>[]): AccessorLib.ChangeFlowRegisteredContract,
        clearFlows(): number,
        sendRequest(type: string, value: any): void,
        sendBroadcast(data: any, message?: EventsLib.FireInfoContract | string): void,
    } & CoreLib.DisposableArrayContract;

    public readonly changing: EventsLib.SingleEventObservable<EventsLib.ChangingInfo<T>>;

    public readonly changed: EventsLib.SingleEventObservable<EventsLib.ChangedInfo<T>>;

    public readonly changeFailed: EventsLib.SingleEventObservable<EventsLib.ChangedInfo<T>>;

    public readonly broadcastReceived: EventsLib.SingleEventObservable<any>;

    public readonly notifyReceived: EventsLib.SingleEventObservable<any>;

    /**
     * Initializes a new instance of the ValueObservable class.
     * @param changer  A function to called that you can get the setter of the value by the argument.
     */
    constructor(changer: ValueObservable<T> | ((changed: ValueObservableAccessorContract<T>) => void)) {
        let disposable = new CoreLib.DisposableArray();
        let accessKey = "value";
        if ((changer instanceof ValueObservable) && changer._instance) {
            this._instance = {
                ...changer._instance,
                pushDisposable(...items) {
                    return disposable.pushDisposable(...items);
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
            return;
        }

        let formatter: (value: any) => T;
        let validator: (value: T) => boolean;
        let obj = AccessorLib.propsAccessor();
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
        this.pushDisposable(this.changing, this.changed, this.changeFailed, this.broadcastReceived, this.notifyReceived);

        let simpleAccessor: AccessorLib.SimpleValueAccessorContract<T> = {
            get() {
                return obj.accessor.getProp(accessKey);
            },
            set(value, message?) {
                return obj.accessor.setProp(accessKey, value, message);
            },
            forceUpdate(message?: EventsLib.FireInfoContract | string) {
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
            get() {
                return obj.accessor.getProp(accessKey);
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
            dispose() {
                disposable.dispose();
            }
        };

        if (typeof changer !== "function") return;
        let eventsMore: ValueFurtherEventsContract = (changer as any).additionalEvents;
        if (eventsMore) {
            if (eventsMore.broadcastReceived instanceof EventsLib.SingleEventObservable) {
                this.broadcastReceived = eventsMore.broadcastReceived;
                this.pushDisposable(this.broadcastReceived);
            }

            if (eventsMore.notifyReceived instanceof EventsLib.SingleEventObservable) {
                this.notifyReceived = eventsMore.notifyReceived;
                this.pushDisposable(this.notifyReceived);
            }

            if (typeof eventsMore.sendRequest === "function") sendRequestH = eventsMore.sendRequest;
            if (typeof eventsMore.sendBroadcast === "function") sendBroadcastH = eventsMore.sendBroadcast;
        }
        changer({
            get() {
                return obj.accessor.getProp(accessKey)
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

    public pushDisposable(...items: CoreLib.DisposableContract[]) {
        return this._instance.pushDisposable(...items);
    }

    public get() {
        return this._instance.get();
    }

    public registerChangeFlow(...value: AccessorLib.ValueModifierContract<T>[]) {
        return this._instance.pushFlows(...value);
    }

    public clearChangeFlow() {
        return this._instance.clearFlows();
    }

    public onChanging(
        h: EventsLib.EventHandlerContract<EventsLib.ChangingInfo<T>> | EventsLib.EventHandlerContract<EventsLib.ChangingInfo<T>>[],
        thisArg?: any,
        options?: EventsLib.EventOptionsContract,
        disposableArray?: CoreLib.DisposableArrayContract
    ) {
        return this.changing.on(h, thisArg, options, disposableArray);
    }

    public onChanged(
        h: EventsLib.EventHandlerContract<EventsLib.ChangedInfo<T>> | EventsLib.EventHandlerContract<EventsLib.ChangedInfo<T>>[],
        thisArg?: any,
        options?: EventsLib.EventOptionsContract,
        disposableArray?: CoreLib.DisposableArrayContract
    ) {
        return this.changed.on(h, thisArg, options, disposableArray);
    }

    public onChangeFailed(
        h: EventsLib.EventHandlerContract<EventsLib.ChangedInfo<T>> | EventsLib.EventHandlerContract<EventsLib.ChangedInfo<T>>[],
        thisArg?: any,
        options?: EventsLib.EventOptionsContract,
        disposableArray?: CoreLib.DisposableArrayContract
    ) {
        return this.changeFailed.on(h, thisArg, options, disposableArray);
    }

    public onBroadcastReceived(
        h: EventsLib.EventHandlerContract<any> | EventsLib.EventHandlerContract<any>[],
        thisArg?: any,
        options?: EventsLib.EventOptionsContract,
        disposableArray?: CoreLib.DisposableArrayContract
    ) {
        return this.broadcastReceived.on(h, thisArg, options, disposableArray);
    }

    public onNotifyReceived(
        h: EventsLib.EventHandlerContract<any> | EventsLib.EventHandlerContract<any>[],
        thisArg?: any,
        options?: EventsLib.EventOptionsContract,
        disposableArray?: CoreLib.DisposableArrayContract
    ) {
        return this.notifyReceived.on(h, thisArg, options, disposableArray);
    }

    public subscribe(h: (newValue: T) => void, thisArg?: any): CoreLib.SubscriberCompatibleResultContract {
        return this.changed.subscribeWithConvertor<T>(h, thisArg, newValue => newValue.value);
    }

    public sendRequest(type: string, value: any) {
        this._instance.sendRequest(type, value);
    }

    public sendBroadcast(data: any, message?: EventsLib.FireInfoContract | string) {
        this._instance.sendBroadcast(data, message);
    }

    public createObservable() {
        return new ValueObservable<T>(this);
    }

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

export class ValueClient<T> extends ValueObservable<T> {
    private readonly _setter: (value: T, message?: EventsLib.FireInfoContract | string) => EventsLib.ChangedInfo<T>;
    private readonly _sendNotify: (data: any, message?: EventsLib.FireInfoContract | string) => void;
    private readonly _registerRequestHandler: (type: string, h: (owner: AccessorLib.SimpleValueAccessorContract<T>, value: any) => void) => boolean;

    constructor(
        modifier: (setter: AccessorLib.ValueModifierContract<T>) => void,
        setter: (value: T, message?: EventsLib.FireInfoContract | string) => EventsLib.ChangedInfo<T>,
        sendNotify: (data: any, message?: EventsLib.FireInfoContract | string) => void,
        registerRequestHandler: (type: string, h: (owner: AccessorLib.SimpleValueAccessorContract<T>, value: any) => void) => boolean,
        additionalEvents: ValueFurtherEventsContract
    ) {
        let h = (acc: ValueObservableAccessorContract<T>) => modifier(acc.customizedSet);
        if (additionalEvents) (h as any).additionalEvents = additionalEvents;
        super(h);

        if (typeof setter === "function") this._setter = setter;
        if (typeof sendNotify === "function") this._sendNotify = sendNotify;
        if (typeof registerRequestHandler === "function") this._registerRequestHandler = registerRequestHandler;
    }

    public set(value: T, message?: EventsLib.FireInfoContract | string): boolean {
        if (typeof this._setter !== "function") return false;
        let info = this._setter(value, message)
        return info ? info.success : false;
    }

    public setForDetails(value: T, message?: EventsLib.FireInfoContract | string): EventsLib.ChangedInfo<T> {
        if (typeof this._setter !== "function") return EventsLib.ChangedInfo.fail(null, undefined, value, "not implemented");
        return this._setter(value, message);
    }

    public setPromise(value: Promise<T>, compatible?: boolean, message?: EventsLib.FireInfoContract | string): Promise<T> {
        return AccessorLib.setPromise((value, message?) => {
            return this.setForDetails(value, message);
        }, value, compatible, message);
    }

    public setSubscribe(value: CoreLib.SubscriberContract<T>, message?: EventsLib.FireInfoContract | string, callbackfn?: (ev: EventsLib.ChangedInfo<T>, message: EventsLib.FireInfoContract) => void, thisArg?: any) {
        return AccessorLib.setSubscribe((value, message?) => {
            return this.setForDetails(value, message);
        }, value, message, callbackfn, thisArg);
    }

    public sendNotify(data: any, message?: EventsLib.FireInfoContract | string) {
        this._sendNotify(data, message);
    }

    public registerRequestHandler(type: string, h: (owner: AccessorLib.SimpleValueAccessorContract<T>, value: any) => void) {
        if (typeof this._registerRequestHandler !== "function") return false;
        return this._registerRequestHandler(type, h);
    }
}

export class ValueController<T> extends ValueObservable<T> {
    private _accessor: ValueObservableAccessorContract<T>;
    private _observing: AccessorLib.ChangeFlowRegisteredContract;

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
        let a: ValueObservableAccessorContract<T>;
        super(acc => a = acc);
        this._accessor = a;
    }

    public set(value: T, message?: EventsLib.FireInfoContract | string): boolean {
        let info = this._accessor.set(value, message);
        return info ? info.success : false;
    }

    public setForDetails(value: T, message?: EventsLib.FireInfoContract | string): EventsLib.ChangedInfo<T> {
        return this._accessor.set(value, message);
    }

    public setPromise(value: Promise<T>, compatible?: boolean, message?: EventsLib.FireInfoContract | string): Promise<T> {
        return AccessorLib.setPromise((value, message?) => {
            return this.setForDetails(value, message);
        }, value, compatible, message);
    }

    public setSubscribe(value: CoreLib.SubscriberContract<T>, message?: EventsLib.FireInfoContract | string, callbackfn?: (ev: EventsLib.ChangedInfo<T>, message: EventsLib.FireInfoContract) => void, thisArg?: any) {
        return AccessorLib.setSubscribe((value, message?) => {
            return this.setForDetails(value, message);
        }, value, message, callbackfn, thisArg);
    }

    public registerRequestHandler(type: string, h: (owner: AccessorLib.SimpleValueAccessorContract<T>, value: any) => void) {
        return this._accessor.registerRequestHandler(type, h);
    }

    public observe(value: ValueObservable<T>) {
        if (!(value instanceof ValueObservable)) return {
            dispose() {}
        };
        this._observing = value.registerChangeFlow(this._accessor.customizedSet);
        return this._observing;
    }

    public stopObserving() {
        let disposeObserving = this._observing;
        if (!disposeObserving) return;
        delete this._observing;
        if (typeof disposeObserving.dispose === "function") disposeObserving.dispose();
    }

    public syncFromObserving(message?: EventsLib.FireInfoContract | string) {
        let disposeObserving = this._observing;
        if (!disposeObserving || typeof disposeObserving.sync !== "function") return false;
        disposeObserving.sync(message);
        return true;
    }

    public isObserving() {
        return !!this._observing;
    }

    public createClient() {
        let token: CoreLib.DisposableContract;
        var sendRequest = (type: string, value: any) => {
            this.sendRequest(type, value);
        };
        var sendBroadcast = (data: any, message?: EventsLib.FireInfoContract | string) => {
            this.sendBroadcast(data, message);
        };
        let client = new ValueClient<T>(modifier => {
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
        });
        client.pushDisposable(token);
        return client;
    }

    public sendNotify(data: any, message?: EventsLib.FireInfoContract | string) {
        this._accessor.sendNotify(data, message);
    }
}
