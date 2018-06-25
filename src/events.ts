namespace DataSense {

export type ChangeActionContract = "add" | "remove" | "update" | "delta" | "none" | "invalid" | "unknown";

export type EventHandlerContract<T> = (ev: T, controller: EventListenerControllerContract) => void;

export type OccurModelContract<T> = { h: (value: T) => void, thisArg: any, delay: boolean | number };

export type FireContract = (key: string, ev: any, message?: FireInfoContract | string) => void;

export type OnAnyContract = (
    h: EventHandlerContract<KeyValueContract<any>> | EventHandlerContract<KeyValueContract<any>>[],
    thisArg?: any,
    options?: EventOptionsContract
) => AnyEventRegisterResultContract;

/**
 * The additional information which will pass to the event handler argument.
 */
export interface FireInfoContract {

    /**
     * An additional message.
     */
    message?: string,

    /**
     * Sender source string.
     */
    source?: string,

    /**
     * The additional data.
     */
    addition?: any
}

/**
 * The changed information.
 */
export interface ChangedInfoContract<T> {

    /**
     * The property key; or null or undefined for the object itself.
     */
    key?: string;

    /**
     * The change state.
     */
    action: ChangeActionContract;

    /**
     * The current value changed.
     */
    value: T;

    /**
     * The old value before changing.
     */
    oldValue: T;

    /**
     * A value request to change. This value might be changed to set.
     */
    valueRequested: T;

    /**
     * true if change succeeded; or false if failed; or undefined if it is still pending to change.
     */
    success: boolean | undefined;

    /**
     * The error information.
     */
    error?: any;
}

/**
 * The changing set information.
 */
export interface ChangingInfoSetContract {

    /**
     * The change list.
     */
    changes: ChangingInfo<any>[];
}

/**
 * The changing set information.
 */
export interface ChangedInfoSetContract {

    /**
     * The change list.
     */
    changes: ChangedInfo<any>[];
}

/**
 * The event options.
 */
export interface EventOptionsContract extends HitTaskOptionsContract {

    /**
     * true if raise for once only;
     * or false or null or undefined (by default) to keep alive;
     * or a number to set a maximum count limitation to raise;
     * or a function to return a boolean indicating whether dispose the event listener.
     */
    invalid?: number | boolean | ((ev: any) => boolean);

    /**
     * A value indicating whether postpone disposing.
     * true if dispose after raising for current time; otherwise, false or null or undefined (by default).
     */
    invalidForNextTime?: boolean;

    /**
     * An argument which will be passed to the event listener handler as an argument.
     */
    arg?: any;
}

/**
 * The event listener controller.
 */
export interface EventListenerControllerContract extends DisposableContract {
    /**
     * The event key.
     */
    readonly key: string;

    /**
     * The original event key.
     */
    readonly originalKey: string;

    /**
     * The count raised.
     */
    readonly count: number;

    /**
     * The current date raised.
     */
    readonly fireDate: Date;

    /**
     * The date railed latest.
     */
    readonly latestFireDate: Date | undefined;

    /**
     * The date railed at last.
     */
    readonly lastFireDate: Date | undefined;

    /**
     * The date registered.
     */
    readonly registerDate: Date;

    /**
     * An argument passed from the firer.
     */
    readonly arg: any;

    /**
     * An additional message.
     */
    readonly message: string;

    /**
     * Sender source string.
     */
    readonly source: string;

    /**
     * The additional data.
     */
    readonly addition: any;

    /**
     * Checks if the given temp store data is existed.
     * @param propKey  The store data key.
     */
    hasStoreData(propKey: string): boolean,

    /**
     * Gets a specific temp store data.
     * @param propKey  The store data key.
     */
    getStoreData(propKey: string): any,

    /**
     * Sets a specific temp store data.
     * @param propKey  The store data key.
     * @param propValue  The store data value.
     */
    setStoreData(propKey: string, propValue: any): void,

    /**
     * Removes the specific temp store data.
     * @param propKey  The store data key.
     */
    removeStoreData(...propKey: string[]): number
}

export interface EventRegisterResultContract<T> extends DisposableArrayContract {
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

    /**
     * Gets a value indicating whether this is mapped to another event observable with different keys.
     */
    public readonly hasKeyMap: boolean;

    /**
     * Initializes a new instance of the EventObservable class.
     * @param firer  The handler to fire.
     */
    public constructor(firer: EventObservable | ((fire: FireContract, onAny: OnAnyContract) => void), mapKey?: string | ((key: string) => string)) {
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
                removeDisposable(...items) {
                    return disposable.removeDisposable(...items);
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
            task: HitTask,
            key: string,
            thisArg: any,
            invalid?: number | boolean | ((ev: any) => boolean);
            invalidForNextTime?: boolean;
            arg?: any;
            isInvalid: boolean,
            time: Date,
            latestFireDate: Date,
            store: any,
            count: number
        }, ev: any, message: FireInfoContract | string, removing: KeyValueContract<any>[], further: boolean) => {
            if (obj.isInvalid) return;
            let isInvalid = false;
            if (obj.invalid) {
                if (obj.invalid === true) {
                    isInvalid = true;
                } else if (typeof obj.invalid === "number") {
                    if (obj.invalid <= obj.count) isInvalid = true;
                } else if (typeof obj.invalid === "function") {
                    isInvalid = obj.invalid(ev);
                }
            }

            if (isInvalid) {
                obj.isInvalid = true;
                removing.push({ key: !further ? key : null, value: obj });
                if (!obj.invalidForNextTime) return;
            }

            let latestFireDate = obj.latestFireDate;
            let currentFireDate = obj.latestFireDate = new Date();
            if (obj.count < Number.MAX_SAFE_INTEGER) obj.count++;
            let fireObj = typeof message === "string" ? { message } : (message || {});
            let working = true;
            obj.task.process({
                ev,
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
                    hasStoreData(propKey: string) {
                        return (obj.store as Object).hasOwnProperty(propKey);
                    },
                    getStoreData(propKey: string) {
                        return obj.store[propKey];
                    },
                    setStoreData(propKey: string, propValue: any) {
                        obj.store[propKey] = propValue;
                    },
                    removeStoreData(...propKey: string[]) {
                        let deltaCount = 0;
                        propKey.forEach(propKeyItem => {
                            if (!propKeyItem || typeof propKeyItem !== "string") return;
                            deltaCount++;
                            delete obj.store[propKeyItem];
                        });
                        return deltaCount;
                    },
                    dispose() {
                        if (working) removing.push({ key: !further ? key : null, value: obj });
                        else remove(key, obj);
                    }
                } as EventListenerControllerContract
            });
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

                        process(key, obj, ev, message, removing, true);
                        removingH();
                        return;
                    }

                    process(key, obj, ev, message, removing, false);
                } else {
                    (store[key] as any[]).forEach(item => {
                        process(key, item, ev, message, removing, false);
                    });
                    furtherHandlers.forEach(item => {
                        process(key, item, ev, message, removing, true);
                    });
                }

                removingH();
            },
            pushDisposable(...items) {
                return disposable.pushDisposable(...items);
            },
            removeDisposable(...items) {
                return disposable.removeDisposable(...items);
            },
            dispose() {
                store = {};
                disposable.dispose();
            }
        };

        if (typeof firer !== "function") return;
        let implInstance = this._instance;
        firer((key, ev, message) => {
            implInstance.fire(key, ev, message);
        }, (h, thisArg, options) => {
            if (!h) h = [];
            if (!(h instanceof Array)) h = [h];
            if (!options) options = {};
            let task = new HitTask();
            task.setOptions({
                delay: options.delay,
                mergeMode: options.mergeMode,
                span: options.span,
                minCount: options.minCount,
                maxCount: options.maxCount
            });
            task.pushHandler(ev => {
                (h as EventHandlerContract<KeyValueContract<any>>[]).forEach(handler => {
                    if (typeof handler === "function") handler(ev.ev, ev.c);
                });
            });
            let obj = {
                task,
                arg: options.arg,
                thisArg,
                invalid: options.invalid,
                invalidForNextTime: options.invalidForNextTime,
                time: new Date(),
                store: {},
                count: 0
            };
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
            return result;
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
     * Registers an event listener.
     * @param key  The event key.
     * @param h  The handler or handlers of the event listener.
     * @param thisArg  this arg.
     * @param options  The event listener options.
     * @param disposableArray  An additional disposable array instance for push current event handler.
     */
    public on<T>(
        key: string,
        h: EventHandlerContract<T> | EventHandlerContract<T>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ): EventRegisterResultContract<T> {
        if (!h) h = [];
        if (!(h instanceof Array)) h = [h];
        let disposableList = new DisposableArray();
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
                pushDisposable(...items) {
                    return disposableList.push(...items);
                },
                removeDisposable(...items) {
                    return disposableList.remove(...items);
                },
                dispose() {
                    disposableList.dispose();
                }
            };
        }

        if (!options) options = {};
        let task = new HitTask();
        task.setOptions({
            delay: options.delay,
            mergeMode: options.mergeMode,
            span: options.span,
            minCount: options.minCount,
            maxCount: options.maxCount
        });
        task.pushHandler(ev => {
            (h as EventHandlerContract<T>[]).forEach(handler => {
                if (typeof handler === "function") handler(ev.ev, ev.c);
            });
        });
        let obj = {
            task,
            arg: options.arg,
            thisArg,
            invalid: options.invalid,
            invalidForNextTime: options.invalidForNextTime,
            time: new Date(),
            store: {},
            count: 0
        };
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
            pushDisposable(...items) {
                return disposableList.push(...items);
            },
            removeDisposable(...items) {
                return disposableList.remove(...items);
            },
            dispose() {
                implInstance.remove(key, obj);
                disposableList.dispose();
            }
        };
        implInstance.pushDisposable(result);
        if (disposableArray) disposableArray.pushDisposable(result);
        return result;
    }

    /**
     * Registers an event listener that will be raised once at most.
     * @param key  The event key.
     * @param h  The handler or handlers of the event listener.
     * @param thisArg  this arg.
     */
    public once<T>(
        key: string,
        h: EventHandlerContract<any> | EventHandlerContract<any>[],
        thisArg?: any
    ) {
        return this.on(key, h, thisArg, { invalid: 1 });
    }

    /**
     * Clears all the specific event listeners
     * @param key  The event key.
     */
    public clearOn(key: string) {
        this._instance.remove(key);
    }

    /**
     * Creates a single event observable.
     * @param key  The event key.
     */
    public createSingleObservable<T>(key: string) {
        return new SingleEventObservable<T>(this, key);
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

        let dispose = this.on<T>(key, ev => {
            if (typeof convertor === "function") ev = convertor(ev);
            h.call(thisArg, ev);
        });
        result = function () {
            dispose.dispose();
        };
        result.dispose = dispose.dispose;
        return result;
    }

    /**
     * Creates an observable instance so that any event listeners and subscribers will be disposed automatically when that instance is disposed.
     */
    public createObservable() {
        return new EventObservable(this);
    }

    /**
     * Creates an observable instance so that any event listeners and subscribers will be disposed automatically when that instance is disposed.
     * @param mapKey  A string or a function to map keys.
     */
    public createMappedObservable(mapKey: string | ((key: string) => string)) {
        return new EventObservable(this, mapKey);
    }

    /**
     * Disposes the instance.
     */
    public dispose() {
        this._instance.dispose();
    }

    public static createFailedOnResult(key: string): EventRegisterResultContract<any> {
        let disposableList = new DisposableArray();
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
            pushDisposable(...items) {
                return disposableList.push(...items);
            },
            removeDisposable(...items) {
                return disposableList.remove(...items);
            },
            dispose() {
                disposableList.dispose();
            }
        };
    }

    /**
     * Creates an empty subscribe result.
     */
    public static createNothingSubscribe(): SubscriberCompatibleResultContract {
        let result: any = function () {};
        result.dispose = function () {};
        return result;
    }

    /**
     * Creates a single event observable for a specific element.
     */
    public static createForElement<T extends Event>(
        dom: HTMLElement,
        eventType: string | keyof HTMLElementEventMap
    ) {
        let event = new EventController();
        let listener = (ev: T) => {
            event.fire(eventType, ev);
        };
        dom.addEventListener(eventType, listener);
        let obs = event.createSingleObservable<T>(eventType);
        obs.pushDisposable({
            dispose() {
                dom.removeEventListener(eventType, listener);
            }
        });
        return obs;
    }
}

