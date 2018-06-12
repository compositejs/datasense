declare namespace DataSense {
    type ValueModifierContract<T> = (newValue: T, message?: FireInfoContract | string) => ValueResolveContract<T>;
    interface ValueResolveContract<T> {
        isAborted?: boolean;
        resolve(finalValue?: T): void;
        reject(ex?: any): void;
        remove?(): void;
    }
    interface SimpleValueAccessorContract<T> {
        get(): T;
        set(value: T, message?: FireInfoContract | string): ChangedInfo<T> | undefined;
        forceUpdate(message?: FireInfoContract | string): void;
    }
    interface ValueAccessorContract<T> extends SimpleValueAccessorContract<T> {
        customizedSet(valueRequested: any, message?: FireInfoContract | string): ValueResolveContract<T>;
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
    interface SimplePropsAccessorContract {
        hasProp(key: string): boolean;
        getProp(key: string): any;
        setProp(key: string, value: any, message?: FireInfoContract | string): ChangedInfo<any>;
        removeProp(keys: string | string[], message?: FireInfoContract | string): number;
        batchProp(changeSet: any | PropUpdateActionContract<any>[], message?: FireInfoContract | string): void;
        forceUpdateProp(key: string, message?: FireInfoContract | string): void;
        getPropKeys(): string[];
    }
    interface PropsAccessorContract extends SimplePropsAccessorContract {
        customizedSetProp(key: string, valueRequested: any, message?: FireInfoContract | string): ValueResolveContract<any>;
        getFormatter(): (key: string, value: any) => any;
        setFormatter(h: (key: string, value: any) => any): void;
        getValidator(): (key: string, value: any) => boolean;
        setValidator(h: (key: string, value: any) => boolean): void;
        getPropStore(key: string, storePropKey: string): any;
        setPropStore(key: string, storePropKey: string, value: any): void;
        removePropStore(key: string, ...storePropKey: string[]): void;
        sendPropNotify(key: string, data: any, message?: FireInfoContract | string): void;
        sendNotify(data: any, message?: FireInfoContract | string): void;
    }
    interface RegisterPropRequestContract<TProps, TValue> extends RegisterRequestContract<TProps> {
        registerPropRequestHandler(key: string, type: string, h: (owner: TValue, value: any) => void): boolean;
    }
    interface ChangeFlowRegisteredContract extends DisposableContract {
        registeredDate: Date;
        count: number;
        sync(message?: FireInfoContract | string): void;
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
    interface DisposableContract {
        dispose(): void;
    }
    type SubscriberCompatibleResultContract = DisposableContract & (() => void);
    type SubscriberResultContract = DisposableContract | (() => void) | SubscriberCompatibleResultContract;
    interface KeyValueContract<T> {
        key: string;
        value: T;
    }
    interface SubscriberContract<T> {
        subscribe(h: (value: T) => void): SubscriberResultContract;
    }
    interface DisposableArrayContract extends DisposableContract {
        pushDisposable(...items: DisposableContract[]): number;
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
         * @param items  The objects to add.
         */
        remove(...items: DisposableContract[]): number;
        /**
         * Disposes the instance.
         */
        dispose(): void;
    }
}
declare namespace DataSense {
    type ChangeActionContract = "add" | "remove" | "update" | "delta" | "none" | "invalid" | "unknown";
    interface FireInfoContract {
        message?: string;
        source?: string;
        addition?: any;
    }
    interface ChangedInfoContract<T> {
        key?: string;
        action: ChangeActionContract;
        value: T;
        oldValue: T;
        valueRequested: T;
        success: boolean | undefined;
        error?: any;
    }
    interface ChangingInfoSetContract {
        changes: ChangingInfo<any>[];
    }
    interface ChangedInfoSetContract {
        changes: ChangedInfo<any>[];
    }
    type EventHandlerContract<T> = (ev: T, controller: EventHandlerControllerContract) => void;
    type OccurModelContract<T> = {
        h: (value: T) => void;
        thisArg: any;
        delay: boolean | number;
    };
    type FireContract = (key: string, ev: any, message?: FireInfoContract | string) => void;
    type OnAnyContract = (h: EventHandlerContract<KeyValueContract<any>> | EventHandlerContract<KeyValueContract<any>>[], thisArg?: any, options?: EventOptionsContract) => AnyEventRegisterResultContract;
    interface EventOptionsContract extends HitTaskOptionsContract {
        invalid?: number | boolean | ((ev: any) => boolean);
        invalidForNextTime?: boolean;
        arg?: any;
    }
    interface EventHandlerControllerContract extends DisposableContract {
        readonly key: string;
        readonly count: number;
        readonly fireDate: Date;
        readonly registerDate: Date;
        readonly arg: any;
        readonly message: string;
        readonly source: string;
        readonly addition: any;
        hasStoreData(propKey: string): boolean;
        getStoreData(propKey: string): any;
        setStoreData(propKey: string, propValue: any): void;
        removeStoreData(...propKey: string[]): number;
    }
    interface EventRegisterResultContract<T> extends DisposableContract {
        readonly key: string;
        readonly count: number;
        readonly registerDate: Date;
        fire(ev: T, message?: FireInfoContract | string): void;
    }
    interface AnyEventRegisterResultContract extends DisposableContract {
        readonly count: number;
        readonly registerDate: Date;
        fire(key: string, ev: any, message?: FireInfoContract | string): void;
    }
    /**
     * Event observable.
     */
    class EventObservable implements DisposableArrayContract {
        private readonly _instance;
        readonly hasKeyMap: boolean;
        /**
         * Initializes a new instance of the EventObservable class.
         * @param firer  The handler to fire.
         */
        constructor(firer: EventObservable | ((fire: FireContract, onAny: OnAnyContract) => void), mapKey?: string | ((key: string) => string));
        pushDisposable(...items: DisposableContract[]): number;
        on<T>(key: string, h: EventHandlerContract<T> | EventHandlerContract<T>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<T>;
        once<T>(key: string, h: EventHandlerContract<any> | EventHandlerContract<any>[], thisArg?: any): EventRegisterResultContract<any>;
        clearOn(key: string): void;
        createSingleObservable<T>(key: string): SingleEventObservable<T>;
        subscribeSingle<T>(key: string, h: (newValue: T) => void, thisArg?: any, convertor?: (newValue: any) => T): SubscriberCompatibleResultContract;
        createObservable(): EventObservable;
        createMappedObservable(mapKey: string | ((key: string) => string)): EventObservable;
        dispose(): void;
        static createFailedOnResult(key: string): EventRegisterResultContract<any>;
        static createNothingSubscribe(): SubscriberCompatibleResultContract;
        static createForElement<T extends Event>(dom: HTMLElement, eventType: string | keyof HTMLElementEventMap): SingleEventObservable<T>;
    }
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
        pushDisposable(...items: DisposableContract[]): number;
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
        subscribe(h: (newValue: T) => void, thisArg?: any): SubscriberCompatibleResultContract;
        subscribeWithConvertor<TValue>(h: (newValue: TValue) => void, thisArg?: any, convertor?: (newValue: T) => TValue): SubscriberCompatibleResultContract;
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
        constructor();
        /**
         * Raises a specific event wth arugment.
         * @param key  The event key.
         * @param ev  The event argument.
         * @param message  The additional information.
         * @param delay  A span in millisecond to delay this raising.
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
        promise(): Promise<T>;
        constructor(executor: OnceObservable<T> | ((resolve: (value: T) => void, reject: (ex: any) => void) => void));
        isPending(): boolean;
        isSuccess(): boolean;
        isFailed(): boolean;
        onResolved(h: (value: T) => void, thisArg?: any, delay?: boolean | number): void;
        onResolvedLater(h: (value: T) => void, thisArg?: any, delay?: boolean | number): void;
        onRejected(h: (value: T) => void, thisArg?: any, delay?: boolean | number): void;
        onRejectedLater(h: (value: T) => void, thisArg?: any, delay?: boolean | number): void;
        then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
        catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
        createObservable(): OnceObservable<T>;
    }
    /**
     * The observable and controller for resolving data.
     */
    class OnceController<T> extends OnceObservable<T> {
        private _instance;
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
        constructor(key: string, currentValue: T, valueRequest: T, observable?: OnceObservable<T>, action?: "add" | "update" | "delete" | "unknown");
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
        constructor(key: string, action: ChangeActionContract, success: boolean | undefined, value: T, oldValue: T, valueRequest: T, error?: any);
        static success<T>(key: string, value: T, oldValue: T, action?: ChangeActionContract | boolean, valueRequest?: T, error?: any): ChangedInfo<T>;
        static fail<T>(key: string, value: T, valueRequest: T, error?: any): ChangedInfo<T>;
        static push(list: ChangedInfo<any>[], ...items: ChangedInfo<any>[]): void;
    }
}
declare namespace DataSense {
    type PropsObservableAccessorContract = PropsAccessorContract & RegisterPropRequestContract<SimplePropsAccessorContract, SimpleValueAccessorContract<any>>;
    interface PropsFurtherEventsContract {
        propBroadcastReceived: EventObservable;
        broadcastReceived: SingleEventObservable<any>;
        propNotifyReceived: EventObservable;
        notifyReceived: SingleEventObservable<any>;
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
        pushDisposable(...items: DisposableContract[]): number;
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
        getProp(key: string): any;
        registerChangeFlow(key: string, ...value: ValueModifierContract<any>[]): ChangeFlowRegisteredContract;
        clearChangeFlow(key: string): number;
        onPropChanging<T>(key: string, h: EventHandlerContract<ChangingInfo<T>> | EventHandlerContract<ChangingInfo<T>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangingInfo<T>>;
        onPropChanged<T>(key: string, h: EventHandlerContract<ChangedInfo<T>> | EventHandlerContract<ChangedInfo<T>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangedInfo<T>>;
        onPropChangeFailed<T>(key: string, h: EventHandlerContract<ChangedInfo<T>> | EventHandlerContract<ChangedInfo<T>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<any>;
        onAnyPropChanging(h: EventHandlerContract<ChangingInfo<any>> | EventHandlerContract<ChangingInfo<any>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangingInfo<any>>;
        onAnyPropChanged(h: EventHandlerContract<ChangedInfo<any>> | EventHandlerContract<ChangedInfo<any>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangedInfo<any>>;
        onAnyPropChangeFailed(h: EventHandlerContract<ChangedInfo<any>> | EventHandlerContract<ChangedInfo<any>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangedInfo<any>>;
        onPropsChanged(h: EventHandlerContract<ChangedInfoSetContract> | EventHandlerContract<ChangedInfoSetContract>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangedInfoSetContract>;
        onPropBroadcastReceived(key: string, h: EventHandlerContract<any> | EventHandlerContract<any>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<any>;
        onBroadcastReceived(h: EventHandlerContract<any> | EventHandlerContract<any>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<any>;
        onPropNotifyReceived(key: string, h: EventHandlerContract<any> | EventHandlerContract<any>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<any>;
        onNotifyReceived(h: EventHandlerContract<any> | EventHandlerContract<any>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<any>;
        subscribeProp<T>(key: string, h: (newValue: T) => void, thisArg?: any): SubscriberCompatibleResultContract;
        subscribeProps(h: (changeSet: ChangedInfo<any>[]) => void, thisArg?: any): SubscriberCompatibleResultContract;
        /**
         * Sends a property request message.
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
        sendPropBroadcast(key: string, data: any, message?: FireInfoContract | string): void;
        sendBroadcast(data: any, message?: FireInfoContract | string): void;
        createPropObservable<T>(key: string): ValueObservable<T>;
        createObservable(): PropsObservable;
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
        readonly proxy: any;
        private readonly _propSetter;
        private readonly _sendPropNotify;
        private readonly _sendNotify;
        private readonly _registerPropRequestHandler;
        private readonly _registerRequestHandler;
        constructor(defaultValue: any, modifier: (setter: (key: string, newValue: any, message?: FireInfoContract | string) => ValueResolveContract<any>) => void, propSetter: (key: string, value: any, message?: FireInfoContract | string) => ChangedInfo<any>, sendPropNotify: (key: string, data: any, message?: FireInfoContract | string) => void, sendNotify: (data: any, message?: FireInfoContract | string) => void, registerPropRequestHandler: (key: string, type: string, h: (owner: SimpleValueAccessorContract<any>, value: any) => void) => boolean, registerRequestHandler: (type: string, h: (owner: SimplePropsAccessorContract, value: any) => void) => boolean, additionalEvents: PropsFurtherEventsContract);
        /**
         * Sets a value of the specific key.
         * @param key  The property key.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        setProp(key: string, value: any, message?: FireInfoContract | string): boolean;
        /**
         * Sets a value of the specific key. A status and further information will be returned.
         * @param key  The property key.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        setPropForDetails<T>(key: string, value: T, message?: FireInfoContract | string): ChangedInfo<T>;
        setPromiseProp<T>(key: string, value: Promise<T>, compatible?: boolean, message?: FireInfoContract | string): Promise<T>;
        setSubscribeProp<T>(key: string, value: SubscriberContract<T>, message?: FireInfoContract | string, callbackfn?: (ev: ChangedInfo<T>, message: FireInfoContract) => void, thisArg?: any): SubscriberResultContract;
        sendPropNotify(key: string, data: any, message?: FireInfoContract | string): void;
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
        readonly proxy: any;
        formatter: (key: string, value: any) => any;
        validator: (key: string, value: any) => boolean;
        constructor();
        forceUpdateProp(key: string, message?: FireInfoContract | string): void;
        /**
         * Sets a value of the specific key.
         * @param key  The property key.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        setProp(key: string, value: any, message?: FireInfoContract | string): boolean;
        /**
         * Sets a value of the specific key. A status and further information will be returned.
         * @param key  The property key.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        setPropForDetails<T>(key: string, value: T, message?: FireInfoContract | string): ChangedInfo<T>;
        setPromiseProp<T>(key: string, value: Promise<T>, compatible?: boolean, message?: FireInfoContract | string): Promise<T>;
        setSubscribeProp<T>(key: string, value: SubscriberContract<T>, message?: FireInfoContract | string, callbackfn?: (ev: ChangedInfo<T>, message: FireInfoContract) => void, thisArg?: any): SubscriberResultContract;
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
        sendPropNotify(key: string, data: any, message?: FireInfoContract | string): void;
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
        createPropClient<T>(key: string): ValueClient<T>;
        createClient(): PropsClient;
    }
}
declare namespace DataSense {
    type HitTaskHandlerContract = (arg: any, ev: {
        initDate: Date;
        processDate: Date;
        latestProcessDate: Date;
        count: number;
        hitCount: number;
    }) => void;
    interface HitTaskOptionsContract {
        delay?: number | boolean;
        mergeMode?: "debounce" | "none" | "mono";
        span?: number;
        minCount?: number;
        maxCount?: number;
    }
    /**
     * A task for processing with times limitation and delay options.
     */
    class HitTask {
        private _proc;
        private _abort;
        private _options;
        private _h;
        constructor();
        setOptions(value: HitTaskOptionsContract): void;
        pushHandler(...h: (HitTaskHandlerContract | HitTaskHandlerContract[])[]): number;
        clearHandler(): void;
        process(arg?: any): void;
        abort(): void;
        static delay(h: Function, span: number | boolean, justPrepare?: boolean): {
            dispose(): void;
        };
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
        pushDisposable(...items: DisposableContract[]): number;
        /**
         * Gets the value.
         */
        get(): T;
        /**
         * Gets the value.
         */
        getType(): "string" | "number" | "boolean" | "symbol" | "undefined" | "object" | "function";
        /**
         * Gets the value.
         */
        instanceOf(c: any): boolean;
        registerChangeFlow(...value: ValueModifierContract<T>[]): ChangeFlowRegisteredContract;
        clearChangeFlow(): number;
        onChanging(h: EventHandlerContract<ChangingInfo<T>> | EventHandlerContract<ChangingInfo<T>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangingInfo<T>>;
        onChanged(h: EventHandlerContract<ChangedInfo<T>> | EventHandlerContract<ChangedInfo<T>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangedInfo<T>>;
        onChangeFailed(h: EventHandlerContract<ChangedInfo<T>> | EventHandlerContract<ChangedInfo<T>>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<ChangedInfo<T>>;
        onBroadcastReceived(h: EventHandlerContract<any> | EventHandlerContract<any>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<any>;
        onNotifyReceived(h: EventHandlerContract<any> | EventHandlerContract<any>[], thisArg?: any, options?: EventOptionsContract, disposableArray?: DisposableArrayContract): EventRegisterResultContract<any>;
        subscribe(h: (newValue: T) => void, thisArg?: any): SubscriberCompatibleResultContract;
        /**
         * Sends a request message.
         * @param type  The request type.
         * @param value  The data.
         */
        sendRequest(type: string, value: any): void;
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
        private readonly _sendNotify;
        private readonly _registerRequestHandler;
        constructor(defaultValue: T, modifier: (setter: ValueModifierContract<T>) => void, setter: (value: T, message?: FireInfoContract | string) => ChangedInfo<T>, sendNotify: (data: any, message?: FireInfoContract | string) => void, registerRequestHandler: (type: string, h: (owner: SimpleValueAccessorContract<T>, value: any) => void) => boolean, additionalEvents: ValueFurtherEventsContract);
        set(value: T, message?: FireInfoContract | string): boolean;
        setForDetails(value: T, message?: FireInfoContract | string): ChangedInfo<T>;
        setPromise(value: Promise<T>, compatible?: boolean, message?: FireInfoContract | string): Promise<T>;
        setSubscribe(value: SubscriberContract<T>, message?: FireInfoContract | string, callbackfn?: (ev: ChangedInfo<T>, message: FireInfoContract) => void, thisArg?: any): SubscriberResultContract;
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
        formatter: (value: any) => T;
        validator: (value: T) => boolean;
        constructor();
        /**
         * Sets value.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        set(value: T, message?: FireInfoContract | string): boolean;
        /**
         * Sets the value. A status and further information will be returned.
         * @param value  The value of the property to set.
         * @param message  A message for the setting event.
         */
        setForDetails(value: T, message?: FireInfoContract | string): ChangedInfo<T>;
        setPromise(value: Promise<T>, compatible?: boolean, message?: FireInfoContract | string): Promise<T>;
        setSubscribe(value: SubscriberContract<T>, message?: FireInfoContract | string, callbackfn?: (ev: ChangedInfo<T>, message: FireInfoContract) => void, thisArg?: any): SubscriberResultContract;
        /**
         * Registers a handler to respond the request message.
         * @param type  The request type.
         * @param h  The handler to respond the request message.
         */
        registerRequestHandler(type: string, h: (owner: SimpleValueAccessorContract<T>, value: any) => void): boolean;
        observe(value: ValueObservable<T>): ChangeFlowRegisteredContract | {
            dispose(): void;
        };
        stopObserving(): void;
        syncFromObserving(message?: FireInfoContract | string): boolean;
        isObserving(): boolean;
        createClient(): ValueClient<T>;
        sendNotify(data: any, message?: FireInfoContract | string): void;
    }
}
