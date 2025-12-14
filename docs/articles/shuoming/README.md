DataSense 是一个包含增强的任务、事件、观察者等功能和模型的前端库。

## 安装和引用

通过执行以下命令，可以从 [npm](https://www.npmjs.com/package/datasense) 来安装。

```sh
npm i datasense
```

另外，你也可以直接下载以下之一的打包后的JS脚本文件，作为 `script` 标签插入你的网页中来进行使用。

- `https://cdn.jsdelivr.net/npm/datasense/dist/index.js`
- `https://unpkg.com/datasense/dist/index.js`

具体安装和引用方法，请[点击此处](../anzhuang/)来进行了解。

## 功能

DataSense 提供一些列底层 API，以提供增强版的访问者模型、绑定与订阅关系、时序任务控制等，你可以利用这些基础功能，来实现你的上层业务逻辑，或在实现用于其它业务场景的高阶技术封装时，基于此进行二次开发。

以下是本库的几个核心功能，可以点击进入查看详情（部分内容为英文），其中示例默认以 Type Script 语言书写。

- [任务](../task/chs.md) - 提供一种对方法执行的控制，包括延迟执行、次数限制、响应过滤等。
- [事件](../event/chs.md) - 可创建多实例，每个实例均可注册多组事件，每个事件均可拥有更为完善的信息获取和控制能力。
- [对象](../value/chs.md) - 可以创建一个实例，并设置一个对象来对其进行访问和监听。
- [属性集合](../props/.chs.md) - 可以创建一个实例，并设置一组对象来对其进行访问和监听，这些变量将以键值对的形式存储和管理。

## 编译和测试

编译之前，需要先确保安装有 `terser` 和 `tsc`。然后执行以下命令即可编译。

```sh
npm run build
```

编译之后，还可以通过执行以下命令来运行所有的单元测试。

```sh
npm test
```

## 许可

本项目基于 [MIT 许可](https://github.com/compositejs/datasense/blob/master/LICENSE)授权，欢迎使用。你也可以根据需要 clone 或 folk 本仓库。
