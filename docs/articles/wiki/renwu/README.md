# 任务

你可以创建一个任务，并在其上绑定所需执行的方法，通过设置一些参数，可以控制这些绑定的方法在执行时的逻辑，包括延迟和过滤等。

## 引用和创建实例

```typescript
import { HitTask } from 'datasense';
```

只需使用关键词`new`即可创建其实例。

``` typescript
// Create an instance of event controller so that you can on and fire events.
var task = new HitTask();
```

## 设置参数

你可以通过调用`setOptions`方法来设置一些参数。这个方法需要传递一个对象作为参数，该对象可以包含以下属性，均为可选。

- `maxCount` 最大暴击数。
- `minCount` 最小暴击数。
- `span` 暴击最大时间间隔。单位是毫秒。
- `delay` 延迟执行时间。单位是毫秒。
- `mergeMode` 并行执行时，过滤的依据。可以是以下字符串。
  - `debounce` 延迟并响应最后一次执行。
  - `mono` 响应第一次的执行。
  - `none` 响应所有执行。

## 添加委托和运行任务

你可以添加一个或多个函数至这个任务中，执行时，这些函数会依次执行。

```typescript
task.pushHandler((arg, info) => {
    console.info("Processed.", arg, info);
});
```

通过以下方式来尝试执行。具体是否执行，依赖于前面定义的参数控制。

```typescript
task.process();
```

这个方法可以接收一个传参。这个参数会被作为所添加的函数的第一个入参传入。

## 函数节流和去抖

以下示例演示了函数节流的设置。

```typescript
let task = HitTask.throttle(() => {
    // 此处放置业务逻辑……
}, 10000, true);
```

这只是准备了一个任务对象，里面的函数并没执行，除非不传第3个参数或传`false`。这里面，第1个参数为所需执行的函数；第2个参数为节流时长。如果要执行该任务，可以按下述方法调用，调用后，该任务会自动根据节流设置来决定是否实际触发里面的函数。

```typescript
task.process();
```

实际上，该辅助方法等同于在`HitTask`中设置类似以下选项。

```json
{
    "span": 500,
    "maxCount": 1
}
```

函数去抖也类似。


```typescript
let task = HitTask.debounce(() => {
    // 此处放置业务逻辑……
}, 500, true);

// 在需要的地方调用。
task.process();
```

其中第2个参数为延迟时长，其余参数与函数节流一致。

实际上，该辅助方法等同于在`HitTask`中设置类似以下选项。

```json
{
    "delay": 500,
    "mergeMode": "debounce"
}
```

## 暴击事件

有时我们需要获取短时间内多次触发的事件，并在指定次数时才执行指定函数，如双击即为短时间触发中的第2次才实际执行。

```typescript
let task = HitTask.multiHit(() => {
    // Do something here.
}, 2, 2, 200, true);

// 在需要的地方调用。
task.process();
```

第2个参数和第3个参数分别是最小和最大触发次数，只有满足该条件才会真正执行里面的函数；第4个参数是算作连击的最大间隔，即两次触发超过该间隔后，后面触发的次数会重新计算。第5个参数为是否仅为准备。

实际上，该辅助方法等同于在`HitTask`中设置类似以下选项。

```json
{
    "span": 200,
    "minCount": 2,
    "maxCount": 2
}
```

## 计划任务

你可以创建一个能够周期性执行指定函数的任务。

```typescript
let scheduler = HitTask.schedule(info => {
    // 此处放置业务逻辑……
}, 6000);

// 立即开始执行，并会于随后周期型执行。
scheduler.start();

// 暂停。
scheduler.pause();

// 恢复。
scheduler.resume();

// 在指定周期后启动，并会于随后周期型执行。
scheduler.start(true);

// 立即执行，并且忽略周期性规则。
scheduler.process();

// 停止。
scheduler.stop();
```

<!-- End -->
---

[下一页](../shijian/)