# Task

You can create a task and register a handler to process. You can define the behavior to process the task such as debounce, throttle and multiple hits.

## Usage and initialize an instance

```typescript
import { HitTask } from 'datasense';
```

You can create an instance by using `new` keyword.

``` typescript
// Create an instance of event controller so that you can on and fire events.
var task = new HitTask();
```

## Set options

You can set an options by `setOptions` method with an argument which has following properties.

- `maxCount` The maximum hits count.
- `minCount` The minimum hits count.
- `span` A time span in millisecond to reset the hits count.
- `delay` A number about the time span in millisecond to delay to process.
- `mergeMode` A string with following values to define the ignore behavior when a new raising is coming but there is a pending one there.
  - `debounce` Process the last one and ignore all the previous.
  - `mono` Process the first one and ignore the rest.
  - `none` (default) Process all.

## Set handler and process

You can register one or more handlers.

```typescript
task.pushHandler((arg, info) => {
    console.info("Processed.", arg, info);
});
```

And process like this way.

```typescript
task.process();
```

This method can pass an argument and this argument will be the first argument in the handler registered.

## Throttle and debounce

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

## Multiple hits

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

## Scheduler

You can create a schedule task if you want to process a handler periodically.

```typescript
let scheduler = HitTask.schedule(info => {
    // Do something here.
}, 6000);

// Start now.
scheduler.start();

// Pause.
scheduler.pause();

// Resume.
scheduler.resume();

// Start after the duration.
scheduler.start(true);

// Process the handler immediately without the controlling of scheduler.
scheduler.process();

// Stop.
scheduler.stop();
```

---

[Next](./event.md)