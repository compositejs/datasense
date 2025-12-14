You can install this web front-end library by [npm](https://www.npmjs.com/package/datasense) or by downloading the bundle file to insert a `script` tag into your web page directly.

## ES6 / Type Script via npm

```sh
npm i datasense
```

Then you can import the ones you needed by patching. Following is a sample.

```typescript
import { createProps } from 'datasense';

let props = createProps();
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
const { createProps } = require('datasense');

let props = createProps();
props.setProp("name", "Muse");
console.info(`The name is ${props.getProp("name")}.`);
```

## Insert script file

You can download the __one of__ following JavaScript bundle file and insert it into your web page by `script` tag.

- `https://cdn.jsdelivr.net/npm/datasense/dist/index.js`
- `https://unpkg.com/datasense/dist/index.js`

Then you can use the global namespace `DataSense`. Following is a sample.

```typescript
const { createProps } = DataSense;

let props = createProps();
props.setProp("name", "Muse");
console.info(`The name is ${props.getProp("name")}.`);
```

<!-- End -->
---

[Next](../task/)
