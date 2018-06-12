# 对象

对象控制器模型可以用于管理一个指定对象，并提供诸如访问和监听的能力。对象观察者模型只提供被监听和值获取的能力，而不能对值进行显示的设置。

## 概念

控制器及其分身都集成自观察者模型，但拥有显示设置值的能力。控制器分身通常是作为控制器的一个代理而存在的，其也具有统一收集监听信息的能力，方便在销毁时自动销毁通过其注册的任何事件和订阅。下表阐述了这三者的能力。

| 功能 | 控制器 | 控制器分身 | 观察者 |
| ---------------- | ---------- | ---------- | ---------- |
| 获取值 | √ | √ | √ |
| 设置值 | √ | √ | × |
| 注册事件 | √ | √ | √ |
| 订阅 | √ | √ | √ |
| 发送通知 | √ | √ | × |
| 接收通知 | √ | √ | × |
| 发送广播 | √ | √ | √ |
| 接收广播 | √ | √ | √ |
| 发送动作请求 | √ | √ | √ |
| 注册动作请求 | √ | √ | × |

## 引用和创建实例

```typescript
import { ValueController } from 'datasense';
```

只需使用关键词`new`即可创建其实例。

``` typescript
// Create a value controller.
let value = new ValueController<string>();
```

## 访问值

你可以采用如下示例所示方式，来设置或获取其中的值。

``` typescript
// 设置一个值。
value.set("Morning!");

// 获取其中的值。
console.info(value.get());
```

你还可以添加转换器和验证器，来使得其值始终符合预期。以下为一组示例。

```typescript
// 强行转换所设置的值为字符串。
value.formatter = newValue => (newValue || "").toString();

// 确保值不能为空。
value.validator = newValue => !!newValue;
```

## 添加事件

You can add an event listener which will be raised after the value is changed. And you can get the listener controller introduced by [event](./shijian.md).

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
        console.info(`New value is ${newValue}`);
    });

    // And also for failure.
    ev.observable.onRejected(newValue => {
        console.info(`New value is ${newValue}`);
    });
});
```

It may be failed to set if you set a validation and the new value is invalid. You can call `onChangeFailed` method to add the event listener for this case just like the way to call `onChanged` for value changed.

Readonly properties `changed`, `changing` and `changeFailed` are the event observable instances.

## 订阅

If you just want to subscribe the value changes, see following way.

``` typescript
// Subscribe new value.
value.subscribe(newValue => {
    console.info(`The new value is ${newValue}.`);
});
```

The result of this method has a `dispose` function to unsubscribe.

## 预设动作

你可以预设一些动作。动作通常可以用于预定义一些标准行为，如按照某种形式来修改值的内容。

```typescript
props.registerRequestHandler("append", (acc, data) => {
    props.set(props.get() + data);
});
```

这样，只需发送动作请求，即可直接执行这些动作。

```typescript
props.sendRequest("append", " Afternoon!");
console.info(props.get()); // "Morning! Afternoon!"
```

## 创建观察者模型

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

[下一页](./shuxingjihe.md)