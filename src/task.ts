namespace DataSense {

export interface HitTaskOptionsContract {
    delay?: number | boolean;
    mergeMode?: "debounce" | "none" | "respond"
    span?: number;
    minCount?: number;
    maxCount?: number;
}

/**
 * A task for processing with times limitation and delay options.
 */
export class HitTask {

    /**
     * Processes a handler delay or immediately.
     * @param h  The handler to process.
     */
    public static process(h: Function, options: HitTaskOptionsContract, justPrepare?: boolean) {
        let procToken: any;
        let count = 0;
        let curCount = 0;
        let latest: Date;
        if (!options) options = {};
        let procH = () => {
            procToken = null;
            h();
            latest = new Date();
            count++;
        };
        let proc = (totalCountLimit?: number | boolean) => {
            if (totalCountLimit === true) totalCountLimit = 1;
            if (typeof totalCountLimit === "number" && count >= totalCountLimit) return;
            var now = new Date();
            curCount++;
            if (!latest || (now.getTime() - latest.getTime() > options.span)) {
                curCount = 1;
            } else if (curCount < options.minCount || curCount > options.maxCount) {
                return;
            }

            if (procToken) {
                if (options.mergeMode === "debounce") clearTimeout(procToken);
                else if (options.mergeMode === "respond") return;
            }

            if (options.delay == null || options.delay === false)
                procH();
            else if (options.delay === true)
                procToken = setTimeout(procH, 0);
            else if (typeof options.delay === "number")
                procToken = setTimeout(procH, options.delay);
        };
        if (!justPrepare) proc();
        return {
            process: proc,
            processNow() {
                if (procToken) clearTimeout(procToken);
                procH();
            },
            get delay() {
                if (options.delay === false) return undefined;
                return options.delay === true ? 0 : options.delay;
            },
            set delay(value: number | boolean) {
                options.delay = value;
            },
            get isPending() {
                return !!procToken;
            },
            get latestDate() {
                return latest;
            },
            get count() {
                return count;
            },
            dispose() {
                if (procToken) clearTimeout(procToken);
            }
        }
    }

    /**
     * Processes a handler delay or immediately.
     * @param h  The handler to process.
     * @param delay  true if process delay; false if process immediately; or a number if process after the specific milliseconds.
     * @param justPrepare  true if just set up a task which will not process immediately; otherwise, false.
     */
    public static debounce(h: Function, delay: number | boolean, justPrepare?: boolean) {
        let procToken: any;
        let count = 0;
        let latest: Date;
        let procH = () => {
            procToken = null;
            h();
            latest = new Date();
            count++;
        };
        let proc = (maxCount?: number | boolean) => {
            if (maxCount === true) maxCount = 1;
            if (typeof maxCount === "number" && count >= maxCount) return;
            if (procToken) clearTimeout(procToken);
            if (delay == null || delay === false)
                procH();
            else if (delay === true)
                procToken = setTimeout(procH, 0);
            else if (typeof delay === "number")
                procToken = setTimeout(procH, delay);
        };
        if (!justPrepare) proc();
        return {
            process: proc,
            processNow() {
                if (procToken) clearTimeout(procToken);
                procH();
            },
            get delay() {
                if (delay === false) return undefined;
                return delay === true ? 0 : delay;
            },
            set delay(value: number | boolean) {
                delay = value;
            },
            get isPending() {
                return !!procToken;
            },
            get latestDate() {
                return latest;
            },
            get count() {
                return count;
            },
            dispose() {
                if (procToken) clearTimeout(procToken);
            }
        }
    }
}

}