declare namespace DataSense {
    type ValueModifierContract<T> = (newValue: T, message?: FireInfoContract | string) => ValueResolveContract<T>;
    interface ValueResolveContract<T> {
        isAborted?: boolean;
        resolve(finalValue?: T): void;
        reject(ex?: any): void;
        remove?(): void;
    }
    interface SimpleValueAccessorContract<T> {
        get(options?: GetterOptionsContract): T;
        set(value: T, message?: SetterOptionsContract | string): ChangedInfo<T> | undefined;
        forceUpdate(message?: FireInfoContract | string): void;
    }
    interface ValueAccessorContract<T> extends SimpleValueAccessorContract<T> {
        customizedSet(valueRequested: any, message?: SetterOptionsContract | string): ValueResolveContract<T>;
        getFormatter(): (value: any) => T;
        setFormatter(h: (value: any) => T): void;
        getValidator(): (value: T) => boolean;
        setValidator(h: (value: T) => boolean): void;
        getStore(storePropKey: string): any;
        setStore(storePropKey: string, value: any): void;
        removeStore(...storePropKey: string[]): void;
        sendNotify(data: any, message?: FireInfoContract | string): void;
    }
    interface RegisterRequestContract<T> {
        registerRequestHandler(type: string, h: (owner: T, value: any) => void): boolean;
    }
    type PropUpdateActionContract<T> = ({
        action: "delete";
        key: string | string[];
    } | {
        action: "init";
        value?: T;
        key: string;
        create?: () => T;
    } | {
        action: "set";
        key: string;
        value?: T;
    } | {
        action: "batch";
        value?: any;
    });
    interface PropDetailsContract<T> {
        hasValue: boolean;
        key: string;
        value: T;
        store: {
            [property: string]: any;
        };
        cacheOptions: CacheOptionsContract | undefined;
        updateTime: Date | undefined;
        requestHandlerTypes: string[];
        flowCount: number;
    }
    interface SimplePropsAccessorContract {
        hasProp(key: string): boolean;
        getProp(key: string, options?: GetterOptionsContract): any;
        setProp(key: string, value: any, message?: SetterOptionsContract | string): ChangedInfo<any>;
        removeProp(keys: string | string[], message?: FireInfoContract | string): number;
        batchProp(changeSet: any | PropUpdateActionContract<any>[], message?: FireInfoContract | string): void;
        forceUpdateProp(key: string, message?: FireInfoContract | string): void;
        getPropKeys(): string[];
    }
    interface PropsAccessorContract extends SimplePropsAccessorContract {
        getPropDetails<T>(key: string): PropDetailsContract<T>;
        customizedSetProp(key: string, valueRequested: any, message?: SetterOptionsContract | string): ValueResolveContract<any>;
        getFormatter(): (key: string, value: any) => any;
        setFormatter(h: (key: string, value: any) => any): void;
        getValidator(): (key: string, value: any) => boolean;
        setValidator(h: (key: string, value: any) => boolean): void;
        getPropStore(key: string, storePropKey: string): any;
        setPropStore(key: string, storePropKey: string, value: any): void;
        removePropStore(key: string, ...storePropKey: string[]): void;
        getPropUpdateTime(key: string): Date | undefined;
        sendPropNotify(key: string, data: any, message?: FireInfoContract | string): void;
        sendNotify(data: any, message?: FireInfoContract | string): void;
    }
    interface RegisterPropRequestContract<TProps, TValue> extends RegisterRequestContract<TProps> {
        registerPropRequestHandler(key: string, type: string, h: (owner: TValue, value: any) => void): boolean;
    }
    interface ChangeFlowRegisteredContract extends DisposableContract {
        readonly registeredDate: Date;
        readonly count: number;
        sync(message?: FireInfoContract | string): void;
    }
    interface CacheOptionsContract {
        formatRev?: number;
        tag?: any;
        expiresIn?: number | Date | null | undefined;
        handler?: (info: {
            value: any;
            formatRev: number | undefined;
            tag: any;
            expiration: Date | undefined;
            updated: Date;
        }) => boolean;
    }
    interface SetterOptionsContract extends FireInfoContract {
        cacheOptions?: CacheOptionsContract;
    }
    interface GetterOptionsContract {
        minFormatRev?: number;
        maxFormatRev?: number;
        ignoreExpires?: boolean;
        earliest?: Date;
        callback?: (details: PropDetailsContract<any>) => void;
    }
}
declare namespace DataSense.Access {
    function setPromise<T>(setter: (value: T, message?: FireInfoContract | string) => ChangedInfo<T>, value: Promise<T>, compatible?: boolean, message?: FireInfoContract | string): Promise<T>;
    function setSubscribe<T>(setter: (value: T, message?: FireInfoContract | string) => ChangedInfo<T>, value: SubscriberContract<T>, message?: FireInfoContract | string, callbackfn?: (ev: ChangedInfo<T>, message: FireInfoContract) => void, thisArg?: any): SubscriberResultContract;
    function propsAccessor(): {
        accessor: PropsAccessorContract & RegisterPropRequestContract<any, any>;
        pushFlows(key: string, ...flows: ValueModifierContract<any>[]): ChangeFlowRegisteredContract;
        clearFlows(key: string): number;
        sendPropRequest(key: string, type: string, data: any, owner: any): void;
        sendRequest(type: string, data: any, owner: any): void;
        sendPropBroadcast(key: string, data: any, message?: FireInfoContract | string): void;
        sendBroadcast(data: any, message?: FireInfoContract | string): void;
        propChanging: EventObservable;
        propChanged: EventObservable;
        propChangeFailed: EventObservable;
        propNotifyReceived: EventObservable;
        propBroadcastReceived: EventObservable;
        notifyReceived: SingleEventObservable<any>;
        broadcastReceived: SingleEventObservable<any>;
        anyPropChanging: SingleEventObservable<ChangingInfo<any>>;
        anyPropChanged: SingleEventObservable<ChangedInfo<any>>;
        anyPropChangeFailed: SingleEventObservable<ChangedInfo<any>>;
        emptyPropRequested: SingleEventObservable<{
            key: string;
        }>;
        propsChanged: SingleEventObservable<ChangedInfoSetContract>;
    };
}
declare namespace DataSense.Collection {
    type CompareConditionContract = string | number | ((a: any, b: any) => boolean);
    /**
     * Gets the index of the specific item in an array.
     * @param {Array} list  The array to find a specific item.
     * @param {*} item  The item for comparing.
     * @param {string | number | Function} compare  The property key; or, a function.
     */
    function findIndex(list: any[], item: any, compare?: CompareConditionContract): number;
    /**
     * Removes an item from given array.
     * @param {Array} originalList  The array to be merged.
     * @param {*} item  An item to remove.
     * @param {string | function} compare  The property key; or, a function.
     */
    function remove(list: any[], item: any, compare?: CompareConditionContract): number;
}
declare namespace DataSense {
    type SubscriberCompatibleResultContract = DisposableContract & (() => void);
    type SubscriberResultContract = DisposableContract | (() => void) | SubscriberCompatibleResultContract;
    /**
     * Disposable instance.
     */
    interface DisposableContract {
        /**
         * Disposes the instance.
         */
        dispose(): void;
    }
    interface KeyValueContract<T> {
        key: string;
        value: T;
    }
    interface SubscriberContract<T> {
        subscribe(h: (value: T) => void): SubscriberResultContract;
    }
    /**
     * Disposable container.
     */
    interface DisposableArrayContract extends DisposableContract {
        /**
         * Adds disposable objects so that they will be disposed when this instance is disposed.
         * @param items  The objects to add.
         */
        pushDisposable(...items: DisposableContract[]): number;
        /**
         * Removes the ones added here.
         * @param items  The objects to remove.
         */
        removeDisposable(...items: DisposableContract[]): number;
    }
    /**
     * A container for store and manage a number of disposable object.
     * @param items  The objects to add.
     */
    class DisposableArray implements DisposableArrayContract {
        private _list;
        /**
         * Adds disposable objects so that they will be disposed when this instance is disposed.
         * @param items  The objects to add.
         */
        push(...items: DisposableContract[]): number;
        /**
         * Adds disposable objects so that they will be disposed when this instance is disposed.
         * @param items  The objects to add.
         */
        pushDisposable(...items: DisposableContract[]): number;
        /**
         * Removes the ones added here.
         * @param items  The objects to remove.
         */
        remove(...items: DisposableContract[]): number;
        /**
         * Removes the ones added here.
         * @param items  The objects to remove.
         */
        removeDisposable(...items: DisposableContract[]): number;
        /**
         * Disposes the instance.
         */
        dispose(): void;
        /**
         * Disposes disposable instances.
         */
        static dispose(disposable: DisposableContract | DisposableContract[]): void;
    }
}
declare namespace DataSense {
    type ChangeActionContract = "add" | "remove" | "update" | "delta" | "none" | "invalid" | "unknown";
    type EventHandlerContract<T> = (ev: T, controller: EventListenerControllerContract) => void;
    type OccurModelContract<T> = {
        h: (value: T) => void;
        thisArg: any;
        delay: boolean | number;
    };
    type FireContract = (key: string, ev: any, message?: FireInfoContract | string) => void;
    type OnAnyContract = (h: EventHandlerContract<KeyValueContract<any>> | EventHandlerContract<KeyValueContract<any>>[], thisArg?: any, options?: EventOptionsContract) => AnyEventRegisterResultContract;
    /**
     * The additional information which will pass to the event handler argument.
     */
    interface FireInfoContract {
        /**
         * An additional message.
         */
        message?: string;
        /**
         * Sender source string.
         */
        source?: string;
        /**
         * The additional data.
         */
        addition?: any;
    }
    /**
     * The changed information.
     */
    interface ChangedInfoContract<T> {
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
    interface ChangingInfoSetContract {
        /**
         * The change list.
         */
        changes: ChangingInfo<any>[];
    }
    /**
     * The changing set information.
     */
    interface ChangedInfoSetContract {
        /**
         * The change list.
         */
        changes: ChangedInfo<any>[];
    }
    /**
     * The event options.
     */
    interface EventOptionsContract extends HitTaskOptionsContract {
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
    interface EventListenerControllerContract extends DisposableContract {
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
        hasStoreData(propKey: string): boolean;
        /**
         * Gets a specific temp store data.
         * @param propKey  The store data key.
         */
        getStoreData(propKey: string): any;
        /**
         * Sets a specific temp store data.
         * @param propKey  The store data key.
         * @param propValue  The store data value.
         */
        setStoreData(propKey: string, propValue: any): void;
        /**
         * Removes the specific temp store data.
         * @param propKey  The store data key.
         */
        removeStoreData(...propKey: string[]): number;
    }
    interface EventRegisterResultContract<T> extends DisposableArrayContract {
        /**
         * Gets the event key.
         */
        readonly key: string;
        /**
         * Gets the hitting count of event raising.
         */
        readonly count: number;
        /**
         * Gets the date time of the event registered.
         */
        readonly registerDate: Date;
        /**
         * Gets the state of the event register result.
         */
        readonly state: "success" | "failure" | "disposed";
        /**
         * Forces to fire an event.
         * @param ev  The event argument.
         * @param message  The additional event information or message.
         */
        fire(ev: T, message?: FireInfoContract | string): void;
    }
    interface AnyEventRegisterResultContract extends DisposableContract {
        /**
         * Gets the hitting count of event raising.
         */
        readonly count: number;
        /**
         * Gets the date time of the event registered.
         */
        readonly registerDate: Date;
        /**
         * Forces to fire an event.
         * @param key  The event key.
         * @param ev  The event argument.
         * @param message  The additional event information or message.
         */
        fire(key: string, ev: any, message?: FireInfoContract | string): void;
    }
    /**
     * Event observable.
     */
    class EventObservable implements DisposableArrayContract {
        private readonly _instance;
        /**
         * Gets a value indicating whether this is mapped to another event observable with different keys.
         */
        readonly hasKeyMap: boolean;
        /**
         * Initializes a new instance of the EventObservable class.
         * @param firer  The handler to fire.
         */
        constructor(firer: EventObservable | ((fire: FireContract, onAny: OnAnyContract) => void), mapKey?: string | ((key: string) => string));
        /**
         * Adds disposable objects so that they will be disposed when this instance is disposed.
         * @param items  The objects to add.
         */
        pushDisposable(...items: DisposableContract[]): number;
        /**
         * Removes the ones added here.
         * @param items  The objects to remove.
         */
        removeDisposable(...items: DisposableContract[]): number;
        /**
         * Registers an event listener.
         * @param key  The event key.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        on<T>(key: string, h: EventHandlerContract<T> | EventHandlerContract<T>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<T>;
        /**
         * Registers an event listener that will be raised once at most.
         * @param key  The event key.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         */
        once<T>(key: string, h: EventHandlerContract<any> | EventHandlerContract<any>[], thisArg?: any): EventRegisterResultContract<any>;
        /**
         * Clears all the specific event listeners
         * @param key  The event key.
         */
        clearOn(key: string): void;
        /**
         * Creates a single event observable.
         * @param key  The event key.
         */
        createSingleObservable<T>(key: string): SingleEventObservable<T>;
        subscribeSingle<T>(key: string, h: (newValue: T) => void, thisArg?: any, convertor?: (newValue: any) => T): SubscriberCompatibleResultContract;
        /**
         * Creates an observable instance so that any event listeners and subscribers will be disposed automatically when that instance is disposed.
         */
        createObservable(): EventObservable;
        /**
         * Creates an observable instance so that any event listeners and subscribers will be disposed automatically when that instance is disposed.
         * @param mapKey  A string or a function to map keys.
         */
        createMappedObservable(mapKey: string | ((key: string) => string)): EventObservable;
        /**
         * Disposes the instance.
         */
        dispose(): void;
        static createFailedOnResult(key: string): EventRegisterResultContract<any>;
        /**
         * Creates an empty subscribe result.
         */
        static createNothingSubscribe(): SubscriberCompatibleResultContract;
        /**
         * Creates a single event observable for a specific element.
         */
        static createForElement<T extends Event>(dom: HTMLElement, eventType: string | keyof HTMLElementEventMap): SingleEventObservable<T>;
    }
    /**
     * The observable to focus on a single event.
     */
    class SingleEventObservable<T> implements DisposableArrayContract {
        readonly key: string;
        private _disposable;
        private _eventObservable;
        /**
         * Initializes a new instance of the SingleEventObservable class.
         * @param eventObservable  The event observable.
         * @param key  The event key.
         */
        constructor(eventObservable: EventObservable, key: string);
        /**
         * Adds disposable objects so that they will be disposed when this instance is disposed.
         * @param items  The objects to add.
         */
        pushDisposable(...items: DisposableContract[]): number;
        /**
         * Removes the ones added here.
         * @param items  The objects to remove.
         */
        removeDisposable(...items: DisposableContract[]): number;
        /**
         * Adds event listener.
         * @param h  The handler.
         * @param thisArg  this argument for calling handler.
         * @param options  The options to control how the handler processes.
         * @param disposabelArray  The disposable array used to push the listener result.
         */
        on(h: EventHandlerContract<T> | EventHandlerContract<T>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<T>;
        /**
         * Adds event listener for one time raised.
         * @param h  The handler.
         * @param thisArg  this argument for calling handler.
         */
        once<T>(h: EventHandlerContract<any> | EventHandlerContract<any>[], thisArg?: any): EventRegisterResultContract<any>;
        /**
         * Subscribes event raised.
         * @param h  The callback.
         * @param thisArg  this argument for calling handler.
         */
        subscribe(h: (newValue: T) => void, thisArg?: any): SubscriberCompatibleResultContract;
        /**
         * Subscribes event raised.
         * @param h  The callback.
         * @param thisArg  this argument for calling handler.
         * @param convertor  A function to convert the event argument to the target data.
         */
        subscribeWithConvertor<TValue>(h: (newValue: TValue) => void, thisArg?: any, convertor?: (newValue: T) => TValue): SubscriberCompatibleResultContract;
        /**
         * Creates an observable instance.
         */
        createObservable(): SingleEventObservable<T>;
        /**
         * Disposes the instance.
         */
        dispose(): void;
    }
    /**
     * Event observable and controller.
     */
    class EventController extends EventObservable {
        private _fireHandler;
        private _onAny;
        /**
         * Initializes a new instance of the EventController class.
         */
        constructor();
        /**
         * Raises a specific event wth arugment.
         * @param key  The event key.
         * @param ev  The event argument.
         * @param message  The additional information which will pass to the event listener handler.
         * @param delay  A span in millisecond to delay to raise.
         */
        fire(key: string, ev: any, message?: FireInfoContract | string, delay?: number | boolean): void;
        onAny(h: EventHandlerContract<KeyValueContract<any>> | EventHandlerContract<KeyValueContract<any>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): AnyEventRegisterResultContract;
        subscribeAny(h: (newValue: KeyValueContract<any>) => void, thisArg?: any): SubscriberCompatibleResultContract;
    }
    /**
     * The observable for resolving data.
     */
    class OnceObservable<T> {
        private _result;
        /**
         * Initializes a new instance of the OnceObservable class.
         * @param executor  An executor to call resolve or reject.
         */
        constructor(executor: OnceObservable<T> | ((resolve: (value: T) => void, reject: (ex: any) => void) => void));
        /**
         * Gets a value indicating whether it is pending.
         */
        get isPending(): boolean;
        /**
         * Gets a value indicating whether it is successful.
         */
        get isSuccessful(): boolean;
        /**
         * Gets a value indicating whether it is failed.
         */
        get isFailed(): boolean;
        /**
         * Added a callback when the result is resolved.
         * @param h  The callback.
         * @param thisArg  this arg.
         * @param delay  A span in millisecond to delay to process.
         */
        onResolved(h: (value: T) => void, thisArg?: any, delay?: boolean | number): void;
        /**
         * Added a callback after a while. The callback will be called when the result is resolved.
         * @param h  The callback.
         * @param thisArg  this arg.
         * @param delay  A span in millisecond to delay to process.
         */
        onResolvedLater(h: (value: T) => void, thisArg?: any, delay?: boolean | number): void;
        /**
         * Added a callback when the result is rejected.
         * @param h  The callback.
         * @param thisArg  this arg.
         * @param delay  A span in millisecond to delay to process.
         */
        onRejected(h: (value: T) => void, thisArg?: any, delay?: boolean | number): void;
        /**
         * Added a callback after a while. The callback will be called when the result is rejected.
         * @param h  The callback.
         * @param thisArg  this arg.
         * @param delay  A span in millisecond to delay to process.
         */
        onRejectedLater(h: (value: T) => void, thisArg?: any, delay?: boolean | number): void;
        /**
         * Creates a promise instance.
         */
        promise(): Promise<T>;
        /**
         * Attaches callbacks for the resolution and/or rejection of the Promise.
         * @param onfulfilled The callback to execute when the Promise is resolved.
         * @param onrejected The callback to execute when the Promise is rejected.
         * @returns A Promise for the completion of which ever callback is executed.
         */
        then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
        /**
         * Attaches a callback for only the rejection of the Promise.
         * @param onrejected The callback to execute when the Promise is rejected.
         * @returns A Promise for the completion of the callback.
         */
        catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
        /**
         * Creates an observable instance.
         */
        createObservable(): OnceObservable<T>;
    }
    /**
     * The observable and controller for resolving data.
     */
    class OnceController<T> extends OnceObservable<T> {
        private _instance;
        /**
         * Initializes a new instance of the OnceController class.
         */
        constructor();
        /**
         * Sets the result data.
         * @param value  The data value.
         */
        resolve(value: T): void;
        /**
         * Sets the error information.
         * @param err  The exception or error information data.
         */
        reject(err: any): void;
    }
    /**
     * The information for data changing.
     */
    class ChangingInfo<T> {
        readonly key: string;
        readonly currentValue: T;
        readonly valueRequest: T;
        readonly observable?: OnceObservable<T>;
        readonly action?: "add" | "update" | "delete" | "unknown";
        /**
         * Initializes a new instance of the ChangingInfo class.
         */
        constructor(key: string, currentValue: T, valueRequest: T, observable?: OnceObservable<T>, action?: "add" | "update" | "delete" | "unknown");
        /**
         * Added a callback when the result is resolved.
         * @param h  The callback.
         * @param thisArg  this arg.
         * @param delay  A span in millisecond to delay to process.
         */
        onResolved(h: (value: T) => void, thisArg?: any, delay?: boolean | number): void;
        /**
         * Added a callback when the result is rejected.
         * @param h  The callback.
         * @param thisArg  this arg.
         * @param delay  A span in millisecond to delay to process.
         */
        onRejected(h: (value: T) => void, thisArg?: any, delay?: boolean | number): void;
    }
    /**
     * The information for data changed.
     */
    class ChangedInfo<T> {
        readonly key: string;
        readonly action: ChangeActionContract;
        readonly success: boolean | undefined;
        readonly value: T;
        readonly oldValue: T;
        readonly valueRequest: T;
        readonly error?: any;
        /**
         * Initializes a new instance of the ChangedInfo class.
         */
        constructor(key: string, action: ChangeActionContract, success: boolean | undefined, value: T, oldValue: T, valueRequest: T, error?: any);
        /**
         * Gets a value indicating whether the value has been changed.
         */
        get hasChanged(): boolean;
        static success<T>(key: string, value: T, oldValue: T, action?: ChangeActionContract | boolean, valueRequest?: T, error?: any): ChangedInfo<T>;
        static fail<T>(key: string, value: T, valueRequest: T, error?: any): ChangedInfo<T>;
        static push(list: ChangedInfo<any>[], ...items: ChangedInfo<any>[]): void;
    }
    /**
     * Creates an event observable and controller.
     * @returns  The event observable and controller.
     */
    function createEvent(): EventController;
}
declare namespace DataSense {
    type PropsObservableAccessorContract = PropsAccessorContract & RegisterPropRequestContract<SimplePropsAccessorContract, SimpleValueAccessorContract<any>>;
    interface PropsFurtherEventsContract {
        propBroadcastReceived: EventObservable;
        broadcastReceived: SingleEventObservable<any>;
        propNotifyReceived: EventObservable;
        notifyReceived: SingleEventObservable<any>;
        emptyPropRequested: SingleEventObservable<{
            key: string;
        }>;
        sendPropRequest(key: string, type: string, value: any): void;
        sendRequest(type: string, value: any): void;
        sendPropBroadcast(key: string, data: any, message?: FireInfoContract | string): void;
        sendBroadcast(data: any, message?: FireInfoContract | string): void;
    }
    /**
     * The observable for object properties.
     */
    class PropsObservable implements DisposableArrayContract {
        private _instance;
        /**
         * The event raised before a property is changing.
         */
        readonly propChanging: EventObservable;
        /**
         * The event raised after a property has changed.
         */
        readonly propChanged: EventObservable;
        /**
         * The event raised when a property is changed failed.
         */
        readonly propChangeFailed: EventObservable;
        /**
         * The event raised when a property broadcast message is recieved.
         */
        readonly propBroadcastReceived: EventObservable;
        /**
         * The event raised when a property notify message is recieved.
         */
        readonly propNotifyReceived: EventObservable;
        readonly anyPropChanging: SingleEventObservable<ChangingInfo<any>>;
        readonly anyPropChanged: SingleEventObservable<ChangedInfo<any>>;
        readonly anyPropChangeFailed: SingleEventObservable<ChangedInfo<any>>;
        readonly emptyPropRequested: SingleEventObservable<{
            key: string;
        }>;
        /**
         * The event raised after a set of property have been changed.
         */
        readonly propsChanged: SingleEventObservable<ChangedInfoSetContract>;
        /**
         * The event raised when a broadcast message is recieved.
         */
        readonly broadcastReceived: SingleEventObservable<any>;
        /**
         * The event raised when a notify message is recieved.
         */
        readonly notifyReceived: SingleEventObservable<any>;
        /**
         * Initializes a new instance of the PropsObservable class.
         * @param changer  A function to called that you can get the accessor of the properties and more by the argument.
         */
        constructor(changer: PropsObservable | ((accessor: PropsObservableAccessorContract) => void));
        /**
         * Adds disposable objects so that they will be disposed when this instance is disposed.
         * @param items  The objects to add.
         */
        pushDisposable(...items: DisposableContract[]): number;
        /**
         * Removes the ones added here.
         * @param items  The objects to remove.
         */
        removeDisposable(...items: DisposableContract[]): number;
        /**
         * Gets all property keys.
         */
        getKeys(): string[];
        /**
         * Checks if the specific key is existed.
         * @param key  The property key.
         */
        hasProp(key: string): boolean;
        /**
         * Gets a value of the specific key.
         * @param key  The property key.
         */
        getProp(key: string, options?: GetterOptionsContract): any;
        /**
         * Gets the update time of the specific key.
         * @param key  The property key.
         */
        getPropUpdateTime(key: string): Date | undefined;
        /**
         * Gets the details information of the specific key.
         * @param key  The property key.
         */
        getPropDetails<T>(key: string): PropDetailsContract<T>;
        registerChangeFlow(key: string, ...value: ValueModifierContract<any>[]): ChangeFlowRegisteredContract;
        clearChangeFlow(key: string): number;
        /**
         * Registers an event listener on the speicific property is changing.
         * @param key  The property key.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        onPropChanging<T>(key: string, h: EventHandlerContract<ChangingInfo<T>> | EventHandlerContract<ChangingInfo<T>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangingInfo<T>>;
        /**
         * Registers an event listener on the speicific property has been changed.
         * @param key  The property key.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        onPropChanged<T>(key: string, h: EventHandlerContract<ChangedInfo<T>> | EventHandlerContract<ChangedInfo<T>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangedInfo<T>>;
        /**
         * Registers an event listener on the speicific property is failed to change.
         * @param key  The property key.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        onPropChangeFailed<T>(key: string, h: EventHandlerContract<ChangedInfo<T>> | EventHandlerContract<ChangedInfo<T>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<any>;
        onAnyPropChanging(h: EventHandlerContract<ChangingInfo<any>> | EventHandlerContract<ChangingInfo<any>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangingInfo<any>>;
        onAnyPropChanged(h: EventHandlerContract<ChangedInfo<any>> | EventHandlerContract<ChangedInfo<any>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangedInfo<any>>;
        onAnyPropChangeFailed(h: EventHandlerContract<ChangedInfo<any>> | EventHandlerContract<ChangedInfo<any>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangedInfo<any>>;
        /**
         * Registers an event listener on one or more properties have been changed.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        onPropsChanged(h: EventHandlerContract<ChangedInfoSetContract> | EventHandlerContract<ChangedInfoSetContract>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangedInfoSetContract>;
        /**
         * Registers an event listener on a broadcast message of a specific property is received.
         * @param key  The property key.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        onPropBroadcastReceived(key: string, h: EventHandlerContract<any> | EventHandlerContract<any>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<any>;
        /**
         * Registers an event listener on a broadcast message is received.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        onBroadcastReceived(h: EventHandlerContract<any> | EventHandlerContract<any>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<any>;
        /**
         * Registers an event listener on a notification of a specific property is received.
         * @param key  The property key.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        onPropNotifyReceived(key: string, h: EventHandlerContract<any> | EventHandlerContract<any>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<any>;
        /**
         * Registers an event listener on a notification is received.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        onNotifyReceived(h: EventHandlerContract<any> | EventHandlerContract<any>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<any>;
        /**
         * Subscribes for what a specific property has been changed.
         * @param key  The property key.
         * @param h  The callback.
         * @param thisArg  this arg.
         */
        subscribeProp<T>(key: string, h: (newValue: T) => void, thisArg?: any): SubscriberCompatibleResultContract;
        /**
         * Subscribes for what one or more properties have been changed.
         * @param h  The callback.
         * @param thisArg  this arg.
         */
        subscribeProps(h: (changeSet: ChangedInfo<any>[]) => void, thisArg?: any): SubscriberCompatibleResultContract;
        /**
         * Sends a request message for a property.
         * @param key  The property key.
         * @param type  The request type.
         * @param value  The data.
         */
        sendPropRequest(key: string, type: string, value: any): void;
        /**
         * Sends a request message.
         * @param type  The request type.
         * @param value  The data.
         */
        sendRequest(type: string, value: any): void;
        /**
         * Sends a broadcast message for a property.
         * @param key  The property key.
         * @param data  The data.
         * @param message  The additional information which will pass to the event listener handler.
         */
        sendPropBroadcast(key: string, data: any, message?: FireInfoContract | string): void;
        /**
         * Sends a broadcast message.
         * @param data  The data.
         * @param message  The additional information which will pass to the event listener handler.
         */
        sendBroadcast(data: any, message?: FireInfoContract | string): void;
        /**
         * Creates an observable instance for a property.
         * @param key  The property key.
         */
        createPropObservable<T>(key: string): ValueObservable<T>;
        /**
         * Creates an observable instance.
         */
        createObservable(): PropsObservable;
        /**
         * Creates an object with properties copied from this.
         */
        copyModel(): any;
        toJSON(): string;
        /**
         * Disposes the instance.
         */
        dispose(): void;
    }
    /**
     * Object property accessing and observing client.
     */
    class PropsClient extends PropsObservable {
        private readonly _propSetter;
        private readonly _sendPropNotify;
        private readonly _sendNotify;
        private readonly _registerPropRequestHandler;
        private readonly _registerRequestHandler;
        /**
         * Gets the data model with two-way bindings for its properties.
         */
        readonly proxy: any;
        /**
         * Initializes a new instance of the PropsClient class.
         */
        constructor(defaultValue: any, modifier: (setter: (key: string, newValue: any, message?: SetterOptionsContract | string) => ValueResolveContract<any>) => void, propSetter: (key: string, value: any, message?: FireInfoContract | string) => ChangedInfo<any>, sendPropNotify: (key: string, data: any, message?: FireInfoContract | string) => void, sendNotify: (data: any, message?: FireInfoContract | string) => void, registerPropRequestHandler: (key: string, type: string, h: (owner: SimpleValueAccessorContract<any>, value: any) => void) => boolean, registerRequestHandler: (type: string, h: (owner: SimplePropsAccessorContract, value: any) => void) => boolean, additionalEvents: PropsFurtherEventsContract);
        /**
         * Sets a value of the specific key.
         * @param key  The property key.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        setProp(key: string, value: any, message?: SetterOptionsContract | string): boolean;
        /**
         * Sets a value of the specific key. A status and further information will be returned.
         * @param key  The property key.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        setPropForDetails<T>(key: string, value: T, message?: SetterOptionsContract | string): ChangedInfo<T>;
        /**
         * Sets a value of the specific key by a Promise.
         * @param key  The property key.
         * @param value  A Promise of the property to set.
         * @param compatible  true if the value can also be a non-Promise; otherwise, false.
         * @param message  A message for the setting event.
         */
        setPromiseProp<T>(key: string, value: Promise<T>, compatible?: boolean, message?: SetterOptionsContract | string): Promise<T>;
        /**
         * Sets a value of the specific key by an observable which can be subscribed.
         * @param key  The property key.
         * @param value  A Promise of the property to set.
         * @param message  A message for the setting event.
         * @param callbackfn  A function will be called on subscribed.
         */
        setSubscribeProp<T>(key: string, value: SubscriberContract<T>, message?: SetterOptionsContract | string, callbackfn?: (ev: ChangedInfo<T>, message: FireInfoContract) => void, thisArg?: any): SubscriberResultContract;
        /**
         * Send a notification for a speicific property.
         * @param key  The property key.
         * @param data  The data.
         * @param message  A message for the setting event.
         */
        sendPropNotify(key: string, data: any, message?: FireInfoContract | string): void;
        /**
         * Send a notification.
         * @param data  The data.
         * @param message  A message for the setting event.
         */
        sendNotify(data: any, message?: FireInfoContract | string): void;
        /**
         * Registers a handler to respond the request message for a property.
         * @param key  The property key.
         * @param type  The request type.
         * @param h  The handler to respond the request message.
         */
        registerPropRequestHandler(key: string, type: string, h: (owner: SimpleValueAccessorContract<any>, value: any) => void): boolean;
        /**
         * Registers a handler to respond the request message.
         * @param type  The request type.
         * @param h  The handler to respond the request message.
         */
        registerRequestHandler(type: string, h: (owner: SimplePropsAccessorContract, value: any) => void): boolean;
    }
    /**
     * Object observable and controller.
     */
    class PropsController extends PropsObservable {
        private _accessor;
        /**
         * Gets an object with properties which are two-way binding with this.
         */
        readonly proxy: any;
        /**
         * Gets the formatter/convertor.
         */
        get formatter(): (key: string, value: any) => any;
        /**
         * Sets the formatter/convertor.
         */
        set formatter(h: (key: string, value: any) => any);
        /**
         * Gets the validator.
         */
        get validator(): (key: string, value: any) => boolean;
        /**
         * Sets the validator.
         */
        set validator(h: (key: string, value: any) => boolean);
        /**
         * Initializes a new instance of the PropsController class.
         */
        constructor();
        getPropWithFallback<T>(key: string, resolver: (details: PropDetailsContract<T>) => Promise<T>, options?: {
            testBeforeSet?: boolean;
            callback?: (details: PropDetailsContract<T>) => void;
        }): Promise<T>;
        /**
         * Force to update a property.
         * @param key  The property key.
         * @param message  A message for the setting event.
         */
        forceUpdateProp(key: string, message?: FireInfoContract | string): void;
        /**
         * Sets a value of the specific key.
         * @param key  The property key.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        setProp(key: string, value: any, message?: SetterOptionsContract | string): boolean;
        /**
         * Sets a value of the specific key. A status and further information will be returned.
         * @param key  The property key.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        setPropForDetails<T>(key: string, value: T, message?: SetterOptionsContract | string): ChangedInfo<T>;
        /**
         * Sets a value of the specific key by a Promise.
         * @param key  The property key.
         * @param value  A Promise of the property to set.
         * @param compatible  true if the value can also be a non-Promise; otherwise, false.
         * @param message  A message for the setting event.
         */
        setPromiseProp<T>(key: string, value: Promise<T>, compatible?: boolean, message?: SetterOptionsContract | string): Promise<T>;
        /**
         * Sets a value of the specific key by an observable which can be subscribed.
         * @param key  The property key.
         * @param value  A Promise of the property to set.
         * @param message  A message for the setting event.
         * @param callbackfn  A function will be called on subscribed.
         */
        setSubscribeProp<T>(key: string, value: SubscriberContract<T>, message?: SetterOptionsContract | string, callbackfn?: (ev: ChangedInfo<T>, message: FireInfoContract) => void, thisArg?: any): SubscriberResultContract;
        /**
         * Removes a property.
         * @param key  The property key.
         * @param message  A message for the setting event.
         */
        removeProp(key: string | string[], message?: FireInfoContract | string): number;
        /**
         * Batch sets properties.
         * @param obj  The data with properties to override current ones.
         * @param message  A message for the setting event.
         */
        setProps(obj: any | PropUpdateActionContract<any>[], message?: FireInfoContract | string): void;
        /**
         * Gets additional store information.
         * @param key  The property key.
         * @param storePropKey  The key of additional information.
         */
        getPropStore(key: string, storePropKey: string): any;
        /**
         * Sets additional store information.
         * @param key  The property key.
         * @param storePropKey  The key of additional information.
         * @param value  The value of additonal information.
         */
        setPropStore(key: string, storePropKey: string, value: any): void;
        /**
         * Removes the specific additional store information.
         * @param key  The property key.
         * @param storePropKeys  The key of additional information.
         */
        removePropStore(key: string, ...storePropKeys: string[]): void;
        /**
         * Send a notification for a speicific property.
         * @param key  The property key.
         * @param data  The data.
         * @param message  The additional information which will pass to the event listener handler.
         */
        sendPropNotify(key: string, data: any, message?: FireInfoContract | string): void;
        /**
         * Send a notification.
         * @param data  The data.
         * @param message  The additional information which will pass to the event listener handler.
         */
        sendNotify(data: any, message?: FireInfoContract | string): void;
        /**
         * Registers a handler to respond the request message for a property.
         * @param key  The property key.
         * @param type  The request type.
         * @param h  The handler to respond the request message.
         */
        registerPropRequestHandler(key: string, type: string, h: (owner: SimpleValueAccessorContract<any>, value: any) => void): boolean;
        /**
         * Registers a handler to respond the request message.
         * @param type  The request type.
         * @param h  The handler to respond the request message.
         */
        registerRequestHandler(type: string, h: (owner: SimplePropsAccessorContract, value: any) => void): boolean;
        /**
         * Creates a controller client for a property.
         * @param key  The property key.
         */
        createPropClient<T>(key: string): ValueClient<T>;
        /**
         * Creates a controller client.
         */
        createClient(): PropsClient;
    }
    /**
     * Creates a props controller with accessor and observable.
     * @param initObj  The optional initialized properties.
     * @returns  The props controller with accessor and observable.
     */
    function createProps(initObj?: {
        [property: string]: any;
    }): PropsController;
}
declare namespace DataSense {
    type HitTaskHandlerContract = (arg: any, ev: {
        readonly initDate: Date;
        readonly processDate: Date;
        readonly latestProcessDate: Date;
        readonly count: number;
        readonly hitCount: number;
    }) => void;
    type ScheduleTaskSourceContract = "start" | "restart" | "plan" | "replan" | "resume" | "schedule" | "immediate" | "unknown";
    /**
     * The options for hit task.
     */
    interface HitTaskOptionsContract {
        /**
         * true if process after current thread;
         * or false, if process immediately.
         * or a time span number in millisecond to delay to process.
         */
        delay?: number | boolean;
        /**
         * Used to control the processing behavior during there is a pending processing when another is raised.
         * "debounce": will process the last one and ignore the previous in pending list;
         * "mono": will process the first one and ignore the up coming ones before beginning to process;
         * "none": will process all and one by one scheduled.
         */
        mergeMode?: "debounce" | "mono" | "none";
        /**
         * A time span number in millisecond to reset the hits count.
         */
        span?: number;
        /**
         * The minimum hits count to respond.
         */
        minCount?: number;
        /**
         * The maximum hits count to respond.
         */
        maxCount?: number;
    }
    interface ScheduleTaskInfoContract {
        readonly startDate: Date;
        readonly latestStopDate: Date;
        readonly processDate: Date;
        readonly latestProcessDate: Date;
        readonly span: number;
        readonly source: ScheduleTaskSourceContract;
    }
    /**
     * The scheduler.
     */
    interface ScheduleTaskResultContract {
        /**
         * Starts, plans, restarts, replans.
         * @param isPlan  true if start after the time span; or false, if start immediately; or a number in millisecond to delay to start.
         */
        start(isPlan?: number | boolean): void;
        /**
         * Processes the handler immediately.
         */
        process(): void;
        /**
         * Resumes.
         * @param isPlan  A value used when the task is not alive.
         */
        resume(isPlan?: number | boolean): void;
        /**
         * Pauses.
         */
        pause(): void;
        /**
         * Stops.
         */
        stop(): void;
        /**
         * Gets a value inidcating whether the task is alive.
         */
        readonly alive: boolean;
    }
    /**
     * A task for processing with times limitation and delay options.
     */
    class HitTask {
        private _proc;
        private _abort;
        private _options;
        private _h;
        /**
         * Initializes a new instance of the HitTask class.
         */
        constructor();
        /**
         * Sets the options.
         * @param value  The options.
         * @param merge  true if merge the properties into the current one; otherwise, false.
         */
        setOptions(value: HitTaskOptionsContract, merge?: boolean): void;
        /**
         * Registers the handler to process when need.
         * @param h  One or more handlers.
         */
        pushHandler(...h: (HitTaskHandlerContract | HitTaskHandlerContract[])[]): number;
        /**
         * Clears all handlers.
         */
        clearHandler(): void;
        /**
         * Tries to process.
         * The handlers registered may not be proceeded unless pass the condition.
         * @param arg  An argument to pass to the handlers registered.
         */
        process(arg?: any): void;
        /**
         * Tries to abort the pending processing.
         */
        abort(): void;
        /**
         * Delays to process a speicific handler.
         * @param h  The handler.
         * @param span  true if process delay; false if process immediately; or a number if process after the specific milliseconds.
         */
        static delay(h: Function, span: number | boolean): DisposableContract;
        /**
         * Processes a handler and ignore the up coming ones in a specific time span.
         * @param h  The handler to process.
         * @param span  A time span in millisecond to avoid up coming.
         * @param justPrepare  true if just set up a task which will not process immediately; otherwise, false.
         */
        static throttle(h: HitTaskHandlerContract | HitTaskHandlerContract[], span: number, justPrepare?: boolean): HitTask;
        /**
         * Processes a handler delay or immediately in debounce mode.
         * @param h  The handler to process.
         * @param delay  true if process delay; false if process immediately; or a number if process after the specific milliseconds.
         * @param justPrepare  true if just set up a task which will not process immediately; otherwise, false.
         */
        static debounce(h: HitTaskHandlerContract | HitTaskHandlerContract[], delay: number | boolean, justPrepare?: boolean): HitTask;
        /**
         * Processes a handler delay or immediately in mono mode.
         * @param h  The handler to process.
         * @param delay  true if process delay; false if process immediately; or a number if process after the specific milliseconds.
         * @param justPrepare  true if just set up a task which will not process immediately; otherwise, false.
         */
        static mono(h: HitTaskHandlerContract | HitTaskHandlerContract[], delay: number | boolean, justPrepare?: boolean): HitTask;
        /**
         * Processes a handler in multiple hits task.
         * @param h  The handler to process.
         * @param min  The minimum hit count.
         * @param max  The maximum hit count.
         * @param span  The hit reset span.
         * @param justPrepare  true if just set up a task which will not process immediately; otherwise, false.
         */
        static multiHit(h: HitTaskHandlerContract | HitTaskHandlerContract[], minCount: number, maxCount: number, span: number, justPrepare?: boolean): HitTask;
        /**
         * Schedule to process a specific handler.
         * @param h  The handler to process.
         * @param span  A time span in millisecond of duration.
         */
        static schedule(h: (info: ScheduleTaskInfoContract) => void, span: number): ScheduleTaskResultContract;
    }
}
declare namespace DataSense {
    type ValueObservableAccessorContract<T> = ValueAccessorContract<T> & RegisterRequestContract<SimpleValueAccessorContract<T>>;
    interface ValueFurtherEventsContract {
        broadcastReceived: SingleEventObservable<any>;
        notifyReceived: SingleEventObservable<any>;
        sendRequest(type: string, value: any): void;
        sendBroadcast(data: any, message?: FireInfoContract | string): void;
    }
    /**
     * The observable for data value.
     */
    class ValueObservable<T> implements DisposableArrayContract {
        private _instance;
        /**
         * The event raised before the value is changing.
         */
        readonly changing: SingleEventObservable<ChangingInfo<T>>;
        /**
         * The event raised after the value has changed.
         */
        readonly changed: SingleEventObservable<ChangedInfo<T>>;
        /**
         * The event raised when the value is changed failed.
         */
        readonly changeFailed: SingleEventObservable<ChangedInfo<T>>;
        /**
         * The event raised when a broadcast message is recieved.
         */
        readonly broadcastReceived: SingleEventObservable<any>;
        /**
         * The event raised when a notify message is recieved.
         */
        readonly notifyReceived: SingleEventObservable<any>;
        /**
         * Initializes a new instance of the ValueObservable class.
         * @param changer  A function to called that you can get the accessor of the value by the argument.
         */
        constructor(changer: ValueObservable<T> | ((changed: ValueObservableAccessorContract<T>) => void));
        /**
         * Adds disposable objects so that they will be disposed when this instance is disposed.
         * @param items  The objects to add.
         */
        pushDisposable(...items: DisposableContract[]): number;
        /**
         * Removes the ones added here.
         * @param items  The objects to remove.
         */
        removeDisposable(...items: DisposableContract[]): number;
        /**
         * Gets the value.
         */
        get(options?: GetterOptionsContract): T;
        /**
         * Gets the type of value.
         */
        getType(): "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
        /**
         * Checks if the value is instance of a specific type.
         */
        instanceOf(c: any): boolean;
        registerChangeFlow(...value: ValueModifierContract<T>[]): ChangeFlowRegisteredContract;
        clearChangeFlow(): number;
        /**
         * Registers an event listener on the value is changing.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        onChanging(h: EventHandlerContract<ChangingInfo<T>> | EventHandlerContract<ChangingInfo<T>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangingInfo<T>>;
        /**
         * Registers an event listener on the value has been changed.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        onChanged(h: EventHandlerContract<ChangedInfo<T>> | EventHandlerContract<ChangedInfo<T>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangedInfo<T>>;
        /**
         * Registers an event listener on the value is failed to change.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        onChangeFailed(h: EventHandlerContract<ChangedInfo<T>> | EventHandlerContract<ChangedInfo<T>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangedInfo<T>>;
        /**
         * Registers an event listener on a broadcast message is received.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        onBroadcastReceived(h: EventHandlerContract<any> | EventHandlerContract<any>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<any>;
        /**
         * Registers an event listener on a notification is received.
         * @param h  The handler or handlers of the event listener.
         * @param thisArg  this arg.
         * @param options  The event listener options.
         * @param disposableArray  An additional disposable array instance for push current event handler.
         */
        onNotifyReceived(h: EventHandlerContract<any> | EventHandlerContract<any>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<any>;
        /**
         * Subscribes for what the value has been changed.
         * @param h  The callback.
         * @param thisArg  this arg.
         */
        subscribe(h: (newValue: T) => void, thisArg?: any): SubscriberCompatibleResultContract;
        /**
         * Sends a request message.
         * @param data  The data.
         * @param message  The additional information.
         */
        sendRequest(type: string, value: any): void;
        /**
         * Sends a broadcast message.
         * @param data  The data.
         * @param message  The additional information which will pass to the event listener handler.
         */
        sendBroadcast(data: any, message?: FireInfoContract | string): void;
        createObservable(): ValueObservable<T>;
        /**
         * Disposes the instance.
         */
        dispose(): void;
        toJSON(): string;
    }
    /**
     * Data property accessing and observing client.
     */
    class ValueClient<T> extends ValueObservable<T> {
        private readonly _setter;
        private readonly _forceUpdate;
        private readonly _sendNotify;
        private readonly _registerRequestHandler;
        /**
         * Initializes a new instance of the ValueClient class.
         */
        constructor(defaultValue: T, modifier: (setter: ValueModifierContract<T>) => void, setter: (value: T, message?: SetterOptionsContract | string) => ChangedInfo<T>, sendNotify: (data: any, message?: FireInfoContract | string) => void, registerRequestHandler: (type: string, h: (owner: SimpleValueAccessorContract<T>, value: any) => void) => boolean, additionalEvents: ValueFurtherEventsContract, forceUpdate?: (message?: FireInfoContract | string) => void);
        /**
         * Sets value.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        set(value: T, message?: SetterOptionsContract | string): boolean;
        /**
         * Sets the value. A status and further information will be returned.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        setForDetails(value: T, message?: FireInfoContract | string): ChangedInfo<T>;
        /**
         * Sets a value by a Promise.
         * @param value  A Promise of the property to set.
         * @param compatible  true if the value can also be a non-Promise; otherwise, false.
         * @param message  A message for the setting event.
         */
        setPromise(value: Promise<T>, compatible?: boolean, message?: FireInfoContract | string): Promise<T>;
        /**
         * Sets a value by an observable which can be subscribed.
         * @param value  A Promise of the property to set.
         * @param message  A message for the setting event.
         * @param callbackfn  A function will be called on subscribed.
         */
        setSubscribe(value: SubscriberContract<T>, message?: FireInfoContract | string, callbackfn?: (ev: ChangedInfo<T>, message: FireInfoContract) => void, thisArg?: any): SubscriberResultContract;
        /**
         * Forces to notify the update event.
         * @param message  A message for the setting event.
         */
        forceUpdate(message?: FireInfoContract | string): void;
        /**
         * Send a notification.
         * @param data  The data.
         * @param message  A message for the setting event.
         */
        sendNotify(data: any, message?: FireInfoContract | string): void;
        /**
         * Registers a handler to respond the request message.
         * @param type  The request type.
         * @param h  The handler to respond the request message.
         */
        registerRequestHandler(type: string, h: (owner: SimpleValueAccessorContract<T>, value: any) => void): boolean;
    }
    /**
     * Data observable and controller.
     */
    class ValueController<T> extends ValueObservable<T> {
        private _accessor;
        private _observing;
        /**
         * Gets the formatter/convertor.
         */
        get formatter(): (value: any) => T;
        /**
         * Sets the formatter/convertor.
         */
        set formatter(h: (value: any) => T);
        /**
         * Gets the validator.
         */
        get validator(): (value: T) => boolean;
        /**
         * Sets the validator.
         */
        set validator(h: (value: T) => boolean);
        /**
         * Initializes a new instance of the ValueController class.
         */
        constructor();
        /**
         * Sets value.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        set(value: T, message?: SetterOptionsContract | string): boolean;
        /**
         * Sets the value. A status and further information will be returned.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        setForDetails(value: T, message?: SetterOptionsContract | string): ChangedInfo<T>;
        /**
         * Sets a value by a Promise.
         * @param value  A Promise of the property to set.
         * @param compatible  true if the value can also be a non-Promise; otherwise, false.
         * @param message  A message for the setting event.
         */
        setPromise(value: Promise<T>, compatible?: boolean, message?: SetterOptionsContract | string): Promise<T>;
        /**
         * Sets a value by an observable which can be subscribed.
         * @param value  A Promise of the property to set.
         * @param message  A message for the setting event.
         * @param callbackfn  A function will be called on subscribed.
         */
        setSubscribe(value: SubscriberContract<T>, message?: SetterOptionsContract | string, callbackfn?: (ev: ChangedInfo<T>, message: FireInfoContract) => void, thisArg?: any): SubscriberResultContract;
        /**
         * Forces to notify the update event.
         * @param message  A message for the setting event.
         */
        forceUpdate(message?: FireInfoContract | string): void;
        /**
         * Registers a handler to respond the request message.
         * @param type  The request type.
         * @param h  The handler to respond the request message.
         */
        registerRequestHandler(type: string, h: (owner: SimpleValueAccessorContract<T>, value: any) => void): boolean;
        /**
         * Start to observe an observable value.
         * @param notSyncNow  true if keep current value unless call syncFromObserved member method of this or the observable value is changed; otherwise false.
         * @param message  A message for the setting event.
         */
        observe(value: ValueObservable<T>, notSyncNow?: boolean, message?: FireInfoContract | string): ChangeFlowRegisteredContract | {
            sync(): void;
            dispose(): void;
        };
        /**
         * Stops observing.
         */
        stopObserving(): void;
        /**
         * Updates the value from the observed value.
         * @param message  A message for the setting event.
         */
        syncFromObserved(message?: FireInfoContract | string): boolean;
        /**
         * Gets a value indicating whether it is observing another observable value.
         */
        isObserving(): boolean;
        /**
         * Creates a controller client.
         */
        createClient(): ValueClient<T>;
        /**
         * Send a notification.
         * @param data  The data.
         * @param message  The additional information which will pass to the event listener handler.
         */
        sendNotify(data: any, message?: FireInfoContract | string): void;
    }
}
