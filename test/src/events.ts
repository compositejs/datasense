import { create, assert } from "./engine"
import * as DataSense from "../../index";

const testCase = create("Events and tasks");

testCase.add("Events", () => {
    let events = new DataSense.EventController();

    // We can add an event listener and it will return a disposable instance.
    let eventArgA;
    let eventA = events.on("a", ev => {
        eventArgA = ev;
    });

    // And we can create a single event.
    let aEvent = events.createSingleObservable("a");

    // Add an event listener for once.
    let aEventArg;
    aEvent.on(ev => {
        aEventArg = ev;
    }, null, {
        invalid: 1
    });

    // We can add an event listener and get details of current raising information and actions.
    let eventArgB: string;
    let eventArgB2: DataSense.EventListenerControllerContract;
    events.on<string>("b", (ev, listenerController) => {
        eventArgB = ev;

        // We can get an additioal message sent from raising place.
        eventArgB2 = listenerController;

        // We can get the date on which it registers and raises.
        assert.isTrue((new Date).getTime() >= listenerController.fireDate.getTime());
        if (listenerController.latestFireDate) {
            assert.isTrue(listenerController.fireDate.getTime() >= listenerController.latestFireDate.getTime());
            assert.isTrue(listenerController.latestFireDate.getTime() >= listenerController.registerDate.getTime());
        } else {
            assert.isTrue(listenerController.fireDate.getTime() >= listenerController.registerDate.getTime());
        }

        // And you can get or set something for using next time.
        if (listenerController.hasStoreData("number")) listenerController.setStoreData("zero", 0);
        listenerController.setStoreData("number", 987);

        // We can get the count of raising and we can dispose the event listener.
        if (listenerController.count >= 3) listenerController.dispose();
    });

    // Let's raise an event.
    events.fire("a", "abc");
    assert.equals(eventArgA, "abc");
    assert.equals(aEventArg, "abc");
    assert.isNull(eventArgB);
    assert.isNull(eventArgB2);
    events.fire("b", "defg");
    assert.equals(eventArgA, "abc");
    assert.equals(aEventArg, "abc");
    assert.equals(eventArgB, "defg");
    assert.isFalse(eventArgB2.hasStoreData("zero"));
    assert.equals(eventArgB2.getStoreData("number"), 987);
    events.fire("a", "hijk");
    assert.equals(eventArgA, "hijk");
    assert.equals(aEventArg, "abc");
    assert.equals(eventArgB, "defg");

    // We can dispose one.
    eventA.dispose();
    events.fire("a", "lmn");
    assert.equals(eventArgA, "hijk");
    assert.equals(eventArgB, "defg");

    // We can raise an event with additional message.
    events.fire("b", "opq", "rst");
    assert.equals(eventArgB, "opq");
    assert.equals(eventArgB2.message, "rst");
    assert.equals(eventArgB2.getStoreData("zero"), 0);

    // And we can raise an event with further information.
    // This information can be resolved by the 2nd argument in event listener handler.
    events.fire("b", "u", {
        message: "v",
        source: "w",
        addition: {
            id: 123456
        }
    });
    assert.equals(eventArgB, "u");
    assert.equals(eventArgB2.message, "v");
    assert.equals(eventArgB2.source, "w");
    assert.equals(eventArgB2.addition.id, 123456);

    // Following will not be raised since it has disposed after 3 times raising.
    events.fire("b", "xyz");
    assert.equals(eventArgB, "u");
});

testCase.add("Tasks", () => {
    let task = new DataSense.HitTask();
    let taskMessage;
    task.pushHandler((arg, o) => {
        taskMessage = arg;
    });
    task.setOptions({
        span: 100,
        maxCount: 2
    });
    task.process("test");
    assert.equals(taskMessage, "test");
});

export = testCase;
