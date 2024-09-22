# Props

You can manage a set of value controller/observable instance by props controller/observable. You can access them by keys just like the way about accessing property of object.

## Usage and initialize an instance

```typescript
import { createProps } from 'datasense';
```

``` typescript
// Create an instance to access props and listen changed events.
let props = new createProps();
```

## Access

You can get or set the properties by following way.

``` typescript
// Check if has a property.
console.info(`There ${props.hasProp("name") ? "isn't" : "is"} a name here.`);

// Set properties.
props.setProp("name", "Kingcean");
props.setProp("gender", "male");

// Batch set.
props.setProps({
    name: "Lily",
    gender: "female"
});

// Get property.
console.info(props.getProp("name"));
```

## Add event listener and subscribe

You can add event listeners or subscribe changes on it just like the way to value observable but the only difference is you need pass a property key.

```typescript
// Add event listeners or subscribe.
props.onPropChanging("name", ev => {});
props.onPropChanged("name", ev => {});
props.onPropChangeFailed("name", ev => {});
props.subscribeProp("name", newValue => {});
```

And you can add an event listener for the property changeset. It will be raised if you delete or set a property, or batch set properties. The event argument contains a list of change record merged as a property `changes` you can access.

```typescript
props.onPropsChanged(ev => {
    console.info(`${ev.changes.length} properties are changed.`)
});
```

The readonly property `propsChanged` is the observable instance for proeprty changeset event.

## Data model

You can get all property keys by calling `getKeys` method.

And you can get a copy of this into an object. This object has no binding relationship with the original instance so that there is no change in original instance if you set a property in this object. Following is an example.

```typescript
let modelCopy = props.copyModel();
modelCopy.name = "Kingcean";
console.info(`You may still see Lily here - ${props.getProp("name")}.`)
```

But you can get the proxy by `proxy` property which has two-way bingding with the original instance.

## Actions store

You can define some actions so that you can just send the request to do what you expect.

```typescript
props.registerRequestHandler("taller", (acc, data) => {
    let height = props.proxy.height;
    if (height == null) height = 100;
    if (data == null) data = 1;
    props.proxy.height += data;
});
```

To process this action, just send a request.

```typescript
props.sendRequest("taller", 70);
console.info(props.getProp("height") + "cm"); // 170cm
```

## Create observable instance

And of course, you can create an observable instance without setter. It includes observable, event listeners registry, request sender and broadcast sender.

```typescript
let propsObs = props.createObservable();
propsObs.onPropChanged("name", ev => {});

// All event listener and subscriber will be diposed if dispose this instance.
propsObs.dispose();
```

And if you want to create an instance with above functionalities and the `set` functions, you can create following.

```typescript
let propsClient = props.createClient();
```

Both `PropsClient` and `PropsObservable` can create their observable instance, too.

And you can also get the property observable or property client.

```typescript
let nameObs = props.createPropObservable("name");
let nameClient = props.createPropClient("name");
```

## Broadcast

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

Controller and client can also send notify message but observable cannot. But any of them can add event listener to receive it.

```typescript
valueObs.onNotifyReceived(ev => {
    console.info(ev);
});
value.sendNotify("This is a notification.");
```

---

[Back home](../README.md)