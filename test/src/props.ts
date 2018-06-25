import { create, assert } from "./engine"
import * as DataSense from "../../index";

const testCase = create("Props observable");

testCase.add("Access", () => {
    var obj = new DataSense.PropsController();

    // We can set a property.
    obj.setProp("name", "abc");

    // And we can check and get the property.
    assert.isTrue(obj.hasProp("name"));
    assert.equals(obj.getProp("name"), "abc");

    // Add an event listener after the value is changed.
    var nextValue;
    obj.onPropChanged("name", ev => {
        assert.equals(ev.key, "name");

        // For test, we record the new value.
        nextValue = ev.value;
    });
    obj.setProp("name", "defg");
    assert.equals(nextValue, "defg");

    // We can set and get a number of property.
    obj.setProp("key", "hijk");
    obj.setProp("more", "lmn");
    assert.equals(obj.getProp("key"), "hijk");
    assert.equals(obj.getProp("more"), "lmn");

    // Test for null.
    obj.setProp("null", null);
    assert.equals(obj.getProp("null"), null);

    // Batch set properties.
    obj.setProps({
        name: "opq",
        key: "rst"
    });
    assert.equals(nextValue, "opq");
    assert.equals(obj.getProp("name"), "opq");
    assert.equals(obj.getProp("key"), "rst");
    assert.equals(obj.getProp("more"), "lmn");

    // Remove a property.
    obj.removeProp("more");
    assert.isFalse(obj.hasProp("more"));
    assert.equals(obj.getProp("more"), undefined);

    // Get all props.
    var keys = obj.getKeys();
    assert.equals(keys.length, 3);
    assert.equals(keys[0], "name");
    assert.equals(keys[1], "key");
    assert.equals(keys[2], "null");

    // Get proxy to access.
    assert.equals(obj.proxy.name, "opq");
    obj.proxy.name = "uvw";
    assert.equals(nextValue, "uvw");
    assert.equals(obj.proxy.name, "uvw");

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
    assert.equals(obj.getProp("key"), "xyz");
    assert.equals(obj.getProp("more"), 543210);
    obj.sendRequest("something", {
        number: 6789
    });
    assert.isTrue(obj.hasProp("key"));
    assert.equals(obj.getProp("key"), undefined);
    assert.equals(obj.getProp("more"), 6789);
});

testCase.add("Observable", () => {
    let obj = new DataSense.PropsController();

    // Set a property.
    obj.setProp("name", "abcdefg");

    // We can create a client so that we can access value and add event listeners.
    let client = obj.createClient();
    assert.isTrue(client.hasProp("name"));
    assert.equals(client.getProp("name"), "abcdefg");
    assert.isFalse(client.hasProp("key"));

    // We can create an observable to add event listeners.
    let obs = obj.createObservable();
    assert.isTrue(obs.hasProp("name"));
    assert.equals(obs.getProp("name"), "abcdefg");
    assert.isFalse(obs.hasProp("key"));

    // Update some properties.
    obj.setProp("name", "hijk");
    obj.setProp("key", "lmn");
    assert.equals(obj.getProp("name"), "hijk");
    assert.equals(obj.getProp("key"), "lmn");
    assert.equals(client.getProp("name"), "hijk");
    assert.equals(client.getProp("key"), "lmn");
    assert.equals(obs.getProp("name"), "hijk");
    assert.equals(obs.getProp("key"), "lmn");

    // Update a property by client.
    client.setProp("key", "opq");
    assert.equals(obj.getProp("key"), "opq");
    assert.equals(client.getProp("key"), "opq");
    assert.equals(obs.getProp("key"), "opq");

    // The controller and client can send notify to all.
    let notifyMessage;
    obs.onNotifyReceived(ev => {
        notifyMessage = ev;
    });
    client.sendNotify("Greetings!");
    assert.equals(notifyMessage, "Greetings!");

    // Any of observable, client controller can send broadcast message to all.
    client.onBroadcastReceived(ev => {
        notifyMessage = ev;
    });
    obs.sendBroadcast("How are you?");
    assert.equals(notifyMessage, "How are you?");

    // The client and observable can create another observable.
    let obs2 = obs.createObservable();
    assert.equals(obs2.getProp("name"), "hijk");
    let obs3 = client.createObservable();
    assert.equals(obs3.getProp("name"), "hijk");

    // Test sync.
    obj.setProp("name", "rst");
    assert.equals(obs2.getProp("name"), "rst");
    assert.equals(obs3.getProp("name"), "rst");
    client.setProp("name", "uvw");
    assert.equals(obs2.getProp("name"), "uvw");
    assert.equals(obs3.getProp("name"), "uvw");

    // Create another client.
    let client2 = obj.createClient();
    client2.setProp("name", "xyz");
    assert.equals(obs2.getProp("name"), "xyz");
    obj.removeProp("more");
    assert.isFalse(client2.hasProp("more"));
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
    assert.equals(propName.get(), "abcdefg");
    assert.equals(propName2.get(), "abcdefg");
    assert.equals(propValue.get(), undefined);

    // Try to update one and others will be updated soon.
    propName.set("hijklmn");
    assert.equals(obj.getProp("name"), "hijklmn");
    assert.equals(propName2.get(), "hijklmn");
    assert.equals(propValue.get(), undefined);
    obj.setProp("name", "opq rst");
    assert.equals(propName.get(), "opq rst");
    assert.equals(propName2.get(), "opq rst");
    assert.equals(propValue.get(), undefined);
    obj.setProp("value", "uvw xyz");
    assert.equals(propName.get(), "opq rst");
    assert.equals(propName2.get(), "opq rst");
    assert.equals(propValue.get(), "uvw xyz");

    // Remove a property will make the value as undefined.
    obj.removeProp("value");
    assert.equals(propName.get(), "opq rst");
    assert.equals(propName2.get(), "opq rst");
    assert.equals(propValue.get(), undefined);
});

export = testCase;
