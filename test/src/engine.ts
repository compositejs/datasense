let assertCount = 0;

export function create(name: string) {
    let list: {
        name: string,
        h: Function
    }[] = [];
    let client = {
        name() {
            return name;
        },
        add(name: string, h: Function) {
            if (!name || typeof name !== "string" || typeof h !== "function") return;
            list.push({ name, h });
        },
        run() {
            let now = new Date();
            let succ = 0;
            let fail = 0;
            console.info("-----------------");
            console.info(name);
            console.info("RUN (" + list.length + " test cases)");
            list.forEach((item, index) => {
                try {
                    assertCount = 0;
                    item.h();
                    if (assertCount > 0) {
                        succ++;
                        console.info((index + 1).toString() + " [pass] " + item.name);
                    } else {
                        console.info((index + 1).toString() + " [ignore] " + item.name);
                    }
                } catch (ex) {
                    console.error((index + 1).toString() + " [fail] " + item.name);
                    if (ex) console.error(" Error", ex);
                    fail++;
                }
            });
            console.info("FINISH");
            let costing = (new Date()).getTime() - now.getTime();
            console.info("Result: " + succ + " successful, " + fail + " failed, costing " + costing + "ms.");
            return {
                name,
                success: succ,
                failure: fail,
                ignore: list.length - succ - fail,
                costing
            }
        }
    };
    return client;
}

export function run(...tests: {
    run: Function
}[]) {
    console.info("START")
    let count = {
        success: 0,
        failure: 0,
        ignore: 0,
        costing: 0
    }
    tests.forEach(item => {
        let summary = item.run();
        count.success += summary.success;
        count.failure += summary.failure;
        count.ignore += summary.ignore;
        count.costing += summary.costing;
    });
    console.info("-----------------");
    console.info("DONE");
    console.info("Result: " + count.success + " successful, " + count.failure + " failed, " + count.ignore + " ignored, costing " + count.costing + "ms.");
    if (count.failure > 0) throw new Error("Oops, " + count.failure + " test cases failed.");
}

function throwError(summary: string, details: string, message: string) {
    var err = "Expect " + summary + " #" + assertCount + " " + details;
    if (message) err+= " | " + message;
    throw err;
}

export const assert = {
    equals(a: any, b: any, errorMessage?: string) {
        if (a !== b) throwError("equal", a + " !== " + b, errorMessage);
        assertCount++;
    },
    isTrue(a: any, strict?: boolean, errorMessage?: string) {
        if (strict) {
            if (a !== true) throwError("equals true", a, errorMessage);
        } else {
            if (!a) throwError("is true", a, errorMessage);
        }

        assertCount++;
    },
    isFalse(a: any, strict?: boolean, errorMessage?: string) {
        if (strict) {
            if (a !== false) throwError("equals false", a, errorMessage);
        } else {
            if (a) throwError("is false", a, errorMessage);
        }

        assertCount++;
    },
    isNull(a: any, errorMessage?: string) {
        if (a != null) throwError("is null", a, errorMessage);
        assertCount++;
    }
}
