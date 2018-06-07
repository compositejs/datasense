import * as Collection from "./collection";
import * as CoreLib from "./core";
import * as EventsLib from "./events";

export type ValueModifierContract<T> = (newValue: T, message?: EventsLib.FireInfoContract | string) => ValueResolveContract<T>;

export interface ValueResolveContract<T> {
    isAborted?: boolean,
    resolve(finalValue?: T): void,
    reject(ex?: any): void
}

export interface SimpleValueAccessorContract<T> {
    get(): T;
    set(value: T, message?: EventsLib.FireInfoContract | string): EventsLib.ChangedInfo<T> | undefined;
    forceUpdate(message?: EventsLib.FireInfoContract | string): void;
}

export interface ValueAccessorContract<T> extends SimpleValueAccessorContract<T> {
    customizedSet(valueRequested: any, message?: EventsLib.FireInfoContract | string): ValueResolveContract<T>;
    getFormatter(): (value: any) => T;
    setFormatter(h: (value: any) => T): void;
    getValidator(): (value: T) => boolean;
    setValidator(h: (value: T) => boolean): void;
    getStore(storePropKey: string): any;
    setStore(storePropKey: string, value: any): void;
    removeStore(...storePropKey: string[]): void;
    sendNotify(data: any, message?: EventsLib.FireInfoContract | string): void;
}

export interface RegisterRequestContract<T> {
    registerRequestHandler(type: string, h: (owner: T, value: any) => void): boolean;
}

export type PropUpdateActionContract<T> = ({ action: "delete", key: string | string[] } | { action: "init", value?: T, key: string, create?: () => T } | { action: "set", key: string, value?: T } | { action: "batch", value?: any });

export interface SimplePropsAccessorContract {
    hasProp(key: string): boolean;
    getProp(key: string): any;
    setProp(key: string, value: any, message?: EventsLib.FireInfoContract | string): EventsLib.ChangedInfo<any>;
    removeProp(keys: string | string[], message?: EventsLib.FireInfoContract | string): number;
    batchProp(changeSet: any | PropUpdateActionContract<any>[], message?: EventsLib.FireInfoContract | string): void;
    forceUpdateProp(key: string, message?: EventsLib.FireInfoContract | string): void;
    getPropKeys(): string[],
}

export interface PropsAccessorContract extends SimplePropsAccessorContract {
    customizedSetProp(key: string, valueRequested: any, message?: EventsLib.FireInfoContract | string): ValueResolveContract<any>;
    getFormatter(): (key: string, value: any) => any;
    setFormatter(h: (key: string, value: any) => any): void;
    getValidator(): (key: string, value: any) => boolean;
    setValidator(h: (key: string, value: any) => boolean): void;
    getPropStore(key: string, storePropKey: string): any;
    setPropStore(key: string, storePropKey: string, value: any): void;
    removePropStore(key: string, ...storePropKey: string[]): void;
    sendPropNotify(key: string, data: any, message?: EventsLib.FireInfoContract | string): void;
    sendNotify(data: any, message?: EventsLib.FireInfoContract | string): void;
}

export interface RegisterPropRequestContract<TProps, TValue> extends RegisterRequestContract<TProps> {
    registerPropRequestHandler(key: string, type: string, h: (owner: TValue, value: any) => void): boolean;
}

export interface ChangeFlowRegisteredContract extends CoreLib.DisposableContract {
    registeredDate: Date;
    count: number;
    sync(message?: EventsLib.FireInfoContract | string): void;
}

export function setPromise<T>(setter: (value: T, message?: EventsLib.FireInfoContract | string) => EventsLib.ChangedInfo<T>, value: Promise<T>, compatible?: boolean, message?: EventsLib.FireInfoContract | string): Promise<T> {
    if (value === undefined) return Promise.reject("value is undefined");
    if (typeof value.then !== "function") {
        if (!compatible) return Promise.reject("value is not a Promise object");
        setter(value as any);
        return Promise.resolve(value);
    }

    return value.then(r => {
        setter(r, message);
        return r;
    });
}
    
