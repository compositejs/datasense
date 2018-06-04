namespace DataSense {

    var inner = {
        eventPrefix: "ev-"
    };

    export type ChangeActionContract = "add" | "remove" | "update" | "delta" | "none" | "invalid" | "unknown";

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
        delay?: number | boolean | DelayOptionsContract;
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
    }

    export interface EventRegisterResultContract<T> extends DisposableContract {
        readonly key: string,
        readonly count: number,
        readonly registerDate: Date,
        fire(ev: T, message?: string): void
    }

    export interface AnyEventRegisterResultContract extends DisposableContract {
        readonly count: number,
        readonly registerDate: Date,
        fire(key: string, ev: any, message?: string): void
    }

    export class EventObservable implements DisposableArrayContract {
        private _instance: {
            push(key: string, obj: any): number,
            remove(key: string, obj?: any): number,
            fire(key: string, ev: any, message: string, obj?: any): void
        } & DisposableArrayContract;

        public constructor(firer: EventObservable | ((fire: (key: string, ev: any, message?: string) => void) => void)) {
            var disposable = new DisposableArray();
            if ((firer instanceof EventObservable) && firer._instance) {
                this._instance = {
                    ...firer._instance,
                    pushDisposable(...items) {
                        return disposable.pushDisposable(...items);
                    },
                    dispose() {
                        disposable.dispose();
                    }
                };
                return;
            }

            var store: any = {};
            var furtherHandlers: any[] = [];
            var remove = (key: string, obj: any) => {
                if (key === null) {
                    if (obj) return Collection.remove(furtherHandlers, obj);
                    var count2 = furtherHandlers.length;
                    furtherHandlers = [];
                    return count2;
                }

                if (typeof key !== "string" || !key) return 0;
                key = inner.eventPrefix + key;
                if (obj) return Collection.remove(store[key], obj);
                if (!store[key]) return 0;
                var count = store[key].length;
                store[key] = [];
                return count;
            };
            var process = (key: string, obj: {
                h: ((ev: any, controller: EventHandlerControllerContract) => void)[],
                thisArg: any,
                options: EventOptionsContract,
                isInvalid: boolean,
                time: Date,
                latestFireDate: Date,
                count: number
            }, ev: any, message: string, further: boolean) => {
                if (obj.isInvalid) return;
                var isInvalid = false;
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
                    setTimeout(() => {
                        remove(!further ? key : null, obj);
                    }, 0);
                    if (!obj.options.invalidForNextTime) return;
                }

                if (obj.count < Number.MAX_SAFE_INTEGER) obj.count++;
                obj.h.forEach(h => {
                    if (typeof h !== "function") return;
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
                            return message;
                        },
                        dispose() {
                            remove(key, obj);
                        }
                    } as EventHandlerControllerContract);
                });
            };

            this._instance = {
                push(key, obj) {
                    if (!obj) return 0;
                    if (key === null) return furtherHandlers.push(obj);
                    if (typeof key !== "string" || !key) return 0;
                    key = inner.eventPrefix + key;
                    if (!store[key]) store[key] = [];
                    return (store[key] as any[]).push(obj);
                },
                remove(key, obj) {
                    return remove(key, obj);
                },
                fire(key, ev, message, obj) {
                    if (typeof key !== "string" || !key) return;
                    key = inner.eventPrefix + key;
                    if (!store[key]) return;
                    if (obj) {
                        if ((store[key] as any[]).indexOf(obj) < 0) {
                            if (furtherHandlers.indexOf(obj) < 0) return;
                            obj.latestFireDate = new Date();
                            process(key, obj, ev, message, true);
                            return;
                        }

                        obj.latestFireDate = new Date();
                        process(key, obj, ev, message, false);
                    } else {
                        obj.latestFireDate = new Date();
                        (store[key] as any[]).forEach(item => {
                            process(key, item, ev, message, false);
                        });
                        furtherHandlers.forEach(item => {
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
            h: EventHandlerContract<any> | EventHandlerContract<any>[],
            thisArg?: any,
            options?: EventOptionsContract,
            disposableArray?: DisposableArrayContract
        ): EventRegisterResultContract<T> {
            if (!h) h = [];
            if (!(h instanceof Array)) h = [h];
            if (!key || typeof key !== "string" || !h || !h.length) {
                var now = new Date();
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
                    fire(ev: T, message?: string) {},
                    dispose() {}
                };
            }

            if (!options) options = {};
            var obj = { h, thisArg, options, time: new Date(), count: 0 };
            this._instance.push(key, obj);
            var result: EventRegisterResultContract<T> = {
                get key() {
                    return key;
                },
                get count() {
                    return obj.count;
                },
                get registerDate() {
                    return obj.time;
                },
                fire(ev: T, message?: string) {
                    this._instance.fire(key, ev, obj, message);
                },
                dispose() {
                    this._instance.remove(key, obj);
                }
            };
            this._instance.pushDisposable(result);
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
            var obj = { h, thisArg, options, time: new Date(), count: 0 };
            this._instance.push(null, obj);
            var result: AnyEventRegisterResultContract = {
                get count() {
                    return obj.count;
                },
                get registerDate() {
                    return obj.time;
                },
                fire(key: string, ev: any, message?: string) {
                    this._instance.fire(key, ev, obj, message);
                },
                dispose() {
                    this._instance.remove(null, obj);
                }
            };
            this._instance.pushDisposable(result);
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
            var result: any;
            if (typeof h !== "function") {
                result = function () {};
                result.dispose = function () {};
                return result;
            }

            var dispose = this.onAny(ev => {
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
            var result: any;
            if (typeof h !== "function") {
                result = function () {};
                result.dispose = function () {};
                return result;
            }

            var dispose = this.on(key, ev => {
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
                fire(ev: any, message?: string) {},
                dispose() {}
            };
        }

        public static createNothingSubscribe(): SubscriberCompatibleResultContract {
            var result: any = function () {};
            result.dispose = function () {};
            return result;
        }
    }

    export class SingleEventObservable<T> implements DisposableArrayContract {
        private _disposable = new DisposableArray();
        private _eventObservable: EventObservable;

        constructor(eventObservable: EventObservable, public key: string) {
            this._eventObservable = eventObservable && eventObservable instanceof EventObservable ? eventObservable : new EventObservable(null);
        }

        public pushDisposable(...items: DisposableContract[]) {
            return this._disposable.pushDisposable(...items);
        }

        public on(
            h: EventHandlerContract<any> | EventHandlerContract<any>[],
            thisArg?: any,
            options?: EventOptionsContract,
            disposableArray?: DisposableArrayContract
        ): EventRegisterResultContract<T> {
            var result = this._eventObservable.on(this.key, h, thisArg, options, disposableArray);
            this._disposable.push(result);
            return result;
        }

        public once<T>(
            h: EventHandlerContract<any> | EventHandlerContract<any>[],
            thisArg?: any
        ) {
            var result = this._eventObservable.once<T>(this.key, h, thisArg);
            this._disposable.push(result);
            return result;
        }

        public subscribe(h: (newValue: T) => void, thisArg?: any): SubscriberCompatibleResultContract {
            var result = this._eventObservable.subscribeSingle<T>(this.key, h, thisArg);
            this._disposable.push(result);
            return result;
        }

        public createObservable() {
            return new SingleEventObservable(this._eventObservable, this.key);
        }

        public dispose() {
            this._disposable.dispose();
        }
    }

    export class EventController extends EventObservable {
        private _fireHandler: (key: string, ev: any, message?: string) => void;

        constructor() {
            super(fire => {
                this._fireHandler = fire;
            });
        }

        fire(key: string, ev: any, message?: string): void {
            this._fireHandler(key, ev, message);
        }
    }

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
                this._result = { ...executor._result };
                return;
            }

            if (typeof executor !== "function") return;
            var resolveH: any, rejectH: any;
            this.promise = new Promise<T>((resolve, reject) => {
                resolveH = resolve;
                rejectH = reject;
            });
            var process = (success: boolean, value: any) => {
                if (this._result.success !== undefined) return;
                var list: OccurModelContract<T>[];
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
                    if (item.delay === false) item.h.call(value);
                    else setTimeout(() => {
                        item.h.call(value);
                    }, item.delay === true ? 0 : item.delay);
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
            setTimeout(() => {
                this.onResolved(h, thisArg, delay);
            });
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
            setTimeout(() => {
                this.onRejected(h, thisArg, delay);
            });
        }

        public then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null) {
            return this.promise.then(onfulfilled, onrejected);
        }

        public createObservable() {
            return new OnceObservable<T>(this);
        }
    }

    export class OnceController<T> extends OnceObservable<T> {
        private _instance: {
            resolve(value: T): void,
            reject(err: any): void
        };

        constructor() {
            super((resolve, reject) => {
                this._instance ={
                    resolve: resolve,
                    reject: reject
                };
            })
        }

        resolve(value: T) {
            this._instance.resolve(value);
        }

        reject(err: any) {
            this._instance.reject(err);
        }
    }

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
            var index = -1;
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
