You can install this web front-end library by npm or by downloading the bundle file to insert a `script` tag into your web page directly.

## ES6 / Type Script via npm

```sh
npm i datasense
```

Then you can import the ones you needed by patching. Following is a sample.

```typescript
import { PropsController } from 'datasense';

let props = new PropsController();
props.setProp("name", "Muse");
console.info(`The name is ${props.getProp("name")}.`);
```

And of couse, you can import all the library as a namespace to use.

```typescript
import * as DataSense from 'datasense';
```

## CommonJS via npm

```sh
npm i datasense
```

And you can require the library and patch what you needed. Following is a sample.

```typescript
const { PropsController } = require('datasense');

let props = new PropsController();
props.setProp("name", "Muse");
console.info(`The name is ${props.getProp("name")}.`);
```

## Insert script file

You can download the [bundle file](./dist/index.js) and insert it into your web page, then you can use the global namespace `DataSense`. Following is a sample.

```typescript
const { PropsController } = DataSense;

let props = new PropsController();
props.setProp("name", "Muse");
console.info(`The name is ${props.getProp("name")}.`);
```

---

[Next](./task.md)
