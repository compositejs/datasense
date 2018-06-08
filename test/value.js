var Engine = require("./engine");
var DataSense = require("../index.js");
let { create, assert } = Engine;
let testCase = create("Value observable");

testCase.add("Access", () => {
    let value = new DataSense.ValueController();

    // Test intialized value.
    assert.equals(value.get(), undefined);
    
    // We can set the value.
    value.set("abc");

    // We can get the value.
    // The value should be the one we set.
    assert.equals(value.get(), "abc");

    // Test for null.
    value.set(null);
    assert.equals(value.get(), null);

    // Add an event listener for changing.
    // It will raise when we set the value again.
    let nextValue;
    let changedResult = value.onChanged(ev => {
        // For test, we record the new value.
        nextValue = ev.value;
    });

    // Now we set a new value to test if the event will be raised.
    // The new value should be the one we just set.
    value.set("defg");
    assert.equals(nextValue, "defg");

    // Try again.
    value.set("hijklmn");
    assert.equals(nextValue, "hijklmn");

    // We can dispose the event listener.
    changedResult.dispose();

    // So the new value should be the old one since we dispose the event listener.
    value.set("opq");
    assert.equals(nextValue, "hijklmn");

    // We can also dispose the listener in the event handler.
    let changedToken = value.onChanged((ev, c) => {
        // Test the new value and old value.
        assert.equals(nextValue = ev.value, "rst");
        assert.equals(ev.oldValue, "opq");

        // Then dispose.
        c.dispose();
    });

    // Then let us set a new value to test the listener.
    value.set("rst");

    // Make sure the listener is raised.
    assert.equals(nextValue, "rst");

    // And set again.
    // It should not raise now since the event has disposed.
    // But the value should be changed.
    value.set("uvw");
    assert.equals(nextValue, "rst");
    assert.equals(value.get(), "uvw");

    // We can also define some actions.
    value.registerRequestHandler("increase", (acc, data) => {
        if (value.getType() !== "number") return;
        if (data == null) data = 1;
        if (typeof data === "number") value.set(value.get() + data);
    });
    value.registerRequestHandler("decrease", (acc, data) => {
        if (value.getType() !== "number") return;
        if (data == null) data = 1;
        if (typeof data === "number") value.set(value.get() - data);
    });

    // It will work as the actions defined when we send the requests.
    value.set(17);
    value.sendRequest("decrease", null);
    assert.equals(value.get(), 16);
    value.sendRequest("increase", 4);
    assert.equals(value.get(), 20);
    value.set("xyz");
    value.sendRequest("increase", null);
    assert.equals(value.get(), "xyz");
});

testCase.add("Subscribe", () => {
    let value = new DataSense.ValueController();

    // We can subscribe the changing.
    let nextValue;
    let subscribeResult = value.subscribe(newValue => nextValue = newValue);

    // Now let's set a value and test if the subscribe action works correctly.
    value.set("abcdefg");
    assert.equals(nextValue, "abcdefg");
    assert.equals(value.get(), "abcdefg");

    // Try again
    value.set("hijklmnop");
    assert.equals(nextValue, "hijklmnop");
    assert.equals(value.get(), "hijklmnop");

    // Dispose the subscribe action.
    subscribeResult.dispose();

    // Try again to set the value.
    // The original subscribe action should not work now.
    value.set("qrs");
    assert.equals(nextValue, "hijklmnop");

    // In fact, we can call the result of subscribe method returned directly to dispose, too.
    subscribeResult = value.subscribe(newValue => nextValue = newValue);
    value.set("tuv");
    assert.equals(nextValue, "tuv");
    assert.equals(value.get(), "tuv");
    subscribeResult();
    value.set("wx");
    assert.equals(nextValue, "tuv");
    assert.equals(value.get(), "wx");
    value.set("y&z");
    assert.equals(nextValue, "tuv");
    assert.equals(value.get(), "y&z");
});

testCase.add("Format", () => {
    let value = new DataSense.ValueController();

    // We can set the formatter and validator.
    value.formatter = newValue => {
        // We can change or format the new value.
        return newValue === "abc" ? "defg" : newValue;
    };
    value.validator = newValue => {
        // We can check if the new value is valid.
        return newValue !== "hijk";
    };

    // Let's prepare something for validation below.
    let onChangedVariables = {
        times: 0,
    };
    onChangedVariables.result = value.onChanged(ev => {
        onChangedVariables.value = ev.value;
        onChangedVariables.valueRequest = ev.valueRequest;
        onChangedVariables.times++;
    });

    // We can listen the failure event.
    let onChangeFailedVariables = {
        times: 0,
    };
    onChangeFailedVariables.result = value.onChangeFailed(ev => {
        onChangeFailedVariables.times++;
    });

    // We can also listen the changing event.
    let onChangingVariables = {
        times: 0,
    };
    onChangingVariables.result = value.onChanging(ev => {
        onChangingVariables.success = undefined;
        onChangingVariables.times++;
        onChangingVariables.valueRequest = ev.valueRequest;

        // We can set a callback here when the value is set succeeded.
        ev.observable.onResolved(newValue => {
            onChangingVariables.success = true;
            onChangingVariables.value = newValue;
        });

        // We can also set a callback here when the value is set failed.
        ev.observable.onRejected(ex => {
            onChangingVariables.success = false;
        });
    });

    // Now let's have a try for formatter. The input will be changed.
    assert.equals(onChangedVariables.times, 0);
    assert.equals(onChangingVariables.times, 0);
    value.set("abc");
    assert.equals(value.get(), "defg");
    assert.equals(onChangingVariables.times, 1);
    assert.equals(onChangingVariables.success, true);
    assert.equals(onChangingVariables.value, "defg");
    assert.equals(onChangingVariables.valueRequest, "abc");
    assert.equals(onChangedVariables.times, 1);
    assert.equals(onChangedVariables.value, "defg");
    assert.equals(onChangedVariables.valueRequest, "abc");
   
    // And test for validator. It should set failed.
    assert.equals(onChangeFailedVariables.times, 0);
    value.set("hijk");
    assert.equals(value.get(), "defg");
    assert.equals(onChangingVariables.times, 2);
    assert.equals(onChangingVariables.success, false);
    assert.equals(onChangingVariables.valueRequest, "hijk");
    assert.equals(onChangedVariables.times, 1);
    assert.equals(onChangeFailedVariables.times, 1);

    // Then test a normal value.
    value.set("lmn");
    assert.equals(value.get(), "lmn");
    assert.equals(onChangingVariables.times, 3);
    assert.equals(onChangingVariables.success, true);
    assert.equals(onChangingVariables.valueRequest, "lmn");
    assert.equals(onChangedVariables.times, 2);
    assert.equals(onChangedVariables.value, "lmn");
    assert.equals(onChangedVariables.valueRequest, "lmn");
    assert.equals(onChangeFailedVariables.times, 1);
});

