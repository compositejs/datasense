const Engine = require("./dist/engine");

Engine.run(
    require("./dist/events"),
    require("./dist/value"),
    require("./dist/props")
);

module.exports = Engine.run;
