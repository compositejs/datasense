var Engine = require("./engine");
var DataSense = require("../index.js");
let { create, assert } = Engine;
let testCase = create("Props observable");

testCase.add("Access", () => {
    var obj = new DataSense.PropsController();

    // We can set a property.
    obj.setProp("name", "abc");

    // And we can get the property.
    assert.equals(obj.getProp("name"), "abc");

    // Add a listner event for changing.
    var nextValue;
    obj.onPropChanged("name", (ev, c) => {
        assert.equals(ev.key, "name");
        nextValue = ev.value;
    });
    obj.setProp("name", "defg");
    assert.equals(nextValue, "defg");

    // Create observable and client.
    var obs = obj.createObservable();
    var client = obj.createClient();
    client.setProp("name", "hijklmn");
    assert.equals(obs.getProp("name"), "hijklmn");
    assert.equals(nextValue, "hijklmn");
});

module.exports = testCase;