testCase.add("Observable", () => {
    let value = new DataSense.ValueController();

    // Let's check how many it changed; and then set a value.
    let valueChangedTimes = 0;
    let valueSubscribeResult = value.subscribe(newValue => {
        valueChangedTimes++;
    });
    value.set("opq");
    assert.equals(valueChangedTimes, 1);

    // We can create a client so that we can access value and add event listeners.
    var client = value.createClient();
    assert.equals(client.get(), "opq");
    let clientChangedTimes = 0;
    client.subscribe(newValue => {
        clientChangedTimes++;
    });

    // We can create an observable to add event listeners.
    var obs = value.createObservable();
    assert.equals(obs.get(), "opq");
    let obsChangedTimes = 0;
    obs.subscribe(newValue => {
        obsChangedTimes++;
    });

    // Let's check if the value can sync from original correctly.
    value.set("r");
    assert.equals(valueChangedTimes, 2);
    assert.equals(value.get(), "r");
    assert.equals(clientChangedTimes, 1);
    assert.equals(client.get(), "r");
    assert.equals(obsChangedTimes, 1);
    assert.equals(obs.get(), "r");

    // And let's check if the value can sync from the client correctly.
    client.set("s");
    assert.equals(valueChangedTimes, 3);
    assert.equals(value.get(), "s");
    assert.equals(clientChangedTimes, 2);
    assert.equals(client.get(), "s");
    assert.equals(obsChangedTimes, 2);
    assert.equals(obs.get(), "s");

    // The controller and client can send notify to all.
    let notifyMessage;
    obs.onNotifyReceived(ev => {
        notifyMessage = ev;
    });
    client.sendNotify("Hello!");
    assert.equals(notifyMessage, "Hello!");

    // Any of observable, client controller can send broadcast message to all.
    client.onBroadcastReceived(ev => {
        notifyMessage = ev;
    });
    obs.sendBroadcast("Test...");
    assert.equals(notifyMessage, "Test...");

    // The observable can create another observable, too.
    var obs2 = obs.createObservable();
    assert.equals(obs2.get(), "s");
    let obs2ChangedTimes = 0;
    obs.subscribe(newValue => {
        obs2ChangedTimes++;
    });

    // Set a value to test.
    value.set("t");
    assert.equals(valueChangedTimes, 4);
    assert.equals(value.get(), "t");
    assert.equals(obs2ChangedTimes, 1);
    assert.equals(obs2.get(), "t");
    assert.equals(obsChangedTimes, 3);

    // We can dispose the observable so that all event added there will be disposed too.
    // The 2nd observable will also be disposed automatically.
    obs.dispose();
    value.set("u");
    assert.equals(valueChangedTimes, 5);
    assert.equals(value.get(), "u");
    assert.equals(obsChangedTimes, 3);
    assert.equals(obs2ChangedTimes, 1);

    // The client can create another observable, too.
    var obs3 = client.createObservable();
    assert.equals(obs3.get(), "u");
    let obs3ChangedTimes = 0;
    obs3.subscribe(newValue => {
        obs3ChangedTimes++;
    });

    // Set a value to test.
    value.set("v");
    assert.equals(valueChangedTimes, 6);
    assert.equals(value.get(), "v");
    assert.equals(obs3ChangedTimes, 1);
    assert.equals(obs3.get(), "v");
    assert.equals(clientChangedTimes, 5);

    // We can dispose the client so that all event added there will be disposed too.
    // The 3rd observable will also be disposed automatically.
    client.dispose();
    value.set("w");
    assert.equals(valueChangedTimes, 7);
    assert.equals(value.get(), "w");
    assert.equals(clientChangedTimes, 5);
    assert.equals(obs3ChangedTimes, 1);

    // Dispose subscribe.
    valueSubscribeResult.dispose();
    value.set("xyz");
    assert.equals(value.get(), "xyz");
    assert.equals(valueChangedTimes, 7);
});

module.exports = testCase;