/**
 * The observable to focus on a single event.
 */
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

    /**
     * Adds disposable objects so that they will be disposed when this instance is disposed.
     * @param items  The objects to add.
     */
    public pushDisposable(...items: DisposableContract[]) {
        return this._disposable.pushDisposable(...items);
    }

    /**
     * Removes the ones added here.
     * @param items  The objects to remove.
     */
    public removeDisposable(...items: DisposableContract[]) {
        return this._disposable.removeDisposable(...items);
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

    /**
     * Subscribes event raised.
     * @param h  The callback.
     * @param thisArg  this argument for calling handler.
     */
    public subscribe(h: (newValue: T) => void, thisArg?: any): SubscriberCompatibleResultContract {
        let result = this._eventObservable.subscribeSingle<T>(this.key, h, thisArg);
        this._disposable.push(result);
        return result;
    }

    /**
     * Subscribes event raised.
     * @param h  The callback.
     * @param thisArg  this argument for calling handler.
     * @param convertor  A function to convert the event argument to the target data.
     */
    public subscribeWithConvertor<TValue>(h: (newValue: TValue) => void, thisArg?: any, convertor?: (newValue: T) => TValue): SubscriberCompatibleResultContract {
        let result = this._eventObservable.subscribeSingle<TValue>(this.key, h, thisArg, convertor);
        this._disposable.push(result);
        return result;
    }

    /**
     * Creates an observable instance.
     */
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
    private _fireHandler: FireContract;
    private _onAny: OnAnyContract;

    /**
     * Initializes a new instance of the EventController class.
     */
    constructor() {
        let f: FireContract;
        let o: OnAnyContract;
        super((fire, onAny) => {
            f = fire;
            o = onAny;
        });
        this._fireHandler = f;
        this._onAny = o;
    }

    /**
     * Raises a specific event wth arugment.
     * @param key  The event key.
     * @param ev  The event argument.
     * @param message  The additional information which will pass to the event listener handler.
     * @param delay  A span in millisecond to delay to raise.
     */
    public fire(key: string, ev: any, message?: FireInfoContract | string, delay?: number | boolean): void {
        HitTask.delay(() => {
            this._fireHandler(key, ev, message);
        }, delay);
    }

    public onAny(
        h: EventHandlerContract<KeyValueContract<any>> | EventHandlerContract<KeyValueContract<any>>[],
        thisArg?: any,
        options?: EventOptionsContract,
        disposableArray?: DisposableArrayContract
    ): AnyEventRegisterResultContract {
        let onResult = this._onAny(h, thisArg, options);
        if (disposableArray && typeof disposableArray.pushDisposable === "function") disposableArray.pushDisposable(onResult);
        return onResult;
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
        result = function () {
            dispose.dispose();
        };
        result.dispose = dispose.dispose;
        return result;
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

    /**
     * Initializes a new instance of the OnceObservable class.
     * @param executor  An executor to call resolve or reject.
     */
    constructor(executor: OnceObservable<T> | ((resolve: (value: T) => void, reject: (ex: any) => void) => void)) {
        if (executor instanceof OnceObservable) {
            this._result = executor._result;
            return;
        }

        if (typeof executor !== "function") return;
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
                HitTask.delay(() => {
                    item.h.call(item.thisArg, value);
                }, item.delay);
            });
        };
        executor(value => {
            process(true, value);
        }, err => {
            process(false, err);
        });
    }

    /**
     * Gets a value indicating whether it is pending.
     */
    public get isPending() {
        return this._result.success === undefined;
    }

    /**
     * Gets a value indicating whether it is successful.
     */
    public get isSuccessful() {
        return this._result.success === true;
    }

    /**
     * Gets a value indicating whether it is failed.
     */
    public get isFailed() {
        return this._result.success === false;
    }

    /**
     * Added a callback when the result is resolved.
     * @param h  The callback.
     * @param thisArg  this arg.
     * @param delay  A span in millisecond to delay to process.
     */
    public onResolved(h: (value: T) => void, thisArg?: any, delay?: boolean | number) {
        if (this._result.success === true) {
            h.call(thisArg, this._result.value);
            return;
        }

        if (this._result.success === false) return;
        if (!this._result.resolved) this._result.resolved = [];
        this._result.resolved.push({ h, delay, thisArg });
    }

    /**
     * Added a callback after a while. The callback will be called when the result is resolved.
     * @param h  The callback.
     * @param thisArg  this arg.
     * @param delay  A span in millisecond to delay to process.
     */
    public onResolvedLater(h: (value: T) => void, thisArg?: any, delay?: boolean | number) {
        HitTask.delay(() => {
            this.onResolved(h, thisArg, delay);
        }, true);
    }

    /**
     * Added a callback when the result is rejected.
     * @param h  The callback.
     * @param thisArg  this arg.
     * @param delay  A span in millisecond to delay to process.
     */
    public onRejected(h: (value: T) => void, thisArg?: any, delay?: boolean | number) {
        if (this._result.success === false) {
            h.call(thisArg, this._result.value);
            return;
        }

        if (this._result.success === true) return;
        if (!this._result.rejected) this._result.rejected = [];
        this._result.rejected.push({ h, delay, thisArg });
    }

    /**
     * Added a callback after a while. The callback will be called when the result is rejected.
     * @param h  The callback.
     * @param thisArg  this arg.
     * @param delay  A span in millisecond to delay to process.
     */
    public onRejectedLater(h: (value: T) => void, thisArg?: any, delay?: boolean | number) {
        HitTask.delay(() => {
            this.onRejected(h, thisArg, delay);
        }, true);
    }

    /**
     * Creates a promise instance.
     */
    public promise(): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.onResolved(resolve);
            this.onRejected(reject);
        });
    }

    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    public then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null) {
        return this.promise().then(onfulfilled, onrejected);
    }

    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    public catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null) {
        return this.promise().catch(onrejected);
    }

    /**
     * Creates an observable instance.
     */
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

    /**
     * Initializes a new instance of the OnceController class.
     */
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
    /**
     * Initializes a new instance of the ChangingInfo class.
     */
    constructor(
        public readonly key: string,
        public readonly currentValue: T,
        public readonly valueRequest: T,
        public readonly observable?: OnceObservable<T>,
        public readonly action?: "add" | "update" | "delete" | "unknown"
    ) {
        if (!action) this.action = "update";
    }

    /**
     * Added a callback when the result is resolved.
     * @param h  The callback.
     * @param thisArg  this arg.
     * @param delay  A span in millisecond to delay to process.
     */
    public onResolved(h: (value: T) => void, thisArg?: any, delay?: boolean | number) {
        if (this.observable) this.observable.onResolved(h, thisArg, delay);
    }

    /**
     * Added a callback when the result is rejected.
     * @param h  The callback.
     * @param thisArg  this arg.
     * @param delay  A span in millisecond to delay to process.
     */
    public onRejected(h: (value: T) => void, thisArg?: any, delay?: boolean | number) {
        if (this.observable) this.observable.onRejected(h, thisArg, delay);
    }
}

/**
 * The information for data changed.
 */
export class ChangedInfo<T> {
    /**
     * Initializes a new instance of the ChangedInfo class.
     */
    constructor(
        public readonly key: string,
        public readonly action: ChangeActionContract,
        public readonly success: boolean | undefined,
        public readonly value: T,
        public readonly oldValue: T,
        public readonly valueRequest: T,
        public readonly error?: any
    ) {}

    /**
     * Gets a value indicating whether the value has been changed.
     */
    public get hasChanged() {
        return this.oldValue === this.value;
    }

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