export function setSubscribe<T>(setter: (value: T, message?: EventsLib.FireInfoContract | string) => EventsLib.ChangedInfo<T>, value: CoreLib.SubscriberContract<T>, message?: EventsLib.FireInfoContract | string, callbackfn?: (ev: EventsLib.ChangedInfo<T>, message: EventsLib.FireInfoContract) => void, thisArg?: any) {
    let needCallback = typeof callbackfn === "function";
    return value.subscribe(newValue => {
        let result = setter(newValue, message);
        if (!needCallback) return;
        let fireObj = typeof message === "string" ? { message } : (message || {});
        callbackfn.call(thisArg, result, fireObj)
    });
}

export function propsAccessor(): {
    accessor: PropsAccessorContract & RegisterPropRequestContract<any, any>,
    pushFlows(key: string, ...flows: ValueModifierContract<any>[]): ChangeFlowRegisteredContract,
    clearFlows(key: string): number,
    sendPropRequest(key: string, type: string, data: any, owner: any): void,
    sendRequest(type: string, data: any, owner: any): void,
    sendPropBroadcast(key: string, data: any, message?: EventsLib.FireInfoContract | string): void,
    sendBroadcast(data: any, message?: EventsLib.FireInfoContract | string): void,
    propChanging: EventsLib.EventObservable,
    propChanged: EventsLib.EventObservable,
    propChangeFailed: EventsLib.EventObservable,
    propNotifyReceived: EventsLib.EventObservable,
    propBroadcastReceived: EventsLib.EventObservable,
    notifyReceived: EventsLib.SingleEventObservable<any>,
    broadcastReceived: EventsLib.SingleEventObservable<any>,
    anyPropChanging: EventsLib.SingleEventObservable<EventsLib.ChangingInfo<any>>,
    anyPropChanged: EventsLib.SingleEventObservable<EventsLib.ChangedInfo<any>>,
    anyPropChangeFailed: EventsLib.SingleEventObservable<EventsLib.ChangedInfo<any>>,
    propsChanged: EventsLib.SingleEventObservable<EventsLib.ChangedInfoSetContract>
} {
    let store: any = {};
    let eventManager = new EventsLib.EventController();
    let hasProp = (key: string) => {
        return (store as Object).hasOwnProperty(key) && (store[key] as Object).hasOwnProperty("value");
    };
    let getProp = (key: string, ensure: boolean): {
        value: any,
        handlers: any[],
        store: any,
        flows: ValueModifierContract<any>[],
        updating?: { value: any, custom?: boolean, cancel(err: any): void },
        factory: any
    } => {
        if (!key || typeof key !== "string") return undefined;
        let obj = store[key];
        if (!obj) {
            obj = {
                handlers: [],
                store: {},
                flows: [],
                factory: {}
            };
            if (ensure) store[key] = obj;
        }

        return obj;
    };
    let formatter: ((key: string, value: any) => any);
    let validator: ((key: string, value: any) => boolean);
    let actionRequests: any = {};

    let setProp = (key: string, value: any, message: EventsLib.FireInfoContract | string, init?: boolean, getResp?: boolean): EventsLib.ChangedInfo<any> => {
        let prop = getProp(key, true);
        if (!prop) return getResp ? new EventsLib.ChangedInfo(null, "invalid", false, undefined, undefined, value, "key is not valid") : undefined;
        if (init && (prop as Object).hasOwnProperty("value")) return getResp ? EventsLib.ChangedInfo.fail(key, prop.value, value, "ignore") : undefined;
        if (prop.updating) {
            if (!prop.updating.custom && prop.updating.value === value) return getResp ? EventsLib.ChangedInfo.fail(key, prop.value, value, "duplicated") : undefined;
            prop.updating.cancel("duplicated");
        }

        let onceC = new EventsLib.OnceController();
        let setToken = prop.updating = {
            value,
            cancel(err) {
                onceC.reject(err);
            }
        };
        let propExist = hasProp(key);
        let oldValue = prop.value;
        eventManager.fire("ing-" + key, new EventsLib.ChangingInfo(key, oldValue, value, onceC.createObservable()));
        eventManager.fire("prop-changing", new EventsLib.ChangingInfo(key, oldValue, value, onceC.createObservable()));
        let flowTokens = prop.flows.map(item => {
            if (typeof item !== "function") return undefined;
            return item(value, message);
        });
        let valueRequested = value;
        if (typeof formatter === "function") value = formatter(key, value);
        if (typeof validator === "function" && !validator(key, value)) {
            if (setToken !== prop.updating) return getResp ? EventsLib.ChangedInfo.fail(key, prop.value, value, "expired") : undefined;
            let errorInfo = EventsLib.ChangedInfo.fail(key, oldValue, value, "invalid");
            onceC.reject("invalid");
            eventManager.fire("err-" + key, errorInfo);
            eventManager.fire("prop-failed", errorInfo);
            flowTokens.forEach(item => {
                if (!item || typeof item.reject !== "function") return;
                item.reject("invalid");
            });
            return errorInfo;
        }

        if (setToken !== prop.updating) return getResp ? EventsLib.ChangedInfo.fail(key, prop.value, value, "expired") : undefined;
        prop.updating = null;
        onceC.resolve(value);
        if (oldValue === value) return EventsLib.ChangedInfo.success(key, value, oldValue, !propExist ? "add" : null, valueRequested);
        prop.value = value;
        let info = EventsLib.ChangedInfo.success(key, value, oldValue, !propExist ? "add" : null, valueRequested);
        eventManager.fire("ed-" + key, info);
        eventManager.fire("prop-changed", info);
        flowTokens.forEach(item => {
            if (!item || typeof item.resolve !== "function") return;
            item.resolve(value);
        });
        return info;
    };
    let removeProp = (keys: string | string[], message: EventsLib.FireInfoContract | string) => {
        if (!keys) return [];
        if (typeof keys === "string") keys = [keys];
        if (!(keys instanceof Array)) return [];
        let result: EventsLib.ChangedInfo<any>[] = [];
        keys.forEach(key => {
            let prop = getProp(key, false);
            if (!prop) return;
            let propExist = hasProp(key);
            if (!propExist) return;
            let oldValue = prop.value;
            let onceC = new EventsLib.OnceController();
            eventManager.fire("ing-" + key, new EventsLib.ChangingInfo(key, oldValue, undefined, onceC.createObservable()));
            eventManager.fire("prop-changing", new EventsLib.ChangingInfo(key, oldValue, undefined, onceC.createObservable()));
            let flowTokens = prop.flows.map(item => {
                if (typeof item !== "function") return undefined;
                return item(undefined, message);
            });
            delete prop.value;
            let info = EventsLib.ChangedInfo.success(key, undefined, oldValue);
            result.push(info);
            onceC.resolve(undefined);
            if (oldValue === undefined) return;
            eventManager.fire("ed-" + key, info);
            eventManager.fire("prop-changed", info);
            flowTokens.forEach(item => {
                if (!item || typeof item.resolve !== "function") return;
                item.resolve(undefined);
            });
        });
        return result;
    };
    let changerClient: PropsAccessorContract & RegisterPropRequestContract<any, any> = {
        hasProp(key) {
            return hasProp(key);
        },
        getProp(key) {
            let prop = getProp(key, false);
            return prop ? prop.value : undefined;
        },
        setProp(key, value, message?) {
            let info = setProp(key, value, message, false, true);
            if (info) eventManager.fire("batch-changed", { changed: info }, message);
            return info;
        },
        customizedSetProp(key, valueRequested, message?) {
            let prop = getProp(key, true);
            if (!prop) return {
                isAborted: true,
                resolve(finalValue) {},
                reject(err) {}
            };
            if (prop.updating) {
                if (prop.updating.custom && prop.updating.value === valueRequested) return {
                    isAborted: true,
                    resolve(finalValue) {},
                    reject(err) {}
                };
                prop.updating.cancel("expired");
            }

            let flowTokens: ValueResolveContract<any>[];
            let done = false;
            let propExist = hasProp(key);
            let oldValue = prop.value;
            let obj: ValueResolveContract<any>;
            let onceC = new EventsLib.OnceController();
            let setToken = prop.updating = {
                value: valueRequested,
                custom: true,
                cancel(err) {
                    obj.isAborted = true;
                    onceC.reject(err);
                }
            };
            eventManager.fire("ing-" + key, new EventsLib.ChangingInfo(key, oldValue, valueRequested, onceC.createObservable()));
            eventManager.fire("prop-changing", new EventsLib.ChangingInfo(key, oldValue, valueRequested, onceC.createObservable()));
            flowTokens = prop.flows.map(item => {
                if (typeof item !== "function") return undefined;
                return item(valueRequested, message);
            });
            obj = {
                resolve(finalValue: any) {
                    if (done) return;
                    if (setToken !== prop.updating) return;
                    prop.updating = null;
                    onceC.resolve(finalValue);
                    if (oldValue === finalValue) return EventsLib.ChangedInfo.success(key, finalValue, oldValue, !propExist ? "add" : null, valueRequested);
                    prop.value = finalValue;
                    let info = EventsLib.ChangedInfo.success(key, finalValue, oldValue, !propExist ? "add" : null, valueRequested);
                    eventManager.fire("ed-" + key, info);
                    eventManager.fire("prop-changed", info);
                    flowTokens.forEach(item => {
                        if (!item || typeof item.resolve !== "function") return;
                        item.resolve(finalValue);
                    });
                    return info;
                },
                reject(err: any) {
                    if (done) return;
                    if (setToken !== prop.updating) return;
                    prop.updating = null;
                    obj.isAborted = true;
                    let errorInfo = EventsLib.ChangedInfo.fail(key, oldValue, valueRequested, "invalid");
                    onceC.reject("invalid");
                    eventManager.fire("err-" + key, errorInfo);
                    eventManager.fire("prop-failed", errorInfo);
                    flowTokens.forEach(item => {
                        if (!item || typeof item.reject !== "function") return;
                        item.reject("invalid");
                    });
                }
            };
            return obj;
        },
        removeProp(keys, message?) {
            let changed = removeProp(keys, message);
            if (changed.length) eventManager.fire("batch-changed", { changed });
            return changed.length;
        },
        batchProp(changeSet, message?) {
            if (!changeSet) return;
            let changed: EventsLib.ChangedInfo<any>[] = [];
            let pushChanged = (...actionResult: EventsLib.ChangedInfo<any>[]) => {
                EventsLib.ChangedInfo.push(changed, ...actionResult);
            };
            var batchPropChanged = (changeSet: any) => {
                if (changeSet) for (let key in changeSet) {
                    if (!key || typeof key !== "string" || !(changeSet as Object).hasOwnProperty(key)) continue;
                    let actionResult = setProp(key, changeSet[key], message);
                    pushChanged(actionResult);
                }
            };
            if (!(changeSet instanceof Array)) {
                batchPropChanged(changeSet);
                return;
            }

            changeSet.forEach(action => {
                if (!action || !action.action) return;
                let actionResult: EventsLib.ChangedInfo<any>[];
                switch (action.action) {
                    case "delete":
                        pushChanged(...removeProp(action.key, message));
                        break;
                    case "batch":
                        batchPropChanged(action.value);
                        break;
                    case "set":
                        pushChanged(setProp(action.key, action.value, message));
                        break;
                    case "init":
                        pushChanged(setProp(action.key, action.value, message, true));
                        break;
                }
            });

            if (changed.length) eventManager.fire("batch-changed", { changed });
        },
        forceUpdateProp(key: string, message?: EventsLib.FireInfoContract | string) {
            var propInfo = getProp(key, false);
            if (!propInfo) return;
            let onceC = new EventsLib.OnceController();
            eventManager.fire("ing-" + key, new EventsLib.ChangingInfo(key, propInfo.value, propInfo.value, onceC.createObservable()), message);
            eventManager.fire("prop-changing", new EventsLib.ChangingInfo(key, propInfo.value, propInfo.value, onceC.createObservable()), message);
            onceC.resolve(propInfo.value);
            let info = EventsLib.ChangedInfo.success(key, propInfo.value, propInfo.value);
            eventManager.fire("ed-" + key, info, message);
            eventManager.fire("prop-changed", info, message);
        },
        getPropKeys() {
            return Object.keys(store);
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
        getPropStore(key, storePropKey) {
            return getProp(key, true).store[storePropKey];
        },
        setPropStore(key, storePropKey, value) {
            getProp(key, true).store[storePropKey] = value;
        },
        removePropStore(key, ...storePropKey) {
            let prop = getProp(key, false).store;
            storePropKey.forEach(storePropKey => {
                delete prop.value;
            });
        },
        sendPropNotify(key, data, message?) {
            if (!key || typeof key !== "string") return;
            eventManager.fire("ntf-" + key, data, message);
        },
        sendNotify(data, message?) {
            eventManager.fire("notify", data, message);
        },
        registerPropRequestHandler(key, type, h) {
            let prop = getProp(key, true).factory;
            if (!h) delete prop[type];
            else if (typeof h !== "function") return false;
            else prop[type] = h;
            return true;
        },
        registerRequestHandler(type, h) {
            if (!h) delete actionRequests[type];
            else if (typeof h !== "function") return false;
            else actionRequests[type] = h;
            return true;
        }
    };
    return {
        accessor: changerClient,
        pushFlows(key, ...flows) {
            let now = new Date();
            flows = flows.filter(item => typeof item === "function");
            let count = getProp(key, true).flows.push(...flows);
            return {
                registeredDate: now,
                count,
                sync(message?: EventsLib.FireInfoContract | string) {
                    flows.forEach(item => {
                        let currentValue = changerClient.getProp(key);
                        let token = item(currentValue, message);
                        if (token && typeof token.resolve === "function") token.resolve(currentValue);
                    });
                },
                dispose() {
                    flows.forEach(item => {
                        Collection.remove(this._instance.observables, item);
                    });
                }
            };
        },
        clearFlows(key) {
            let prop = getProp(key, false);
            let count = prop.flows.length;
            prop.flows = [];
            return count;
        },
        sendPropRequest(key, type, value, owner) {
            let requestH = getProp(key, false).factory[type] as Function;
            if (typeof requestH !== "function") return;
            requestH(owner, value);
        },
        sendRequest(type, value, owner) {
            let requestH = actionRequests[type] as Function;
            if (typeof requestH !== "function") return;
            requestH(owner, value);
        },
        sendPropBroadcast(key, data, message?) {
            if (!key || typeof key !== "string") return;
            eventManager.fire("cst-" + key, data, message);
        },
        sendBroadcast(data, message?) {
            eventManager.fire("broadcast", data, message);
        },
        propChanging: eventManager.createMappedObservable("ing-{0}"),
        propChanged: eventManager.createMappedObservable("ed-{0}"),
        propChangeFailed: eventManager.createMappedObservable("err-{0}"),
        propNotifyReceived: eventManager.createMappedObservable("ntf-{0}"),
        propBroadcastReceived: eventManager.createMappedObservable("cst-{0}"),
        notifyReceived: eventManager.createSingleObservable("notify"),
        broadcastReceived: eventManager.createSingleObservable("broadcast"),
        anyPropChanging: eventManager.createSingleObservable("prop-changing"),
        anyPropChanged: eventManager.createSingleObservable("prop-changed"),
        anyPropChangeFailed: eventManager.createSingleObservable("prop-failed"),
        propsChanged: eventManager.createSingleObservable("batch-changed")
    }
}
