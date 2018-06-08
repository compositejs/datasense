# DataSense

A JavaScript library of observable, events and advanced model.

## Features

### Event

Event controller is used to let you have full control to add listeners and raise events with lots of useful options. An observable class related is used to add listeners only.

Following is an sample.

```typescript
import { EventController } from 'datasense';

// Create an instance of event controller so that you can on and fire events.
var events = new EventController();

// Add event listener.
events.on("click", (ev, listenerController) => {
    console.info("Clicked!", ev);

    // You can access the controller for current event listener for status and actions.
    // For example, we can off this listener after 3 times raised.
    if (listenerController.count > 3)
        listener.dispose();
});
```

For above sample, we can also use following way to implement.

```typescript
events.on("click", (ev, listenerController) => {
    console.info("Clicked!", ev);
}, {
    invalid: 3
});
```

The result of `on` has a number of properties and methods to get the key, fire manually, dispose, etc.

You can fire it anywhere.

```typescript
events.fire("click", "Test only");
```

And you can create an observable instance which is used for adding listeners with lots of useful options only so that you can send this object to other places.

```typescipt
let eventObs = events.createObservable();
```

### Value

Value controller is used to manage a value with full control of accessing and observing. Value observable is the observable model of the controller which has no setting ability.

```typescript
import { ValueController } from 'datasense';

// Create a value controller.
let value = new ValueController<string>();

// Set value.
value.set("Morning!");

// Get value.
console.info(value.get());
```

And you can add event listener or subscribe for changes.

```typescript
// Add event listener on changed.
value.onChanged((ev, listenerController) => {
    console.info(`The new value of ${listenerController.key} is ${ev.value} and old value is ${ev.oldValue}, it changes ${listenerController.count} times.`);
});

// Subscribe new value.
value.subscribe(newValue => {
    console.info(`The new value is ${newValue}.`);
});

// Add event listener when changing.
value.onChanging(ev => {
    console.info(`Change to ${ev.valueRequest}.`);

    // And we can set a callback when done.
    ev.observable.onResolved(newValue => {
        console.info(`New value is ${newValue}`);
    });

    // And also for failure.
    ev.observable.onRejected(newValue => {
        console.info(`New value is ${newValue}`);
    });
});
```

You can create an observable instance.

```
let valueObs = value.createObservable();
```

### Object

You can manage a set of value controller/observable instance by props controller/observable. You can access them by key just like the way about accessing property of object but with observable ability.

```typescript
import { PropsController } from 'datasense';

// Create an instance.
let props = new PropsController();

// Access property.
props.setProp("name", "Kingcean");
props.setProp("gender", "male");
console.info(props.getProp("name"));
console.info(`There is ${props.hasProp("birthday") ? "no " : ""} property of birthday registered here.`);
props.onPropChanged(ev => {});
props.onPropChanging(ev => {});
props.subscribe(newValue => {});
```

You can set props in a batch.

```typescript
props.setProps({
    name: "Lily",
    gender: "female"
});
console.info(props.getProp("name"));
```

You can get all property keys by calling `getKeys` method. And you can get a copy of this into an object. This object has no binding relationship with the original instance so that there is no change of original instance if you set property of this object.

```typescript
let modelCopy = props.copyModel();
modelCopy.name = "Kingcean";
console.info(`You may still see Lily here - ${props.getProp("name")}.`)
```

But you can get proxy by `proxy` property which has two-way bingding with the original instance.

You can define some actions so that you can just send the request to do what you expect.

```typescript
props.registerRequestHandler("taller", (acc, data) => {
    let height = props.proxy.height;
    if (height == null) height = 100;
    if (data == null) data = 1;
    props.proxy.height += data;
});
props.sendRequest("taller", 70);
console.info(props.getProp("height") + "cm"); // 170cm
```

And of course, you can create an observable instance without setter.

```typesript
let propsObs = props.createObservable();
```

See test cases for more. Enjoy!
