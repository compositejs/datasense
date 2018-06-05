function create(name) {
    var list = [];
    var client = {
        name() {
            return name;
        },
        add(name, h) {
            if (!name || typeof name !== "string" || typeof h !== "function") return;
            list.push({ name, h });
        },
        run() {
            console.info("RUN - " + name + " (" + list.length + ")")
            list.forEach(item => {
                try {
                    item.h();
                    console.info("PASS - " + item.name);
                } catch (ex) {
                    console.error("FAIL - " + item.name, ex);
                }
            });
        }
    };
    return client;
}

function run(...tests) {
    tests.forEach(item => {
        item.run();
    });
    console.info("Finished.")
}

var assert = {
    equals(a, b, errorMessage) {
        if (a !== b) throw errorMessage || "not equal";
    }
}

module.exports = {
    create,
    run,
    assert
}
