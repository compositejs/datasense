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
// 以下示例通过 Type Script 语法指定值必须为字符串型。
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
// 以下示例为强行转换所设置的值为字符串。
value.formatter = newValue => (newValue || "").toString();

// 以下示例确保值不能为空。
// 如果对值的设置不满足以下条件，该次值设置会被回滚/取消。
value.validator = newValue => !!newValue;
```

## 添加事件

你可以为此添加事件，例如值内容修改后的事件。这些事件包括一些[事件](../shijian/)中介绍的增强功能。

```typescript
// 添加一个事件，其会在值修改成功后触发。
value.onChanged((ev, listenerController) => {
    console.info(`新值是${ev.value}，旧值是${ev.oldValue}，共被改过${listenerController.count}次。`);
});
```

以上示例是关于值变更后的事件。你也可以在正式变更前获得事件支持，如下所示。

``` typescript
// 添加一个事件，其会在值准备修改时触发。
value.onChanging(ev => {
    console.info(`计划更改为${ev.valueRequest}。`);

    // 你可以在其中设置修改成功后的回调。
    ev.observable.onResolved(newValue => {
        console.info(`新值是${newValue}。`);
    });

    // 以及若失败了的回调。
    ev.observable.onRejected(err => {
        console.error("出错啦！", err);
    });
});
```

如果设置有验证器，那么有可能会存在值设置失败的情况，此时可以调用`onChangeFailed`方法来监听对应的事件。

你也可以通过访问`changed`、`changing`和`changeFailed`属性来获得这些事件的相关操作，它们都是事件观察者模型。

## 订阅

如果你只是想简单地订阅值的改动，可以参考以下示例。

``` typescript
// 订阅值的变动。
value.subscribe(newValue => {
    console.info(`The new value is ${newValue}.`);
});
```

它将返回一个包含`dispose`方法的结果，该方法用于取消订阅。

## 预设动作

你可以预设一些动作。动作通常可以用于预定义一些标准行为，如按照某种形式来修改值的内容。

```typescript
value.registerRequestHandler("append", (acc, data) => {
    value.set(value.get() + data);
});
```

这样，只需发送动作请求，即可直接执行这些动作。

```typescript
value.sendRequest("append", " Afternoon!");
console.info(value.get()); // "Morning! Afternoon!"
```

## 创建观察者模型

你可以创建一个观察者模型。该模型只能被读取、监听、订阅、收发广播和接受通知，而不能直接操作里面的内容，但可以通过发送动作请求来执行预定的动作。基于此特性，该实例适用于传递给其它模块使用，而不用担心这些模块会对数据内容进行非预期的篡改。

观察者模型会自动收集从中创建的事件和订阅，从而在该模型被销毁时，自动取消这些事件和订阅。

```typescript
let valueObs = value.createObservable();
valueObs.onChanged(ev => {});

// 所有在该观察者模型上注册的事件和添加的订阅都会一并销毁。
valueObs.dispose();
```

如果你希望拥有除订阅者模型的功能外，还要有设置、发送通知、注册预设动作等功能，可创建一个控制器的副本。

```typescript
let valueClient = value.createClient();
```

类型`ValueClient`和`ValueObservable`都可以创建源自其自身的观察者模型。

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

## 绑定

你也可以让当前控制器监听其它观察者模型，当被绑定的观察者模型中的内容更新，当前控制器中的内容也会同步更新，如下示例。

```typescript
// 另一个控制器/观察者模型。
let value2 = new ValueController();
value2.set("初始值");

// 单向绑定。 value2 -> value
value.observe(value2);
console.info(value.get()); // 会输出"初始值"。
```

如果你在绑定后，对当前控制器进行值的设置，那么，

- 当前值被成功改变；
- 监听的那个观察者模型不受影响；
- 当监听的那个观察者对象的值被改动，或者你像如下所示去强制同步，则会再次用监听的那个观察者模型的最新的值去覆盖当前的值。

```typescript
value.syncFromObserved();
```

以上是单向数据绑定，如果你想在两个控制器间创建双向数据绑定，可以让它们相互监听对方。

```typescript
value2.observe(value);
```

如果需要停止监听，直接调用`stopObserving`成员方法即可。

<!-- End -->
---

[下一页](../shuxingjihe/)