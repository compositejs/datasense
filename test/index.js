const Engine = require("./engine");

Engine.run(
    require("./events"),
    require("./value"),
    require("./props")
);

module.exports = Engine.run;