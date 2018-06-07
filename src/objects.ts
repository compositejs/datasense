import * as Collection from "./collection";
import * as CoreLib from "./core";
import * as EventsLib from "./events";
import * as AccessorLib from "./accessor";
import * as ValuesLib from "./values";

export type PropsObservableAccessorContract = AccessorLib.PropsAccessorContract & AccessorLib.RegisterPropRequestContract<AccessorLib.SimplePropsAccessorContract, AccessorLib.SimpleValueAccessorContract<any>>;

export interface PropsFurtherEventsContract {
    propBroadcastReceived: EventsLib.EventObservable;
    broadcastReceived: EventsLib.SingleEventObservable<any>;
    propNotifyReceived: EventsLib.EventObservable;
    notifyReceived: EventsLib.SingleEventObservable<any>;
    sendPropRequest(key: string, type: string, value: any): void;
    sendRequest(type: string, value: any): void;
    sendPropBroadcast(key: string, data: any, message?: EventsLib.FireInfoContract | string): void;
    sendBroadcast(data: any, message?: EventsLib.FireInfoContract | string): void;
}

export class PropsObservable implements CoreLib.DisposableArrayContract {
    private _instance: {
        has(key: string): boolean,
        get(key: string): any,
        keys(): string[],
        pushFlows(key: string, ...flows: AccessorLib.ValueModifierContract<any>[]): AccessorLib.ChangeFlowRegisteredContract,
        clearFlows(key: string): number,
        sendPropRequest(key: string, type: string, value: any): void,
        sendRequest(type: string, value: any): void,
        sendPropBroadcast(key: string, data: any, message?: EventsLib.FireInfoContract | string): void,
        sendBroadcast(data: any, message?: EventsLib.FireInfoContract | string): void
    } & CoreLib.DisposableArrayContract;

    public readonly propChanging: EventsLib.EventObservable;

    public readonly propChanged: EventsLib.EventObservable;

    public readonly propChangeFailed: EventsLib.EventObservable;

    public readonly propBroadcastReceived: EventsLib.EventObservable;

    public readonly propNotifyReceived: EventsLib.EventObservable;

    public readonly anyPropChanging: EventsLib.SingleEventObservable<EventsLib.ChangingInfo<any>>;

    public readonly anyPropChanged: EventsLib.SingleEventObservable<EventsLib.ChangedInfo<any>>;

    public readonly anyPropChangeFailed: EventsLib.SingleEventObservable<EventsLib.ChangedInfo<any>>;

    public readonly propsChanged: EventsLib.SingleEventObservable<EventsLib.ChangedInfoSetContract>;

    public readonly broadcastReceived: EventsLib.SingleEventObservable<any>;

    public readonly notifyReceived: EventsLib.SingleEventObservable<any>;

    constructor(changer: PropsObservable | ((accessor: PropsObservableAccessorContract) => void)) {
        let disposable = new CoreLib.DisposableArray();
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
            return;
        }

        let obj = AccessorLib.propsAccessor();
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

        let simpleAccessor: AccessorLib.SimplePropsAccessorContract = {
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
            } as AccessorLib.SimpleValueAccessorContract<any>;
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
            if (eventsMore.broadcastReceived instanceof EventsLib.SingleEventObservable) {
                this.broadcastReceived = eventsMore.broadcastReceived;
                this.pushDisposable(this.broadcastReceived);
            }

            if (eventsMore.propBroadcastReceived instanceof EventsLib.EventObservable) {
                this.propBroadcastReceived = eventsMore.propBroadcastReceived;
                this.pushDisposable(this.propBroadcastReceived);
            }

            if (eventsMore.notifyReceived instanceof EventsLib.SingleEventObservable) {
                this.notifyReceived = eventsMore.notifyReceived;
                this.pushDisposable(this.notifyReceived);
            }

