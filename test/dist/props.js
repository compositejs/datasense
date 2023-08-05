"use strict";
const engine_1 = require("./engine");
const DataSense = require("../../index");
const testCase = (0, engine_1.create)("Props observable");
testCase.add("Access", () => {
    let obj = new DataSense.PropsController();
    // We can set a property.
    obj.setProp("name", "abc");
    // And we can check and get the property.
    engine_1.assert.isTrue(obj.hasProp("name"));
    engine_1.assert.equals(obj.getProp("name"), "abc");
    // Add an event listener occurred after the value is changed.
    let nextValue;
    obj.onPropChanged("name", ev => {
        engine_1.assert.equals(ev.key, "name");
        // For test, we record the new value.
        nextValue = ev.value;
    });
    obj.setProp("name", "defg");
    engine_1.assert.equals(nextValue, "defg");
    // We can set and get a number of the property.
    obj.setProp("key", "hijk");
    obj.setProp("more", "lmn");
    engine_1.assert.equals(obj.getProp("key"), "hijk");
    engine_1.assert.equals(obj.getProp("more"), "lmn");
    // Test for null.
    obj.setProp("null", null);
    engine_1.assert.equals(obj.getProp("null"), null);
    // Batch set properties.
    obj.setProps({
        name: "opq",
        key: "rst"
    });
    engine_1.assert.equals(nextValue, "opq");
    engine_1.assert.equals(obj.getProp("name"), "opq");
    engine_1.assert.equals(obj.getProp("key"), "rst");
    engine_1.assert.equals(obj.getProp("more"), "lmn");
    // Remove a property.
    obj.removeProp("more");
    engine_1.assert.isFalse(obj.hasProp("more"));
    engine_1.assert.equals(obj.getProp("more"), undefined);
    // Get all properties.
    var keys = obj.getKeys();
    engine_1.assert.equals(keys.length, 3);
    engine_1.assert.equals(keys[0], "name");
    engine_1.assert.equals(keys[1], "key");
    engine_1.assert.equals(keys[2], "null");
    // Get proxy to access.
    engine_1.assert.equals(obj.proxy.name, "opq");
    obj.proxy.name = "uvw";
    engine_1.assert.equals(nextValue, "uvw");
    engine_1.assert.equals(obj.proxy.name, "uvw");
    // We can also define some actions.
    obj.registerRequestHandler("something", (acc, data) => {
        obj.setProps({
            key: data.title,
            more: data.number
        });
    });
    obj.sendRequest("something", {
        title: "xyz",
        number: 543210
    });
    engine_1.assert.equals(obj.getProp("key"), "xyz");
    engine_1.assert.equals(obj.getProp("more"), 543210);
    obj.sendRequest("something", {
        number: 6789
    });
    engine_1.assert.isTrue(obj.hasProp("key"));
    engine_1.assert.equals(obj.getProp("key"), undefined);
    engine_1.assert.equals(obj.getProp("more"), 6789);
});
testCase.add("Observable", () => {
    let obj = new DataSense.PropsController();
    // Set a property.
    obj.setProp("name", "abcdefg");
    // We can create a client so that we can access value and add event listeners.
    let client = obj.createClient();
    engine_1.assert.isTrue(client.hasProp("name"));
    engine_1.assert.equals(client.getProp("name"), "abcdefg");
    engine_1.assert.isFalse(client.hasProp("key"));
    // We can create an observable to add event listeners.
    let obs = obj.createObservable();
    engine_1.assert.isTrue(obs.hasProp("name"));
    engine_1.assert.equals(obs.getProp("name"), "abcdefg");
    engine_1.assert.isFalse(obs.hasProp("key"));
    // Update some properties.
    obj.setProp("name", "hijk");
    obj.setProp("key", "lmn");
    engine_1.assert.equals(obj.getProp("name"), "hijk");
    engine_1.assert.equals(obj.getProp("key"), "lmn");
    engine_1.assert.equals(client.getProp("name"), "hijk");
    engine_1.assert.equals(client.getProp("key"), "lmn");
    engine_1.assert.equals(obs.getProp("name"), "hijk");
    engine_1.assert.equals(obs.getProp("key"), "lmn");
    // Update a property by client.
    client.setProp("key", "opq");
    engine_1.assert.equals(obj.getProp("key"), "opq");
    engine_1.assert.equals(client.getProp("key"), "opq");
    engine_1.assert.equals(obs.getProp("key"), "opq");
    // The controller and client can send notify to all.
    let notifyMessage;
    obs.onNotifyReceived(ev => {
        notifyMessage = ev;
    });
    client.sendNotify("Greetings!");
    engine_1.assert.equals(notifyMessage, "Greetings!");
    // Any of observable, client controller can send broadcast message to all.
    client.onBroadcastReceived(ev => {
        notifyMessage = ev;
    });
    obs.sendBroadcast("How are you?");
    engine_1.assert.equals(notifyMessage, "How are you?");
    // The client and observable can create another observable.
    let obs2 = obs.createObservable();
    engine_1.assert.equals(obs2.getProp("name"), "hijk");
    let obs3 = client.createObservable();
    engine_1.assert.equals(obs3.getProp("name"), "hijk");
    // Test sync.
    obj.setProp("name", "rst");
    engine_1.assert.equals(obs2.getProp("name"), "rst");
    engine_1.assert.equals(obs3.getProp("name"), "rst");
    client.setProp("name", "uvw");
    engine_1.assert.equals(obs2.getProp("name"), "uvw");
    engine_1.assert.equals(obs3.getProp("name"), "uvw");
    // Create another client.
    let client2 = obj.createClient();
    client2.setProp("name", "xyz");
    engine_1.assert.equals(obs2.getProp("name"), "xyz");
    obj.removeProp("more");
    engine_1.assert.isFalse(client2.hasProp("more"));
});
testCase.add("Property", () => {
    let obj = new DataSense.PropsController();
    // Set a property.
    obj.setProp("name", "abcdefg");
    // Create some property observables.
    let propName = obj.createPropClient("name");
    let propName2 = obj.createPropObservable("name");
    let propValue = obj.createPropObservable("value");
    // Check their values.
    engine_1.assert.equals(propName.get(), "abcdefg");
    engine_1.assert.equals(propName2.get(), "abcdefg");
    engine_1.assert.equals(propValue.get(), undefined);
    // Try to update one and others will be updated soon.
    propName.set("hijklmn");
    engine_1.assert.equals(obj.getProp("name"), "hijklmn");
    engine_1.assert.equals(propName2.get(), "hijklmn");
    engine_1.assert.equals(propValue.get(), undefined);
    obj.setProp("name", "opq rst");
    engine_1.assert.equals(propName.get(), "opq rst");
    engine_1.assert.equals(propName2.get(), "opq rst");
    engine_1.assert.equals(propValue.get(), undefined);
    obj.setProp("value", "uvw xyz");
    engine_1.assert.equals(propName.get(), "opq rst");
    engine_1.assert.equals(propName2.get(), "opq rst");
    engine_1.assert.equals(propValue.get(), "uvw xyz");
    // Remove a property will make the value as undefined.
    obj.removeProp("value");
    engine_1.assert.equals(propName.get(), "opq rst");
    engine_1.assert.equals(propName2.get(), "opq rst");
    engine_1.assert.equals(propValue.get(), undefined);
});
module.exports = testCase;
