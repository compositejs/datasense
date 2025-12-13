# Event

Event controller is used to let you have full control to add listeners and raise events with lots of useful options. An observable class related is used to add listeners only.

## Usage and initialize an instance

```typescript
import { createEvent } from 'datasense';
```

``` typescript
// Create an instance of event controller so that you can on and fire events.
var events = createEvent();
```

## Add event listener

```typescript
// Add event listener.
events.on("click", ev => {
    console.info("Clicked!", ev);
});
```

In fact, you can have further power to control and get details about this event listener. You can get the listener controller by the 2nd argument in the handler to access these.

```typescript
// Add event listener.
events.on("click", (ev, listenerController) => {
    // You can access the controller for current event listener for status and actions.
    // For example, you can get the date of current and latest date raised of this handler.
    // So that you can use these information to add a debounce, throttle or multiple hits event handler.
    console.info(`Clicked at ${listenerController.fireDate.toLocaleTimeString()}!`, ev);

    // We can dispose this listener after 3 times raised.
    if (listenerController.count > 3)
        listener.dispose();
});
```

To set times that it could raise in the above sample, you can also use following way to implement.

```typescript
events.on("click", (ev, listenerController) => {
    console.info("Clicked!", ev);
}, null, {
    invalid: 3
});
```

The property `invalid` in the 3rd argument is used to dispose the event listener automatically after it is processed equals or more than the given times. You can also set it as `true` if you want to make it only once raising. And you can set `invalidForNextTime` property if you still want to process this handler even if it touches the invalid count and then dispose. And you can also set further properties to support debounce, throttle or multiple hits, see [task](../task/), these properties are as same as the hit task options.

The result of `on` has a number of properties and methods to get the key, fire manually, dispose, etc.

## Raise

You can fire it anywhere.

```typescript
events.fire("click", "Test only");
```

And you can also transfer an additional message to the listener.

```typescript
events.fire("click", "Test only", "Hello!");

// You can get the message by this way,
events.on("click", (ev, listenerController) => {
    console.info(listenerController.message);
});
```

And you can also send further information such as the sender source in string format or even an additional data. And the listener handler can get this by the properties of listener controller, too.

```typescript
events.fire("click", "Test only", {
    source: "Somewhere",
    message: "Hello!",
    data: {
        name: "abc",
        value: "defg"
    }
});
```

## Subscribe

By a simple way to get the notification of event raising, you can just subscribe it.

```typescript
events.subscribe("click", ev => {
    console.info("Clicked!", ev);
});
```

And it will return an object with a method `dispose` to unsubscribe.

## Temp store

Sometimes, we need use a variable or more to save the temp data during an event listener is raised for several times. But it has a center place to do so.

```typescript
events.on("click", (ev, listenerController) => {
    // You can get a value you saved in previous time.
    // You need identify it by a key since you can set and get a lot.
    if (listenerController.hasStoreData("latestValue"))
        console.info("Latest event argument.", listenerController.getStoreData("latestValue"));

    // You can save something here so that you can use next time.
    listenerController.setStoreData("latestValue", ev);

    // And you can delete it.
    listenerController.removeStoreData("latestValue");
});
```

These data will not share with other event listeners.

## Create observable instance

And you can create an observable instance which is used for adding listeners with lots of useful options only so that you can send this object to other places. Its event listeners and subscriptions will be disposed automatically when this observable instance is disposed.

```typescript
let eventObs = events.createObservable();
```

You can also create a single event observable to focus on an event type.

```typescript
let clickEvent = events.createSingleObservable("click");
clickEvent.on((ev, listenerController) => {
    console.info(`Clicked ${listenerController.count} times!`, ev);
})
```

## Create event from DOM

You can use this event observable for DOM.

```typescript
let element = document.getByElement("#someone");
let obs = EventObservable.createForElement(element, "click");
obs.on(ev => {
    // Do something.
});
```

The `obs` variable is a single event observable.

<!-- End -->
---

[Next](../value/)