var Engine = require("./engine");

var ValueTest = require("./value");
var PropsTest = require("./props");

Engine.run(ValueTest, PropsTest);

module.exports = Engine.run;