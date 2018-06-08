namespace DataSense {

export type ChangeActionContract = "add" | "remove" | "update" | "delta" | "none" | "invalid" | "unknown";

export interface FireInfoContract {
    message?: string,
    source?: string,
    data?: any
}

export interface ChangedInfoContract<T> {
    key?: string;
    action: ChangeActionContract;
    value: T;
    oldValue: T;
    valueRequested: T;
    success: boolean | undefined;
    error?: any;
}

export interface ChangingInfoSetContract {
    changes: ChangingInfo<any>[];
}

export interface ChangedInfoSetContract {
    changes: ChangedInfo<any>[];
}

export type EventHandlerContract<T> = (ev: T, controller: EventHandlerControllerContract) => void;

export type OccurModelContract<T> = { h: (value: T) => void, thisArg: any, delay: boolean | number };

export interface EventOptionsContract {
    delay?: number | boolean;
    invalid?: number | boolean | ((ev: any) => boolean);
    invalidForNextTime?: boolean;
    arg?: any;
}

export interface EventHandlerControllerContract extends DisposableContract {
    readonly key: string;
    readonly count: number;
    readonly fireDate: Date;
    readonly registerDate: Date;
    readonly arg: any;
    readonly message: string;
    readonly source: string;
    readonly additional: any;
}

export interface EventRegisterResultContract<T> extends DisposableContract {
    readonly key: string,
    readonly count: number,
    readonly registerDate: Date,
    fire(ev: T, message?: FireInfoContract | string): void
}

export interface AnyEventRegisterResultContract extends DisposableContract {
    readonly count: number,
    readonly registerDate: Date,
    fire(key: string, ev: any, message?: FireInfoContract | string): void
}

/**
 * Event observable.
 */
export class EventObservable implements DisposableArrayContract {
    private readonly _instance: {
        push(key: string, obj: any): number,
        remove(key: string, obj?: any): number,
        fire(key: string, ev: any, message?: FireInfoContract | string, obj?: any): void
    } & DisposableArrayContract;

    public readonly hasKeyMap: boolean;

    /**
     * Initializes a new instance of the EventObservable class.
     * @param firer  The handler to fire.
     */
    public constructor(firer: EventObservable | ((fire: (key: string, ev: any, message?: FireInfoContract | string) => void) => void), mapKey?: string | ((key: string) => string)) {
        let disposable = new DisposableArray();
        let getKey = (key: string) => {
            if (!mapKey || !key || typeof key !== "string") return key;
            if (typeof mapKey === "function") return mapKey(key);
            if (typeof mapKey === "string") return mapKey.replace("{0}", key).replace("{0}", key).replace("{0}", key);
            return key;
        };
        if ((firer instanceof EventObservable) && firer._instance) {
            this.hasKeyMap = !!mapKey || firer.hasKeyMap;
            this._instance = {
                push(key, obj) {
                    var keyMapped = getKey(key);
                    if (keyMapped && keyMapped !== key) {
                        if (obj) obj.key = key;
                        else obj = { key };
                    }

                    return typeof firer._instance.push === "function" ? firer._instance.push(keyMapped, obj) : 0;
                },
                remove(key, obj?) {
                    return typeof firer._instance.remove === "function" ? firer._instance.remove(getKey(key), obj) : 0;
                },
                fire(key, ev, message?, obj?) {
                    if (typeof firer._instance.fire === "function") firer._instance.fire(getKey(key), ev, message, obj);
                },
                pushDisposable(...items) {
                    return disposable.pushDisposable(...items);
                },
                dispose() {
                    disposable.dispose();
                }
            };
            firer.pushDisposable(this);
            return;
        }

        this.hasKeyMap = !!mapKey;
        let store: any = {};
        let furtherHandlers: any[] = [];
        let remove = (key: string, obj: any) => {
            if (key === null) {
                if (obj) return Collection.remove(furtherHandlers, obj);
                let count2 = furtherHandlers.length;
                furtherHandlers = [];
                return count2;
            }

            if (typeof key !== "string" || !key) return 0;
            if (obj) return Collection.remove(store[key], obj);
            if (!store[key]) return 0;
            let count = store[key].length;
            store[key] = [];
            return count;
        };
        let process = (key: string, obj: {
            h: ((ev: any, controller: EventHandlerControllerContract) => void)[],
            key: string,
            thisArg: any,
            options: EventOptionsContract,
            isInvalid: boolean,
            time: Date,
            latestFireDate: Date,
            count: number
        }, ev: any, message: FireInfoContract | string, removing: KeyValueContract<any>[], further: boolean) => {
            if (obj.isInvalid) return;
            let isInvalid = false;
            if (obj.options.invalid) {
                if (obj.options.invalid === true) {
                    isInvalid = true;
                } else if (typeof obj.options.invalid === "number") {
                    if (obj.options.invalid <= obj.count) isInvalid = true;
                } else if (typeof obj.options.invalid === "function") {
                    isInvalid = obj.options.invalid(ev);
                }
            }

            if (isInvalid) {
                obj.isInvalid = true;
                removing.push({ key: !further ? key : null, value: obj });
                if (!obj.options.invalidForNextTime) return;
            }

            if (obj.count < Number.MAX_SAFE_INTEGER) obj.count++;
            let fireObj = typeof message === "string" ? { message } : (message || {});
            let working = true;
            HitTask.debounce(() => {
                obj.h.forEach(h => {
                    if (typeof h !== "function") return;
                    h.call(obj.thisArg, ev, {
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
                            if (working) removing.push({ key: !further ? key : null, value: obj });
                            else remove(key, obj);
                        }
                    } as EventHandlerControllerContract);
                });
            }, obj.options.delay);
            working = false;
        };

        this._instance = {
            push(key, obj) {
                if (!obj) return 0;
                if (key === null) return furtherHandlers.push(obj);
                if (typeof key !== "string" || !key) return 0;
                if (!store[key]) store[key] = [];
                return (store[key] as any[]).push(obj);
            },
            remove(key, obj) {
                return remove(key, obj);
            },
            fire(key, ev, message, obj) {
                if (typeof key !== "string" || !key) return;
                if (!store[key]) return;
                let removing: KeyValueContract<any>[] = [];
                let removingToken = setTimeout(() => {
                    removing.forEach(removingItem => {
                        remove(removingItem.key, removingItem.value);
                    })
                }, 0);
                let removingH = () => {
                    clearTimeout(removingToken);
                    removing.forEach(removingItem => {
                        remove(removingItem.key, removingItem.value);
                    })
                };
                if (obj) {
                    if ((store[key] as any[]).indexOf(obj) < 0) {
                        if (furtherHandlers.indexOf(obj) < 0) {
                            clearTimeout(removingToken);
                            return;
                        }

                        obj.latestFireDate = new Date();
                        process(key, obj, ev, message, removing, true);
                        removingH();
                        return;
                    }

                    obj.latestFireDate = new Date();
                    process(key, obj, ev, message, removing, false);
                } else {
                    (store[key] as any[]).forEach(item => {
                        item.latestFireDate = new Date();
                        process(key, item, ev, message, removing, false);
                    });
                    furtherHandlers.forEach(item => {
                        item.latestFireDate = new Date();
                        process(key, item, ev, message, removing, true);
                    });
                }

                removingH();
            },
            pushDisposable(...items) {
                return disposable.pushDisposable(...items);
            },
            dispose() {
                store = {};
                disposable.dispose();
            }
        };

        if (typeof firer !== "function") return;
        firer((key, ev, message) => {
            this._instance.fire(key, ev, message);
        });
    }

    public pushDisposable(...items: DisposableContract[]) {
        return this._instance.pushDisposable(...items);
    }

    public on<T>(
        key: string,
        h: EventHandlerContract<T> | EventHandlerContract<T>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ): EventRegisterResultContract<T> {
        if (!h) h = [];
        if (!(h instanceof Array)) h = [h];
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
                fire(ev: T, message?: FireInfoContract | string) {},
                dispose() {}
            };
        }

        if (!options) options = {};
        let obj = { h, thisArg, options, time: new Date(), count: 0 };
        let implInstance = this._instance;
        implInstance.push(key, obj);
        let result: EventRegisterResultContract<T> = {
            get key() {
                return key;
            },
            get count() {
                return obj.count;
            },
            get registerDate() {
                return obj.time;
            },
            fire(ev: T, message?: FireInfoContract | string) {
                implInstance.fire(key, ev, message);
            },
            dispose() {
                implInstance.remove(key, obj);
            }
        };
        implInstance.pushDisposable(result);
        if (disposableArray) disposableArray.pushDisposable(result);
        return result;
    }

    public once<T>(
        key: string,
        h: EventHandlerContract<any> | EventHandlerContract<any>[],
        thisArg?: any
    ) {
        return this.on(key, h, thisArg, { invalid: 1 });
    }

    public onAny(
        h: EventHandlerContract<KeyValueContract<any>> | EventHandlerContract<KeyValueContract<any>>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract): AnyEventRegisterResultContract {
        if (!h) h = [];
        if (!(h instanceof Array)) h = [h];
        if (!options) options = {};
        let obj = { h, thisArg, options, time: new Date(), count: 0 };
        let implInstance = this._instance;
        implInstance.push(null, obj);
        let result: AnyEventRegisterResultContract = {
            get count() {
                return obj.count;
            },
            get registerDate() {
                return obj.time;
            },
            fire(key: string, ev: any, message?: FireInfoContract | string) {
                implInstance.fire(key, ev, message);
            },
            dispose() {
                implInstance.remove(null, obj);
            }
        };
        implInstance.pushDisposable(result);
        if (disposableArray) disposableArray.pushDisposable(result);
        return result;
    }

    public clearOn(key: string) {
        this._instance.remove(key);
    }

    public createSingleObservable<T>(key: string) {
        return new SingleEventObservable<T>(this, key);
    }

    public subscribeAny(
        h: (newValue: KeyValueContract<any>) => void,
        thisArg?: any
    ): SubscriberCompatibleResultContract {
        let result: any;
        if (typeof h !== "function") {
            result = function () {};
            result.dispose = function () {};
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

    public subscribeSingle<T>(
        key: string,
        h: (newValue: T) => void,
        thisArg?: any,
        convertor?: (newValue: any) => T
    ): SubscriberCompatibleResultContract {
        let result: any;
        if (typeof h !== "function") {
            result = function () {};
            result.dispose = function () {};
            return result;
        }

        let dispose = this.on(key, ev => {
            if (typeof convertor === "function") ev = convertor(ev);
            h.call(thisArg, ev);
        });
        this._instance.pushDisposable(dispose);
        result = function () {
            dispose.dispose();
        };
        result.dispose = dispose.dispose;
        return result;
    }

    public createObservable() {
        return new EventObservable(this);
    }

    public createMappedObservable(mapKey: string | ((key: string) => string)) {
        return new EventObservable(this, mapKey);
    }

    public dispose() {
        this._instance.dispose();
    }

    public static createFailedOnResult(key: string): EventRegisterResultContract<any> {
        return {
            get key() {
                return key;
            },
            get count() {
                return 0;
            },
            get registerDate(): Date {
                return undefined;
            },
            fire(ev: any, message?: FireInfoContract | string) {},
            dispose() {}
        };
    }

    public static createNothingSubscribe(): SubscriberCompatibleResultContract {
        let result: any = function () {};
        result.dispose = function () {};
        return result;
    }
}

export class SingleEventObservable<T> implements DisposableArrayContract {
    private _disposable = new DisposableArray();
    private _eventObservable: EventObservable;

    /**
     * Initializes a new instance of the SingleEventObservable class.
     * @param eventObservable  The event observable.
     * @param key  The event key.
     */
    constructor(eventObservable: EventObservable, public readonly key: string) {
        this._eventObservable = eventObservable && eventObservable instanceof EventObservable ? eventObservable : new EventObservable(null);
        eventObservable.pushDisposable(this);
    }

    public pushDisposable(...items: DisposableContract[]) {
        return this._disposable.pushDisposable(...items);
    }

    /**
     * Adds event listener.
     * @param h  The handler.
     * @param thisArg  this argument for calling handler.
     * @param options  The options to control how the handler processes.
     * @param disposabelArray  The disposable array used to push the listener result.
     */
    public on(
        h: EventHandlerContract<T> | EventHandlerContract<T>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ): EventRegisterResultContract<T> {
        let result = this._eventObservable.on(this.key, h, thisArg, options, disposableArray);
        this._disposable.push(result);
        return result;
    }

    /**
     * Adds event listener for one time raised.
     * @param h  The handler.
     * @param thisArg  this argument for calling handler.
     */
    public once<T>(
        h: EventHandlerContract<any> | EventHandlerContract<any>[],
        thisArg?: any
    ) {
        let result = this._eventObservable.once<T>(this.key, h, thisArg);
        this._disposable.push(result);
        return result;
    }

    public subscribe(h: (newValue: T) => void, thisArg?: any): SubscriberCompatibleResultContract {
        let result = this._eventObservable.subscribeSingle<T>(this.key, h, thisArg);
        this._disposable.push(result);
        return result;
    }

    public subscribeWithConvertor<TValue>(h: (newValue: TValue) => void, thisArg?: any, convertor?: (newValue: T) => TValue): SubscriberCompatibleResultContract {
        let result = this._eventObservable.subscribeSingle<TValue>(this.key, h, thisArg, convertor);
        this._disposable.push(result);
        return result;
    }

    public createObservable() {
        return new SingleEventObservable<T>(this._eventObservable, this.key);
    }

    /**
     * Disposes the instance.
     */
    public dispose() {
        this._disposable.dispose();
    }
}

/**
 * Event observable and controller.
 */
export class EventController extends EventObservable {
    private _fireHandler: (key: string, ev: any, message?: FireInfoContract | string) => void;

    constructor() {
        let f: (key: string, ev: any, message?: FireInfoContract | string) => void;
        super(fire => {
            f = fire;
        });
        this._fireHandler = f;
    }

    /**
     * Raises a specific event wth arugment.
     * @param key  The event key.
     * @param ev  The event argument.
     * @param message  The additional information.
     * @param delay  A span in millisecond to delay this raising.
     */
    fire(key: string, ev: any, message?: FireInfoContract | string, delay?: number | boolean): void {
        HitTask.debounce(() => {
            this._fireHandler(key, ev, message);
        }, delay);
    }
}

/**
 * The observable for resolving data.
 */
export class OnceObservable<T> {
    private _result: {
        success?: boolean,
        value?: any,
        resolved?: OccurModelContract<T>[],
        rejected?: OccurModelContract<T>[]
    } = {};

    public readonly promise: Promise<T>;

    constructor(executor: OnceObservable<T> | ((resolve: (value: T) => void, reject: (ex: any) => void) => void)) {
        if (executor instanceof OnceObservable) {
            this._result = executor._result;
            return;
        }

        if (typeof executor !== "function") return;
        let resolveH: Function, rejectH: Function;
        this.promise = new Promise<T>((resolve, reject) => {
            resolveH = resolve;
            rejectH = reject;
        });
        let process = (success: boolean, value: any) => {
            if (this._result.success !== undefined) return;
            let list: OccurModelContract<T>[];
            if (success) {
                this._result.value = value;
                this._result.success = true;
                list = this._result.resolved;
            } else {
                this._result.value = value;
                this._result.success = false;
                list = this._result.rejected;
            }

            delete this._result.resolved;
            delete this._result.rejected;
            if (!list) return;
            list.forEach(item => {
                HitTask.debounce(() => {
                    item.h.call(item.thisArg, value);
                }, item.delay);
            });
        };
        executor(value => {
            process(true, value);
            if (typeof resolveH === "function") resolveH(value);
        }, err => {
            process(false, err);
            if (typeof rejectH === "function") rejectH(err);
        });
    }

    public isPending() {
        return this._result.success === undefined;
    }

    public isSuccess() {
        return this._result.success === true;
    }

    public isFailed() {
        return this._result.success === false;
    }

    public onResolved(h: (value: T) => void, thisArg?: any, delay?: boolean | number) {
        if (this._result.success === true) {
            h.call(thisArg, this._result.value);
            return;
        }

        if (this._result.success === false) return;
        if (!this._result.resolved) this._result.resolved = [];
        this._result.resolved.push({ h, delay, thisArg });
    }

    public onResolvedLater(h: (value: T) => void, thisArg?: any, delay?: boolean | number) {
        HitTask.debounce(() => {
            this.onResolved(h, thisArg, delay);
        }, true);
    }

    public onRejected(h: (value: T) => void, thisArg?: any, delay?: boolean | number) {
        if (this._result.success === false) {
            h.call(thisArg, this._result.value);
            return;
        }

        if (this._result.success === true) return;
        if (!this._result.rejected) this._result.rejected = [];
        this._result.rejected.push({ h, delay, thisArg });
    }

    public onRejectedLater(h: (value: T) => void, thisArg?: any, delay?: boolean | number) {
        HitTask.debounce(() => {
            this.onRejected(h, thisArg, delay);
        }, true);
    }

    public then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null) {
        return this.promise.then(onfulfilled, onrejected);
    }

    public createObservable() {
        return new OnceObservable<T>(this);
    }
}

