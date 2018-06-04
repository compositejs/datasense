namespace DataSense {

    export type ValueModifierContract<T> = (newValue: T, message?: string) => ValueResolveContract<T>;

    export interface ValueResolveContract<T> {
        isAborted?: boolean,
        resolve(finalValue?: T): void,
        reject(ex?: any): void
    }

    export interface ValueAccessorContract<T> {
        get(): T;
        set(value: T, message?: string): ChangedInfo<T> | undefined;
        customizedSet(valueRequested: any, message?: string): ValueResolveContract<T>;
        getFormatter(): (value: any) => T;
        setFormatter(h: (value: any) => T): void;
        getValidator(): (value: T) => boolean;
        setValidator(h: (value: T) => boolean): void;
        getStore(storePropKey: string): any;
        setStore(storePropKey: string, value: any): void;
        removeStore(...storePropKey: string[]): void;
        sendNotify(data: any, message?: string): void;
        requestReceived: SingleEventObservable<any>;
    }

    export interface PropsAccessorContract {
        has(key: string): boolean;
        get(key: string): any;
        set(key: string, value: any, message: string): ChangedInfo<any>;
        customizedSet(key: string, valueRequested: any, message: string): ValueResolveContract<any>;
        remove(keys: string | string[], message: string): number;
        batchProp(obj: any, removeKeys: string[], initObj: any, message: string): void;
        keys(): string[],
        getFormatter(): (key: string, value: any) => any;
        setFormatter(h: (key: string, value: any) => any): void;
        getValidator(): (key: string, value: any) => boolean;
        setValidator(h: (key: string, value: any) => boolean): void;
        getStore(key: string, storePropKey: string): any;
        setStore(key: string, storePropKey: string, value: any): void;
        removeStore(key: string, ...storePropKey: string[]): void;
        sendPropNotify(key: string, data: any, message?: string): void;
    }

    export interface ChangeFlowRegisteredContract extends DisposableContract {
        registeredDate: Date;
        count: number;
        sync(message?: string): void;
    }

    var dataUtilities = {
        setPromise<T>(setter: (value: T, message?: string) => ChangedInfo<T>, value: Promise<T>, compatible?: boolean, message?: string): Promise<T> {
            if (value === undefined) return new Promise((resolve, reject) => {
                reject("value is undefined")
            });
            if (typeof value.then !== "function") {
                if (!compatible) return new Promise((resolve, reject) => {
                    reject("value is not a Promise object")
                });
                setter(value as any);
                return new Promise((resolve) => {
                    resolve(value);
                });
            }

            return value.then(r => {
                setter(r, message);
                return r;
            });
        },
        setSubscribe<T>(setter: (value: T, message?: string) => ChangedInfo<T>, value: SubscriberContract<T>, message?: string, callbackfn?: (ev: ChangedInfo<T>, message: string) => void, thisArg?: any) {
            var needCallback = typeof callbackfn === "function";
            return value.subscribe(newValue => {
                var result = setter(newValue, message);
                if (needCallback) callbackfn.call(thisArg, result, message)
            });
        },
        propsAccessor(): {
            accessor: PropsAccessorContract,
            pushFlows(key: string, ...flows: ValueModifierContract<any>[]): ChangeFlowRegisteredContract,
            clearFlows(key: string): number,
            sendPropRequest(key: string, data: any, message?: string): void,
            sendPropBroadcast(key: string, data: any, message?: string): void,
            eventObservable: EventObservable
        } {
            var store: any = {};
            var eventManager = new EventController();
            var hasProp = (key: string) => {
                return (store as Object).hasOwnProperty(key) && (store[key] as Object).hasOwnProperty("value");
            };
            var getProp = (key: string, ensure: boolean): {
                value: any,
                handlers: any[],
                store: any,
                flows: ValueModifierContract<any>[],
                updating?: { value: any, custom?: boolean, cancel(err: any): void }
            } => {
                if (!key || typeof key !== "string") return undefined;
                var obj = store[key];
                if (!obj) {
                    obj = {
                        handlers: [],
                        store: {},
                        flows: []
                    };
                    if (ensure) store[key] = obj;
                }

                return obj;
            };
            var formatter: ((key: string, value: any) => any);
            var validator: ((key: string, value: any) => boolean);

            var setProp = (key: string, value: any, message: string, init?: boolean, getResp?: boolean): ChangedInfo<any> => {
                var prop = getProp(key, true);
                if (!prop) return getResp ? new ChangedInfo(null, "invalid", false, undefined, undefined, value, "key is not valid") : undefined;
                if (init && (prop as Object).hasOwnProperty("value")) return getResp ? ChangedInfo.fail(key, prop.value, value, "ignore") : undefined;
                if (prop.updating) {
                    if (!prop.updating.custom && prop.updating.value === value) return getResp ? ChangedInfo.fail(key, prop.value, value, "duplicated") : undefined;
                    prop.updating.cancel("duplicated");
                }

                var onceC = new OnceController();
                var setToken = prop.updating = {
                    value,
                    cancel(err) {
                        onceC.reject(err);
                    }
                };
                var propExist = hasProp(key);
                var oldValue = prop.value;
                eventManager.fire("ing-" + key, new ChangingInfo(key, oldValue, value, onceC.createObservable()));
                eventManager.fire("prop-changing", new ChangingInfo(key, oldValue, value, onceC.createObservable()));
                var flowTokens = prop.flows.map(item => {
                    if (typeof item !== "function") return undefined;
                    return item(value, message);
                });
                var valueRequested = value;
                if (typeof formatter === "function") value = formatter(key, value);
                if (typeof validator === "function" && !validator(key, value)) {
                    if (setToken !== prop.updating) return getResp ? ChangedInfo.fail(key, prop.value, value, "expired") : undefined;
                    var errorInfo = ChangedInfo.fail(key, oldValue, value, "invalid");
                    onceC.reject("invalid");
                    eventManager.fire("err-" + key, errorInfo);
                    eventManager.fire("prop-failed", errorInfo);
                    flowTokens.forEach(item => {
                        if (!item || typeof item.reject !== "function") return;
                        item.reject("invalid");
                    });
                    return errorInfo;
                }

                if (setToken !== prop.updating) return getResp ? ChangedInfo.fail(key, prop.value, value, "expired") : undefined;
                prop.updating = null;
                onceC.resolve(value);
                if (oldValue === value) return ChangedInfo.success(key, value, oldValue, !propExist ? "add" : null, valueRequested);
                prop.value = value;
                var info = ChangedInfo.success(key, value, oldValue, !propExist ? "add" : null, valueRequested);
                eventManager.fire("ed-" + key, info);
                eventManager.fire("prop-changed", info);
                flowTokens.forEach(item => {
                    if (!item || typeof item.resolve !== "function") return;
                    item.resolve(value);
                });
                return info;
            };
            var removeProp = (keys: string | string[], message: string) => {
                if (!keys) return [];
                if (typeof keys === "string") keys = [keys];
                if (!(keys instanceof Array)) return [];
                var result: ChangedInfo<any>[] = [];
                keys.forEach(key => {
                    var prop = getProp(key, false);
                    if (!prop) return;
                    var propExist = hasProp(key);
                    if (!propExist) return;
                    var oldValue = prop.value;
                    var onceC = new OnceController();
                    eventManager.fire("ing-" + key, new ChangingInfo(key, oldValue, undefined, onceC.createObservable()));
                    eventManager.fire("prop-changing", new ChangingInfo(key, oldValue, undefined, onceC.createObservable()));
                    var flowTokens = prop.flows.map(item => {
                        if (typeof item !== "function") return undefined;
                        return item(undefined, message);
                    });
                    delete prop.value;
                    var info = ChangedInfo.success(key, undefined, oldValue);
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
            var changerClient: PropsAccessorContract = {
                has(key) {
                    return hasProp(key);
                },
                get(key) {
                    var prop = getProp(key, false);
                    return prop ? prop.value : undefined;
                },
                set(key, value, message) {
                    var info = setProp(key, value, message, false, true);
                    if (info) eventManager.fire("batch-changed", { changed: info }, message);
                    return info;
                },
                customizedSet(key, valueRequested, message) {
                    var prop = getProp(key, true);
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

                    var flowTokens: ValueResolveContract<any>[];
                    var done = false;
                    var propExist = hasProp(key);
                    var oldValue = prop.value;
                    var obj: ValueResolveContract<any>;
                    var onceC = new OnceController();
                    var setToken = prop.updating = {
                        value: valueRequested,
                        custom: true,
                        cancel(err) {
                            obj.isAborted = true;
                            onceC.reject(err);
                        }
                    };
                    eventManager.fire("ing-" + key, new ChangingInfo(key, oldValue, valueRequested, onceC.createObservable()));
                    eventManager.fire("prop-changing", new ChangingInfo(key, oldValue, valueRequested, onceC.createObservable()));
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
                            if (oldValue === finalValue) return ChangedInfo.success(key, finalValue, oldValue, !propExist ? "add" : null, valueRequested);
                            prop.value = finalValue;
                            var info = ChangedInfo.success(key, finalValue, oldValue, !propExist ? "add" : null, valueRequested);
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
                            var errorInfo = ChangedInfo.fail(key, oldValue, valueRequested, "invalid");
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
                remove(keys, message) {
                    var changed = removeProp(keys, message);
                    if (changed.length) eventManager.fire("batch-changed", { changed });
                    return changed.length;
                },
                batchProp(obj, removeKeys, initObj, message) {
                    var changed: ChangedInfo<any>[] = [];
                    if (obj) for (var key in obj) {
                        if (!key || typeof key !== "string" || !(obj as Object).hasOwnProperty(key)) continue;
                        var actionResult = setProp(key, obj[key], message);
                        ChangedInfo.push(changed, actionResult);
                    }

                    ChangedInfo.push(changed, ...removeProp(removeKeys, message));

                    if (initObj) for (var key in initObj) {
                        if (!key || typeof key !== "string" || !(initObj as Object).hasOwnProperty(key)) continue;
                        var actionResult = setProp(key, obj[key], message, true);
                        ChangedInfo.push(changed, actionResult);
                    }

                    if (changed.length) eventManager.fire("batch-changed", { changed });
                },
                keys() {
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
                getStore(key, storePropKey) {
                    return getProp(key, true).store[storePropKey];
                },
                setStore(key, storePropKey, value) {
                    getProp(key, true).store[storePropKey] = value;
                },
                removeStore(key, ...storePropKey) {
                    var prop = getProp(key, false).store;
                    storePropKey.forEach(storePropKey => {
                        delete prop.value;
                    });
                },
                sendPropNotify(key, data, message?) {
                    if (!key || typeof key !== "string") return;
                    eventManager.fire("ntf-" + key, data, message);
                }
            };
            return {
                accessor: changerClient,
                pushFlows(key, ...flows) {
                    var now = new Date();
                    flows = flows.filter(item => typeof item === "function");
                    var count = getProp(key, true).flows.push(...flows);
                    return {
                        registeredDate: now,
                        count,
                        sync(message?: string) {
                            flows.forEach(item => {
                                var currentValue = changerClient.get(key);
                                var token = item(currentValue, message);
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
                    var prop = getProp(key, false);
                    var count = prop.flows.length;
                    prop.flows = [];
                    return count;
                },
                sendPropRequest(key, data, message?) {
                    if (!key || typeof key !== "string") return;
                    eventManager.fire("req-" + key, data, message);
                },
                sendPropBroadcast(key, data, message?) {
                    if (!key || typeof key !== "string") return;
                    eventManager.fire("cst-" + key, data, message);
                },
                eventObservable: eventManager.createObservable()
            }
        }
    };

    /**
     * The observable for value.
     */
    export class ValueObservable<T> implements DisposableArrayContract {
        private _instance: {
            get(): T,
            pushFlows(...flows: ValueModifierContract<any>[]): ChangeFlowRegisteredContract,
            clearFlows(): number,
            sendRequest(data: any, message?: string): void,
            sendBroadcast(data: any, message?: string): void,
            eventObservable: EventObservable
        } & DisposableArrayContract;

        public changing: SingleEventObservable<ChangedInfo<T>>;

        public changed: SingleEventObservable<ChangedInfo<T>>;

        public changeFailed: SingleEventObservable<ChangedInfo<T>>;

        public broadcastReceived: SingleEventObservable<any>;

        public notifyReceived: SingleEventObservable<any>;

        /**
         * Initializes a new instance of the ValueObservable class.
         * @param changer  A function to called that you can get the setter of the value by the argument.
         */
        constructor(changer: ValueObservable<T> | ((changed: ValueAccessorContract<T>) => void)) {
            var disposable = new DisposableArray();
            var accessKey = "value";
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
                if (changer._instance.eventObservable instanceof EventObservable) this._instance.eventObservable = this._instance.eventObservable.createObservable();
                else changer._instance.eventObservable = new EventController();
                this.changing = changer._instance.eventObservable.createSingleObservable<ChangedInfo<T>>("ing-" + accessKey);
                this.changed = changer._instance.eventObservable.createSingleObservable<ChangedInfo<T>>("ed-" + accessKey);
                this.changeFailed = changer._instance.eventObservable.createSingleObservable<ChangedInfo<T>>("err-" + accessKey);
                this.broadcastReceived = changer._instance.eventObservable.createSingleObservable<any>("cst-" + accessKey);
                this.notifyReceived = changer._instance.eventObservable.createSingleObservable<any>("ntf-" + accessKey);
                return;
            }

            var formatter: (value: any) => T;
            var validator: (value: T) => boolean;
            var obj = dataUtilities.propsAccessor();
            obj.accessor.setFormatter((key, value) => {
                if (typeof formatter !== "function" || key !== accessKey) return value;
                return formatter(value);
            });
            obj.accessor.setValidator((key, value) => {
                if (typeof validator !== "function" || key !== accessKey) return true;
                return validator(value);
            });
            this.changing = obj.eventObservable.createSingleObservable("ing-" + accessKey);
            this.changed = obj.eventObservable.createSingleObservable("ed-" + accessKey);
            this.changeFailed = obj.eventObservable.createSingleObservable("err-" + accessKey);
            this.broadcastReceived = obj.eventObservable.createSingleObservable<any>("cst-" + accessKey);
            this.notifyReceived = obj.eventObservable.createSingleObservable<any>("ntf-" + accessKey);
            this._instance = {
                get() {
                    return obj.accessor.get(accessKey);
                },
                pushFlows(...flows) {
                    return obj.pushFlows(accessKey, ...flows);
                },
                clearFlows() {
                    return obj.clearFlows(accessKey);
                },
                sendRequest(data, message?) {
                    obj.sendPropRequest(data, message);
                },
                sendBroadcast(data, message?) {
                    obj.sendPropBroadcast(accessKey, data, message);
                },
                eventObservable: obj.eventObservable,
                pushDisposable(...items) {
                    return disposable.pushDisposable(...items);
                },
                dispose() {
                    disposable.dispose();
                }
            };

            if (typeof changer !== "function") return;
            changer({
                get() {
                    return obj.accessor.get(accessKey)
                },
                set(value, message) {
                    return obj.accessor.set(accessKey, value, message);
                },
                customizedSet(valueRequested, message) {
                    return obj.accessor.customizedSet(accessKey, valueRequested, message);
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
                    return obj.accessor.getStore(accessKey, storePropKey);
                },
                setStore(storePropKey, value) {
                    obj.accessor.setStore(accessKey, storePropKey, value);
                },
                removeStore(...storePropKey) {
                    obj.accessor.removeStore(accessKey, ...storePropKey);
                },
                sendNotify(data, message?) {
                    obj.accessor.sendPropNotify(accessKey, data, message);
                },
                requestReceived: obj.eventObservable.createSingleObservable("req-" + accessKey)
            });
        }

        public pushDisposable(...items: DisposableContract[]) {
            return this._instance.pushDisposable(...items);
        }

        public get() {
            return this._instance.get();
        }

        public registerChangeFlow(...value: ValueModifierContract<T>[]) {
            return this._instance.pushFlows(...value);
        }

        public clearChangeFlow() {
            return this._instance.clearFlows();
        }

        public onChanging(
            h: EventHandlerContract<ChangingInfo<T>> | EventHandlerContract<ChangingInfo<T>>[],
            thisArg?: any,
            options?: EventOptionsContract,
            disposableArray?: DisposableArrayContract
        ): EventRegisterResultContract<T> {
            return this._instance.eventObservable.on("ing-value", h, thisArg, options, disposableArray);
        }

        public onChanged(
            h: EventHandlerContract<ChangedInfo<T>> | EventHandlerContract<ChangedInfo<T>>[],
            thisArg?: any,
            options?: EventOptionsContract,
            disposableArray?: DisposableArrayContract
        ): EventRegisterResultContract<T> {
            return this._instance.eventObservable.on("ed-value", h, thisArg, options, disposableArray);
        }

        public onChangeFailed(
            h: EventHandlerContract<ChangedInfo<T>> | EventHandlerContract<ChangedInfo<T>>[],
            thisArg?: any,
            options?: EventOptionsContract,
            disposableArray?: DisposableArrayContract
        ): EventRegisterResultContract<T> {
            return this._instance.eventObservable.on("err-value", h, thisArg, options, disposableArray);
        }

        public onBroadcastReceived(
            h: EventHandlerContract<ChangingInfo<T>> | EventHandlerContract<ChangingInfo<T>>[],
            thisArg?: any,
            options?: EventOptionsContract,
            disposableArray?: DisposableArrayContract
        ): EventRegisterResultContract<T> {
            return this._instance.eventObservable.on("cst-value", h, thisArg, options, disposableArray);
        }

        public onNotifyReceived(
            h: EventHandlerContract<ChangingInfo<T>> | EventHandlerContract<ChangingInfo<T>>[],
            thisArg?: any,
            options?: EventOptionsContract,
            disposableArray?: DisposableArrayContract
        ): EventRegisterResultContract<T> {
            return this._instance.eventObservable.on("ntf-value", h, thisArg, options, disposableArray);
        }

        public subscribe(h: (newValue: T) => void, thisArg?: any): SubscriberCompatibleResultContract {
            return this._instance.eventObservable.subscribeSingle("ed-value", h, thisArg, (newValue: ChangedInfo<T>) => newValue.value);
        }

        public sendRequest(data: any, message?: string) {
            this._instance.sendRequest(data, message);
        }

        public sendBroadcast(data: any, message?: string) {
            this._instance.sendBroadcast(data, message);
        }

        public createObservable() {
            return new ValueObservable<T>(this);
        }

        public dispose() {
            this._instance.dispose();
        }

        public toJSON() {
            var value = this._instance.get();
            try {
                if (value != null) return JSON.stringify(value);
            } catch (ex) {}
            return (new String(value)).toString();
        }
    }

    export class ValueClient<T> extends ValueObservable<T> {
        constructor(
            modifier: (setter: ValueModifierContract<T>) => void,
            private _setter: (value: T, message?: string) => ChangedInfo<T>,
            public requestReceived: SingleEventObservable<any>,
            private _sendNotify: (data: any, message?: string) => void
        ) {
            super(acc => modifier(acc.customizedSet));
            if (!requestReceived) this.requestReceived = new SingleEventObservable(null, "none");
            this.pushDisposable(requestReceived);
        }

        public set(value: T, message?: string): boolean {
            if (typeof this._setter !== "function") return false;
            var info = this._setter(value, message)
            return info ? info.success : false;
        }

        public setForDetails(value: T, message?: string): ChangedInfo<T> {
            if (typeof this._setter !== "function") return ChangedInfo.fail(null, undefined, value, "not implemented");
            return this._setter(value, message);
        }

        public setPromise(value: Promise<T>, compatible?: boolean, message?: string): Promise<T> {
            return dataUtilities.setPromise((value, message?) => {
                return this.setForDetails(value, message);
            }, value, compatible, message);
        }

        public setSubscribe(value: SubscriberContract<T>, message?: string, callbackfn?: (ev: ChangedInfo<T>, message: string) => void, thisArg?: any) {
            return dataUtilities.setSubscribe((value, message?) => {
                return this.setForDetails(value, message);
            }, value, message, callbackfn, thisArg);
        }

        public onRequestReceived(
            h: EventHandlerContract<ChangingInfo<T>> | EventHandlerContract<ChangingInfo<T>>[],
            thisArg?: any,
            options?: EventOptionsContract,
            disposableArray?: DisposableArrayContract
        ): EventRegisterResultContract<T> {
            return this.requestReceived.on(h, thisArg, options, disposableArray);
        }

        public sendNotify(data: any, message?: string) {
            this._sendNotify(data, message);
        }
    }

    export class ValueController<T> extends ValueObservable<T> {
        private _accessor: ValueAccessorContract<T>;
        private _observing: ChangeFlowRegisteredContract;

        public requestReceived: SingleEventObservable<any>;

        public formatter?: (value: any) => T;

        public validator?: (value: T) => boolean;

        constructor() {
            super(acc => this._accessor = acc);
            this.requestReceived = this._accessor.requestReceived.createObservable();
            super.pushDisposable({
                dispose: () => {
                    this.stopObserving();
                }
            }, this.requestReceived);
        }

        public set(value: T, message?: string): boolean {
            var info = this._accessor.set(value, message);
            return info ? info.success : false;
        }

        public setForDetails(value: T, message?: string): ChangedInfo<T> {
            return this._accessor.set(value, message);
        }

        public setPromise(value: Promise<T>, compatible?: boolean, message?: string): Promise<T> {
            return dataUtilities.setPromise((value, message?) => {
                return this.setForDetails(value, message);
            }, value, compatible, message);
        }

        public setSubscribe(value: SubscriberContract<T>, message?: string, callbackfn?: (ev: ChangedInfo<T>, message: string) => void, thisArg?: any) {
            return dataUtilities.setSubscribe((value, message?) => {
                return this.setForDetails(value, message);
            }, value, message, callbackfn, thisArg);
        }

        public observe(value: ValueObservable<T>) {
            if (!(value instanceof ValueObservable)) return {
                dispose() {}
            };
            this._observing = value.registerChangeFlow(this._accessor.customizedSet);
            return this._observing;
        }

        public stopObserving() {
            var disposeObserving = this._observing;
            if (!disposeObserving) return;
            delete this._observing;
            if (typeof disposeObserving.dispose === "function") disposeObserving.dispose();
        }

        public syncFromObserving(message?: string) {
            var disposeObserving = this._observing;
            if (!disposeObserving || typeof disposeObserving.sync !== "function") return false;
            disposeObserving.sync(message);
            return true;
        }

        public isObserving() {
            return !!this._observing;
        }

        public createClient() {
            var token: DisposableContract;
            var client = new ValueClient<T>(modifier => {
                token = this.onChanging((ev, evController) => {
                    var updateToken = modifier(ev.valueRequest, evController.message);
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
            }, this._accessor.requestReceived.createObservable(), this._accessor.sendNotify);
            client.pushDisposable(token);
            return client;
        }

        public onRequestReceived(
            h: EventHandlerContract<ChangingInfo<T>> | EventHandlerContract<ChangingInfo<T>>[],
            thisArg?: any,
            options?: EventOptionsContract,
            disposableArray?: DisposableArrayContract
        ): EventRegisterResultContract<T> {
            return this._accessor.requestReceived.on(h, thisArg, options, disposableArray);
        }

        public sendNotify(data: any, message?: string) {
            this._accessor.sendNotify(data, message);
        }
    }

    export class PropsObservable implements DisposableArrayContract {
        private _instance: {
            has(key: string): boolean,
            get(key: string): any,
            keys(): string[],
            pushFlows(key: string, ...flows: ValueModifierContract<any>[]): ChangeFlowRegisteredContract,
            clearFlows(key: string): number,
            eventObservable: EventObservable
        } & DisposableArrayContract;

        constructor(changer: PropsObservable | ((accessor: PropsAccessorContract) => void)) {
            var disposable = new DisposableArray();
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
                if (changer._instance.eventObservable instanceof EventObservable) changer._instance.eventObservable = changer._instance.eventObservable.createObservable();
                else changer._instance.eventObservable = new EventController();
                return;
            }

            var obj = dataUtilities.propsAccessor();
            this._instance = {
                has(key) {
                    return obj.accessor.has(key)
                },
                get(key) {
                    return obj.accessor.get(key);
                },
                keys() {
                    return obj.accessor.keys();
                },
                pushFlows(key, ...flows) {
                    return obj.pushFlows(key, ...flows);
                },
                clearFlows(key) {
                    return obj.clearFlows(key);
                },
                eventObservable: obj.eventObservable,
                pushDisposable(...items) {
                    return disposable.pushDisposable(...items);
                },
                dispose() {
                    disposable.dispose();
                }
            };
            if (typeof changer !== "function") return;
            changer(obj.accessor);
        }

        public pushDisposable(...items: DisposableContract[]) {
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
        ): EventRegisterResultContract<T> {
            if (!key || typeof key !== "string") return EventObservable.createFailedOnResult(null);
            return this._instance.eventObservable.on("ing-" + key, h, thisArg, options, disposableArray);
        }

        public onPropChanged<T>(
            key: string,
            h: EventHandlerContract<ChangedInfo<T>> | EventHandlerContract<ChangedInfo<T>>[],
            thisArg?: any,
            options?: EventOptionsContract,
            disposableArray?: DisposableArrayContract
        ): EventRegisterResultContract<T> {
            if (!key || typeof key !== "string") return EventObservable.createFailedOnResult(null);
            return this._instance.eventObservable.on("ed-" + key, h, thisArg, options, disposableArray);
        }

        public onPropChangeFailed<T>(
            key: string,
            h: EventHandlerContract<ChangedInfo<T>> | EventHandlerContract<ChangedInfo<T>>[],
            thisArg?: any,
            options?: EventOptionsContract,
            disposableArray?: DisposableArrayContract
        ): EventRegisterResultContract<T> {
            if (!key || typeof key !== "string") return EventObservable.createFailedOnResult(null);
            return this._instance.eventObservable.on("err-" + key, h, thisArg, options, disposableArray);
        }

        public onAnyPropChanging(
            h: EventHandlerContract<ChangingInfo<any>> | EventHandlerContract<ChangingInfo<any>>[],
            thisArg?: any,
            options?: EventOptionsContract,
            disposableArray?: DisposableArrayContract
        ) {
            return this._instance.eventObservable.on("prop-changing", h, thisArg, options, disposableArray);
        }

        public onAnyPropChanged(
            h: EventHandlerContract<ChangedInfo<any>> | EventHandlerContract<ChangedInfo<any>>[],
            thisArg?: any,
            options?: EventOptionsContract,
            disposableArray?: DisposableArrayContract
        ) {
            return this._instance.eventObservable.on("prop-changed", h, thisArg, options, disposableArray);
        }

        public onAnyPropChangeFailed(
            h: EventHandlerContract<ChangedInfo<any>> | EventHandlerContract<ChangedInfo<any>>[],
            thisArg?: any,
            options?: EventOptionsContract,
            disposableArray?: DisposableArrayContract
        ) {
            return this._instance.eventObservable.on("prop-failed", h, thisArg, options, disposableArray);
        }

        public onPropsChanged(
            h: EventHandlerContract<ChangedInfoSetContract> | EventHandlerContract<ChangedInfoSetContract>[],
            thisArg?: any,
            options?: EventOptionsContract,
            disposableArray?: DisposableArrayContract
        ) {
            return this._instance.eventObservable.on("batch-changed", h, thisArg, options, disposableArray);
        }

        public subscribeProp<T>(key: string, h: (newValue: T) => void, thisArg?: any): SubscriberCompatibleResultContract {
            if (!key || typeof key !== "string") return EventObservable.createNothingSubscribe();
            return this._instance.eventObservable.subscribeSingle("ed-" + key, h, thisArg, (newValue: ChangedInfo<T>) => newValue.value);
        }

        public subscribeProps(h: (changeSet: ChangedInfo<any>[]) => void, thisArg?: any): SubscriberCompatibleResultContract {
            return this._instance.eventObservable.subscribeSingle("batch-changed", h, thisArg, (changeSet: ChangedInfoSetContract) => changeSet.changes);
        }

        public createPropObservable<T>(key: string) {
            var obj: {
                accessor?: ValueAccessorContract<T>
            } = {};
            var result = new ValueObservable<T>(accessor => {
                obj.accessor = accessor;
            });
            var onToken = this.onPropChanging<T>(key, (ev, evController) => {
                var changeToken = obj.accessor.customizedSet(ev.currentValue, evController.message);
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

        constructor(
            modifier: (setter: (key: string, newValue: any, message?: string) => ValueResolveContract<any>) => void,
            private _propSetter: (key: string, value: any, message?: string) => ChangedInfo<any>,
            private _sendPropNotify: (key: string, data: any, message?: string) => void
        ) {
            super(acc => modifier(acc.customizedSet));
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

        public setProp(key: string, value: any, message?: string): boolean {
            if (typeof this._propSetter !== "function") return false;
            var info = this._propSetter(key, value, message)
            return info ? info.success : false;
        }

        public setPropForDetails<T>(key: string, value: T, message?: string): ChangedInfo<T> {
            if (typeof this._propSetter !== "function") return ChangedInfo.fail(null, undefined, value, "not implemented");
            return this._propSetter(key, value, message);
        }

        public setPromiseProp<T>(key: string, value: Promise<T>, compatible?: boolean, message?: string): Promise<T> {
            return dataUtilities.setPromise((value, message?) => {
                return this.setPropForDetails(key, value, message);
            }, value, compatible, message);
        }

        public setSubscribeProp<T>(key: string, value: SubscriberContract<T>, message?: string, callbackfn?: (ev: ChangedInfo<T>, message: string) => void, thisArg?: any) {
            return dataUtilities.setSubscribe((value, message?) => {
                return this.setPropForDetails(key, value, message);
            }, value, message, callbackfn, thisArg);
        }

        public sendPropNotify(key: string, data: any, message?: string) {
            if (typeof this._sendPropNotify !== "function") return;
            this._sendPropNotify(key, data, message);
        }
    }

    export class PropsController extends PropsObservable {
        private _accessor: PropsAccessorContract;

        public readonly proxy: any;

        constructor() {
            super(accessor => {
                this._accessor = accessor;
            });
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

        public setProp(key: string, value: any, message?: string) {
            var info = this._accessor.set(key, value, message);
            return info ? info.success : false;
        }

        public setPropForDetails<T>(key: string, value: T, message?: string): ChangedInfo<T> {
            return this._accessor.set(key, value, message);
        }

        public setPromiseProp<T>(key: string, value: Promise<T>, compatible?: boolean, message?: string): Promise<T> {
            return dataUtilities.setPromise((value, message?) => {
                return this.setPropForDetails(key, value, message);
            }, value, compatible, message);
        }

        public setSubscribeProp<T>(key: string, value: SubscriberContract<T>, message?: string, callbackfn?: (ev: ChangedInfo<T>, message: string) => void, thisArg?: any) {
            return dataUtilities.setSubscribe((value, message?) => {
                return this.setPropForDetails(key, value, message);
            }, value, message, callbackfn, thisArg);
        }

        public createPropClient<T>(key: string) {
            var token: DisposableContract;
            var client = new ValueClient<T>(modifier => {
                token = this.onPropChanging<T>(key, (ev, evController) => {
                    var updateToken = modifier(ev.valueRequest, evController.message);
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
            }, null, (data, message?) => {
                this._accessor.sendPropNotify(key, data, message);
            });
            client.pushDisposable(token);
            return client;
        }

        public createClient() {
            var token: DisposableContract;
            var client = new PropsClient(modifier => {
                token = this.onAnyPropChanging((ev, evController) => {
                    var updateToken = modifier(ev.key, ev.valueRequest, evController.message);
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
            }, this._accessor.sendPropNotify);
            client.pushDisposable(token);
            return client;
        }
    }

}
