import * as Collection from "./collection";
import * as CoreLib from "./core";
import * as ValuesLib from "./values";
import * as ObjectsLib from "./objects";
import * as EventsLib from "./events";

let output = { ...Collection, ...CoreLib, ...ValuesLib, ...ObjectsLib, ...EventsLib };
try {
    if (typeof window !== "undefined") (window as any).DataSense = output;
} catch (ex) {}
export default output;
