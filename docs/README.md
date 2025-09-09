# DataSense

A JavaScript library of observable, events and advanced model.

## Installation and Usage

You can install this by [npm](https://www.npmjs.com/package/datasense).

```sh
npm i datasense
```

And you can also insert one of following JavaScript bundled file by `script` tag into your web page directly.

- `https://cdn.jsdelivr.net/npm/datasense/dist/index.js`
- `https://unpkg.com/datasense/dist/index.js`

## Features

DataSense provides lots of powerful low-level APIs for the management of observable, events and tasks. You can build your business logic apps or technical libraries based on this, including one/two-way-bindings, observing, subscript management and time sequence controlling.

Following are the key features that you can click to read more. The samples are written by Type Script by default in these documents.

- [Task](https://github.com/compositejs/datasense/wiki/task) - A way to control how process a given handler including debounce, throttle, multiple hits, etc.
- [Event](https://github.com/compositejs/datasense/wiki/event) - A place to add event listeners and raise events with additional information and utilities supports, such as the one the tasks provided.
- [Value](https://github.com/compositejs/datasense/wiki/value) - The controller and observable for a variable so that you can access it and subscribe its changing.
- [Props](https://github.com/compositejs/datasense/wiki/props) - The controller and observable for a set of variables with keys. They are like the property of an object. You can access and observe them.

## Building / Testing

You may need install `gulp` and `tsc` to build. Following is the command line to build this project including the source and test cases.

```sh
npm run-script build
```

You can run all test cases after building by following command line.

```sh
npm test
```

## Readme in other languages

- [简体中文](https://github.com/compositejs/datasense/wiki/shuoming)

## License

This project is [MIT Licensed](./LICENSE).

Please feel free to import this into your project. And you can also clone or fork the repository as you want.