/**
 * The observable and controller for resolving data.
 */
export class OnceController<T> extends OnceObservable<T> {
    private _instance: {
        resolve(value: T): void,
        reject(err: any): void
    };

    constructor() {
        let a: {
            resolve(value: T): void,
            reject(err: any): void
        };
        super((resolve, reject) => {
            a = {
                resolve: resolve,
                reject: reject
            };
        });
        this._instance = a;
    }

    /**
     * Sets the result data.
     * @param value  The data value.
     */
    resolve(value: T) {
        this._instance.resolve(value);
    }

    /**
     * Sets the error information.
     * @param err  The exception or error information data.
     */
    reject(err: any) {
        this._instance.reject(err);
    }
}

/**
 * The information for data changing.
 */
export class ChangingInfo<T> {
    constructor(
        public readonly key: string,
        public readonly currentValue: T,
        public readonly valueRequest: T,
        public readonly observable?: OnceObservable<T>,
        public readonly action?: "add" | "update" | "delete" | "unknown"
    ) {
        if (!action) this.action = "update";
    }
}

/**
 * The information for data changed.
 */
export class ChangedInfo<T> {
    constructor(
        public readonly key: string,
        public readonly action: ChangeActionContract,
        public readonly success: boolean | undefined,
        public readonly value: T,
        public readonly oldValue: T,
        public readonly valueRequest: T,
        public readonly error?: any
    ) {}

    public static success<T>(key: string, value: T, oldValue: T, action?: ChangeActionContract | boolean, valueRequest?: T, error?: any) {
        if (!action) {
            if (key) {
                if (value === oldValue) action = "none";
                else if (value === undefined) action = "add";
                else if (oldValue === undefined) action = "remove";
                else action = "update";
            } else {
                action = value === oldValue ? "none" : "update";
            }
        } else if (action === true) {
            action = value === oldValue ? "none" : "update";
        }

        return new ChangedInfo<T>(key, action, true, value, oldValue, arguments.length > 4 ? valueRequest : value, error);
    }

    public static fail<T>(key: string, value: T, valueRequest: T, error?: any) {
        return new ChangedInfo<T>(key, "none", false, value, value, valueRequest, error);
    }

    public static push(list: ChangedInfo<any>[], ...items: ChangedInfo<any>[]): void {
        if (!list) return;
        let index = -1;
        items.forEach(item => {
            if (!item || !item.key) return;
            list.some((test, i) => {
                if (test.key !== item.key) return false;
                index = i;
                return true;
            });
            if (index >= 0) list[index] = item;
            else list.push(item);
        });
    }
}

}
