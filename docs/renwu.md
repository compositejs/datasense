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

## 误触和延迟

You can process a function in throttle mode as following way.

```typescript
let task = HitTask.throttle(() => {
    // Do something here.
}, 10000, true);
```

This will prepare a task to process where you want to call. The 2nd argument is to set a time span to avoid the later processing. And the 3rd argument is used to declare this task is just for preparing so that it will not process immediately. To process it manually, just do like below.

```typescript
task.process();
```

In fact, the above debounce example is to set the options as following.

```json
{
    "span": 500,
    "maxCount": 1
}
```

Debounce is similar.


```typescript
let task = HitTask.debounce(() => {
    // Do something here.
}, 500, true);

// Call.
task.process();
```

The 2nd argument is a time span to delay to process. The 3rd argument is to stop processing immediately.

In fact, the above debounce example is to set the options as following.

```json
{
    "delay": 500,
    "mergeMode": "debounce"
}
```

## 暴击事件

Sometimes you may need respond some events for mulitple hits such as double click for 2 hits in short, you can use multiple hits task.

```typescript
let task = HitTask.multiHit(() => {
    // Do something here.
}, 2, 2, 200, true);

// Call.
task.process();
```

The 2nd argument is to set the minimum hits count to respond and the 3rd is the maximum. The 4th argument is a time span to reset the hit counter. The 5th argument is to stop processing immediately.

In fact, the above multiple hits example is to set the options as following.

```json
{
    "span": 200,
    "minCount": 2,
    "maxCount": 2
}
```

---

[下一页](./shijian.md)