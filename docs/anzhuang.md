你可以通过 npm 来安装本库；也可以直接下载打包后的脚本文件，并将其引入你的网页中。

## 通过 npm 并使用 ES6 或 Type Script

请在控制台/命令提示符中，转入你所在的项目目录，并执行以下命令。

```
npm install datasense
```

然后引入需要使用的功能。如下示例。

```typescript
import { PropsController } from 'datasense';

let props = new PropsController();
props.setProp("name", "Muse");
console.info(`The name is ${props.getProp("name")}.`);
```

当然，你也可以将整个模块引入。


```typescript
import * as DataSense from 'datasense';
```

## CommonJS

请先在控制台/命令提示符中，转入你所在的项目目录，并执行以下命令。

```
npm install datasense
```

然后引入模块。如下示例。

```typescript
const { PropsController } = require('datasense');

let props = new PropsController();
props.setProp("name", "Muse");
console.info(`The name is ${props.getProp("name")}.`);
```

## 直接引入JS文件

你可以将[打包JS脚本文件](./dist/index.js)下载到本地，并通过`script`标签插入到你的页面中。然后，可以通过`DataSense`命名空间来进行访问。如下示例。

```typescript
const { PropsController } = DataSense;

let props = new PropsController();
props.setProp("name", "Muse");
console.info(`The name is ${props.getProp("name")}.`);
```

---

[下一页](./renwu.md)
