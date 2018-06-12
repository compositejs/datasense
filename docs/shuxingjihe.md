# 属性集合

你可以通过键值对的形式访问、监听或管理一组对象，并可据此快速生成观察者模型或数据模型。

## 引用和创建实例

```typescript
import { PropsController } from 'datasense';
```

只需使用关键词`new`即可创建其实例。

``` typescript
// Create an instance.
let props = new PropsController();
```

## 访问属性

你可以获取或设置指定属性的值。

``` typescript
// 检查是否已存在该属性。
console.info(`There ${props.hasProp("name") ? "isn't" : "is"} a name here.`);

// 逐一设置指定属性。
props.setProp("name", "Kingcean");
props.setProp("gender", "male");

// 批量设置一组属性。
props.setProps({
    name: "Lily",
    gender: "female"
});

// 获取指定属性。
console.info(props.getProp("name"));
```

## 添加事件和订阅

你可以为各属性添加事件或订阅，以观测其值的变化。

```typescript
// 注册事件或订阅。
props.onPropChanging("name", ev => {});
props.onPropChanged("name", ev => {});
props.onPropChangeFailed("name", ev => {});
props.subscribeProp("name", newValue => {});
```

并且，你也可以对各属性的更改，添加一个统一的事件，使得任何一个或一批属性的值发生变更，都能获得一个汇总。该事件会创造一个数组，里面包含了所有的改动，该数组会以属性`changes`的形式，存在于注册事件的参数中。

```typescript
props.onPropsChanged(ev => {
    console.info(`${ev.changes.length} properties are changed.`)
});
```

你也可以通过`propsChanged`只读属性获取该事件的观察者模型。

## 获取数据模型

You can get all property keys by calling `getKeys` method. And you can get a copy of this into an object. This object has no binding relationship with the original instance so that there is no change in original instance if you set a property in this object. Following is an example.

```typescript
let modelCopy = props.copyModel();
modelCopy.name = "Kingcean";
console.info(`You may still see Lily here - ${props.getProp("name")}.`)
```

But you can get proxy by `proxy` property which has two-way bingding with the original instance.

## 预设动作

你可以预设一些动作。动作通常可以用于预定义一些标准行为，如按照某种形式来修改属性。

```typescript
props.registerRequestHandler("taller", (acc, data) => {
    let height = props.proxy.height;
    if (height == null) height = 100;
    if (data == null) data = 1;
    props.proxy.height += data;
});
```

这样，只需发送动作请求，即可直接执行这些动作。

```typescript
props.sendRequest("taller", 70);
console.info(props.getProp("height") + "cm"); // 170cm
```

## 创建观察者模型

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

## 广播和通知

广播消息用于将某一自定义对象发送至该实例相关的各控制器、控制器分身和观察者模型，以便响应一些特殊事件。

控制器、控制器分身和观察者模型都可以发送广播消息；并且，它们也都能接收该消息，即便是发自其自身。

```typescript
value.onBroadcastReceived(ev => {
    console.info(ev);
});
valueObs.onBroadcastReceived(ev => {
    console.info(ev);
});
value.sendBroadcast("这是一条消息。");
valueObs.sendBroadcast("这是另一条消息。")
```

通知只能通过控制器及其分身发送，它们以及观察者模型都能接收，包括其自身所发的。通知通常用于响应来自修改者发送的额外对象所带的内容。

```typescript
valueObs.onNotifyReceived(ev => {
    console.info(ev);
});
value.sendNotify("这是另一条通知。");
```

---

[Back home](./shuoming.md)