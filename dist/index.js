var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var DataSense;
(function (DataSense) {
    var Access;
    (function (Access) {
        function isExpired(cacheOptions, updateTime) {
            if (!cacheOptions || !cacheOptions.expiresIn)
                return false;
            var now = new Date();
            if (cacheOptions.expiresIn instanceof Date)
                return now > cacheOptions.expiresIn;
            if (!updateTime)
                return true;
            return now.getTime() > (updateTime.getTime() + cacheOptions.expiresIn);
        }
        function convertToDetails(key, prop) {
            return {
                hasValue: prop.hasOwnProperty("value"),
                key: key,
                value: prop.value,
                store: __assign({}, prop.store),
                cacheOptions: prop.caching,
                updateTime: prop.updated,
                requestHandlerTypes: Object.keys(prop.factory),
                flowCount: prop.flows.length,
            };
        }
        function setPromise(setter, value, compatible, message) {
            if (value === undefined)
                return Promise.reject("value is undefined");
            if (typeof value.then !== "function") {
                if (!compatible)
                    return Promise.reject("value is not a Promise object");
                setter(value);
                return Promise.resolve(value);
            }
            return value.then(function (r) {
                setter(r, message);
                return r;
            });
        }
        Access.setPromise = setPromise;
        function setSubscribe(setter, value, message, callbackfn, thisArg) {
            var needCallback = typeof callbackfn === "function";
            return value.subscribe(function (newValue) {
                var result = setter(newValue, message);
                if (!needCallback)
                    return;
                var fireObj = typeof message === "string" ? { message: message } : (message || {});
                callbackfn.call(thisArg, result, fireObj);
            });
        }
        Access.setSubscribe = setSubscribe;
        function propsAccessor() {
            var store = {};
            var eventManager = new DataSense.EventController();
            var hasProp = function (key) {
                return store.hasOwnProperty(key) && store[key].hasOwnProperty("value");
            };
            var getProp = function (key, ensure, ignoreExpiration) {
                if (!key || typeof key !== "string")
                    return undefined;
                var obj = store[key];
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
                else if (!ignoreExpiration) {
                    var cacheOptions = obj.caching;
                    if (cacheOptions) {
                        if (isExpired(cacheOptions, obj.updated)) {
                            delete obj.value;
                        }
                        else if (typeof cacheOptions.handler === "function") {
                            var expiration = void 0;
                            if (cacheOptions.expiresIn instanceof Date)
                                expiration = cacheOptions.expiresIn;
                            else if (typeof cacheOptions.expiresIn === "number")
                                expiration = new Date(new Date().getTime() + cacheOptions.expiresIn);
                            else
                                expiration = undefined;
                            if (cacheOptions.handler({
                                value: obj.value,
                                formatRev: cacheOptions.formatRev,
                                tag: cacheOptions.tag,
                                expiration: expiration,
                                updated: obj.updated,
                            })) {
                                delete obj.value;
                            }
                        }
                    }
                }
                return obj;
            };
            var formatter;
            var validator;
            var actionRequests = {};
            var undefinedProps = [];
            var notifyUndefinedProp = function (prop, key) {
                if (prop.hasOwnProperty("value") || undefinedProps.indexOf(key) >= 0)
                    return;
                undefinedProps.push(key);
                if (undefinedProps.length > 50)
                    undefinedProps = undefinedProps.slice(1);
                eventManager.fire("prop-empty", { key: key });
            };
            var setProp = function (key, value, message, init, getResp) {
                var prop = getProp(key, true);
                if (!prop)
                    return getResp ? new DataSense.ChangedInfo(null, "invalid", false, undefined, undefined, value, "key is not valid") : undefined;
                if (init && prop.hasOwnProperty("value"))
                    return getResp ? DataSense.ChangedInfo.fail(key, prop.value, value, "ignore") : undefined;
                if (prop.updating) {
                    if (!prop.updating.custom && prop.updating.value === value)
                        return getResp ? DataSense.ChangedInfo.fail(key, prop.value, value, "duplicated") : undefined;
                    prop.updating.cancel("duplicated");
                }
                var onceC = new DataSense.OnceController();
                var setToken = prop.updating = {
                    value: value,
                    cancel: function (err) {
                        onceC.reject(err);
                    }
                };
                var propExist = hasProp(key);
                var oldValue = prop.value;
                eventManager.fire("ing-" + key, new DataSense.ChangingInfo(key, oldValue, value, onceC.createObservable()), message);
                eventManager.fire("prop-changing", new DataSense.ChangingInfo(key, oldValue, value, onceC.createObservable()), message);
                var flowTokens = prop.flows.map(function (item) {
                    if (typeof item !== "function")
                        return undefined;
                    return item(value, message);
                });
                var valueRequested = value;
                if (typeof formatter === "function")
                    value = formatter(key, value);
                if (typeof validator === "function" && !validator(key, value)) {
                    if (setToken !== prop.updating) {
                        onceC.reject("expired");
                        return getResp ? DataSense.ChangedInfo.fail(key, prop.value, value, "expired") : undefined;
                    }
                    var errorInfo = DataSense.ChangedInfo.fail(key, oldValue, value, "invalid");
                    onceC.reject("invalid");
                    eventManager.fire("err-" + key, errorInfo, message);
                    eventManager.fire("prop-failed", errorInfo, message);
                    flowTokens.forEach(function (item) {
                        if (!item || typeof item.reject !== "function")
                            return;
                        item.reject("invalid");
                    });
                    return errorInfo;
                }
                if (setToken !== prop.updating) {
                    onceC.reject("expired");
                    return getResp ? DataSense.ChangedInfo.fail(key, prop.value, value, "expired") : undefined;
                }
                prop.updating = null;
                prop.updated = new Date();
                if (message && typeof message !== "string") {
                    if (typeof message.cacheOptions === "boolean" || message.cacheOptions === null) {
                        if (!message.cacheOptions)
                            prop.caching = null;
                    }
                    if (typeof message.cacheOptions !== "number" && typeof message.cacheOptions !== "string")
                        prop.caching = message.cacheOptions;
                }
                prop.value = value;
                onceC.resolve(value);
                if (oldValue === value)
                    return DataSense.ChangedInfo.success(key, value, oldValue, !propExist ? "add" : null, valueRequested);
                var info = DataSense.ChangedInfo.success(key, value, oldValue, !propExist ? "add" : null, valueRequested);
                eventManager.fire("ed-" + key, info, message);
                eventManager.fire("prop-changed", info, message);
                flowTokens.forEach(function (item) {
                    if (!item || typeof item.resolve !== "function")
                        return;
                    item.resolve(value);
                });
                return info;
            };
            var removeProp = function (keys, message) {
                if (!keys)
                    return [];
                if (typeof keys === "string")
                    keys = [keys];
                if (!(keys instanceof Array))
                    return [];
                var result = [];
                keys.forEach(function (key) {
                    var prop = getProp(key, false);
                    if (!prop)
                        return;
                    var propExist = hasProp(key);
                    if (!propExist)
                        return;
                    var oldValue = prop.value;
                    var onceC = new DataSense.OnceController();
                    var setToken = prop.updating = {
                        value: undefined,
                        cancel: function (err) {
                            onceC.reject(err);
                        }
                    };
                    eventManager.fire("ing-" + key, new DataSense.ChangingInfo(key, oldValue, undefined, onceC.createObservable()), message);
                    eventManager.fire("prop-changing", new DataSense.ChangingInfo(key, oldValue, undefined, onceC.createObservable()), message);
                    var flowTokens = prop.flows.map(function (item) {
                        if (typeof item !== "function")
                            return undefined;
                        return item(undefined, message);
                    });
                    if (setToken !== prop.updating) {
                        onceC.reject("expired");
                        return DataSense.ChangedInfo.fail(key, prop.value, undefined, "expired");
                    }
                    prop.updating = null;
                    prop.updated = new Date();
                    delete prop.caching;
                    delete prop.value;
                    var info = DataSense.ChangedInfo.success(key, undefined, oldValue);
                    result.push(info);
                    onceC.resolve(undefined);
                    if (oldValue === undefined)
                        return;
                    eventManager.fire("ed-" + key, info, message);
                    eventManager.fire("prop-changed", info, message);
                    flowTokens.forEach(function (item) {
                        if (!item || typeof item.resolve !== "function")
                            return;
                        if (typeof item.remove === "function")
                            item.remove();
                        else
                            item.resolve(undefined);
                    });
                });
                return result;
            };
            var changerClient = {
                hasProp: function (key) {
                    return hasProp(key);
                },
                getProp: function (key, options) {
                    var prop = getProp(key, false, options === null || options === void 0 ? void 0 : options.ignoreExpires);
                    notifyUndefinedProp(prop, key);
                    if (options && typeof options.callback === "function") {
                        options.callback(convertToDetails(key, prop));
                    }
                    if (options && prop.caching) {
                        var rev = prop.caching.formatRev;
                        if (typeof rev === "number") {
                            if (typeof options.minFormatRev == "number" && rev < options.minFormatRev)
                                return undefined;
                            if (typeof options.maxFormatRev == "number" && rev > options.maxFormatRev)
                                return undefined;
                        }
                        if (prop.updated && options.earliest instanceof Date && options.earliest > prop.updated)
                            return undefined;
                    }
                    return prop ? prop.value : undefined;
                },
                getPropDetails: function (key) {
                    var prop = getProp(key, false);
                    notifyUndefinedProp(prop, key);
                    return convertToDetails(key, prop);
                },
                setProp: function (key, value, message) {
                    var info = setProp(key, value, message, false, true);
                    if (info)
                        eventManager.fire("batch-changed", { changed: info }, message);
                    return info;
                },
                customizedSetProp: function (key, valueRequested, message) {
                    var prop = getProp(key, true);
                    if (!prop)
                        return {
                            isAborted: true,
                            resolve: function (finalValue) { },
                            reject: function (err) { }
                        };
                    if (prop.updating) {
                        if (prop.updating.value === valueRequested)
                            return {
                                isAborted: true,
                                resolve: function (finalValue) { },
                                reject: function (err) { }
                            };
                        prop.updating.cancel("expired");
                    }
                    var flowTokens;
                    var done = false;
                    var propExist = hasProp(key);
                    var oldValue = prop.value;
                    var obj;
                    var onceC = new DataSense.OnceController();
                    var setToken = prop.updating = {
                        value: valueRequested,
                        custom: true,
                        cancel: function (err) {
                            obj.isAborted = true;
                            onceC.reject(err);
                        }
                    };
                    eventManager.fire("ing-" + key, new DataSense.ChangingInfo(key, oldValue, valueRequested, onceC.createObservable()), message);
                    eventManager.fire("prop-changing", new DataSense.ChangingInfo(key, oldValue, valueRequested, onceC.createObservable()), message);
                    flowTokens = prop.flows.map(function (item) {
                        if (typeof item !== "function")
                            return undefined;
                        return item(valueRequested, message);
                    });
                    obj = {
                        resolve: function (finalValue) {
                            if (done)
                                return;
                            if (setToken !== prop.updating)
                                return;
                            if (arguments.length === 0)
                                finalValue = valueRequested;
                            prop.updating = null;
                            onceC.resolve(finalValue);
                            if (oldValue === finalValue)
                                return DataSense.ChangedInfo.success(key, finalValue, oldValue, !propExist ? "add" : null, valueRequested);
                            prop.updated = new Date();
                            delete prop.caching;
                            if (message && typeof message !== "string" && message.cacheOptions)
                                prop.caching = message.cacheOptions;
                            prop.value = finalValue;
                            var info = DataSense.ChangedInfo.success(key, finalValue, oldValue, !propExist ? "add" : null, valueRequested);
                            eventManager.fire("ed-" + key, info, message);
                            eventManager.fire("prop-changed", info, message);
                            flowTokens.forEach(function (item) {
                                if (!item || typeof item.resolve !== "function")
                                    return;
                                item.resolve(finalValue);
                            });
                            return info;
                        },
                        reject: function (err) {
                            if (done)
                                return;
                            if (setToken !== prop.updating)
                                return;
                            prop.updating = null;
                            obj.isAborted = true;
                            var errorInfo = DataSense.ChangedInfo.fail(key, oldValue, valueRequested, "invalid");
                            onceC.reject("invalid");
                            eventManager.fire("err-" + key, errorInfo, message);
                            eventManager.fire("prop-failed", errorInfo, message);
                            flowTokens.forEach(function (item) {
                                if (!item || typeof item.reject !== "function")
                                    return;
                                item.reject("invalid");
                            });
                        },
                        remove: function () {
                            if (done)
                                return;
                            if (setToken !== prop.updating)
                                return;
                            prop.updating = null;
                            if (!propExist)
                                return;
                            onceC.resolve(undefined);
                            if (oldValue === undefined)
                                return DataSense.ChangedInfo.success(key, undefined, oldValue, "remove", valueRequested);
                            prop.updated = new Date();
                            delete prop.caching;
                            delete prop.value;
                            var info = DataSense.ChangedInfo.success(key, undefined, oldValue, "remove", valueRequested);
                            eventManager.fire("ed-" + key, info, message);
                            eventManager.fire("prop-changed", info, message);
                            flowTokens.forEach(function (item) {
                                if (!item || typeof item.resolve !== "function")
                                    return;
                                item.resolve(undefined);
                            });
                            return info;
                        }
                    };
                    return obj;
                },
                removeProp: function (keys, message) {
                    var changed = removeProp(keys, message);
                    if (changed.length)
                        eventManager.fire("batch-changed", { changed: changed });
                    return changed.length;
                },
                batchProp: function (changeSet, message) {
                    if (!changeSet)
                        return;
                    var changed = [];
                    var pushChanged = function () {
                        var actionResult = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            actionResult[_i] = arguments[_i];
                        }
                        DataSense.ChangedInfo.push.apply(DataSense.ChangedInfo, __spreadArray([changed], actionResult, false));
                    };
                    var batchPropChanged = function (changeSet) {
                        if (changeSet)
                            for (var key in changeSet) {
                                if (!key || typeof key !== "string" || !changeSet.hasOwnProperty(key))
                                    continue;
                                var actionResult = setProp(key, changeSet[key], message);
                                pushChanged(actionResult);
                            }
                    };
                    if (!(changeSet instanceof Array)) {
                        batchPropChanged(changeSet);
                        return;
                    }
                    changeSet.forEach(function (action) {
                        if (!action || !action.action)
                            return;
                        switch (action.action) {
                            case "delete":
                                pushChanged.apply(void 0, removeProp(action.key, message));
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
                    if (changed.length)
                        eventManager.fire("batch-changed", { changed: changed });
                },
                forceUpdateProp: function (key, message) {
                    var propInfo = getProp(key, false);
                    if (!propInfo)
                        return;
                    var onceC = new DataSense.OnceController();
                    eventManager.fire("ing-" + key, new DataSense.ChangingInfo(key, propInfo.value, propInfo.value, onceC.createObservable()), message);
                    eventManager.fire("prop-changing", new DataSense.ChangingInfo(key, propInfo.value, propInfo.value, onceC.createObservable()), message);
                    onceC.resolve(propInfo.value);
                    var info = DataSense.ChangedInfo.success(key, propInfo.value, propInfo.value);
                    eventManager.fire("ed-" + key, info, message);
                    eventManager.fire("prop-changed", info, message);
                },
                getPropKeys: function () {
                    return Object.keys(store).filter(function (key) { return !!store[key] && store[key].hasOwnProperty("value"); });
                },
                getFormatter: function () {
                    return formatter;
                },
                setFormatter: function (h) {
                    formatter = h;
                },
                getValidator: function () {
                    return validator;
                },
                setValidator: function (h) {
                    validator = h;
                },
                getPropStore: function (key, storePropKey) {
                    return getProp(key, true).store[storePropKey];
                },
                setPropStore: function (key, storePropKey, value) {
                    getProp(key, true).store[storePropKey] = value;
                },
                removePropStore: function (key) {
                    var storePropKey = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        storePropKey[_i - 1] = arguments[_i];
                    }
                    var propInfo = getProp(key, false);
                    if (!propInfo)
                        return;
                    var prop = propInfo.store;
                    storePropKey.forEach(function (storePropKey) {
                        delete prop.store[storePropKey];
                    });
                },
                getPropUpdateTime: function (key) {
                    var propInfo = getProp(key, false);
                    return propInfo ? propInfo.updated : undefined;
                },
                sendPropNotify: function (key, data, message) {
                    if (!key || typeof key !== "string")
                        return;
                    eventManager.fire("ntf-" + key, data, message);
                },
                sendNotify: function (data, message) {
                    eventManager.fire("notify", data, message);
                },
                registerPropRequestHandler: function (key, type, h) {
                    var prop = getProp(key, true).factory;
                    if (!h)
                        delete prop[type];
                    else if (typeof h !== "function")
                        return false;
                    else
                        prop[type] = h;
                    return true;
                },
                registerRequestHandler: function (type, h) {
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
                pushFlows: function (key) {
                    var flows = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        flows[_i - 1] = arguments[_i];
                    }
                    var now = new Date();
                    flows = flows.filter(function (item) { return typeof item === "function"; });
                    var flowArr = getProp(key, true).flows;
                    var count = flowArr.push.apply(flowArr, flows);
                    return {
                        get registeredDate() {
                            return now;
                        },
                        get count() {
                            return count;
                        },
                        sync: function (message) {
                            flows.forEach(function (item) {
                                var currentValue = changerClient.getProp(key);
                                var token = item(currentValue, message);
                                if (token && typeof token.resolve === "function")
                                    token.resolve(currentValue);
                            });
                        },
                        dispose: function () {
                            flows.forEach(function (item) {
                                DataSense.Collection.remove(flowArr, item);
                            });
                        }
                    };
                },
                clearFlows: function (key) {
                    var prop = getProp(key, false);
                    var count = prop.flows.length;
                    prop.flows = [];
                    return count;
                },
                sendPropRequest: function (key, type, value, owner) {
                    var requestH = getProp(key, false).factory[type];
                    if (typeof requestH !== "function")
                        return;
                    requestH(owner, value);
                },
                sendRequest: function (type, value, owner) {
                    var requestH = actionRequests[type];
                    if (typeof requestH !== "function")
                        return;
                    requestH(owner, value);
                },
                sendPropBroadcast: function (key, data, message) {
                    if (!key || typeof key !== "string")
                        return;
                    eventManager.fire("cst-" + key, data, message);
                },
                sendBroadcast: function (data, message) {
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
                emptyPropRequested: eventManager.createSingleObservable("prop-empty"),
                propsChanged: eventManager.createSingleObservable("batch-changed")
            };
        }
        Access.propsAccessor = propsAccessor;
    })(Access = DataSense.Access || (DataSense.Access = {}));
})(DataSense || (DataSense = {}));
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
            var findIndex = function (predicate) {
                var resultIndex = -1;
                list.some(function (ele, eleIndex, eleArr) {
                    if (!predicate(ele, eleIndex, eleArr))
                        return false;
                    resultIndex = eleIndex;
                    return true;
                });
                return resultIndex;
            };
            if (!compare)
                return findIndex(function (ele) { return ele === item; });
            switch (typeof compare) {
                case "string":
                case "number":
                    return findIndex(function (ele) { return ele[compare] === item; });
                case "function":
                    return findIndex(function (ele) { return compare(ele, item); });
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
            var count = 0;
            while (true) {
                var index = findIndex(list, item, compare);
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
     * A container for store and manage a number of disposable object.
     * @param items  The objects to add.
     */
    var DisposableArray = /** @class */ (function () {
        function DisposableArray() {
            this._list = [];
        }
        /**
         * Adds disposable objects so that they will be disposed when this instance is disposed.
         * @param items  The objects to add.
         */
        DisposableArray.prototype.push = function () {
            var _this = this;
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            var count = 0;
            items.forEach(function (item) {
                if (!item || _this._list.indexOf(item) >= 0)
                    return;
                _this._list.push(item);
                if (typeof item.pushDisposable === "function")
                    item.pushDisposable({
                        dispose: function () {
                            DataSense.Collection.remove(this._list, item);
                        }
                    });
                count++;
            });
            return count;
        };
        /**
         * Adds disposable objects so that they will be disposed when this instance is disposed.
         * @param items  The objects to add.
         */
        DisposableArray.prototype.pushDisposable = function () {
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            return this.push.apply(this, items);
        };
        /**
         * Removes the ones added here.
         * @param items  The objects to remove.
         */
        DisposableArray.prototype.remove = function () {
            var _this = this;
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            var count = 0;
            items.forEach(function (item) {
                if (item && DataSense.Collection.remove(_this._list, item) < 1)
                    return;
                count++;
            });
            return count;
        };
        /**
         * Removes the ones added here.
         * @param items  The objects to remove.
         */
        DisposableArray.prototype.removeDisposable = function () {
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            return this.remove.apply(this, items);
        };
        /**
         * Disposes the instance.
         */
        DisposableArray.prototype.dispose = function () {
            var list = this._list;
            this._list = [];
            DisposableArray.dispose(list);
        };
        /**
         * Disposes disposable instances.
         */
        DisposableArray.dispose = function (disposable) {
            if (!disposable)
                return;
            if (!(disposable instanceof Array))
                disposable = [disposable];
            var listFailed = [];
            disposable.forEach(function (item) {
                if (!item || typeof item.dispose !== "function")
                    return;
                try {
                    item.dispose();
                }
                catch (ex) {
                    listFailed.push(item);
                }
            });
            listFailed.forEach(function (item) {
                if (!item || typeof item.dispose !== "function")
                    return;
                item.dispose();
            });
        };
        return DisposableArray;
    }());
    DataSense.DisposableArray = DisposableArray;
})(DataSense || (DataSense = {}));
var DataSense;
(function (DataSense) {
    /**
     * Event observable.
     */
    var EventObservable = /** @class */ (function () {
        /**
         * Initializes a new instance of the EventObservable class.
         * @param firer  The handler to fire.
         */
        function EventObservable(firer, mapKey) {
            var disposable = new DataSense.DisposableArray();
            var getKey = function (key) {
                if (!mapKey || !key || typeof key !== "string")
                    return key;
                if (typeof mapKey === "function")
                    return mapKey(key);
                if (typeof mapKey === "string")
                    return mapKey.replace("{0}", key).replace("{0}", key).replace("{0}", key);
                return key;
            };
            if ((firer instanceof EventObservable) && firer._instance) {
                this.hasKeyMap = !!mapKey || firer.hasKeyMap;
                this._instance = {
                    push: function (key, obj) {
                        var keyMapped = getKey(key);
                        if (keyMapped && keyMapped !== key) {
                            if (obj)
                                obj.key = key;
                            else
                                obj = { key: key };
                        }
                        return typeof firer._instance.push === "function" ? firer._instance.push(keyMapped, obj) : 0;
                    },
                    remove: function (key, obj) {
                        return typeof firer._instance.remove === "function" ? firer._instance.remove(getKey(key), obj) : 0;
                    },
                    fire: function (key, ev, message, obj) {
                        if (typeof firer._instance.fire === "function")
                            firer._instance.fire(getKey(key), ev, message, obj);
                    },
                    pushDisposable: function () {
                        var items = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            items[_i] = arguments[_i];
                        }
                        return disposable.pushDisposable.apply(disposable, items);
                    },
                    removeDisposable: function () {
                        var items = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            items[_i] = arguments[_i];
                        }
                        return disposable.removeDisposable.apply(disposable, items);
                    },
                    dispose: function () {
                        disposable.dispose();
                    }
                };
                firer.pushDisposable(this);
                return;
            }
            this.hasKeyMap = !!mapKey;
            var store = {};
            var furtherHandlers = [];
            var remove = function (key, obj) {
                if (key === null) {
                    if (obj)
                        return DataSense.Collection.remove(furtherHandlers, obj);
                    var count2 = furtherHandlers.length;
                    furtherHandlers = [];
                    return count2;
                }
                if (typeof key !== "string" || !key)
                    return 0;
                if (obj)
                    return DataSense.Collection.remove(store[key], obj);
                if (!store[key])
                    return 0;
                var count = store[key].length;
                store[key] = [];
                return count;
            };
            var process = function (key, obj, ev, message, removing, further) {
                if (obj.isInvalid)
                    return;
                var isInvalid = false;
                if (obj.invalid) {
                    if (obj.invalid === true) {
                        isInvalid = true;
                    }
                    else if (typeof obj.invalid === "number") {
                        if (obj.invalid <= obj.count)
                            isInvalid = true;
                    }
                    else if (typeof obj.invalid === "function") {
                        isInvalid = obj.invalid(ev);
                    }
                }
                if (isInvalid) {
                    obj.isInvalid = true;
                    removing.push({ key: !further ? key : null, value: obj });
                    if (!obj.invalidForNextTime)
                        return;
                }
                var latestFireDate = obj.latestFireDate;
                var currentFireDate = obj.latestFireDate = new Date();
                if (obj.count < Number.MAX_SAFE_INTEGER)
                    obj.count++;
                var fireObj = typeof message === "string" ? { message: message } : (message || {});
                var working = true;
                obj.task.process({
                    ev: ev,
                    c: {
                        get key() {
                            return obj.key || key;
                        },
                        get originalKey() {
                            return key;
                        },
                        get count() {
                            return obj.count;
                        },
                        get fireDate() {
                            return currentFireDate;
                        },
                        get latestFireDate() {
                            return latestFireDate;
                        },
                        get lastFireDate() {
                            return obj.latestFireDate;
                        },
                        get registerDate() {
                            return obj.time;
                        },
                        get arg() {
                            return obj.arg;
                        },
                        get message() {
                            return fireObj.message;
                        },
                        get source() {
                            return fireObj.source;
                        },
                        get addition() {
                            return fireObj.addition;
                        },
                        hasStoreData: function (propKey) {
                            return obj.store.hasOwnProperty(propKey);
                        },
                        getStoreData: function (propKey) {
                            return obj.store[propKey];
                        },
                        setStoreData: function (propKey, propValue) {
                            obj.store[propKey] = propValue;
                        },
                        removeStoreData: function () {
                            var propKey = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                propKey[_i] = arguments[_i];
                            }
                            var deltaCount = 0;
                            propKey.forEach(function (propKeyItem) {
                                if (!propKeyItem || typeof propKeyItem !== "string")
                                    return;
                                deltaCount++;
                                delete obj.store[propKeyItem];
                            });
                            return deltaCount;
                        },
                        dispose: function () {
                            if (working)
                                removing.push({ key: !further ? key : null, value: obj });
                            else
                                remove(key, obj);
                        }
                    }
                });
                working = false;
            };
            this._instance = {
                push: function (key, obj) {
                    if (!obj)
                        return 0;
                    if (key === null)
                        return furtherHandlers.push(obj);
                    if (typeof key !== "string" || !key)
                        return 0;
                    if (!store[key])
                        store[key] = [];
                    return store[key].push(obj);
                },
                remove: function (key, obj) {
                    return remove(key, obj);
                },
                fire: function (key, ev, message, obj) {
                    if (typeof key !== "string" || !key)
                        return;
                    if (!store[key])
                        return;
                    var removing = [];
                    var removingToken = setTimeout(function () {
                        removing.forEach(function (removingItem) {
                            remove(removingItem.key, removingItem.value);
                        });
                    }, 0);
                    var removingH = function () {
                        clearTimeout(removingToken);
                        removing.forEach(function (removingItem) {
                            remove(removingItem.key, removingItem.value);
                        });
                    };
                    if (obj) {
                        if (store[key].indexOf(obj) < 0) {
                            if (furtherHandlers.indexOf(obj) < 0) {
                                clearTimeout(removingToken);
                                return;
                            }
                            process(key, obj, ev, message, removing, true);
                            removingH();
                            return;
                        }
                        process(key, obj, ev, message, removing, false);
                    }
                    else {
                        store[key].forEach(function (item) {
                            process(key, item, ev, message, removing, false);
                        });
                        furtherHandlers.forEach(function (item) {
                            process(key, item, ev, message, removing, true);
                        });
                    }
                    removingH();
                },
                pushDisposable: function () {
                    var items = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        items[_i] = arguments[_i];
                    }
                    return disposable.pushDisposable.apply(disposable, items);
                },
                removeDisposable: function () {
                    var items = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        items[_i] = arguments[_i];
                    }
                    return disposable.removeDisposable.apply(disposable, items);
                },
                dispose: function () {
                    store = {};
                    disposable.dispose();
                }
            };
            if (typeof firer !== "function")
                return;
            var implInstance = this._instance;
            firer(function (key, ev, message) {
                implInstance.fire(key, ev, message);
            }, function (h, thisArg, options) {
                if (!h)
                    h = [];
                if (!(h instanceof Array))
                    h = [h];
                if (!options)
                    options = {};
                var task = new DataSense.HitTask();
                task.setOptions({
                    delay: options.delay,
                    mergeMode: options.mergeMode,
                    span: options.span,
                    minCount: options.minCount,
                    maxCount: options.maxCount
                });
                task.pushHandler(function (ev) {
                    h.forEach(function (handler) {
                        if (typeof handler === "function")
                            handler(ev.ev, ev.c);
                    });
                });
                var obj = {
                    task: task,
                    arg: options.arg,
                    thisArg: thisArg,
                    invalid: options.invalid,
                    invalidForNextTime: options.invalidForNextTime,
                    time: new Date(),
                    store: {},
                    count: 0
                };
                implInstance.push(null, obj);
                var disposableResult = {};
                var result = {
                    get count() {
                        return obj.count;
                    },
                    get registerDate() {
                        return obj.time;
                    },
                    fire: function (key, ev, message) {
                        implInstance.fire(key, ev, message);
                    },
                    dispose: function () {
                        implInstance.remove(null, obj);
                        implInstance.removeDisposable(disposableResult);
                        disposableResult.dispose = function () { };
                        disposableResult.isDisposed = true;
                    }
                };
                disposableResult.dispose = function () {
                    result.dispose();
                };
                implInstance.pushDisposable(disposableResult);
                return result;
            });
        }
        /**
         * Adds disposable objects so that they will be disposed when this instance is disposed.
         * @param items  The objects to add.
         */
        EventObservable.prototype.pushDisposable = function () {
            var _a;
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            return (_a = this._instance).pushDisposable.apply(_a, items);
        };
        /**
         * Removes the ones added here.
         * @param items  The objects to remove.
         */
        EventObservable.prototype.removeDisposable = function () {
            var _a;
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            return (_a = this._instance).removeDisposable.apply(_a, items);
        };
        /**
         * Registers an event listener.
         * @param key  The event key.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        EventObservable.prototype.on = function (key, h, thisArg, options, disposableArray) {
            if (!h)
                h = [];
            if (!(h instanceof Array))
                h = [h];
            var disposableList = new DataSense.DisposableArray();
            if (!key || typeof key !== "string" || !h || !h.length) {
                var now_1 = new Date();
                return {
                    get key() {
                        return key;
                    },
                    get count() {
                        return 0;
                    },
                    get registerDate() {
                        return now_1;
                    },
                    get state() {
                        return "failure";
                    },
                    fire: function (ev, message) { },
                    pushDisposable: function () {
                        var items = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            items[_i] = arguments[_i];
                        }
                        return disposableList.push.apply(disposableList, items);
                    },
                    removeDisposable: function () {
                        var items = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            items[_i] = arguments[_i];
                        }
                        return disposableList.remove.apply(disposableList, items);
                    },
                    dispose: function () {
                        disposableList.dispose();
                    }
                };
            }
            if (!options)
                options = {};
            var task = new DataSense.HitTask();
            task.setOptions({
                delay: options.delay,
                mergeMode: options.mergeMode,
                span: options.span,
                minCount: options.minCount,
                maxCount: options.maxCount
            });
            task.pushHandler(function (ev) {
                h.forEach(function (handler) {
                    if (typeof handler === "function")
                        handler(ev.ev, ev.c);
                });
            });
            var obj = {
                task: task,
                arg: options.arg,
                thisArg: thisArg,
                invalid: options.invalid,
                invalidForNextTime: options.invalidForNextTime,
                time: new Date(),
                store: {},
                count: 0
            };
            var implInstance = this._instance;
            implInstance.push(key, obj);
            var disposableResult = {};
            var state = "success";
            var result = {
                get key() {
                    return key;
                },
                get count() {
                    return obj.count;
                },
                get registerDate() {
                    return obj.time;
                },
                get state() {
                    return state;
                },
                fire: function (ev, message) {
                    implInstance.fire(key, ev, message);
                },
                pushDisposable: function () {
                    var items = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        items[_i] = arguments[_i];
                    }
                    return disposableList.push.apply(disposableList, items);
                },
                removeDisposable: function () {
                    var items = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        items[_i] = arguments[_i];
                    }
                    return disposableList.remove.apply(disposableList, items);
                },
                dispose: function () {
                    implInstance.remove(key, obj);
                    implInstance.removeDisposable(disposableResult);
                    disposableList.dispose();
                    state = "disposed";
                    disposableResult.dispose = function () { };
                    disposableResult.isDisposed = true;
                    if (disposableArray)
                        disposableArray.removeDisposable(disposableResult);
                }
            };
            disposableResult.dispose = function () {
                result.dispose();
            };
            implInstance.pushDisposable(disposableResult);
            if (disposableArray)
                disposableArray.pushDisposable(disposableResult);
            return result;
        };
        /**
         * Registers an event listener that will be raised once at most.
         * @param key  The event key.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         */
        EventObservable.prototype.once = function (key, h, thisArg) {
            return this.on(key, h, thisArg, { invalid: 1 });
        };
        /**
         * Clears all the specific event listeners
         * @param key  The event key.
         */
        EventObservable.prototype.clearOn = function (key) {
            this._instance.remove(key);
        };
        /**
         * Creates a single event observable.
         * @param key  The event key.
         */
        EventObservable.prototype.createSingleObservable = function (key) {
            return new SingleEventObservable(this, key);
        };
        EventObservable.prototype.subscribeSingle = function (key, h, thisArg, convertor) {
            var result;
            if (typeof h !== "function") {
                result = function () { };
                result.dispose = function () { };
                return result;
            }
            var dispose = this.on(key, function (ev) {
                if (typeof convertor === "function")
                    ev = convertor(ev);
                h.call(thisArg, ev);
            });
            result = function () {
                dispose.dispose();
            };
            result.dispose = dispose.dispose;
            return result;
        };
        /**
         * Creates an observable instance so that any event listeners and subscribers will be disposed automatically when that instance is disposed.
         */
        EventObservable.prototype.createObservable = function () {
            return new EventObservable(this);
        };
        /**
         * Creates an observable instance so that any event listeners and subscribers will be disposed automatically when that instance is disposed.
         * @param mapKey  A string or a function to map keys.
         */
        EventObservable.prototype.createMappedObservable = function (mapKey) {
            return new EventObservable(this, mapKey);
        };
        /**
         * Disposes the instance.
         */
        EventObservable.prototype.dispose = function () {
            this._instance.dispose();
        };
        EventObservable.createFailedOnResult = function (key) {
            var disposableList = new DataSense.DisposableArray();
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
                get state() {
                    return "failure";
                },
                fire: function (ev, message) { },
                pushDisposable: function () {
                    var items = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        items[_i] = arguments[_i];
                    }
                    return disposableList.push.apply(disposableList, items);
                },
                removeDisposable: function () {
                    var items = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        items[_i] = arguments[_i];
                    }
                    return disposableList.remove.apply(disposableList, items);
                },
                dispose: function () {
                    disposableList.dispose();
                }
            };
        };
        /**
         * Creates an empty subscribe result.
         */
        EventObservable.createNothingSubscribe = function () {
            var result = function () { };
            result.dispose = function () { };
            return result;
        };
        /**
         * Creates a single event observable for a specific element.
         */
        EventObservable.createForElement = function (dom, eventType) {
            var event = new EventController();
            var listener = function (ev) {
                event.fire(eventType, ev);
            };
            dom.addEventListener(eventType, listener);
            var obs = event.createSingleObservable(eventType);
            obs.pushDisposable({
                dispose: function () {
                    dom.removeEventListener(eventType, listener);
                }
            });
            return obs;
        };
        return EventObservable;
    }());
    DataSense.EventObservable = EventObservable;
    /**
     * The observable to focus on a single event.
     */
    var SingleEventObservable = /** @class */ (function () {
        /**
         * Initializes a new instance of the SingleEventObservable class.
         * @param eventObservable  The event observable.
         * @param key  The event key.
         */
        function SingleEventObservable(eventObservable, key) {
            this.key = key;
            this._disposable = new DataSense.DisposableArray();
            this._eventObservable = eventObservable && eventObservable instanceof EventObservable ? eventObservable : new EventObservable(null);
            eventObservable.pushDisposable(this);
        }
        /**
         * Adds disposable objects so that they will be disposed when this instance is disposed.
         * @param items  The objects to add.
         */
        SingleEventObservable.prototype.pushDisposable = function () {
            var _a;
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            return (_a = this._disposable).pushDisposable.apply(_a, items);
        };
        /**
         * Removes the ones added here.
         * @param items  The objects to remove.
         */
        SingleEventObservable.prototype.removeDisposable = function () {
            var _a;
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            return (_a = this._disposable).removeDisposable.apply(_a, items);
        };
        /**
         * Adds event listener.
         * @param h  The handler.
         * @param thisArg  this argument for calling handler.
         * @param options  The options to control how the handler processes.
         * @param disposabelArray  The disposable array used to push the listener result.
         */
        SingleEventObservable.prototype.on = function (h, thisArg, options, disposableArray) {
            var result = this._eventObservable.on(this.key, h, thisArg, options, disposableArray);
            this._disposable.push(result);
            return result;
        };
        /**
         * Adds event listener for one time raised.
         * @param h  The handler.
         * @param thisArg  this argument for calling handler.
         */
        SingleEventObservable.prototype.once = function (h, thisArg) {
            var result = this._eventObservable.once(this.key, h, thisArg);
            this._disposable.push(result);
            return result;
        };
        /**
         * Subscribes event raised.
         * @param h  The callback.
         * @param thisArg  this argument for calling handler.
         */
        SingleEventObservable.prototype.subscribe = function (h, thisArg) {
            var result = this._eventObservable.subscribeSingle(this.key, h, thisArg);
            this._disposable.push(result);
            return result;
        };
        /**
         * Subscribes event raised.
         * @param h  The callback.
         * @param thisArg  this argument for calling handler.
         * @param convertor  A function to convert the event argument to the target data.
         */
        SingleEventObservable.prototype.subscribeWithConvertor = function (h, thisArg, convertor) {
            var result = this._eventObservable.subscribeSingle(this.key, h, thisArg, convertor);
            this._disposable.push(result);
            return result;
        };
        /**
         * Creates an observable instance.
         */
        SingleEventObservable.prototype.createObservable = function () {
            return new SingleEventObservable(this._eventObservable, this.key);
        };
        /**
         * Disposes the instance.
         */
        SingleEventObservable.prototype.dispose = function () {
            this._disposable.dispose();
        };
        return SingleEventObservable;
    }());
    DataSense.SingleEventObservable = SingleEventObservable;
    /**
     * Event observable and controller.
     */
    var EventController = /** @class */ (function (_super) {
        __extends(EventController, _super);
        /**
         * Initializes a new instance of the EventController class.
         */
        function EventController() {
            var _this = this;
            var f;
            var o;
            _this = _super.call(this, function (fire, onAny) {
                f = fire;
                o = onAny;
            }) || this;
            _this._fireHandler = f;
            _this._onAny = o;
            return _this;
        }
        /**
         * Raises a specific event wth arugment.
         * @param key  The event key.
         * @param ev  The event argument.
         * @param message  The additional information which will pass to the event listener handler.
         * @param delay  A span in millisecond to delay to raise.
         */
        EventController.prototype.fire = function (key, ev, message, delay) {
            var _this = this;
            DataSense.delay(function () {
                _this._fireHandler(key, ev, message);
            }, delay);
        };
        EventController.prototype.onAny = function (h, thisArg, options, disposableArray) {
            var onResult = this._onAny(h, thisArg, options);
            if (disposableArray && typeof disposableArray.pushDisposable === "function")
                disposableArray.pushDisposable(onResult);
            return onResult;
        };
        EventController.prototype.subscribeAny = function (h, thisArg) {
            var result;
            if (typeof h !== "function") {
                result = function () { };
                result.dispose = function () { };
                return result;
            }
            var dispose = this.onAny(function (ev) {
                h.call(thisArg, ev);
            });
            result = function () {
                dispose.dispose();
            };
            result.dispose = dispose.dispose;
            return result;
        };
        return EventController;
    }(EventObservable));
    DataSense.EventController = EventController;
    /**
     * The observable for resolving data.
     */
    var OnceObservable = /** @class */ (function () {
        /**
         * Initializes a new instance of the OnceObservable class.
         * @param executor  An executor to call resolve or reject.
         */
        function OnceObservable(executor) {
            var _this = this;
            this._result = {};
            if (executor instanceof OnceObservable) {
                this._result = executor._result;
                return;
            }
            if (typeof executor !== "function")
                return;
            var process = function (success, value) {
                if (_this._result.success !== undefined)
                    return;
                var list;
                if (success) {
                    _this._result.value = value;
                    _this._result.success = true;
                    list = _this._result.resolved;
                }
                else {
                    _this._result.value = value;
                    _this._result.success = false;
                    list = _this._result.rejected;
                }
                delete _this._result.resolved;
                delete _this._result.rejected;
                if (!list)
                    return;
                list.forEach(function (item) {
                    DataSense.delay(function () {
                        item.h.call(item.thisArg, value);
                    }, item.delay);
                });
            };
            executor(function (value) {
                process(true, value);
            }, function (err) {
                process(false, err);
            });
        }
        Object.defineProperty(OnceObservable.prototype, "isPending", {
            /**
             * Gets a value indicating whether it is pending.
             */
            get: function () {
                return this._result.success === undefined;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(OnceObservable.prototype, "isSuccessful", {
            /**
             * Gets a value indicating whether it is successful.
             */
            get: function () {
                return this._result.success === true;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(OnceObservable.prototype, "isFailed", {
            /**
             * Gets a value indicating whether it is failed.
             */
            get: function () {
                return this._result.success === false;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Added a callback when the result is resolved.
         * @param h  The callback.
         * @param thisArg  this arg.
         * @param delay  A span in millisecond to delay to process.
         */
        OnceObservable.prototype.onResolved = function (h, thisArg, delay) {
            if (this._result.success === true) {
                h.call(thisArg, this._result.value);
                return;
            }
            if (this._result.success === false)
                return;
            if (!this._result.resolved)
                this._result.resolved = [];
            this._result.resolved.push({ h: h, delay: delay, thisArg: thisArg });
        };
        /**
         * Added a callback after a while. The callback will be called when the result is resolved.
         * @param h  The callback.
         * @param thisArg  this arg.
         * @param delay  A span in millisecond to delay to process.
         */
        OnceObservable.prototype.onResolvedLater = function (h, thisArg, delay) {
            var _this = this;
            DataSense.delay(function () {
                _this.onResolved(h, thisArg, delay);
            }, true);
        };
        /**
         * Added a callback when the result is rejected.
         * @param h  The callback.
         * @param thisArg  this arg.
         * @param delay  A span in millisecond to delay to process.
         */
        OnceObservable.prototype.onRejected = function (h, thisArg, delay) {
            if (this._result.success === false) {
                h.call(thisArg, this._result.value);
                return;
            }
            if (this._result.success === true)
                return;
            if (!this._result.rejected)
                this._result.rejected = [];
            this._result.rejected.push({ h: h, delay: delay, thisArg: thisArg });
        };
        /**
         * Added a callback after a while. The callback will be called when the result is rejected.
         * @param h  The callback.
         * @param thisArg  this arg.
         * @param delay  A span in millisecond to delay to process.
         */
        OnceObservable.prototype.onRejectedLater = function (h, thisArg, delay) {
            var _this = this;
            DataSense.delay(function () {
                _this.onRejected(h, thisArg, delay);
            }, true);
        };
        /**
         * Creates a promise instance.
         */
        OnceObservable.prototype.promise = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.onResolved(resolve);
                _this.onRejected(reject);
            });
        };
        /**
         * Attaches callbacks for the resolution and/or rejection of the Promise.
         * @param onfulfilled The callback to execute when the Promise is resolved.
         * @param onrejected The callback to execute when the Promise is rejected.
         * @returns A Promise for the completion of which ever callback is executed.
         */
        OnceObservable.prototype.then = function (onfulfilled, onrejected) {
            return this.promise().then(onfulfilled, onrejected);
        };
        /**
         * Attaches a callback for only the rejection of the Promise.
         * @param onrejected The callback to execute when the Promise is rejected.
         * @returns A Promise for the completion of the callback.
         */
        OnceObservable.prototype.catch = function (onrejected) {
            return this.promise().catch(onrejected);
        };
        /**
         * Creates an observable instance.
         */
        OnceObservable.prototype.createObservable = function () {
            return new OnceObservable(this);
        };
        return OnceObservable;
    }());
    DataSense.OnceObservable = OnceObservable;
    /**
     * The observable and controller for resolving data.
     */
    var OnceController = /** @class */ (function (_super) {
        __extends(OnceController, _super);
        /**
         * Initializes a new instance of the OnceController class.
         */
        function OnceController() {
            var _this = this;
            var a;
            _this = _super.call(this, function (resolve, reject) {
                a = {
                    resolve: resolve,
                    reject: reject
                };
            }) || this;
            _this._instance = a;
            return _this;
        }
        /**
         * Sets the result data.
         * @param value  The data value.
         */
        OnceController.prototype.resolve = function (value) {
            this._instance.resolve(value);
        };
        /**
         * Sets the error information.
         * @param err  The exception or error information data.
         */
        OnceController.prototype.reject = function (err) {
            this._instance.reject(err);
        };
        return OnceController;
    }(OnceObservable));
    DataSense.OnceController = OnceController;
    /**
     * The information for data changing.
     */
    var ChangingInfo = /** @class */ (function () {
        /**
         * Initializes a new instance of the ChangingInfo class.
         */
        function ChangingInfo(key, currentValue, valueRequest, observable, action) {
            this.key = key;
            this.currentValue = currentValue;
            this.valueRequest = valueRequest;
            this.observable = observable;
            this.action = action;
            if (!action)
                this.action = "update";
        }
        /**
         * Added a callback when the result is resolved.
         * @param h  The callback.
         * @param thisArg  this arg.
         * @param delay  A span in millisecond to delay to process.
         */
        ChangingInfo.prototype.onResolved = function (h, thisArg, delay) {
            if (this.observable)
                this.observable.onResolved(h, thisArg, delay);
        };
        /**
         * Added a callback when the result is rejected.
         * @param h  The callback.
         * @param thisArg  this arg.
         * @param delay  A span in millisecond to delay to process.
         */
        ChangingInfo.prototype.onRejected = function (h, thisArg, delay) {
            if (this.observable)
                this.observable.onRejected(h, thisArg, delay);
        };
        return ChangingInfo;
    }());
    DataSense.ChangingInfo = ChangingInfo;
    /**
     * The information for data changed.
     */
    var ChangedInfo = /** @class */ (function () {
        /**
         * Initializes a new instance of the ChangedInfo class.
         */
        function ChangedInfo(key, action, success, value, oldValue, valueRequest, error) {
            this.key = key;
            this.action = action;
            this.success = success;
            this.value = value;
            this.oldValue = oldValue;
            this.valueRequest = valueRequest;
            this.error = error;
        }
        Object.defineProperty(ChangedInfo.prototype, "hasChanged", {
            /**
             * Gets a value indicating whether the value has been changed.
             */
            get: function () {
                return this.oldValue === this.value;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Creates an information instance described a value is changed.
         * @param key  The property key.
         * @param value  The new value of the property.
         * @param oldValue  The old value of the property.
         * @param action  The action kind of change.
         * @param valueRequest  The property value request to update.
         * @param error  The error information.
         * @returns  A changed info object.
         */
        ChangedInfo.success = function (key, value, oldValue, action, valueRequest, error) {
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
        };
        /**
         * Creates an information instance described a value is failed to change.
         * @param key  The property key.
         * @param value  The value of the property.
         * @param valueRequest  The property value request to update.
         * @param error  The error information.
         * @returns  A changed info object.
         */
        ChangedInfo.fail = function (key, value, valueRequest, error) {
            return new ChangedInfo(key, "none", false, value, value, valueRequest, error);
        };
        /**
         * Append a set of changed info objects into an array.
         * @param list  The array to push further items.
         * @param items  The items to push.
         */
        ChangedInfo.push = function (list) {
            var items = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                items[_i - 1] = arguments[_i];
            }
            if (!list)
                return;
            var index = -1;
            items.forEach(function (item) {
                if (!item || !item.key)
                    return;
                list.some(function (test, i) {
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
        };
        return ChangedInfo;
    }());
    DataSense.ChangedInfo = ChangedInfo;
    /**
     * Creates an event observable and controller.
     * @returns  The event observable and controller.
     */
    function createEvent() {
        return new EventController();
    }
    DataSense.createEvent = createEvent;
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
    /**
     * The observable for object properties.
     */
    var PropsObservable = /** @class */ (function () {
        /**
         * Initializes a new instance of the PropsObservable class.
         * @param changer  A function to called that you can get the accessor of the properties and more by the argument.
         */
        function PropsObservable(changer) {
            var disposable = new DataSense.DisposableArray();
            if ((changer instanceof PropsObservable) && changer._instance) {
                this._instance = __assign(__assign({}, changer._instance), { pushDisposable: function () {
                        var items = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            items[_i] = arguments[_i];
                        }
                        return disposable.pushDisposable.apply(disposable, items);
                    }, removeDisposable: function () {
                        var items = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            items[_i] = arguments[_i];
                        }
                        return disposable.removeDisposable.apply(disposable, items);
                    }, dispose: function () {
                        disposable.dispose();
                    } });
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
                this.pushDisposable(this.propChanging, this.propChanged, this.propChangeFailed, this.propBroadcastReceived, this.propNotifyReceived, this.anyPropChanging, this.anyPropChanged, this.anyPropChangeFailed, this.emptyPropRequested, this.propsChanged, this.broadcastReceived, this.notifyReceived);
                changer.pushDisposable(this);
                return;
            }
            var obj = DataSense.Access.propsAccessor();
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
            disposable.pushDisposable(this.propChanging, this.propChanged, this.propChangeFailed, this.propBroadcastReceived, this.propNotifyReceived, this.anyPropChanging, this.anyPropChanged, this.anyPropChangeFailed, this.emptyPropRequested, this.propsChanged, this.broadcastReceived, this.notifyReceived);
            var simpleAccessor = {
                hasProp: function (key) {
                    return obj.accessor.hasProp(key);
                },
                getProp: function (key, options) {
                    return obj.accessor.getProp(key, options);
                },
                getPropKeys: function () {
                    return obj.accessor.getPropKeys();
                },
                setProp: function (key, value, message) {
                    return obj.accessor.setProp(key, value, message);
                },
                removeProp: function (keys, message) {
                    return obj.accessor.removeProp(keys, message);
                },
                batchProp: function (changeSet, message) {
                    return obj.accessor.batchProp(changeSet, message);
                },
                forceUpdateProp: function (key) {
                    obj.accessor.forceUpdateProp(key);
                }
            };
            var getSimplePropAccessor = function (key) {
                return {
                    get: function (options) {
                        return obj.accessor.getProp(key, options);
                    },
                    set: function (value, message) {
                        return obj.accessor.setProp(key, value, message);
                    },
                    forceUpdate: function () {
                        obj.accessor.forceUpdateProp(key);
                    }
                };
            };
            var sendPropRequestH = function (key, type, value) {
                obj.sendPropRequest(key, type, value, getSimplePropAccessor(key));
            };
            var sendRequestH = function (type, value) {
                obj.sendRequest(type, value, simpleAccessor);
            };
            var sendPropBroadcastH = function (key, type, value) {
                obj.sendPropBroadcast(key, type, value);
            };
            var sendBroadcastH = function (type, value) {
                obj.sendBroadcast(type, value);
            };
            this._instance = {
                has: function (key) {
                    return obj.accessor.hasProp(key);
                },
                get: function (key, options) {
                    return obj.accessor.getProp(key, options);
                },
                getDetails: function (key) {
                    return obj.accessor.getPropDetails(key);
                },
                getUpdateTime: function (key) {
                    return obj.accessor.getPropUpdateTime(key);
                },
                keys: function () {
                    return obj.accessor.getPropKeys();
                },
                pushFlows: function (key) {
                    var flows = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        flows[_i - 1] = arguments[_i];
                    }
                    return obj.pushFlows.apply(obj, __spreadArray([key], flows, false));
                },
                clearFlows: function (key) {
                    return obj.clearFlows(key);
                },
                sendPropRequest: function (key, type, value) {
                    sendPropRequestH(key, type, value);
                },
                sendRequest: function (type, value) {
                    sendRequestH(type, value);
                },
                sendPropBroadcast: function (key, data, message) {
                    sendPropBroadcastH(key, data, message);
                },
                sendBroadcast: function (data, message) {
                    sendBroadcastH(data, message);
                },
                pushDisposable: function () {
                    var items = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        items[_i] = arguments[_i];
                    }
                    return disposable.pushDisposable.apply(disposable, items);
                },
                removeDisposable: function () {
                    var items = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        items[_i] = arguments[_i];
                    }
                    return disposable.removeDisposable.apply(disposable, items);
                },
                dispose: function () {
                    disposable.dispose();
                }
            };
            if (typeof changer !== "function")
                return;
            var eventsMore = changer.additionalEvents;
            if (eventsMore) {
                if (eventsMore.broadcastReceived instanceof DataSense.SingleEventObservable) {
                    this.broadcastReceived = eventsMore.broadcastReceived;
                    this.pushDisposable(this.broadcastReceived);
                }
                if (eventsMore.propBroadcastReceived instanceof DataSense.EventObservable) {
                    this.propBroadcastReceived = eventsMore.propBroadcastReceived;
                    this.pushDisposable(this.propBroadcastReceived);
                }
                if (eventsMore.notifyReceived instanceof DataSense.SingleEventObservable) {
                    this.notifyReceived = eventsMore.notifyReceived;
                    this.pushDisposable(this.notifyReceived);
                }
                if (eventsMore.propNotifyReceived instanceof DataSense.EventObservable) {
                    this.propNotifyReceived = eventsMore.propNotifyReceived;
                    this.pushDisposable(this.propNotifyReceived);
                }
                if (typeof eventsMore.sendRequest === "function")
                    sendRequestH = eventsMore.sendRequest;
                if (typeof eventsMore.sendPropRequest === "function")
                    sendPropRequestH = eventsMore.sendPropRequest;
                if (typeof eventsMore.sendBroadcast === "function")
                    sendBroadcastH = eventsMore.sendBroadcast;
                if (typeof eventsMore.sendPropBroadcast === "function")
                    sendPropBroadcastH = eventsMore.sendPropBroadcast;
            }
            changer(obj.accessor);
        }
        /**
         * Adds disposable objects so that they will be disposed when this instance is disposed.
         * @param items  The objects to add.
         */
        PropsObservable.prototype.pushDisposable = function () {
            var _a;
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            return (_a = this._instance).pushDisposable.apply(_a, items);
        };
        /**
         * Removes the ones added here.
         * @param items  The objects to remove.
         */
        PropsObservable.prototype.removeDisposable = function () {
            var _a;
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            return (_a = this._instance).removeDisposable.apply(_a, items);
        };
        /**
         * Gets all property keys.
         */
        PropsObservable.prototype.getKeys = function () {
            return this._instance.keys();
        };
        /**
         * Checks if the specific key is existed.
         * @param key  The property key.
         */
        PropsObservable.prototype.hasProp = function (key) {
            return this._instance.has(key);
        };
        /**
         * Gets a value of the specific key.
         * @param key  The property key.
         */
        PropsObservable.prototype.getProp = function (key, options) {
            return this._instance.get(key, options);
        };
        /**
         * Gets the update time of the specific key.
         * @param key  The property key.
         */
        PropsObservable.prototype.getPropUpdateTime = function (key) {
            return this._instance.getUpdateTime(key);
        };
        /**
         * Gets the details information of the specific key.
         * @param key  The property key.
         */
        PropsObservable.prototype.getPropDetails = function (key) {
            return this._instance.getDetails(key);
        };
        PropsObservable.prototype.registerChangeFlow = function (key) {
            var _a;
            var value = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                value[_i - 1] = arguments[_i];
            }
            return (_a = this._instance).pushFlows.apply(_a, __spreadArray([key], value, false));
        };
        PropsObservable.prototype.clearChangeFlow = function (key) {
            return this._instance.clearFlows(key);
        };
        /**
         * Registers an event listener on the speicific property is changing.
         * @param key  The property key.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        PropsObservable.prototype.onPropChanging = function (key, h, thisArg, options, disposableArray) {
            return this.propChanging.on(key, h, thisArg, options, disposableArray);
        };
        /**
         * Registers an event listener on the speicific property has been changed.
         * @param key  The property key.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        PropsObservable.prototype.onPropChanged = function (key, h, thisArg, options, disposableArray) {
            return this.propChanged.on(key, h, thisArg, options, disposableArray);
        };
        /**
         * Registers an event listener on the speicific property is failed to change.
         * @param key  The property key.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        PropsObservable.prototype.onPropChangeFailed = function (key, h, thisArg, options, disposableArray) {
            if (!key || typeof key !== "string")
                return DataSense.EventObservable.createFailedOnResult(null);
            return this.propChangeFailed.on(key, h, thisArg, options, disposableArray);
        };
        PropsObservable.prototype.onAnyPropChanging = function (h, thisArg, options, disposableArray) {
            return this.anyPropChanging.on(h, thisArg, options, disposableArray);
        };
        PropsObservable.prototype.onAnyPropChanged = function (h, thisArg, options, disposableArray) {
            return this.anyPropChanged.on(h, thisArg, options, disposableArray);
        };
        PropsObservable.prototype.onAnyPropChangeFailed = function (h, thisArg, options, disposableArray) {
            return this.anyPropChangeFailed.on(h, thisArg, options, disposableArray);
        };
        /**
         * Registers an event listener on one or more properties have been changed.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        PropsObservable.prototype.onPropsChanged = function (h, thisArg, options, disposableArray) {
            return this.propsChanged.on(h, thisArg, options, disposableArray);
        };
        /**
         * Registers an event listener on a broadcast message of a specific property is received.
         * @param key  The property key.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        PropsObservable.prototype.onPropBroadcastReceived = function (key, h, thisArg, options, disposableArray) {
            return this.propBroadcastReceived.on(key, h, thisArg, options, disposableArray);
        };
        /**
         * Registers an event listener on a broadcast message is received.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        PropsObservable.prototype.onBroadcastReceived = function (h, thisArg, options, disposableArray) {
            return this.broadcastReceived.on(h, thisArg, options, disposableArray);
        };
        /**
         * Registers an event listener on a notification of a specific property is received.
         * @param key  The property key.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        PropsObservable.prototype.onPropNotifyReceived = function (key, h, thisArg, options, disposableArray) {
            return this.propNotifyReceived.on(key, h, thisArg, options, disposableArray);
        };
        /**
         * Registers an event listener on a notification is received.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        PropsObservable.prototype.onNotifyReceived = function (h, thisArg, options, disposableArray) {
            return this.notifyReceived.on(h, thisArg, options, disposableArray);
        };
        /**
         * Subscribes for what a specific property has been changed.
         * @param key  The property key.
         * @param h  The callback.
         * @param thisArg  this arg.
         */
        PropsObservable.prototype.subscribeProp = function (key, h, thisArg) {
            return this.propChanged.subscribeSingle(key, h, thisArg, function (newValue) { return newValue.value; });
        };
        /**
         * Subscribes for what one or more properties have been changed.
         * @param h  The callback.
         * @param thisArg  this arg.
         */
        PropsObservable.prototype.subscribeProps = function (h, thisArg) {
            return this.propsChanged.subscribeWithConvertor(h, thisArg, function (changeSet) { return changeSet.changes; });
        };
        /**
         * Sends a request message for a property.
         * @param key  The property key.
         * @param type  The request type.
         * @param value  The data.
         */
        PropsObservable.prototype.sendPropRequest = function (key, type, value) {
            this._instance.sendPropRequest(key, type, value);
        };
        /**
         * Sends a request message.
         * @param type  The request type.
         * @param value  The data.
         */
        PropsObservable.prototype.sendRequest = function (type, value) {
            this._instance.sendRequest(type, value);
        };
        /**
         * Sends a broadcast message for a property.
         * @param key  The property key.
         * @param data  The data.
         * @param message  The additional information which will pass to the event listener handler.
         */
        PropsObservable.prototype.sendPropBroadcast = function (key, data, message) {
            this._instance.sendPropBroadcast(key, data, message);
        };
        /**
         * Sends a broadcast message.
         * @param data  The data.
         * @param message  The additional information which will pass to the event listener handler.
         */
        PropsObservable.prototype.sendBroadcast = function (data, message) {
            this._instance.sendBroadcast(data, message);
        };
        /**
         * Creates an observable instance for a property.
         * @param key  The property key.
         */
        PropsObservable.prototype.createPropObservable = function (key) {
            var _this = this;
            var obj = {};
            var sendBroadcast = function (data, message) {
                _this.sendPropBroadcast(key, data, message);
            };
            var h = function (accessor) {
                obj.accessor = accessor;
            };
            h = {
                broadcastReceived: this.propBroadcastReceived.createSingleObservable(key),
                notifyReceived: this.propNotifyReceived.createSingleObservable(key),
                sendBroadcast: sendBroadcast
            };
            var result = new DataSense.ValueObservable(function (accessor) {
                accessor.set(_this.getProp(key));
                obj.accessor = accessor;
            });
            var onToken = this.onPropChanging(key, function (ev, evController) {
                var changeToken = obj.accessor.customizedSet(ev.currentValue, evController.message);
                if (!ev.observable)
                    return;
                ev.observable.onResolved(function (newValue) {
                    changeToken.resolve(newValue);
                });
                ev.observable.onRejected(function (err) {
                    changeToken.reject(err);
                });
            });
            result.pushDisposable(onToken);
            return result;
        };
        /**
         * Creates an observable instance.
         */
        PropsObservable.prototype.createObservable = function () {
            return new PropsObservable(this);
        };
        /**
         * Creates an object with properties copied from this.
         */
        PropsObservable.prototype.copyModel = function () {
            var _this = this;
            var obj = {};
            this.getKeys().forEach(function (key) {
                obj[key] = _this.getProp(key);
            });
            return obj;
        };
        PropsObservable.prototype.toJSON = function () {
            var value = this.copyModel();
            try {
                if (value != null)
                    return JSON.stringify(value);
            }
            catch (ex) { }
            return (new String(value)).toString();
        };
        /**
         * Disposes the instance.
         */
        PropsObservable.prototype.dispose = function () {
            this._instance.dispose();
        };
        return PropsObservable;
    }());
    DataSense.PropsObservable = PropsObservable;
    /**
     * Object property accessing and observing client.
     */
    var PropsClient = /** @class */ (function (_super) {
        __extends(PropsClient, _super);
        /**
         * Initializes a new instance of the PropsClient class.
         */
        function PropsClient(defaultValue, modifier, propSetter, sendPropNotify, sendNotify, registerPropRequestHandler, registerRequestHandler, additionalEvents) {
            var _this = this;
            var h = function (acc) {
                acc.batchProp(defaultValue);
                modifier(acc.customizedSetProp);
            };
            if (additionalEvents)
                h.additionalEvents = additionalEvents;
            _this = _super.call(this, h) || this;
            if (typeof propSetter === "function")
                _this._propSetter = propSetter;
            if (typeof sendPropNotify === "function")
                _this._sendPropNotify = sendPropNotify;
            if (typeof sendNotify === "function")
                _this._sendNotify = sendNotify;
            if (typeof registerPropRequestHandler === "function")
                _this._registerPropRequestHandler = registerPropRequestHandler;
            if (typeof registerRequestHandler === "function")
                _this._registerRequestHandler = registerRequestHandler;
            if (typeof Proxy === "undefined")
                return _this;
            _this.proxy = new Proxy({}, {
                has: function (target, p) {
                    if (!p || typeof p !== "string")
                        return false;
                    return _this.hasProp(p);
                },
                get: function (target, p, receiver) {
                    if (!p || typeof p !== "string")
                        return undefined;
                    return _this.getProp(p);
                },
                set: function (target, p, value, receiver) {
                    if (!p || typeof p !== "string")
                        throw new TypeError("the property key should be a string");
                    return _this.setProp(p, value);
                },
                ownKeys: function (target) {
                    return _this.getKeys();
                }
            });
            return _this;
        }
        /**
         * Sets a value of the specific key.
         * @param key  The property key.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        PropsClient.prototype.setProp = function (key, value, message) {
            if (typeof this._propSetter !== "function")
                return false;
            var info = this._propSetter(key, value, message);
            return info ? info.success : false;
        };
        /**
         * Sets a value of the specific key. A status and further information will be returned.
         * @param key  The property key.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        PropsClient.prototype.setPropForDetails = function (key, value, message) {
            if (typeof this._propSetter !== "function")
                return DataSense.ChangedInfo.fail(null, undefined, value, "not implemented");
            return this._propSetter(key, value, message);
        };
        /**
         * Sets a value of the specific key by a Promise.
         * @param key  The property key.
         * @param value  A Promise of the property to set.
         * @param compatible  true if the value can also be a non-Promise; otherwise, false.
         * @param message  A message for the setting event.
         */
        PropsClient.prototype.setPromiseProp = function (key, value, compatible, message) {
            var _this = this;
            return DataSense.Access.setPromise(function (value, message) {
                return _this.setPropForDetails(key, value, message);
            }, value, compatible, message);
        };
        /**
         * Sets a value of the specific key by an observable which can be subscribed.
         * @param key  The property key.
         * @param value  A Promise of the property to set.
         * @param message  A message for the setting event.
         * @param callbackfn  A function will be called on subscribed.
         */
        PropsClient.prototype.setSubscribeProp = function (key, value, message, callbackfn, thisArg) {
            var _this = this;
            return DataSense.Access.setSubscribe(function (value, message) {
                return _this.setPropForDetails(key, value, message);
            }, value, message, callbackfn, thisArg);
        };
        /**
         * Send a notification for a speicific property.
         * @param key  The property key.
         * @param data  The data.
         * @param message  A message for the setting event.
         */
        PropsClient.prototype.sendPropNotify = function (key, data, message) {
            if (typeof this._sendPropNotify !== "function")
                return;
            this._sendPropNotify(key, data, message);
        };
        /**
         * Send a notification.
         * @param data  The data.
         * @param message  A message for the setting event.
         */
        PropsClient.prototype.sendNotify = function (data, message) {
            if (typeof this._sendNotify !== "function")
                return;
            this._sendNotify(data, message);
        };
        /**
         * Registers a handler to respond the request message for a property.
         * @param key  The property key.
         * @param type  The request type.
         * @param h  The handler to respond the request message.
         */
        PropsClient.prototype.registerPropRequestHandler = function (key, type, h) {
            if (typeof this._registerPropRequestHandler !== "function")
                return false;
            return this._registerPropRequestHandler(key, type, h);
        };
        /**
         * Registers a handler to respond the request message.
         * @param type  The request type.
         * @param h  The handler to respond the request message.
         */
        PropsClient.prototype.registerRequestHandler = function (type, h) {
            if (typeof this._registerRequestHandler !== "function")
                return false;
            return this._registerRequestHandler(type, h);
        };
        return PropsClient;
    }(PropsObservable));
    DataSense.PropsClient = PropsClient;
    /**
     * Object observable and controller.
     */
    var PropsController = /** @class */ (function (_super) {
        __extends(PropsController, _super);
        /**
         * Initializes a new instance of the PropsController class.
         */
        function PropsController() {
            var _this = this;
            var a;
            _this = _super.call(this, function (acc) { return a = acc; }) || this;
            _this._accessor = a;
            if (typeof Proxy === "undefined")
                return _this;
            _this.proxy = new Proxy({}, {
                has: function (target, p) {
                    if (!p || typeof p !== "string")
                        return false;
                    return _this.hasProp(p);
                },
                get: function (target, p, receiver) {
                    if (!p || typeof p !== "string")
                        return undefined;
                    return _this.getProp(p);
                },
                set: function (target, p, value, receiver) {
                    if (!p || typeof p !== "string")
                        throw new TypeError("the property key should be a string");
                    return _this.setProp(p, value);
                },
                ownKeys: function (target) {
                    return _this.getKeys();
                }
            });
            return _this;
        }
        Object.defineProperty(PropsController.prototype, "formatter", {
            /**
             * Gets the formatter/convertor.
             */
            get: function () {
                return this._accessor.getFormatter();
            },
            /**
             * Sets the formatter/convertor.
             */
            set: function (h) {
                this._accessor.setFormatter(h);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(PropsController.prototype, "validator", {
            /**
             * Gets the validator.
             */
            get: function () {
                return this._accessor.getValidator();
            },
            /**
             * Sets the validator.
             */
            set: function (h) {
                this._accessor.setValidator(h);
            },
            enumerable: false,
            configurable: true
        });
        PropsController.prototype.getPropWithFallback = function (key, resolver, options) {
            var _this = this;
            var prop = this._accessor.getPropDetails(key);
            if (!options)
                options = {};
            if (typeof options.callback === "function")
                options.callback(prop);
            if (prop.hasValue)
                return Promise.resolve(prop.value);
            return resolver(prop).then(function (value) {
                if (options.testBeforeSet) {
                    prop = _this._accessor.getPropDetails(key);
                    if (prop.hasValue)
                        return prop.value;
                }
                _this._accessor.setProp(key, value);
                return value;
            });
        };
        /**
         * Force to update a property.
         * @param key  The property key.
         * @param message  A message for the setting event.
         */
        PropsController.prototype.forceUpdateProp = function (key, message) {
            this._accessor.forceUpdateProp(key, message);
        };
        /**
         * Sets a value of the specific key.
         * @param key  The property key.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        PropsController.prototype.setProp = function (key, value, message) {
            var info = this._accessor.setProp(key, value, message);
            return info ? info.success : false;
        };
        /**
         * Sets a value of the specific key. A status and further information will be returned.
         * @param key  The property key.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        PropsController.prototype.setPropForDetails = function (key, value, message) {
            return this._accessor.setProp(key, value, message);
        };
        /**
         * Sets a value of the specific key by a Promise.
         * @param key  The property key.
         * @param value  A Promise of the property to set.
         * @param compatible  true if the value can also be a non-Promise; otherwise, false.
         * @param message  A message for the setting event.
         */
        PropsController.prototype.setPromiseProp = function (key, value, compatible, message) {
            var _this = this;
            return DataSense.Access.setPromise(function (value, message) {
                return _this.setPropForDetails(key, value, message);
            }, value, compatible, message);
        };
        /**
         * Sets a value of the specific key by an observable which can be subscribed.
         * @param key  The property key.
         * @param value  A Promise of the property to set.
         * @param message  A message for the setting event.
         * @param callbackfn  A function will be called on subscribed.
         */
        PropsController.prototype.setSubscribeProp = function (key, value, message, callbackfn, thisArg) {
            var _this = this;
            return DataSense.Access.setSubscribe(function (value, message) {
                return _this.setPropForDetails(key, value, message);
            }, value, message, callbackfn, thisArg);
        };
        /**
         * Removes a property.
         * @param key  The property key.
         * @param message  A message for the setting event.
         */
        PropsController.prototype.removeProp = function (key, message) {
            return this._accessor.removeProp(key, message);
        };
        /**
         * Batch sets properties.
         * @param obj  The data with properties to override current ones.
         * @param message  A message for the setting event.
         */
        PropsController.prototype.setProps = function (obj, message) {
            return this._accessor.batchProp(obj, message);
        };
        /**
         * Gets additional store information.
         * @param key  The property key.
         * @param storePropKey  The key of additional information.
         */
        PropsController.prototype.getPropStore = function (key, storePropKey) {
            return this._accessor.getPropStore(key, storePropKey);
        };
        /**
         * Sets additional store information.
         * @param key  The property key.
         * @param storePropKey  The key of additional information.
         * @param value  The value of additonal information.
         */
        PropsController.prototype.setPropStore = function (key, storePropKey, value) {
            this._accessor.setPropStore(key, storePropKey, value);
        };
        /**
         * Removes the specific additional store information.
         * @param key  The property key.
         * @param storePropKeys  The key of additional information.
         */
        PropsController.prototype.removePropStore = function (key) {
            var _a;
            var storePropKeys = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                storePropKeys[_i - 1] = arguments[_i];
            }
            (_a = this._accessor).removePropStore.apply(_a, __spreadArray([key], storePropKeys, false));
        };
        /**
         * Send a notification for a speicific property.
         * @param key  The property key.
         * @param data  The data.
         * @param message  The additional information which will pass to the event listener handler.
         */
        PropsController.prototype.sendPropNotify = function (key, data, message) {
            this._accessor.sendPropNotify(key, data, message);
        };
        /**
         * Send a notification.
         * @param data  The data.
         * @param message  The additional information which will pass to the event listener handler.
         */
        PropsController.prototype.sendNotify = function (data, message) {
            this._accessor.sendNotify(data, message);
        };
        /**
         * Registers a handler to respond the request message for a property.
         * @param key  The property key.
         * @param type  The request type.
         * @param h  The handler to respond the request message.
         */
        PropsController.prototype.registerPropRequestHandler = function (key, type, h) {
            return this._accessor.registerPropRequestHandler(key, type, h);
        };
        /**
         * Registers a handler to respond the request message.
         * @param type  The request type.
         * @param h  The handler to respond the request message.
         */
        PropsController.prototype.registerRequestHandler = function (type, h) {
            return this._accessor.registerRequestHandler(type, h);
        };
        /**
         * Creates a controller client for a property.
         * @param key  The property key.
         */
        PropsController.prototype.createPropClient = function (key) {
            var _this = this;
            var token;
            var sendBroadcast = function (data, message) {
                _this.sendPropBroadcast(key, data, message);
            };
            var sendRequest = function (type, value) {
                _this.sendPropRequest(key, type, value);
            };
            var client = new DataSense.ValueClient(this.getProp(key), function (modifier) {
                token = _this.onPropChanging(key, function (ev, evController) {
                    var updateToken = modifier(ev.valueRequest, evController.message);
                    if (!ev.observable)
                        return;
                    ev.observable.onResolved(function (newValue) {
                        updateToken.resolve(newValue);
                    });
                    ev.observable.onRejected(function (err) {
                        updateToken.reject(err);
                    });
                });
            }, function (value, message) {
                return _this.setPropForDetails(key, value, message);
            }, function (data, message) {
                _this._accessor.sendPropNotify(key, data, message);
            }, function (type, h) {
                return _this._accessor.registerPropRequestHandler(key, type, h);
            }, {
                broadcastReceived: this.propBroadcastReceived.createSingleObservable(key),
                notifyReceived: this.propNotifyReceived.createSingleObservable(key),
                sendRequest: sendRequest,
                sendBroadcast: sendBroadcast
            }, function (message) {
                _this.forceUpdateProp(key, message);
            });
            client.pushDisposable(token);
            return client;
        };
        /**
         * Creates a controller client.
         */
        PropsController.prototype.createClient = function () {
            var _this = this;
            var token;
            var sendRequest = function (type, value) {
                _this.sendRequest(type, value);
            };
            var sendPropRequest = function (key, type, value) {
                _this.sendPropRequest(key, type, value);
            };
            var sendBroadcast = function (data, message) {
                _this.sendBroadcast(data, message);
            };
            var sendPropBroadcast = function (key, data, message) {
                _this.sendPropBroadcast(key, data, message);
            };
            var client = new PropsClient(this.copyModel(), function (modifier) {
                token = _this.onAnyPropChanging(function (ev, evController) {
                    var updateToken = modifier(ev.key, ev.valueRequest, evController.message);
                    if (!ev.observable)
                        return;
                    ev.observable.onResolved(function (newValue) {
                        updateToken.resolve(newValue);
                    });
                    ev.observable.onRejected(function (err) {
                        updateToken.reject(err);
                    });
                });
            }, function (key, value, message) {
                return _this.setPropForDetails(key, value, message);
            }, this._accessor.sendPropNotify, this._accessor.sendNotify, this.registerPropRequestHandler, this.registerRequestHandler, {
                propBroadcastReceived: this.propBroadcastReceived.createObservable(),
                broadcastReceived: this.broadcastReceived.createObservable(),
                propNotifyReceived: this.propNotifyReceived.createObservable(),
                notifyReceived: this.notifyReceived.createObservable(),
                emptyPropRequested: this.emptyPropRequested.createObservable(),
                sendPropRequest: sendPropRequest,
                sendRequest: sendRequest,
                sendPropBroadcast: sendPropBroadcast,
                sendBroadcast: sendBroadcast
            });
            client.pushDisposable(token);
            this.pushDisposable(client);
            client.emptyPropRequested.on(function (ev) { return _this.getProp(ev.key); });
            return client;
        };
        return PropsController;
    }(PropsObservable));
    DataSense.PropsController = PropsController;
    /**
     * Creates a props controller with accessor and observable.
     * @param initObj  The optional initialized properties.
     * @returns  The props controller with accessor and observable.
     */
    function createProps(initObj) {
        var p = new PropsController();
        if (initObj)
            p.setProps(initObj);
        return p;
    }
    DataSense.createProps = createProps;
})(DataSense || (DataSense = {}));
var DataSense;
(function (DataSense) {
    /**
     * A task for processing with times limitation and delay options.
     */
    var HitTask = /** @class */ (function () {
        /**
         * Initializes a new instance of the HitTask class.
         */
        function HitTask() {
            var _this = this;
            this._options = {};
            this._h = [];
            var initDate = new Date();
            var procToken;
            var count = 0;
            var curCount = 0;
            var latest;
            var latest2;
            var procH = function (arg) {
                procToken = null;
                var latest3 = latest;
                latest = new Date();
                if (count < Number.MAX_SAFE_INTEGER)
                    count++;
                _this._h.forEach(function (h) {
                    h(arg, {
                        initDate: initDate,
                        processDate: latest,
                        latestProcessDate: latest3,
                        count: count,
                        hitCount: curCount
                    });
                });
            };
            this._abort = function () {
                if (procToken)
                    clearTimeout(procToken);
                procToken = null;
            };
            this._proc = function (arg) {
                var now = new Date();
                curCount++;
                var options = _this._options;
                if (!options.span || !latest2 || (now.getTime() - latest2.getTime() > options.span)) {
                    curCount = 1;
                }
                latest2 = new Date();
                if ((options.minCount != null && curCount < options.minCount) || (options.maxCount != null && curCount > options.maxCount)) {
                    return;
                }
                if (procToken) {
                    if (options.mergeMode === "debounce")
                        clearTimeout(procToken);
                    else if (options.mergeMode === "mono")
                        return;
                }
                if (options.delay == null || options.delay === false)
                    procH(arg);
                else if (options.delay === true)
                    procToken = setTimeout(function () {
                        procH(arg);
                    }, 0);
                else if (typeof options.delay === "number")
                    procToken = setTimeout(function () {
                        procH(arg);
                    }, options.delay);
            };
        }
        /**
         * Sets the options.
         * @param value  The options.
         * @param merge  true if merge the properties into the current one; otherwise, false.
         */
        HitTask.prototype.setOptions = function (value, merge) {
            if (!merge) {
                this._options = value || {};
            }
            else if (value) {
                this._options = __assign(__assign({}, this._options), value);
            }
        };
        /**
         * Registers the handler to process when need.
         * @param h  One or more handlers.
         */
        HitTask.prototype.pushHandler = function () {
            var _this = this;
            var h = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                h[_i] = arguments[_i];
            }
            var count = 0;
            h.forEach(function (handler) {
                var _a;
                if (typeof handler === "function")
                    count += _this._h.push(handler);
                else if (handler instanceof Array)
                    count += (_a = _this._h).push.apply(_a, handler);
            });
            return count;
        };
        /**
         * Clears all handlers.
         */
        HitTask.prototype.clearHandler = function () {
            this._h = [];
        };
        /**
         * Tries to process.
         * The handlers registered may not be proceeded unless pass the condition.
         * @param arg  An argument to pass to the handlers registered.
         */
        HitTask.prototype.process = function (arg) {
            this._proc(arg);
        };
        /**
         * Tries to abort the pending processing.
         */
        HitTask.prototype.abort = function () {
            this._abort();
        };
        return HitTask;
    }());
    DataSense.HitTask = HitTask;
    /**
     * Delays to process a speicific handler.
     * @param h  The handler.
     * @param span  true if process delay; false if process immediately; or a number if process after the specific milliseconds.
     */
    function delay(h, span) {
        var procToken;
        if (span == null || span === false)
            h();
        else if (span === true)
            procToken = setTimeout(function () {
                procToken = null;
                h();
            }, 0);
        else if (typeof span === "number")
            procToken = setTimeout(function () {
                procToken = null;
                h();
            }, span);
        return {
            dispose: function () {
                if (procToken)
                    clearTimeout(procToken);
                procToken = null;
            }
        };
    }
    DataSense.delay = delay;
    /**
     * Processes a handler and ignore the up coming ones in a specific time span.
     * @param h  The handler to process.
     * @param span  A time span in millisecond to avoid up coming.
     * @param justPrepare  true if just set up a task which will not process immediately; otherwise, false.
     */
    function throttle(h, span, justPrepare) {
        var task = new HitTask();
        task.setOptions({
            span: span,
            maxCount: 1
        });
        task.pushHandler(h);
        if (!justPrepare)
            task.process();
        return task;
    }
    DataSense.throttle = throttle;
    /**
     * Processes a handler delay or immediately in debounce mode.
     * @param h  The handler to process.
     * @param delay  true if process delay; false if process immediately; or a number if process after the specific milliseconds.
     * @param justPrepare  true if just set up a task which will not process immediately; otherwise, false.
     */
    function debounce(h, delay, justPrepare) {
        var task = new HitTask();
        task.setOptions({
            delay: delay,
            mergeMode: "debounce"
        });
        task.pushHandler(h);
        if (!justPrepare)
            task.process();
        return task;
    }
    DataSense.debounce = debounce;
    /**
     * Processes a handler delay or immediately in mono mode.
     * @param h  The handler to process.
     * @param delay  true if process delay; false if process immediately; or a number if process after the specific milliseconds.
     * @param justPrepare  true if just set up a task which will not process immediately; otherwise, false.
     */
    function mono(h, delay, justPrepare) {
        var task = new HitTask();
        task.setOptions({
            delay: delay,
            mergeMode: "mono"
        });
        task.pushHandler(h);
        if (!justPrepare)
            task.process();
        return task;
    }
    DataSense.mono = mono;
    /**
     * Processes a handler in multiple hits task.
     * @param h  The handler to process.
     * @param min  The minimum hit count.
     * @param max  The maximum hit count.
     * @param span  The hit reset span.
     * @param justPrepare  true if just set up a task which will not process immediately; otherwise, false.
     */
    function multiHit(h, minCount, maxCount, span, justPrepare) {
        var task = new HitTask();
        task.setOptions({
            minCount: minCount,
            maxCount: maxCount,
            span: span
        });
        task.pushHandler(h);
        if (!justPrepare)
            task.process();
        return task;
    }
    DataSense.multiHit = multiHit;
    /**
     * Schedule to process a specific handler.
     * @param h  The handler to process.
     * @param span  A time span in millisecond of duration.
     */
    function schedule(h, span) {
        var token;
        var token2;
        var startDate;
        var processDate;
        var stopDate;
        var latest;
        var isInit = true;
        var clearToken = function () {
            if (token2)
                token2.dispose();
            token2 = null;
            if (!token)
                return;
            clearInterval(token);
            token = null;
        };
        var process = function (source) {
            processDate = new Date();
            h({
                startDate: startDate,
                latestStopDate: stopDate,
                processDate: processDate,
                latestProcessDate: latest,
                span: span,
                source: source
            });
            latest = new Date();
        };
        var startProc = function (delay, source) {
            isInit = false;
            clearToken();
            token2 = DataSense.delay(function () {
                token2 = null;
                process(source);
                token = setInterval(function () {
                    process("schedule");
                }, span);
            }, delay);
        };
        var task = {
            start: function (isPlan) {
                var delay = false;
                var source = isPlan ? "plan" : "start";
                if (startDate)
                    source = ("re" + source);
                if (typeof isPlan === "number")
                    delay = isPlan;
                else if (isPlan === true)
                    delay = span;
                startProc(delay, source);
            },
            process: function () {
                process("immediate");
            },
            resume: function (isPlan) {
                if (token || token2)
                    return;
                if (isInit || !stopDate || !startDate) {
                    startProc(isPlan, startDate ? "restart" : "resume");
                    return;
                }
                var delay = span - stopDate.getTime() - startDate.getTime();
                if (delay <= 0)
                    delay = false;
                startProc(delay, "resume");
            },
            pause: function () {
                clearToken();
                stopDate = new Date();
            },
            stop: function () {
                clearToken();
                stopDate = new Date();
                isInit = true;
            },
            get alive() {
                return token || token2;
            }
        };
        return task;
    }
    DataSense.schedule = schedule;
})(DataSense || (DataSense = {}));
var DataSense;
(function (DataSense) {
    /**
     * The observable for data value.
     */
    var ValueObservable = /** @class */ (function () {
        /**
         * Initializes a new instance of the ValueObservable class.
         * @param changer  A function to called that you can get the accessor of the value by the argument.
         */
        function ValueObservable(changer) {
            var disposable = new DataSense.DisposableArray();
            var accessKey = "value";
            if ((changer instanceof ValueObservable) && changer._instance) {
                this._instance = __assign(__assign({}, changer._instance), { pushDisposable: function () {
                        var items = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            items[_i] = arguments[_i];
                        }
                        return disposable.pushDisposable.apply(disposable, items);
                    }, removeDisposable: function () {
                        var items = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            items[_i] = arguments[_i];
                        }
                        return disposable.removeDisposable.apply(disposable, items);
                    }, dispose: function () {
                        disposable.dispose();
                    } });
                this.changing = changer.changing.createObservable();
                this.changed = changer.changed.createObservable();
                this.changeFailed = changer.changeFailed.createObservable();
                this.broadcastReceived = changer.broadcastReceived.createObservable();
                this.notifyReceived = changer.notifyReceived.createObservable();
                this.pushDisposable(this.changing, this.changed, this.changeFailed, this.broadcastReceived, this.notifyReceived);
                changer.pushDisposable(this);
                return;
            }
            var formatter;
            var validator;
            var obj = DataSense.Access.propsAccessor();
            obj.accessor.setFormatter(function (key, value) {
                if (typeof formatter !== "function" || key !== accessKey)
                    return value;
                return formatter(value);
            });
            obj.accessor.setValidator(function (key, value) {
                if (typeof validator !== "function" || key !== accessKey)
                    return true;
                return validator(value);
            });
            this.changing = obj.propChanging.createSingleObservable(accessKey);
            this.changed = obj.propChanged.createSingleObservable(accessKey);
            this.changeFailed = obj.propChangeFailed.createSingleObservable(accessKey);
            this.broadcastReceived = obj.propBroadcastReceived.createSingleObservable(accessKey);
            this.notifyReceived = obj.propNotifyReceived.createSingleObservable(accessKey);
            disposable.pushDisposable(this.changing, this.changed, this.changeFailed, this.broadcastReceived, this.notifyReceived);
            var simpleAccessor = {
                get: function (options) {
                    return obj.accessor.getProp(accessKey, options);
                },
                set: function (value, message) {
                    return obj.accessor.setProp(accessKey, value, message);
                },
                forceUpdate: function (message) {
                    obj.accessor.forceUpdateProp(accessKey, message);
                }
            };
            var sendRequestH = function (type, value) {
                obj.sendPropRequest(accessKey, type, value, simpleAccessor);
            };
            var sendBroadcastH = function (type, value) {
                obj.sendPropBroadcast(accessKey, type, value);
            };
            this._instance = {
                get: function (options) {
                    return obj.accessor.getProp(accessKey, options);
                },
                pushFlows: function () {
                    var flows = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        flows[_i] = arguments[_i];
                    }
                    return obj.pushFlows.apply(obj, __spreadArray([accessKey], flows, false));
                },
                clearFlows: function () {
                    return obj.clearFlows(accessKey);
                },
                sendRequest: function (type, value) {
                    sendRequestH(type, value);
                },
                sendBroadcast: function (data, message) {
                    sendBroadcastH(data, message);
                },
                pushDisposable: function () {
                    var items = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        items[_i] = arguments[_i];
                    }
                    return disposable.pushDisposable.apply(disposable, items);
                },
                removeDisposable: function () {
                    var items = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        items[_i] = arguments[_i];
                    }
                    return disposable.removeDisposable.apply(disposable, items);
                },
                dispose: function () {
                    disposable.dispose();
                }
            };
            if (typeof changer !== "function")
                return;
            var eventsMore = changer.additionalEvents;
            if (eventsMore) {
                if (eventsMore.broadcastReceived instanceof DataSense.SingleEventObservable) {
                    this.broadcastReceived = eventsMore.broadcastReceived;
                    this.pushDisposable(this.broadcastReceived);
                }
                if (eventsMore.notifyReceived instanceof DataSense.SingleEventObservable) {
                    this.notifyReceived = eventsMore.notifyReceived;
                    this.pushDisposable(this.notifyReceived);
                }
                if (typeof eventsMore.sendRequest === "function")
                    sendRequestH = eventsMore.sendRequest;
                if (typeof eventsMore.sendBroadcast === "function")
                    sendBroadcastH = eventsMore.sendBroadcast;
            }
            changer({
                get: function (options) {
                    return obj.accessor.getProp(accessKey, options);
                },
                set: function (value, message) {
                    return obj.accessor.setProp(accessKey, value, message);
                },
                customizedSet: function (valueRequested, message) {
                    return obj.accessor.customizedSetProp(accessKey, valueRequested, message);
                },
                forceUpdate: function (message) {
                    obj.accessor.forceUpdateProp(accessKey, message);
                },
                getFormatter: function () {
                    return formatter;
                },
                setFormatter: function (h) {
                    formatter = h;
                },
                getValidator: function () {
                    return validator;
                },
                setValidator: function (h) {
                    validator = h;
                },
                getStore: function (storePropKey) {
                    return obj.accessor.getPropStore(accessKey, storePropKey);
                },
                setStore: function (storePropKey, value) {
                    obj.accessor.setPropStore(accessKey, storePropKey, value);
                },
                removeStore: function () {
                    var _a;
                    var storePropKey = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        storePropKey[_i] = arguments[_i];
                    }
                    (_a = obj.accessor).removePropStore.apply(_a, __spreadArray([accessKey], storePropKey, false));
                },
                sendNotify: function (data, message) {
                    obj.accessor.sendPropNotify(accessKey, data, message);
                },
                registerRequestHandler: function (type, h) {
                    return obj.accessor.registerPropRequestHandler(accessKey, type, h);
                }
            });
        }
        /**
         * Adds disposable objects so that they will be disposed when this instance is disposed.
         * @param items  The objects to add.
         */
        ValueObservable.prototype.pushDisposable = function () {
            var _a;
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            return (_a = this._instance).pushDisposable.apply(_a, items);
        };
        /**
         * Removes the ones added here.
         * @param items  The objects to remove.
         */
        ValueObservable.prototype.removeDisposable = function () {
            var _a;
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i] = arguments[_i];
            }
            return (_a = this._instance).removeDisposable.apply(_a, items);
        };
        /**
         * Gets the value.
         */
        ValueObservable.prototype.get = function (options) {
            return this._instance.get(options);
        };
        /**
         * Gets the type of value.
         */
        ValueObservable.prototype.getType = function () {
            return typeof this._instance.get();
        };
        /**
         * Checks if the value is instance of a specific type.
         */
        ValueObservable.prototype.instanceOf = function (c) {
            return this._instance.get() instanceof c;
        };
        ValueObservable.prototype.registerChangeFlow = function () {
            var _a;
            var value = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                value[_i] = arguments[_i];
            }
            return (_a = this._instance).pushFlows.apply(_a, value);
        };
        ValueObservable.prototype.clearChangeFlow = function () {
            return this._instance.clearFlows();
        };
        /**
         * Registers an event listener on the value is changing.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        ValueObservable.prototype.onChanging = function (h, thisArg, options, disposableArray) {
            return this.changing.on(h, thisArg, options, disposableArray);
        };
        /**
         * Registers an event listener on the value has been changed.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        ValueObservable.prototype.onChanged = function (h, thisArg, options, disposableArray) {
            return this.changed.on(h, thisArg, options, disposableArray);
        };
        /**
         * Registers an event listener on the value is failed to change.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        ValueObservable.prototype.onChangeFailed = function (h, thisArg, options, disposableArray) {
            return this.changeFailed.on(h, thisArg, options, disposableArray);
        };
        /**
         * Registers an event listener on a broadcast message is received.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        ValueObservable.prototype.onBroadcastReceived = function (h, thisArg, options, disposableArray) {
            return this.broadcastReceived.on(h, thisArg, options, disposableArray);
        };
        /**
         * Registers an event listener on a notification is received.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        ValueObservable.prototype.onNotifyReceived = function (h, thisArg, options, disposableArray) {
            return this.notifyReceived.on(h, thisArg, options, disposableArray);
        };
        /**
         * Subscribes for what the value has been changed.
         * @param h  The callback.
         * @param thisArg  this arg.
         */
        ValueObservable.prototype.subscribe = function (h, thisArg) {
            return this.changed.subscribeWithConvertor(h, thisArg, function (newValue) { return newValue.value; });
        };
        /**
         * Sends a request message.
         * @param data  The data.
         * @param message  The additional information.
         */
        ValueObservable.prototype.sendRequest = function (type, value) {
            this._instance.sendRequest(type, value);
        };
        /**
         * Sends a broadcast message.
         * @param data  The data.
         * @param message  The additional information which will pass to the event listener handler.
         */
        ValueObservable.prototype.sendBroadcast = function (data, message) {
            this._instance.sendBroadcast(data, message);
        };
        ValueObservable.prototype.createObservable = function () {
            return new ValueObservable(this);
        };
        /**
         * Disposes the instance.
         */
        ValueObservable.prototype.dispose = function () {
            this._instance.dispose();
        };
        ValueObservable.prototype.toJSON = function () {
            var value = this._instance.get();
            try {
                if (value != null)
                    return JSON.stringify(value);
            }
            catch (ex) { }
            return (new String(value)).toString();
        };
        return ValueObservable;
    }());
    DataSense.ValueObservable = ValueObservable;
    /**
     * Data property accessing and observing client.
     */
    var ValueClient = /** @class */ (function (_super) {
        __extends(ValueClient, _super);
        /**
         * Initializes a new instance of the ValueClient class.
         */
        function ValueClient(defaultValue, modifier, setter, sendNotify, registerRequestHandler, additionalEvents, forceUpdate) {
            var _this = this;
            var h = function (acc) {
                acc.set(defaultValue);
                modifier(acc.customizedSet);
            };
            if (additionalEvents)
                h.additionalEvents = additionalEvents;
            _this = _super.call(this, h) || this;
            if (typeof setter === "function")
                _this._setter = setter;
            if (typeof sendNotify === "function")
                _this._sendNotify = sendNotify;
            if (typeof registerRequestHandler === "function")
                _this._registerRequestHandler = registerRequestHandler;
            if (typeof forceUpdate === "function")
                _this._forceUpdate = forceUpdate;
            return _this;
        }
        /**
         * Sets value.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        ValueClient.prototype.set = function (value, message) {
            if (typeof this._setter !== "function")
                return false;
            var info = this._setter(value, message);
            return info ? info.success : false;
        };
        /**
         * Sets the value. A status and further information will be returned.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        ValueClient.prototype.setForDetails = function (value, message) {
            if (typeof this._setter !== "function")
                return DataSense.ChangedInfo.fail(null, undefined, value, "not implemented");
            return this._setter(value, message);
        };
        /**
         * Sets a value by a Promise.
         * @param value  A Promise of the property to set.
         * @param compatible  true if the value can also be a non-Promise; otherwise, false.
         * @param message  A message for the setting event.
         */
        ValueClient.prototype.setPromise = function (value, compatible, message) {
            var _this = this;
            return DataSense.Access.setPromise(function (value, message) {
                return _this.setForDetails(value, message);
            }, value, compatible, message);
        };
        /**
         * Sets a value by an observable which can be subscribed.
         * @param value  A Promise of the property to set.
         * @param message  A message for the setting event.
         * @param callbackfn  A function will be called on subscribed.
         */
        ValueClient.prototype.setSubscribe = function (value, message, callbackfn, thisArg) {
            var _this = this;
            return DataSense.Access.setSubscribe(function (value, message) {
                return _this.setForDetails(value, message);
            }, value, message, callbackfn, thisArg);
        };
        /**
         * Forces to notify the update event.
         * @param message  A message for the setting event.
         */
        ValueClient.prototype.forceUpdate = function (message) {
            if (typeof this._forceUpdate !== "function")
                return;
            this._forceUpdate(message);
        };
        /**
         * Send a notification.
         * @param data  The data.
         * @param message  A message for the setting event.
         */
        ValueClient.prototype.sendNotify = function (data, message) {
            this._sendNotify(data, message);
        };
        /**
         * Registers a handler to respond the request message.
         * @param type  The request type.
         * @param h  The handler to respond the request message.
         */
        ValueClient.prototype.registerRequestHandler = function (type, h) {
            if (typeof this._registerRequestHandler !== "function")
                return false;
            return this._registerRequestHandler(type, h);
        };
        return ValueClient;
    }(ValueObservable));
    DataSense.ValueClient = ValueClient;
    /**
     * Data observable and controller.
     */
    var ValueController = /** @class */ (function (_super) {
        __extends(ValueController, _super);
        /**
         * Initializes a new instance of the ValueController class.
         */
        function ValueController() {
            var _this = this;
            var a;
            _this = _super.call(this, function (acc) { return a = acc; }) || this;
            _this._accessor = a;
            return _this;
        }
        Object.defineProperty(ValueController.prototype, "formatter", {
            /**
             * Gets the formatter/convertor.
             */
            get: function () {
                return this._accessor.getFormatter();
            },
            /**
             * Sets the formatter/convertor.
             */
            set: function (h) {
                this._accessor.setFormatter(h);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ValueController.prototype, "validator", {
            /**
             * Gets the validator.
             */
            get: function () {
                return this._accessor.getValidator();
            },
            /**
             * Sets the validator.
             */
            set: function (h) {
                this._accessor.setValidator(h);
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Sets value.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        ValueController.prototype.set = function (value, message) {
            var info = this._accessor.set(value, message);
            return info ? info.success : false;
        };
        /**
         * Sets the value. A status and further information will be returned.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        ValueController.prototype.setForDetails = function (value, message) {
            return this._accessor.set(value, message);
        };
        /**
         * Sets a value by a Promise.
         * @param value  A Promise of the property to set.
         * @param compatible  true if the value can also be a non-Promise; otherwise, false.
         * @param message  A message for the setting event.
         */
        ValueController.prototype.setPromise = function (value, compatible, message) {
            var _this = this;
            return DataSense.Access.setPromise(function (value, message) {
                return _this.setForDetails(value, message);
            }, value, compatible, message);
        };
        /**
         * Sets a value by an observable which can be subscribed.
         * @param value  A Promise of the property to set.
         * @param message  A message for the setting event.
         * @param callbackfn  A function will be called on subscribed.
         */
        ValueController.prototype.setSubscribe = function (value, message, callbackfn, thisArg) {
            var _this = this;
            return DataSense.Access.setSubscribe(function (value, message) {
                return _this.setForDetails(value, message);
            }, value, message, callbackfn, thisArg);
        };
        /**
         * Forces to notify the update event.
         * @param message  A message for the setting event.
         */
        ValueController.prototype.forceUpdate = function (message) {
            this._accessor.forceUpdate(message);
        };
        /**
         * Registers a handler to respond the request message.
         * @param type  The request type.
         * @param h  The handler to respond the request message.
         */
        ValueController.prototype.registerRequestHandler = function (type, h) {
            return this._accessor.registerRequestHandler(type, h);
        };
        /**
         * Start to observe an observable value.
         * @param notSyncNow  true if keep current value unless call syncFromObserved member method of this or the observable value is changed; otherwise false.
         * @param message  A message for the setting event.
         */
        ValueController.prototype.observe = function (value, notSyncNow, message) {
            if (!(value instanceof ValueObservable))
                return {
                    sync: function () { },
                    dispose: function () { }
                };
            this._observing = value.registerChangeFlow(this._accessor.customizedSet);
            if (!notSyncNow)
                this._accessor.customizedSet(value.get(), message).resolve();
            return this._observing;
        };
        /**
         * Stops observing.
         */
        ValueController.prototype.stopObserving = function () {
            var disposeObserving = this._observing;
            if (!disposeObserving)
                return;
            delete this._observing;
            if (typeof disposeObserving.dispose === "function")
                disposeObserving.dispose();
        };
        /**
         * Updates the value from the observed value.
         * @param message  A message for the setting event.
         */
        ValueController.prototype.syncFromObserved = function (message) {
            var disposeObserving = this._observing;
            if (!disposeObserving || typeof disposeObserving.sync !== "function")
                return false;
            disposeObserving.sync(message);
            return true;
        };
        /**
         * Gets a value indicating whether it is observing another observable value.
         */
        ValueController.prototype.isObserving = function () {
            return !!this._observing;
        };
        /**
         * Creates a controller client.
         */
        ValueController.prototype.createClient = function () {
            var _this = this;
            var token;
            var sendRequest = function (type, value) {
                _this.sendRequest(type, value);
            };
            var sendBroadcast = function (data, message) {
                _this.sendBroadcast(data, message);
            };
            var client = new ValueClient(this.get(), function (modifier) {
                token = _this.onChanging(function (ev, evController) {
                    var updateToken = modifier(ev.valueRequest, evController.message);
                    if (!ev.observable)
                        return;
                    ev.observable.onResolved(function (newValue) {
                        updateToken.resolve(newValue);
                    });
                    ev.observable.onRejected(function (err) {
                        updateToken.reject(err);
                    });
                });
            }, function (value, message) {
                return _this.setForDetails(value, message);
            }, this._accessor.sendNotify, this._accessor.registerRequestHandler, {
                broadcastReceived: this.broadcastReceived.createObservable(),
                notifyReceived: this.notifyReceived.createObservable(),
                sendRequest: sendRequest,
                sendBroadcast: sendBroadcast
            }, function (message) {
                _this.forceUpdate(message);
            });
            client.pushDisposable(token);
            this.pushDisposable(client);
            return client;
        };
        /**
         * Send a notification.
         * @param data  The data.
         * @param message  The additional information which will pass to the event listener handler.
         */
        ValueController.prototype.sendNotify = function (data, message) {
            this._accessor.sendNotify(data, message);
        };
        return ValueController;
    }(ValueObservable));
    DataSense.ValueController = ValueController;
    /**
     * Creates a value controller with accessor and observable.
     * @param value  The optional initialized value.
     * @returns  The value controller with accessor and observable.
     */
    function createValue(value) {
        var p = new ValueController();
        if (arguments.length > 0)
            p.set(value);
        return p;
    }
    DataSense.createValue = createValue;
})(DataSense || (DataSense = {}));
