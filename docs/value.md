# Value

Value controller is used to manage a value with full control of accessing and observing. Value observable is the observable model of the controller which has no value setting ability.

## Concepts

Controller and client is derived from observable but with setter ability. Client is used to access the controller and manage all the disposable objects such as event listener. Following is a table about their abilities.

| Abilities | Controller | Client | Observable |
| ---------------- | ---------- | ---------- | ---------- |
| Get | √ | √ | √ |
| Set | √ | √ | × |
| Event | √ | √ | √ |
| Subscriber | √ | √ | √ |
| Send Notify | √ | √ | × |
| Receive Notify | √ | √ | × |
| Send Broadcast | √ | √ | √ |
| Receive Broadcast | √ | √ | √ |
| Send Request | √ | √ | √ |
| Register Actions | √ | √ | × |

## Usage and initialize an instance

```typescript
import { ValueController } from 'datasense';
```

You can create an instance by using `new` keyword.

``` typescript
// Create a value controller.
let value = new ValueController<string>();
```

## Access

You can get or set its value by following way.

``` typescript
// Set value.
value.set("Morning!");

// Get value.
console.info(value.get());
```

You can customize the formatter and validator for the value. Following are examples.

```typescript
// Convert the value to string.
value.formatter = newValue => (newValue || "").toString();

// Make sure the value is not empty, null or undefined.
value.validator = newValue => !!newValue;
```

## Event listener

You can add an event listener which will be raised after the value is changed. And you can get the listener controller introduced by [event](./event.md).

```typescript
// Add event listener on changed.
value.onChanged((ev, listenerController) => {
    console.info(`The new value of ${listenerController.key} is ${ev.value} and old value is ${ev.oldValue}, it changes ${listenerController.count} times.`);
});
```

The above is after the value has been changed. You can also add an event listener before the value is changed and get an observable to set a callback called for changed succeeded or failure.

``` typescript
// Add event listener when changing.
value.onChanging(ev => {
    console.info(`Change to ${ev.valueRequest}.`);

    // And we can set a callback when done.
    ev.observable.onResolved(newValue => {
        console.info(`New value is ${newValue}.`);
    });

    // And also for failure.
    ev.observable.onRejected(err => {
        console.info("Something wrong.", err);
    });
});
```

It may be failed to set if you set a validation and the new value is invalid. You can call `onChangeFailed` method to add the event listener for this case just like the way to call `onChanged` for value changed.

Readonly properties `changed`, `changing` and `changeFailed` are the event observable instances.

## Subscribe

If you just want to subscribe the value changes, see following way.

``` typescript
// Subscribe new value.
value.subscribe(newValue => {
    console.info(`The new value is ${newValue}.`);
});
```

The result of this method has a `dispose` function to unsubscribe.

## Actions store

You can define some actions so that you can just send the request to do what you expect.

```typescript
props.registerRequestHandler("append", (acc, data) => {
    props.set(props.get() + data);
});
```

To process this action, just send a request.

```typescript
props.sendRequest("append", " Afternoon!");
console.info(props.get()); // "Morning! Afternoon!"
```

## Create observable instance

You can create an observable instance of this. You can only get value, add event listeners or subscribe this instance but you cannot set value except request sending so that you can transfer this instance to other places for usages and do not worry about the value will be changed unexpected.

The observable instance is disposable. All event listeners added and subscriptions on it will be disposed when you dispose this instance.

```typescript
let valueObs = value.createObservable();
valueObs.onChanged(ev => {});

// All event listeners and subscriptions will be diposed if dispose this instance.
valueObs.dispose();
```

And if you want to create an instance with above functionalities and the `set` functions, you can create following.

```typescript
let valueClient = value.createClient();
```

Both `ValueClient` and `ValueObservable` can create their observable instance, too.

## Broadcast

Broadcast is used to transfer or share a specific object to all the instances related the current one, including controllers, observables and clients. Then receiver can get this object to respond for the business logic.

Controller, observable and client can send broadcast message, and any of them can add event listener to receive including the one send by itself.

```typescript
value.onBroadcastReceived(ev => {
    console.info(ev);
});
valueObs.onBroadcastReceived(ev => {
    console.info(ev);
});
value.sendBroadcast("This is a message.");
valueObs.sendBroadcast("This is another message.")
```

Notify is another kind of broadcast with limitation that controller and client can send it but observable cannot although any of them can add event listener to receive it.

```typescript
valueObs.onNotifyReceived(ev => {
    console.info(ev);
});
value.sendNotify("This is a notification.");
```

## Bindings

You can observe another observable value so that its value will be changed if that value is changed.

```typescript
// Suppose there is another observable value.
let value2 = new ValueController();
value2.set("Initialized value");

// Observe that instance to build one-way bindings.
// value2 -> value
value.observe(value2);
console.info(value.get()); // Should be "Initialized value".
```

If you set a new value into current value controller:

- Current one will be set succeeded.
- The value observed will not be updated; and
- Current one will be overridden by value observed again when the value observed is set by another value or you asked to sync immediately as following example.

```typescript
value.syncFromObserved();
```

And you can also build two-way binding between them by let them observe each other so that any of them is changed will sync to the other. Only ValueController and ValueClient can observe others.

```typescript
value2.observe(value);
```

To stop observing, you can call `stopObserving` member method.

---

[Next](./props.md)