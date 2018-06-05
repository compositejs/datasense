var Engine = require("./engine");
var DataSense = require("../dist/datasense.js");
let { create, assert } = Engine;
let testCase = create("Value observable");

testCase.add("Access", () => {
    var value = new DataSense.ValueController();

    // We can set the value.
    value.set("abc");

    // And we can get the value.
    assert.equals(value.get(), "abc");

    // Add a listner event for changing.
    var nextValue;
    value.onChanged((ev, c) => {
        nextValue = ev.value;
    });
    value.set("defg");
    assert.equals(nextValue, "defg");

    // Create observable and client.
    var obs = value.createObservable();
    var client = value.createClient();
    client.set("hijklmn");
    assert.equals(obs.get(), "hijklmn");
    assert.equals(nextValue, "hijklmn");
});

module.exports = testCase;