            if (eventsMore.propNotifyReceived instanceof EventsLib.EventObservable) {
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

    public pushDisposable(...items: CoreLib.DisposableContract[]) {
        return this._instance.pushDisposable(...items);
    }

    public getKeys() {
        return this._instance.keys();
    }

    public hasProp(key: string) {
        return this._instance.has(key);
    }

    public getProp(key: string) {
        return this._instance.get(key);
    }

    public registerChangeFlow(key: string, ...value: AccessorLib.ValueModifierContract<any>[]) {
        return this._instance.pushFlows(key, ...value);
    }

    public clearChangeFlow(key: string) {
        return this._instance.clearFlows(key);
    }

    public onPropChanging<T>(
        key: string,
        h: EventsLib.EventHandlerContract<EventsLib.ChangingInfo<T>> | EventsLib.EventHandlerContract<EventsLib.ChangingInfo<T>>[],
        thisArg?: any,
        options?: EventsLib.EventOptionsContract,
        disposableArray?: CoreLib.DisposableArrayContract
    ) {
        return this.propChanging.on(key, h, thisArg, options, disposableArray);
    }

    public onPropChanged<T>(
        key: string,
        h: EventsLib.EventHandlerContract<EventsLib.ChangedInfo<T>> | EventsLib.EventHandlerContract<EventsLib.ChangedInfo<T>>[],
        thisArg?: any,
        options?: EventsLib.EventOptionsContract,
        disposableArray?: CoreLib.DisposableArrayContract
    ) {
        return this.propChanged.on(key, h, thisArg, options, disposableArray);
    }

    public onPropChangeFailed<T>(
        key: string,
        h: EventsLib.EventHandlerContract<EventsLib.ChangedInfo<T>> | EventsLib.EventHandlerContract<EventsLib.ChangedInfo<T>>[],
        thisArg?: any,
        options?: EventsLib.EventOptionsContract,
        disposableArray?: CoreLib.DisposableArrayContract
    ) {
        if (!key || typeof key !== "string") return EventsLib.EventObservable.createFailedOnResult(null);
        return this.propChangeFailed.on(key, h, thisArg, options, disposableArray);
    }

    public onAnyPropChanging(
        h: EventsLib.EventHandlerContract<EventsLib.ChangingInfo<any>> | EventsLib.EventHandlerContract<EventsLib.ChangingInfo<any>>[],
        thisArg?: any,
        options?: EventsLib.EventOptionsContract,
        disposableArray?: CoreLib.DisposableArrayContract
    ) {
        return this.anyPropChanging.on(h, thisArg, options, disposableArray);
    }

    public onAnyPropChanged(
        h: EventsLib.EventHandlerContract<EventsLib.ChangedInfo<any>> | EventsLib.EventHandlerContract<EventsLib.ChangedInfo<any>>[],
        thisArg?: any,
        options?: EventsLib.EventOptionsContract,
        disposableArray?: CoreLib.DisposableArrayContract
    ) {
        return this.anyPropChanged.on(h, thisArg, options, disposableArray);
    }

    public onAnyPropChangeFailed(
        h: EventsLib.EventHandlerContract<EventsLib.ChangedInfo<any>> | EventsLib.EventHandlerContract<EventsLib.ChangedInfo<any>>[],
        thisArg?: any,
        options?: EventsLib.EventOptionsContract,
        disposableArray?: CoreLib.DisposableArrayContract
    ) {
        return this.anyPropChangeFailed.on(h, thisArg, options, disposableArray);
    }

    public onPropsChanged(
        h: EventsLib.EventHandlerContract<EventsLib.ChangedInfoSetContract> | EventsLib.EventHandlerContract<EventsLib.ChangedInfoSetContract>[],
        thisArg?: any,
        options?: EventsLib.EventOptionsContract,
        disposableArray?: CoreLib.DisposableArrayContract
    ) {
        return this.propsChanged.on(h, thisArg, options, disposableArray);
    }

    public onPropBroadcastReceived(
        key: string,
        h: EventsLib.EventHandlerContract<any> | EventsLib.EventHandlerContract<any>[],
        thisArg?: any,
        options?: EventsLib.EventOptionsContract,
        disposableArray?: CoreLib.DisposableArrayContract
    ) {
        return this.propBroadcastReceived.on(key, h, thisArg, options, disposableArray);
    }

    public onBroadcastReceived(
        h: EventsLib.EventHandlerContract<any> | EventsLib.EventHandlerContract<any>[],
        thisArg?: any,
        options?: EventsLib.EventOptionsContract,
        disposableArray?: CoreLib.DisposableArrayContract
    ) {
        return this.broadcastReceived.on(h, thisArg, options, disposableArray);
    }

    public onPropNotifyReceived(
        key: string,
        h: EventsLib.EventHandlerContract<any> | EventsLib.EventHandlerContract<any>[],
        thisArg?: any,
        options?: EventsLib.EventOptionsContract,
        disposableArray?: CoreLib.DisposableArrayContract
    ) {
        return this.propNotifyReceived.on<any>(key, h, thisArg, options, disposableArray);
    }

    public subscribeProp<T>(key: string, h: (newValue: T) => void, thisArg?: any) {
        return this.propChanged.subscribeSingle(key, h, thisArg, (newValue: EventsLib.ChangedInfo<T>) => newValue.value);
    }

    public subscribeProps(h: (changeSet: EventsLib.ChangedInfo<any>[]) => void, thisArg?: any) {
        return this.propsChanged.subscribeWithConvertor(h, thisArg, (changeSet: EventsLib.ChangedInfoSetContract) => changeSet.changes);
    }

    public sendPropRequest(key: string, type: string, value: any) {
        this._instance.sendPropRequest(key, type, value);
    }

    public sendRequest(type: string, value: any) {
        this._instance.sendRequest(type, value);
    }

    public sendPropBroadcast(key: string, data: any, message?: EventsLib.FireInfoContract | string) {
        this._instance.sendPropBroadcast(key, data, message);
    }

    public sendBroadcast(data: any, message?: EventsLib.FireInfoContract | string) {
        this._instance.sendBroadcast(data, message);
    }

    public createPropObservable<T>(key: string) {
        let obj: {
            accessor?: AccessorLib.ValueAccessorContract<T>
        } = {};
        let sendBroadcast = (data: any, message?: EventsLib.FireInfoContract | string) => {
            this.sendPropBroadcast(key, data, message);
        };
        let h = (accessor: AccessorLib.ValueAccessorContract<T>) => {
            obj.accessor = accessor;
        };
        (h as any) = {
            broadcastReceived: this.propBroadcastReceived.createSingleObservable(key),
            notifyReceived: this.propNotifyReceived.createSingleObservable(key),
            sendBroadcast
        } as ValuesLib.ValueFurtherEventsContract;
        let result = new ValuesLib.ValueObservable<T>(accessor => {
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

    public dispose() {
        this._instance.dispose();
    }
}

export class PropsClient extends PropsObservable {
    public readonly proxy: any;

    private readonly _propSetter: (key: string, value: any, message?: EventsLib.FireInfoContract | string) => EventsLib.ChangedInfo<any>;
    private readonly _sendPropNotify: (key: string, data: any, message?: EventsLib.FireInfoContract | string) => void;
    private readonly _sendNotify: (data: any, message?: EventsLib.FireInfoContract | string) => void;
    private readonly _registerPropRequestHandler: (key: string, type: string, h: (owner: AccessorLib.SimpleValueAccessorContract<any>, value: any) => void) => boolean;
    private readonly _registerRequestHandler: (type: string, h: (owner: AccessorLib.SimplePropsAccessorContract, value: any) => void) => boolean;

    constructor(
        modifier: (setter: (key: string, newValue: any, message?: EventsLib.FireInfoContract | string) => AccessorLib.ValueResolveContract<any>) => void,
        propSetter: (key: string, value: any, message?: EventsLib.FireInfoContract | string) => EventsLib.ChangedInfo<any>,
        sendPropNotify: (key: string, data: any, message?: EventsLib.FireInfoContract | string) => void,
        sendNotify: (data: any, message?: EventsLib.FireInfoContract | string) => void,
        registerPropRequestHandler: (key: string, type: string, h: (owner: AccessorLib.SimpleValueAccessorContract<any>, value: any) => void) => boolean,
        registerRequestHandler: (type: string, h: (owner: AccessorLib.SimplePropsAccessorContract, value: any) => void) => boolean,
        additionalEvents: PropsFurtherEventsContract
    ) {
        let h = (acc: PropsObservableAccessorContract) => modifier(acc.customizedSetProp);
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

    public setProp(key: string, value: any, message?: EventsLib.FireInfoContract | string): boolean {
        if (typeof this._propSetter !== "function") return false;
        let info = this._propSetter(key, value, message)
        return info ? info.success : false;
    }

    public setPropForDetails<T>(key: string, value: T, message?: EventsLib.FireInfoContract | string): EventsLib.ChangedInfo<T> {
        if (typeof this._propSetter !== "function") return EventsLib.ChangedInfo.fail(null, undefined, value, "not implemented");
        return this._propSetter(key, value, message);
    }

    public setPromiseProp<T>(key: string, value: Promise<T>, compatible?: boolean, message?: EventsLib.FireInfoContract | string): Promise<T> {
        return AccessorLib.setPromise((value, message?) => {
            return this.setPropForDetails(key, value, message);
        }, value, compatible, message);
    }

    public setSubscribeProp<T>(key: string, value: CoreLib.SubscriberContract<T>, message?: EventsLib.FireInfoContract | string, callbackfn?: (ev: EventsLib.ChangedInfo<T>, message: EventsLib.FireInfoContract) => void, thisArg?: any) {
        return AccessorLib.setSubscribe((value, message?) => {
            return this.setPropForDetails(key, value, message);
        }, value, message, callbackfn, thisArg);
    }

    public sendPropNotify(key: string, data: any, message?: EventsLib.FireInfoContract | string) {
        if (typeof this._sendPropNotify !== "function") return;
        this._sendPropNotify(key, data, message);
    }

    public sendNotify(data: any, message?: EventsLib.FireInfoContract | string) {
        if (typeof this._sendNotify !== "function") return;
        this._sendNotify(data, message);
    }

    public registerPropRequestHandler(key: string, type: string, h: (owner: AccessorLib.SimpleValueAccessorContract<any>, value: any) => void) {
        if (typeof this._registerPropRequestHandler !== "function") return false;
        return this._registerPropRequestHandler(key, type, h);
    }

    public registerRequestHandler(type: string, h: (owner: AccessorLib.SimplePropsAccessorContract, value: any) => void) {
        if (typeof this._registerRequestHandler !== "function") return false;
        return this._registerRequestHandler(type, h);
    }
}

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

    public forceUpdateProp(key: string, message?: EventsLib.FireInfoContract | string) {
        this._accessor.forceUpdateProp(key, message);
    }

    public setProp(key: string, value: any, message?: EventsLib.FireInfoContract | string) {
        let info = this._accessor.setProp(key, value, message);
        return info ? info.success : false;
    }

    public setPropForDetails<T>(key: string, value: T, message?: EventsLib.FireInfoContract | string): EventsLib.ChangedInfo<T> {
        return this._accessor.setProp(key, value, message);
    }

    public setPromiseProp<T>(key: string, value: Promise<T>, compatible?: boolean, message?: EventsLib.FireInfoContract | string): Promise<T> {
        return AccessorLib.setPromise((value, message?) => {
            return this.setPropForDetails(key, value, message);
        }, value, compatible, message);
    }

    public setSubscribeProp<T>(key: string, value: CoreLib.SubscriberContract<T>, message?: EventsLib.FireInfoContract | string, callbackfn?: (ev: EventsLib.ChangedInfo<T>, message: EventsLib.FireInfoContract) => void, thisArg?: any) {
        return AccessorLib.setSubscribe((value, message?) => {
            return this.setPropForDetails(key, value, message);
        }, value, message, callbackfn, thisArg);
    }

    public sendPropNotify(key: string, data: any, message?: EventsLib.FireInfoContract | string) {
        this._accessor.sendPropNotify(key, data, message);
    }

    public sendNotify(data: any, message?: EventsLib.FireInfoContract | string) {
        this._accessor.sendNotify(data, message);
    }

    public registerPropRequestHandler(key: string, type: string, h: (owner: AccessorLib.SimpleValueAccessorContract<any>, value: any) => void) {
        return this._accessor.registerPropRequestHandler(key, type, h);
    }

    public registerRequestHandler(type: string, h: (owner: AccessorLib.SimplePropsAccessorContract, value: any) => void) {
        return this._accessor.registerRequestHandler(type, h);
    }

    public createPropClient<T>(key: string) {
        let token: CoreLib.DisposableContract;
        let sendBroadcast = (data: any, message?: EventsLib.FireInfoContract | string) => {
            this.sendPropBroadcast(key, data, message);
        };
        let sendRequest = (type: string, value: any) => {
            this.sendPropRequest(key, type, value);
        };
        let client = new ValuesLib.ValueClient<T>(modifier => {
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
        let token: CoreLib.DisposableContract;
        var sendRequest = (type: string, value: any) => {
            this.sendRequest(type, value);
        };
        var sendPropRequest = (key: string, type: string, value: any) => {
            this.sendPropRequest(key, type, value);
        };
        var sendBroadcast = (data: any, message?: EventsLib.FireInfoContract | string) => {
            this.sendBroadcast(data, message);
        };
        var sendPropBroadcast = (key: string, data: any, message?: EventsLib.FireInfoContract | string) => {
            this.sendPropBroadcast(key, data, message);
        };
        let client = new PropsClient(modifier => {
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
        return client;
    }
}
