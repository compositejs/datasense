# 事件

事件管理器用于提供事件监听和触发的一系列完善的增强型功能。事件观察者模型只用于监听，并也提供一套相关的增强型功能。

## 引用和创建实例

```typescript
import { EventController } from 'datasense';
```

只需使用关键词`new`即可创建其实例。

``` typescript
// Create an instance of event controller so that you can on and fire events.
var events = new EventController();
```

## 注册事件

```typescript
// 注册一个事件。
events.on("click", ev => {
    console.info("Clicked!", ev);
});
```

事实上，不光可以如同上面那样注册一个简单的事件，还可以获得该事件在执行时的处理状况，甚至还能在其中进行事件销毁等操作。通过访问事件委托的第2个参数，可以做到这一切，如下所示。

```typescript
events.on("click", (ev, listenerController) => {
    // 你可以获得注册、触发、上次触发等相关的时间信息，
    // 由此，你就能非常方便地实现诸如函数截流的功能。
    console.info(`Clicked at ${listenerController.fireDate.toLocaleTimeString()}!`, ev);

    // 你还可以访问其它一些信息，甚至做一些操作。
    // 例如，我们判断该事件被调用超过3次后，则销毁该事件，即以后便不再会执行。
    if (listenerController.count > 3)
        listener.dispose();
});
```

以上看起来可以做很多事情，然而，还有更轻松的：只需在该函数的第4个参数中，指定一些选项，即可完成这些任务。例如，以下示例是关于如何指定该事件最多只执行3次。

```typescript
events.on("click", (ev, listenerController) => {
    console.info("Clicked!", ev);
}, null, {
    invalid: 3
});
```

属性`invalid`可用于指定执行多少次后即销毁该事件，也可通过指定一个函数并通过返回`true`或`false`来决定是否销毁。你也可以配合使用`invalidForNextTime`属性来控制是否需要等该次事件执行完后才销毁。除此之外，你还可以通过该对象来实现诸如函数节流、函数去抖、暴击等模式，其对应各属性与[任务](../renwu/)中的设置参数一致。

方法`on`会返回一个对象，其中包括了一些属性和方法，例如`dispose`方法用于销毁该事件。

## 触发事件

触发也非常简单。

```typescript
events.fire("click", "Test only");
```

除此之外，你还可以传入一个额外的消息字符串，该消息将被作为事件函数的第2个的`message`属性传入。

```typescript
events.fire("click", "Test only", "Hello!");

// 你可以如此获取消息字符串，
events.on("click", (ev, listenerController) => {
    console.info(listenerController.message);
});
```

实际上，你还可以传入更多细节，包括一个标识发起者来源的字符串`source`属性，以及用于传入更多内容的`data`属性，原消息字符串放置于`message`属性中。

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

## 订阅

通过订阅，可以以一种非常简单的方式来获取事件的发送通知。

```typescript
events.subscribe("click", ev => {
    console.info("Clicked!", ev);
});
```

其会返回一个对象，该对象中的`dispose`方法可以用于取消该订阅。

## 上下文存储

有时候，我们需要使用一些变量来存储一些临时信息，这些临时信息需要在事件调用者内被访问，即某次调用时，可能会存储一些信息，在下次再次被调用时，需要读取该信息。上下文存储就用于解决这类问题，而无需你在外部另行定义变量。

```typescript
events.on("click", (ev, listenerController) => {
    // 你可以读取某个存储于上下文存储的某个内容，也包括判断是否有该存储。
    // 由于可以存储多项，因此需要指定一个名称来做标识。
    // 以下所示为判断是否存在某一内容，以及如何获取。
    if (listenerController.hasStoreData("latestValue"))
        console.info("Latest event argument.", listenerController.getStoreData("latestValue"));

    // 你也可以设置某一内容。
    listenerController.setStoreData("latestValue", ev);

    // 还可以删除。
    listenerController.removeStoreData("latestValue");
});
```

这些内容不会和其它事件进行共享。

## 创建观察者模型

你可以创建一个观察者模型，该模型只能用于注册事件和添加订阅，而不能触发事件。当你将该对象传入其它模块时，不用担心被随意触发事件。观察者模型在被调用`dispose`销毁时，通过其注册的所有事件和添加的所有订阅也会被自动一并销毁。

```typescript
let eventObs = events.createObservable();
```

你还可以为某一个具体事件创建一个观察者模型，以便使用者专注于该事件的注册和订阅。

```typescript
let clickEvent = events.createSingleObservable("click");
clickEvent.on((ev, listenerController) => {
    console.info(`Clicked ${listenerController.count} times!`, ev);
})
```

## 从 DOM 中创建事件

当然，你可以从 DOM 中创建事件。

```typescript
let element = document.getByElement("#someone");
let obs = EventObservable.createForElement(element, "click");
obs.on(ev => {
    // 此处放置业务逻辑……
});
```

此处的`obs`对象即点击事件的观察者模型实例，你可以利用里面的所有特性。

<!-- End -->
---

[下一页](../duixiang/)