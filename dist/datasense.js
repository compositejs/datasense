var DataSense;
(function (DataSense) {
    var Collection;
    (function (Collection) {
        /**
         * Gets the index of the specific item in an array.
         * @param {Array} list  The array to find a specific item.
         * @param {*} item  The item for comparing.
         * @param {string | number | Function} compare  The property key; or, a function.
         */
        function findIndex(list, item, compare) {
            if (!list || item == null)
                return -1;
            if (!list.findIndex)
                list.findIndex = (callback) => {
                    let resultIndex = -1;
                    list.some((ele, eleIndex, eleArr) => {
                        if (!callback(ele, eleIndex, eleArr))
                            return false;
                        resultIndex = eleIndex;
                        return true;
                    });
                    return resultIndex;
                };
            if (!compare)
                return list.findIndex(ele => ele === item);
            switch (typeof compare) {
                case "string":
                case "number":
                    return list.findIndex(ele => ele[compare] === item);
                case "function":
                    return list.findIndex(ele => compare(ele, item));
                default:
                    return -1;
            }
        }
        Collection.findIndex = findIndex;
        /**
         * Removes an item from given array.
         * @param {Array} originalList  The array to be merged.
         * @param {*} item  An item to remove.
         * @param {string | function} compare  The property key; or, a function.
         */
        function remove(list, item, compare) {
            let count = 0;
            while (true) {
                let index = findIndex(list, item, compare);
                if (index < 0)
                    break;
                list.splice(index, 1);
                count++;
            }
            return count;
        }
        Collection.remove = remove;
    })(Collection = DataSense.Collection || (DataSense.Collection = {}));
})(DataSense || (DataSense = {}));
var DataSense;
(function (DataSense) {
    /**
     * Processes a handler delay or immediately.
     * @param h  The handler to process.
     * @param delay  true if process delay; false if process immediately; or a number if process after the specific milliseconds.
     * @param justPrepare  true if just set up a task which will not process immediately; otherwise, false.
     */
    function delay(h, delay, justPrepare) {
        let procToken;
        let count = 0;
        let latest;
        let procH = () => {
            procToken = null;
            h();
            latest = new Date();
            count++;
        };
        let proc = (maxCount) => {
            if (maxCount === true)
                maxCount = 1;
            if (typeof maxCount === "number" && count >= maxCount)
                return;
            if (procToken)
                clearTimeout(procToken);
            if (delay == null || delay === false)
                procH();
            else if (delay === true)
                procToken = setTimeout(procH, 0);
            else if (typeof delay === "number")
                procToken = setTimeout(procH, delay);
        };
        if (!justPrepare)
            proc();
        return {
            process: proc,
            processNow() {
                if (procToken)
                    clearTimeout(procToken);
                procH();
            },
            delay(value) {
                if (arguments.length > 0)
                    delay = value;
                return delay;
            },
            pending() {
                return !!procToken;
            },
            latest() {
                return latest;
            },
            count() {
                return count;
            },
            dispose() {
                if (procToken)
                    clearTimeout(procToken);
            }
        };
    }
    DataSense.delay = delay;
    class DisposableArray {
        constructor() {
            this._list = [];
        }
        push(...items) {
            let count = 0;
            items.forEach(item => {
                if (!item || this._list.indexOf(item) >= 0)
                    return;
                this._list.push(item);
                count++;
            });
            return count;
        }
        pushDisposable(...items) {
            return this.push(...items);
        }
        remove(...items) {
            let count = 0;
            items.forEach(item => {
                if (item && DataSense.Collection.remove(this._list, item) < 1)
                    return;
                count++;
            });
            return count;
        }
        dispose() {
            this._list.forEach(item => {
                if (!item || typeof item.dispose !== "function")
                    return;
                item.dispose();
            });
            this._list = [];
        }
    }
    DataSense.DisposableArray = DisposableArray;
})(DataSense || (DataSense = {}));
// For asynchronous modules loaders.
(function () {
    if (typeof define === 'function') {
        if (define.amd || typeof __webpack_require__ !== "undefined") {
            define(["exports"], function (exports) {
                return DataSense;
            });
        }
    }
    else if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        module["exports"] = DataSense;
    }
})();
var DataSense;
(function (DataSense) {
    let dataUtilities = {
        setPromise(setter, value, compatible, message) {
            if (value === undefined)
                return new Promise((resolve, reject) => {
                    reject("value is undefined");
                });
            if (typeof value.then !== "function") {
                if (!compatible)
                    return new Promise((resolve, reject) => {
                        reject("value is not a Promise object");
                    });
                setter(value);
                return new Promise((resolve) => {
                    resolve(value);
                });
            }
            return value.then(r => {
                setter(r, message);
                return r;
            });
        },
        setSubscribe(setter, value, message, callbackfn, thisArg) {
            let needCallback = typeof callbackfn === "function";
            return value.subscribe(newValue => {
                let result = setter(newValue, message);
                if (!needCallback)
                    return;
                let fireObj = typeof message === "string" ? { message } : (message || {});
                callbackfn.call(thisArg, result, fireObj);
            });
        },
        propsAccessor() {
            let store = {};
            let eventManager = new DataSense.EventController();
            let hasProp = (key) => {
                return store.hasOwnProperty(key) && store[key].hasOwnProperty("value");
            };
            let getProp = (key, ensure) => {
                if (!key || typeof key !== "string")
                    return undefined;
                let obj = store[key];
                if (!obj) {
                    obj = {
                        handlers: [],
                        store: {},
                        flows: [],
                        factory: {}
                    };
                    if (ensure)
                        store[key] = obj;
                }
                return obj;
            };
            let formatter;
            let validator;
            let actionRequests = {};
            let setProp = (key, value, message, init, getResp) => {
                let prop = getProp(key, true);
                if (!prop)
                    return getResp ? new DataSense.ChangedInfo(null, "invalid", false, undefined, undefined, value, "key is not valid") : undefined;
                if (init && prop.hasOwnProperty("value"))
                    return getResp ? DataSense.ChangedInfo.fail(key, prop.value, value, "ignore") : undefined;
                if (prop.updating) {
                    if (!prop.updating.custom && prop.updating.value === value)
                        return getResp ? DataSense.ChangedInfo.fail(key, prop.value, value, "duplicated") : undefined;
                    prop.updating.cancel("duplicated");
                }
                let onceC = new DataSense.OnceController();
                let setToken = prop.updating = {
                    value,
                    cancel(err) {
                        onceC.reject(err);
                    }
                };
                let propExist = hasProp(key);
                let oldValue = prop.value;
                eventManager.fire("ing-" + key, new DataSense.ChangingInfo(key, oldValue, value, onceC.createObservable()));
                eventManager.fire("prop-changing", new DataSense.ChangingInfo(key, oldValue, value, onceC.createObservable()));
                let flowTokens = prop.flows.map(item => {
                    if (typeof item !== "function")
                        return undefined;
                    return item(value, message);
                });
                let valueRequested = value;
                if (typeof formatter === "function")
                    value = formatter(key, value);
                if (typeof validator === "function" && !validator(key, value)) {
                    if (setToken !== prop.updating)
                        return getResp ? DataSense.ChangedInfo.fail(key, prop.value, value, "expired") : undefined;
                    let errorInfo = DataSense.ChangedInfo.fail(key, oldValue, value, "invalid");
                    onceC.reject("invalid");
                    eventManager.fire("err-" + key, errorInfo);
                    eventManager.fire("prop-failed", errorInfo);
                    flowTokens.forEach(item => {
                        if (!item || typeof item.reject !== "function")
                            return;
                        item.reject("invalid");
                    });
                    return errorInfo;
                }
                if (setToken !== prop.updating)
                    return getResp ? DataSense.ChangedInfo.fail(key, prop.value, value, "expired") : undefined;
                prop.updating = null;
                onceC.resolve(value);
                if (oldValue === value)
                    return DataSense.ChangedInfo.success(key, value, oldValue, !propExist ? "add" : null, valueRequested);
                prop.value = value;
                let info = DataSense.ChangedInfo.success(key, value, oldValue, !propExist ? "add" : null, valueRequested);
                eventManager.fire("ed-" + key, info);
                eventManager.fire("prop-changed", info);
                flowTokens.forEach(item => {
                    if (!item || typeof item.resolve !== "function")
                        return;
                    item.resolve(value);
                });
                return info;
            };
            let removeProp = (keys, message) => {
                if (!keys)
                    return [];
                if (typeof keys === "string")
                    keys = [keys];
                if (!(keys instanceof Array))
                    return [];
                let result = [];
                keys.forEach(key => {
                    let prop = getProp(key, false);
                    if (!prop)
                        return;
                    let propExist = hasProp(key);
                    if (!propExist)
                        return;
                    let oldValue = prop.value;
                    let onceC = new DataSense.OnceController();
                    eventManager.fire("ing-" + key, new DataSense.ChangingInfo(key, oldValue, undefined, onceC.createObservable()));
                    eventManager.fire("prop-changing", new DataSense.ChangingInfo(key, oldValue, undefined, onceC.createObservable()));
                    let flowTokens = prop.flows.map(item => {
                        if (typeof item !== "function")
                            return undefined;
                        return item(undefined, message);
                    });
                    delete prop.value;
                    let info = DataSense.ChangedInfo.success(key, undefined, oldValue);
                    result.push(info);
                    onceC.resolve(undefined);
                    if (oldValue === undefined)
                        return;
                    eventManager.fire("ed-" + key, info);
                    eventManager.fire("prop-changed", info);
                    flowTokens.forEach(item => {
                        if (!item || typeof item.resolve !== "function")
                            return;
                        item.resolve(undefined);
                    });
                });
                return result;
            };
            let changerClient = {
                has(key) {
                    return hasProp(key);
                },
                get(key) {
                    let prop = getProp(key, false);
                    return prop ? prop.value : undefined;
                },
                set(key, value, message) {
                    let info = setProp(key, value, message, false, true);
                    if (info)
                        eventManager.fire("batch-changed", { changed: info }, message);
                    return info;
                },
                customizedSet(key, valueRequested, message) {
                    let prop = getProp(key, true);
                    if (!prop)
                        return {
                            isAborted: true,
                            resolve(finalValue) { },
                            reject(err) { }
                        };
                    if (prop.updating) {
                        if (prop.updating.custom && prop.updating.value === valueRequested)
                            return {
                                isAborted: true,
                                resolve(finalValue) { },
                                reject(err) { }
                            };
                        prop.updating.cancel("expired");
                    }
                    let flowTokens;
                    let done = false;
                    let propExist = hasProp(key);
                    let oldValue = prop.value;
                    let obj;
                    let onceC = new DataSense.OnceController();
                    let setToken = prop.updating = {
                        value: valueRequested,
                        custom: true,
                        cancel(err) {
                            obj.isAborted = true;
                            onceC.reject(err);
                        }
                    };
                    eventManager.fire("ing-" + key, new DataSense.ChangingInfo(key, oldValue, valueRequested, onceC.createObservable()));
                    eventManager.fire("prop-changing", new DataSense.ChangingInfo(key, oldValue, valueRequested, onceC.createObservable()));
                    flowTokens = prop.flows.map(item => {
                        if (typeof item !== "function")
                            return undefined;
                        return item(valueRequested, message);
                    });
                    obj = {
                        resolve(finalValue) {
                            if (done)
                                return;
                            if (setToken !== prop.updating)
                                return;
                            prop.updating = null;
                            onceC.resolve(finalValue);
                            if (oldValue === finalValue)
                                return DataSense.ChangedInfo.success(key, finalValue, oldValue, !propExist ? "add" : null, valueRequested);
                            prop.value = finalValue;
                            let info = DataSense.ChangedInfo.success(key, finalValue, oldValue, !propExist ? "add" : null, valueRequested);
                            eventManager.fire("ed-" + key, info);
                            eventManager.fire("prop-changed", info);
                            flowTokens.forEach(item => {
                                if (!item || typeof item.resolve !== "function")
                                    return;
                                item.resolve(finalValue);
                            });
                            return info;
                        },
                        reject(err) {
                            if (done)
                                return;
                            if (setToken !== prop.updating)
                                return;
                            prop.updating = null;
                            obj.isAborted = true;
                            let errorInfo = DataSense.ChangedInfo.fail(key, oldValue, valueRequested, "invalid");
                            onceC.reject("invalid");
                            eventManager.fire("err-" + key, errorInfo);
                            eventManager.fire("prop-failed", errorInfo);
                            flowTokens.forEach(item => {
                                if (!item || typeof item.reject !== "function")
                                    return;
                                item.reject("invalid");
                            });
                        }
                    };
                    return obj;
                },
                remove(keys, message) {
                    let changed = removeProp(keys, message);
                    if (changed.length)
                        eventManager.fire("batch-changed", { changed });
                    return changed.length;
                },
                batchProp(obj, removeKeys, initObj, message) {
                    let changed = [];
                    if (obj)
                        for (let key in obj) {
                            if (!key || typeof key !== "string" || !obj.hasOwnProperty(key))
                                continue;
                            let actionResult = setProp(key, obj[key], message);
                            DataSense.ChangedInfo.push(changed, actionResult);
                        }
                    DataSense.ChangedInfo.push(changed, ...removeProp(removeKeys, message));
                    if (initObj)
                        for (let key in initObj) {
                            if (!key || typeof key !== "string" || !initObj.hasOwnProperty(key))
                                continue;
                            let actionResult = setProp(key, obj[key], message, true);
                            DataSense.ChangedInfo.push(changed, actionResult);
                        }
                    if (changed.length)
                        eventManager.fire("batch-changed", { changed });
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
                    let prop = getProp(key, false).store;
                    storePropKey.forEach(storePropKey => {
                        delete prop.value;
                    });
                },
                sendPropNotify(key, data, message) {
                    if (!key || typeof key !== "string")
                        return;
                    eventManager.fire("ntf-" + key, data, message);
                },
                registerPropRequestHandler(key, type, h) {
                    let prop = getProp(key, true).factory;
                    if (!h)
                        delete prop[type];
                    else if (typeof h !== "function")
                        return false;
                    else
                        prop[type] = h;
                    return true;
                },
                registerRequestHandler(type, h) {
                    if (!h)
                        delete actionRequests[type];
                    else if (typeof h !== "function")
                        return false;
                    else
                        actionRequests[type] = h;
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
                        sync(message) {
                            flows.forEach(item => {
                                let currentValue = changerClient.get(key);
                                let token = item(currentValue, message);
                                if (token && typeof token.resolve === "function")
                                    token.resolve(currentValue);
                            });
                        },
                        dispose() {
                            flows.forEach(item => {
                                DataSense.Collection.remove(this._instance.observables, item);
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
                sendPropRequest(key, type, value, thisArg) {
                    let requestH = getProp(key, false).factory[type];
                    if (typeof requestH !== "function")
                        return;
                    requestH.call(thisArg, value);
                },
                sendRequest(type, value, thisArg) {
                    let requestH = actionRequests[type];
                    if (typeof requestH !== "function")
                        return;
                    requestH.call(thisArg, value);
                },
                sendPropBroadcast(key, data, message) {
                    if (!key || typeof key !== "string")
                        return;
                    eventManager.fire("cst-" + key, data, message);
                },
                sendBroadcast(data, message) {
                    eventManager.fire("broadcast", data, message);
                },
                eventObservable: eventManager.createObservable()
            };
        }
    };
    /**
     * The observable for value.
     */
    class ValueObservable {
        /**
         * Initializes a new instance of the ValueObservable class.
         * @param changer  A function to called that you can get the setter of the value by the argument.
         */
        constructor(changer) {
            let disposable = new DataSense.DisposableArray();
            let accessKey = "value";
            if ((changer instanceof ValueObservable) && changer._instance) {
                this._instance = Object.assign({}, changer._instance, { pushDisposable(...items) {
                        return disposable.pushDisposable(...items);
                    },
                    dispose() {
                        disposable.dispose();
                    } });
                if (changer._instance.eventObservable instanceof DataSense.EventObservable)
                    this._instance.eventObservable = this._instance.eventObservable.createObservable();
                else
                    changer._instance.eventObservable = new DataSense.EventController();
                this.changing = changer._instance.eventObservable.createSingleObservable("ing-" + accessKey);
                this.changed = changer._instance.eventObservable.createSingleObservable("ed-" + accessKey);
                this.changeFailed = changer._instance.eventObservable.createSingleObservable("err-" + accessKey);
                this.broadcastReceived = changer._instance.eventObservable.createSingleObservable("cst-" + accessKey);
                this.notifyReceived = changer._instance.eventObservable.createSingleObservable("ntf-" + accessKey);
                return;
            }
            let formatter;
            let validator;
            let obj = dataUtilities.propsAccessor();
            obj.accessor.setFormatter((key, value) => {
                if (typeof formatter !== "function" || key !== accessKey)
                    return value;
                return formatter(value);
            });
            obj.accessor.setValidator((key, value) => {
                if (typeof validator !== "function" || key !== accessKey)
                    return true;
                return validator(value);
            });
            this.changing = obj.eventObservable.createSingleObservable("ing-" + accessKey);
            this.changed = obj.eventObservable.createSingleObservable("ed-" + accessKey);
            this.changeFailed = obj.eventObservable.createSingleObservable("err-" + accessKey);
            this.broadcastReceived = obj.eventObservable.createSingleObservable("cst-" + accessKey);
            this.notifyReceived = obj.eventObservable.createSingleObservable("ntf-" + accessKey);
            let self = this;
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
                sendRequest(type, value) {
                    obj.sendPropRequest(accessKey, type, value, self);
                },
                sendBroadcast(data, message) {
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
            if (typeof changer !== "function")
                return;
            changer({
                get() {
                    return obj.accessor.get(accessKey);
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
                sendNotify(data, message) {
                    obj.accessor.sendPropNotify(accessKey, data, message);
                },
                registerRequestHandler(type, h) {
                    return obj.accessor.registerPropRequestHandler(accessKey, type, h);
                }
            });
        }
        pushDisposable(...items) {
            return this._instance.pushDisposable(...items);
        }
        get() {
            return this._instance.get();
        }
        registerChangeFlow(...value) {
            return this._instance.pushFlows(...value);
        }
        clearChangeFlow() {
            return this._instance.clearFlows();
        }
        onChanging(h, thisArg, options, disposableArray) {
            return this._instance.eventObservable.on("ing-value", h, thisArg, options, disposableArray);
        }
        onChanged(h, thisArg, options, disposableArray) {
            return this._instance.eventObservable.on("ed-value", h, thisArg, options, disposableArray);
        }
        onChangeFailed(h, thisArg, options, disposableArray) {
            return this._instance.eventObservable.on("err-value", h, thisArg, options, disposableArray);
        }
        onBroadcastReceived(h, thisArg, options, disposableArray) {
            return this._instance.eventObservable.on("cst-value", h, thisArg, options, disposableArray);
        }
        onNotifyReceived(h, thisArg, options, disposableArray) {
            return this._instance.eventObservable.on("ntf-value", h, thisArg, options, disposableArray);
        }
        subscribe(h, thisArg) {
            return this._instance.eventObservable.subscribeSingle("ed-value", h, thisArg, (newValue) => newValue.value);
        }
        sendRequest(type, value) {
            this._instance.sendRequest(type, value);
        }
        sendBroadcast(data, message) {
            this._instance.sendBroadcast(data, message);
        }
        createObservable() {
            return new ValueObservable(this);
        }
        dispose() {
            this._instance.dispose();
        }
        toJSON() {
            let value = this._instance.get();
            try {
                if (value != null)
                    return JSON.stringify(value);
            }
            catch (ex) { }
            return (new String(value)).toString();
        }
    }
    DataSense.ValueObservable = ValueObservable;
    class ValueClient extends ValueObservable {
        constructor(modifier, _setter, _sendNotify) {
            super(acc => modifier(acc.customizedSet));
            this._setter = _setter;
            this._sendNotify = _sendNotify;
        }
        set(value, message) {
            if (typeof this._setter !== "function")
                return false;
            let info = this._setter(value, message);
            return info ? info.success : false;
        }
        setForDetails(value, message) {
            if (typeof this._setter !== "function")
                return DataSense.ChangedInfo.fail(null, undefined, value, "not implemented");
            return this._setter(value, message);
        }
        setPromise(value, compatible, message) {
            return dataUtilities.setPromise((value, message) => {
                return this.setForDetails(value, message);
            }, value, compatible, message);
        }
        setSubscribe(value, message, callbackfn, thisArg) {
            return dataUtilities.setSubscribe((value, message) => {
                return this.setForDetails(value, message);
            }, value, message, callbackfn, thisArg);
        }
        sendNotify(data, message) {
            this._sendNotify(data, message);
        }
    }
    DataSense.ValueClient = ValueClient;
    class ValueController extends ValueObservable {
        constructor() {
            let a;
            super(acc => a = acc);
            this._accessor = a;
        }
        get formatter() {
            return this._accessor.getFormatter();
        }
        set formatter(h) {
            this._accessor.setFormatter(h);
        }
        get validator() {
            return this._accessor.getValidator();
        }
        set validator(h) {
            this._accessor.setValidator(h);
        }
        set(value, message) {
            let info = this._accessor.set(value, message);
            return info ? info.success : false;
        }
        setForDetails(value, message) {
            return this._accessor.set(value, message);
        }
        setPromise(value, compatible, message) {
            return dataUtilities.setPromise((value, message) => {
                return this.setForDetails(value, message);
            }, value, compatible, message);
        }
        setSubscribe(value, message, callbackfn, thisArg) {
            return dataUtilities.setSubscribe((value, message) => {
                return this.setForDetails(value, message);
            }, value, message, callbackfn, thisArg);
        }
        registerRequestHandler(type, h) {
            return this._accessor.registerRequestHandler(type, h);
        }
        observe(value) {
            if (!(value instanceof ValueObservable))
                return {
                    dispose() { }
                };
            this._observing = value.registerChangeFlow(this._accessor.customizedSet);
            return this._observing;
        }
        stopObserving() {
            let disposeObserving = this._observing;
            if (!disposeObserving)
                return;
            delete this._observing;
            if (typeof disposeObserving.dispose === "function")
                disposeObserving.dispose();
        }
        syncFromObserving(message) {
            let disposeObserving = this._observing;
            if (!disposeObserving || typeof disposeObserving.sync !== "function")
                return false;
            disposeObserving.sync(message);
            return true;
        }
        isObserving() {
            return !!this._observing;
        }
        createClient() {
            let token;
            let client = new ValueClient(modifier => {
                token = this.onChanging((ev, evController) => {
                    let updateToken = modifier(ev.valueRequest, evController.message);
                    if (!ev.observable)
                        return;
                    ev.observable.onResolved(newValue => {
                        updateToken.resolve(newValue);
                    });
                    ev.observable.onRejected(err => {
                        updateToken.reject(err);
                    });
                });
            }, (value, message) => {
                return this.setForDetails(value, message);
            }, this._accessor.sendNotify);
            client.pushDisposable(token);
            return client;
        }
        sendNotify(data, message) {
            this._accessor.sendNotify(data, message);
        }
    }
    DataSense.ValueController = ValueController;
    class PropsObservable {
        constructor(changer) {
            let disposable = new DataSense.DisposableArray();
            if ((changer instanceof PropsObservable) && changer._instance) {
                this._instance = Object.assign({}, changer._instance, { pushDisposable(...items) {
                        return disposable.pushDisposable(...items);
                    },
                    dispose() {
                        disposable.dispose();
                    } });
                if (changer._instance.eventObservable instanceof DataSense.EventObservable)
                    changer._instance.eventObservable = changer._instance.eventObservable.createObservable();
                else
                    changer._instance.eventObservable = new DataSense.EventController();
                return;
            }
            let obj = dataUtilities.propsAccessor();
            this._instance = {
                has(key) {
                    return obj.accessor.has(key);
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
                sendPropRequest(key, type, value) {
                    obj.sendPropRequest(key, type, value, self);
                },
                sendRequest(type, value) {
                    obj.sendRequest(type, value, self);
                },
                sendPropBroadcast(key, data, message) {
                    obj.sendPropBroadcast(key, data, message);
                },
                sendBroadcast(data, message) {
                    obj.sendBroadcast(data, message);
                },
                eventObservable: obj.eventObservable,
                pushDisposable(...items) {
                    return disposable.pushDisposable(...items);
                },
                dispose() {
                    disposable.dispose();
                }
            };
            if (typeof changer !== "function")
                return;
            changer(obj.accessor);
        }
        pushDisposable(...items) {
            return this._instance.pushDisposable(...items);
        }
        getKeys() {
            return this._instance.keys();
        }
        hasProp(key) {
            return this._instance.has(key);
        }
        getProp(key) {
            return this._instance.get(key);
        }
        registerChangeFlow(key, ...value) {
            return this._instance.pushFlows(key, ...value);
        }
        clearChangeFlow(key) {
            return this._instance.clearFlows(key);
        }
        onPropChanging(key, h, thisArg, options, disposableArray) {
            if (!key || typeof key !== "string")
                return DataSense.EventObservable.createFailedOnResult(null);
            return this._instance.eventObservable.on("ing-" + key, h, thisArg, options, disposableArray);
        }
        onPropChanged(key, h, thisArg, options, disposableArray) {
            if (!key || typeof key !== "string")
                return DataSense.EventObservable.createFailedOnResult(null);
            return this._instance.eventObservable.on("ed-" + key, h, thisArg, options, disposableArray);
        }
        onPropChangeFailed(key, h, thisArg, options, disposableArray) {
            if (!key || typeof key !== "string")
                return DataSense.EventObservable.createFailedOnResult(null);
            return this._instance.eventObservable.on("err-" + key, h, thisArg, options, disposableArray);
        }
        onAnyPropChanging(h, thisArg, options, disposableArray) {
            return this._instance.eventObservable.on("prop-changing", h, thisArg, options, disposableArray);
        }
        onAnyPropChanged(h, thisArg, options, disposableArray) {
            return this._instance.eventObservable.on("prop-changed", h, thisArg, options, disposableArray);
        }
        onAnyPropChangeFailed(h, thisArg, options, disposableArray) {
            return this._instance.eventObservable.on("prop-failed", h, thisArg, options, disposableArray);
        }
        onPropsChanged(h, thisArg, options, disposableArray) {
            return this._instance.eventObservable.on("batch-changed", h, thisArg, options, disposableArray);
        }
        onPropBroadcastReceived(key, h, thisArg, options, disposableArray) {
            if (!key || typeof key !== "string")
                return DataSense.EventObservable.createFailedOnResult(null);
            return this._instance.eventObservable.on("cst-" + key, h, thisArg, options, disposableArray);
        }
        onPropNotifyReceived(key, h, thisArg, options, disposableArray) {
            if (!key || typeof key !== "string")
                return DataSense.EventObservable.createFailedOnResult(null);
            return this._instance.eventObservable.on("ntf-" + key, h, thisArg, options, disposableArray);
        }
        subscribeProp(key, h, thisArg) {
            if (!key || typeof key !== "string")
                return DataSense.EventObservable.createNothingSubscribe();
            return this._instance.eventObservable.subscribeSingle("ed-" + key, h, thisArg, (newValue) => newValue.value);
        }
        subscribeProps(h, thisArg) {
            return this._instance.eventObservable.subscribeSingle("batch-changed", h, thisArg, (changeSet) => changeSet.changes);
        }
        sendPropRequest(key, type, value) {
            this._instance.sendPropRequest(key, type, value);
        }
        sendRequest(type, value) {
            this._instance.sendRequest(type, value);
        }
        sendPropBroadcast(key, data, message) {
            this._instance.sendPropBroadcast(key, data, message);
        }
        sendBroadcast(data, message) {
            this._instance.sendBroadcast(data, message);
        }
        createPropObservable(key) {
            let obj = {};
            let result = new ValueObservable(accessor => {
                obj.accessor = accessor;
            });
            let onToken = this.onPropChanging(key, (ev, evController) => {
                let changeToken = obj.accessor.customizedSet(ev.currentValue, evController.message);
                if (!ev.observable)
                    return;
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
        createObservable() {
            return new PropsObservable(this);
        }
        dispose() {
            this._instance.dispose();
        }
    }
    DataSense.PropsObservable = PropsObservable;
    class PropsClient extends PropsObservable {
        constructor(modifier, _propSetter, _sendPropNotify, _registerPropRequestHandler, _registerRequestHandler) {
            super(acc => modifier(acc.customizedSet));
            this._propSetter = _propSetter;
            this._sendPropNotify = _sendPropNotify;
            this._registerPropRequestHandler = _registerPropRequestHandler;
            this._registerRequestHandler = _registerRequestHandler;
            if (typeof Proxy === "undefined")
                return;
            this.proxy = new Proxy({}, {
                has: (target, p) => {
                    if (!p || typeof p !== "string")
                        return false;
                    return this.hasProp(p);
                },
                get: (target, p, receiver) => {
                    if (!p || typeof p !== "string")
                        return undefined;
                    return this.getProp(p);
                },
                set: (target, p, value, receiver) => {
                    if (!p || typeof p !== "string")
                        throw new TypeError("the property key should be a string");
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
        setProp(key, value, message) {
            if (typeof this._propSetter !== "function")
                return false;
            let info = this._propSetter(key, value, message);
            return info ? info.success : false;
        }
        setPropForDetails(key, value, message) {
            if (typeof this._propSetter !== "function")
                return DataSense.ChangedInfo.fail(null, undefined, value, "not implemented");
            return this._propSetter(key, value, message);
        }
        setPromiseProp(key, value, compatible, message) {
            return dataUtilities.setPromise((value, message) => {
                return this.setPropForDetails(key, value, message);
            }, value, compatible, message);
        }
        setSubscribeProp(key, value, message, callbackfn, thisArg) {
            return dataUtilities.setSubscribe((value, message) => {
                return this.setPropForDetails(key, value, message);
            }, value, message, callbackfn, thisArg);
        }
        sendPropNotify(key, data, message) {
            if (typeof this._sendPropNotify !== "function")
                return;
            this._sendPropNotify(key, data, message);
        }
        registerPropRequestHandler(key, type, h) {
            if (typeof this._registerPropRequestHandler !== "function")
                return false;
            return this._registerPropRequestHandler(key, type, h);
        }
        registerRequestHandler(type, h) {
            if (typeof this._registerRequestHandler !== "function")
                return false;
            return this._registerRequestHandler(type, h);
        }
    }
    DataSense.PropsClient = PropsClient;
    class PropsController extends PropsObservable {
        constructor() {
            let a;
            super(acc => a = acc);
            this._accessor = a;
            if (typeof Proxy === "undefined")
                return;
            this.proxy = new Proxy({}, {
                has: (target, p) => {
                    if (!p || typeof p !== "string")
                        return false;
                    return this.hasProp(p);
                },
                get: (target, p, receiver) => {
                    if (!p || typeof p !== "string")
                        return undefined;
                    return this.getProp(p);
                },
                set: (target, p, value, receiver) => {
                    if (!p || typeof p !== "string")
                        throw new TypeError("the property key should be a string");
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
        get formatter() {
            return this._accessor.getFormatter();
        }
        set formatter(h) {
            this._accessor.setFormatter(h);
        }
        get validator() {
            return this._accessor.getValidator();
        }
        set validator(h) {
            this._accessor.setValidator(h);
        }
        setProp(key, value, message) {
            let info = this._accessor.set(key, value, message);
            return info ? info.success : false;
        }
        setPropForDetails(key, value, message) {
            return this._accessor.set(key, value, message);
        }
        setPromiseProp(key, value, compatible, message) {
            return dataUtilities.setPromise((value, message) => {
                return this.setPropForDetails(key, value, message);
            }, value, compatible, message);
        }
        setSubscribeProp(key, value, message, callbackfn, thisArg) {
            return dataUtilities.setSubscribe((value, message) => {
                return this.setPropForDetails(key, value, message);
            }, value, message, callbackfn, thisArg);
        }
        sendPropNotify(key, data, message) {
            this._accessor.sendPropNotify(key, data, message);
        }
        registerPropRequestHandler(key, type, h) {
            return this._accessor.registerPropRequestHandler(key, type, h);
        }
        registerRequestHandler(type, h) {
            return this._accessor.registerRequestHandler(type, h);
        }
        createPropClient(key) {
            let token;
            let client = new ValueClient(modifier => {
                token = this.onPropChanging(key, (ev, evController) => {
                    let updateToken = modifier(ev.valueRequest, evController.message);
                    if (!ev.observable)
                        return;
                    ev.observable.onResolved(newValue => {
                        updateToken.resolve(newValue);
                    });
                    ev.observable.onRejected(err => {
                        updateToken.reject(err);
                    });
                });
            }, (value, message) => {
                return this.setPropForDetails(key, value, message);
            }, (data, message) => {
                this._accessor.sendPropNotify(key, data, message);
            });
            client.pushDisposable(token);
            return client;
        }
        createClient() {
            let token;
            let client = new PropsClient(modifier => {
                token = this.onAnyPropChanging((ev, evController) => {
                    let updateToken = modifier(ev.key, ev.valueRequest, evController.message);
                    if (!ev.observable)
                        return;
                    ev.observable.onResolved(newValue => {
                        updateToken.resolve(newValue);
                    });
                    ev.observable.onRejected(err => {
                        updateToken.reject(err);
                    });
                });
            }, (key, value, message) => {
                return this.setPropForDetails(key, value, message);
            }, this._accessor.sendPropNotify, this._accessor.registerPropRequestHandler, this._accessor.registerRequestHandler);
            client.pushDisposable(token);
            return client;
        }
    }
    DataSense.PropsController = PropsController;
})(DataSense || (DataSense = {}));
var DataSense;
(function (DataSense) {
    let inner = {
        eventPrefix: "ev-"
    };
    class EventObservable {
        constructor(firer) {
            let disposable = new DataSense.DisposableArray();
            if ((firer instanceof EventObservable) && firer._instance) {
                this._instance = Object.assign({}, firer._instance, { pushDisposable(...items) {
                        return disposable.pushDisposable(...items);
                    },
                    dispose() {
                        disposable.dispose();
                    } });
                return;
            }
            let store = {};
            let furtherHandlers = [];
            let remove = (key, obj) => {
                if (key === null) {
                    if (obj)
                        return DataSense.Collection.remove(furtherHandlers, obj);
                    let count2 = furtherHandlers.length;
                    furtherHandlers = [];
                    return count2;
                }
                if (typeof key !== "string" || !key)
                    return 0;
                key = inner.eventPrefix + key;
                if (obj)
                    return DataSense.Collection.remove(store[key], obj);
                if (!store[key])
                    return 0;
                let count = store[key].length;
                store[key] = [];
                return count;
            };
            let process = (key, obj, ev, message, further) => {
                if (obj.isInvalid)
                    return;
                let isInvalid = false;
                if (obj.options.invalid) {
                    if (obj.options.invalid === true) {
                        isInvalid = true;
                    }
                    else if (typeof obj.options.invalid === "number") {
                        if (obj.options.invalid <= obj.count)
                            isInvalid = true;
                    }
                    else if (typeof obj.options.invalid === "function") {
                        isInvalid = obj.options.invalid(ev);
                    }
                }
                if (isInvalid) {
                    obj.isInvalid = true;
                    setTimeout(() => {
                        remove(!further ? key : null, obj);
                    }, 0);
                    if (!obj.options.invalidForNextTime)
                        return;
                }
                if (obj.count < Number.MAX_SAFE_INTEGER)
                    obj.count++;
                let fireObj = typeof message === "string" ? { message } : (message || {});
                DataSense.delay(() => {
                    obj.h.forEach(h => {
                        if (typeof h !== "function")
                            return;
                        h.call(obj.thisArg, ev, {
                            get key() {
                                return key;
                            },
                            get count() {
                                return obj.count;
                            },
                            get fireDate() {
                                return obj.latestFireDate;
                            },
                            get registerDate() {
                                return obj.time;
                            },
                            get arg() {
                                return obj.options.arg;
                            },
                            get message() {
                                return fireObj.message;
                            },
                            get source() {
                                return fireObj.source;
                            },
                            get additional() {
                                return fireObj.data;
                            },
                            dispose() {
                                remove(key, obj);
                            }
                        });
                    });
                }, obj.options.delay);
            };
            this._instance = {
                push(key, obj) {
                    if (!obj)
                        return 0;
                    if (key === null)
                        return furtherHandlers.push(obj);
                    if (typeof key !== "string" || !key)
                        return 0;
                    key = inner.eventPrefix + key;
                    if (!store[key])
                        store[key] = [];
                    return store[key].push(obj);
                },
                remove(key, obj) {
                    return remove(key, obj);
                },
                fire(key, ev, message, obj) {
                    if (typeof key !== "string" || !key)
                        return;
                    key = inner.eventPrefix + key;
                    if (!store[key])
                        return;
                    if (obj) {
                        if (store[key].indexOf(obj) < 0) {
                            if (furtherHandlers.indexOf(obj) < 0)
                                return;
                            obj.latestFireDate = new Date();
                            process(key, obj, ev, message, true);
                            return;
                        }
                        obj.latestFireDate = new Date();
                        process(key, obj, ev, message, false);
                    }
                    else {
                        store[key].forEach(item => {
                            item.latestFireDate = new Date();
                            process(key, item, ev, message, false);
                        });
                        furtherHandlers.forEach(item => {
                            item.latestFireDate = new Date();
                            process(key, item, ev, message, true);
                        });
                    }
                },
                pushDisposable(...items) {
                    return disposable.pushDisposable(...items);
                },
                dispose() {
                    store = {};
                    disposable.dispose();
                }
            };
            if (typeof firer !== "function")
                return;
            firer((key, ev, message) => {
                this._instance.fire(key, ev, message);
            });
        }
        pushDisposable(...items) {
            return this._instance.pushDisposable(...items);
        }
        on(key, h, thisArg, options, disposableArray) {
            if (!h)
                h = [];
            if (!(h instanceof Array))
                h = [h];
            if (!key || typeof key !== "string" || !h || !h.length) {
                let now = new Date();
                return {
                    get key() {
                        return key;
                    },
                    get count() {
                        return 0;
                    },
                    get registerDate() {
                        return now;
                    },
                    fire(ev, message) { },
                    dispose() { }
                };
            }
            if (!options)
                options = {};
            let obj = { h, thisArg, options, time: new Date(), count: 0 };
            this._instance.push(key, obj);
            let result = {
                get key() {
                    return key;
                },
                get count() {
                    return obj.count;
                },
                get registerDate() {
                    return obj.time;
                },
                fire(ev, message) {
                    this._instance.fire(key, ev, obj, message);
                },
                dispose() {
                    this._instance.remove(key, obj);
                }
            };
            this._instance.pushDisposable(result);
            if (disposableArray)
                disposableArray.pushDisposable(result);
            return result;
        }
        once(key, h, thisArg) {
            return this.on(key, h, thisArg, { invalid: 1 });
        }
        onAny(h, thisArg, options, disposableArray) {
            if (!h)
                h = [];
            if (!(h instanceof Array))
                h = [h];
            if (!options)
                options = {};
            let obj = { h, thisArg, options, time: new Date(), count: 0 };
            this._instance.push(null, obj);
            let result = {
                get count() {
                    return obj.count;
                },
                get registerDate() {
                    return obj.time;
                },
                fire(key, ev, message) {
                    this._instance.fire(key, ev, obj, message);
                },
                dispose() {
                    this._instance.remove(null, obj);
                }
            };
            this._instance.pushDisposable(result);
            if (disposableArray)
                disposableArray.pushDisposable(result);
            return result;
        }
        clearOn(key) {
            this._instance.remove(key);
        }
        createSingleObservable(key) {
            return new SingleEventObservable(this, key);
        }
        subscribeAny(h, thisArg) {
            let result;
            if (typeof h !== "function") {
                result = function () { };
                result.dispose = function () { };
                return result;
            }
            let dispose = this.onAny(ev => {
                h.call(thisArg, ev);
            });
            this._instance.pushDisposable(dispose);
            result = function () {
                dispose.dispose();
            };
            result.dispose = dispose.dispose;
            return result;
        }
        subscribeSingle(key, h, thisArg, convertor) {
            let result;
            if (typeof h !== "function") {
                result = function () { };
                result.dispose = function () { };
                return result;
            }
            let dispose = this.on(key, ev => {
                if (typeof convertor === "function")
                    ev = convertor(ev);
                h.call(thisArg, ev);
            });
            this._instance.pushDisposable(dispose);
            result = function () {
                dispose.dispose();
            };
            result.dispose = dispose.dispose;
            return result;
        }
        createObservable() {
            return new EventObservable(this);
        }
        dispose() {
            this._instance.dispose();
        }
        static createFailedOnResult(key) {
            return {
                get key() {
                    return key;
                },
                get count() {
                    return 0;
                },
                get registerDate() {
                    return undefined;
                },
                fire(ev, message) { },
                dispose() { }
            };
        }
        static createNothingSubscribe() {
            let result = function () { };
            result.dispose = function () { };
            return result;
        }
    }
    DataSense.EventObservable = EventObservable;
    class SingleEventObservable {
        constructor(eventObservable, key) {
            this.key = key;
            this._disposable = new DataSense.DisposableArray();
            this._eventObservable = eventObservable && eventObservable instanceof EventObservable ? eventObservable : new EventObservable(null);
        }
        pushDisposable(...items) {
            return this._disposable.pushDisposable(...items);
        }
        on(h, thisArg, options, disposableArray) {
            let result = this._eventObservable.on(this.key, h, thisArg, options, disposableArray);
            this._disposable.push(result);
            return result;
        }
        once(h, thisArg) {
            let result = this._eventObservable.once(this.key, h, thisArg);
            this._disposable.push(result);
            return result;
        }
        subscribe(h, thisArg) {
            let result = this._eventObservable.subscribeSingle(this.key, h, thisArg);
            this._disposable.push(result);
            return result;
        }
        createObservable() {
            return new SingleEventObservable(this._eventObservable, this.key);
        }
        dispose() {
            this._disposable.dispose();
        }
    }
    DataSense.SingleEventObservable = SingleEventObservable;
    class EventController extends EventObservable {
        constructor() {
            let f;
            super(fire => {
                f = fire;
            });
            this._fireHandler = f;
        }
        fire(key, ev, message, delay) {
            DataSense.delay(() => {
                this._fireHandler(key, ev, message);
            }, delay);
        }
    }
    DataSense.EventController = EventController;
    class OnceObservable {
        constructor(executor) {
            this._result = {};
            if (executor instanceof OnceObservable) {
                this._result = Object.assign({}, executor._result);
                return;
            }
            if (typeof executor !== "function")
                return;
            let resolveH, rejectH;
            this.promise = new Promise((resolve, reject) => {
                resolveH = resolve;
                rejectH = reject;
            });
            let process = (success, value) => {
                if (this._result.success !== undefined)
                    return;
                let list;
                if (success) {
                    this._result.value = value;
                    this._result.success = true;
                    list = this._result.resolved;
                }
                else {
                    this._result.value = value;
                    this._result.success = false;
                    list = this._result.rejected;
                }
                delete this._result.resolved;
                delete this._result.rejected;
                if (!list)
                    return;
                list.forEach(item => {
                    if (item.delay === false)
                        item.h.call(value);
                    else
                        setTimeout(() => {
                            item.h.call(value);
                        }, item.delay === true ? 0 : item.delay);
                });
            };
            executor(value => {
                process(true, value);
                if (typeof resolveH === "function")
                    resolveH(value);
            }, err => {
                process(false, err);
                if (typeof rejectH === "function")
                    rejectH(err);
            });
        }
        isPending() {
            return this._result.success === undefined;
        }
        isSuccess() {
            return this._result.success === true;
        }
        isFailed() {
            return this._result.success === false;
        }
        onResolved(h, thisArg, delay) {
            if (this._result.success === true) {
                h.call(thisArg, this._result.value);
                return;
            }
            if (this._result.success === false)
                return;
            if (!this._result.resolved)
                this._result.resolved = [];
            this._result.resolved.push({ h, delay, thisArg });
        }
        onResolvedLater(h, thisArg, delay) {
            setTimeout(() => {
                this.onResolved(h, thisArg, delay);
            });
        }
        onRejected(h, thisArg, delay) {
            if (this._result.success === false) {
                h.call(thisArg, this._result.value);
                return;
            }
            if (this._result.success === true)
                return;
            if (!this._result.rejected)
                this._result.rejected = [];
            this._result.rejected.push({ h, delay, thisArg });
        }
        onRejectedLater(h, thisArg, delay) {
            setTimeout(() => {
                this.onRejected(h, thisArg, delay);
            });
        }
        then(onfulfilled, onrejected) {
            return this.promise.then(onfulfilled, onrejected);
        }
        createObservable() {
            return new OnceObservable(this);
        }
    }
    DataSense.OnceObservable = OnceObservable;
    class OnceController extends OnceObservable {
        constructor() {
            let a;
            super((resolve, reject) => {
                a = {
                    resolve: resolve,
                    reject: reject
                };
            });
            this._instance = a;
        }
        resolve(value) {
            this._instance.resolve(value);
        }
        reject(err) {
            this._instance.reject(err);
        }
    }
    DataSense.OnceController = OnceController;
    class ChangingInfo {
        constructor(key, currentValue, valueRequest, observable, action) {
            this.key = key;
            this.currentValue = currentValue;
            this.valueRequest = valueRequest;
            this.observable = observable;
            this.action = action;
            if (!action)
                this.action = "update";
        }
    }
    DataSense.ChangingInfo = ChangingInfo;
    class ChangedInfo {
        constructor(key, action, success, value, oldValue, valueRequest, error) {
            this.key = key;
            this.action = action;
            this.success = success;
            this.value = value;
            this.oldValue = oldValue;
            this.valueRequest = valueRequest;
            this.error = error;
        }
        static success(key, value, oldValue, action, valueRequest, error) {
            if (!action) {
                if (key) {
                    if (value === oldValue)
                        action = "none";
                    else if (value === undefined)
                        action = "add";
                    else if (oldValue === undefined)
                        action = "remove";
                    else
                        action = "update";
                }
                else {
                    action = value === oldValue ? "none" : "update";
                }
            }
            else if (action === true) {
                action = value === oldValue ? "none" : "update";
            }
            return new ChangedInfo(key, action, true, value, oldValue, arguments.length > 4 ? valueRequest : value, error);
        }
        static fail(key, value, valueRequest, error) {
            return new ChangedInfo(key, "none", false, value, value, valueRequest, error);
        }
        static push(list, ...items) {
            if (!list)
                return;
            let index = -1;
            items.forEach(item => {
                if (!item || !item.key)
                    return;
                list.some((test, i) => {
                    if (test.key !== item.key)
                        return false;
                    index = i;
                    return true;
                });
                if (index >= 0)
                    list[index] = item;
                else
                    list.push(item);
            });
        }
    }
    DataSense.ChangedInfo = ChangedInfo;
})(DataSense || (DataSense = {}));
