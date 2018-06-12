namespace DataSense {

export type HitTaskHandlerContract = (arg: any, ev: {
    initDate: Date,
    processDate: Date,
    latestProcessDate: Date,
    count: number,
    hitCount: number
}) => void;

export interface HitTaskOptionsContract {
    delay?: number | boolean;
    mergeMode?: "debounce" | "none" | "mono";
    span?: number;
    minCount?: number;
    maxCount?: number;
}

/**
 * A task for processing with times limitation and delay options.
 */
export class HitTask {

    private _proc: (arg?: any) => void;
    private _abort: () => void;
    private _options: HitTaskOptionsContract = {};
    private _h: HitTaskHandlerContract[] = [];

    constructor() {
        let initDate = new Date();
        let procToken: any;
        let count = 0;
        let curCount = 0;
        let latest: Date;
        let latest2: Date;
        let procH = (arg?: any) => {
            procToken = null;
            let latest3 = latest;
            latest = new Date();
            if (count < Number.MAX_SAFE_INTEGER) count++;
            this._h.forEach(h => {
                h(arg, {
                    initDate,
                    processDate: latest,
                    latestProcessDate: latest3,
                    count,
                    hitCount: curCount
                });
            });
        };
        this._abort = () => {
            if (procToken) clearTimeout(procToken);
            procToken = null;
        };
        this._proc = (arg?) => {
            var now = new Date();
            curCount++;
            let options = this._options;
            if (!options.span || !latest2 || (now.getTime() - latest2.getTime() > options.span)) {
                curCount = 1;
            }

            latest2 = new Date();
            if ((options.minCount != null && curCount < options.minCount) || (options.maxCount != null && curCount > options.maxCount)) {
                return;
            }

            if (procToken) {
                if (options.mergeMode === "debounce") clearTimeout(procToken);
                else if (options.mergeMode === "mono") return;
            }

            if (options.delay == null || options.delay === false)
                procH(arg);
            else if (options.delay === true)
                procToken = setTimeout(() => {
                    procH(arg);
                }, 0);
            else if (typeof options.delay === "number")
                procToken = setTimeout(() => {
                    procH(arg);
                }, options.delay);
        };
    }

    public setOptions(value: HitTaskOptionsContract) {
        this._options = value || {};
    }

    public pushHandler(...h: (HitTaskHandlerContract | HitTaskHandlerContract[])[]) {
        let count = 0;
        h.forEach(handler => {
            if (typeof handler === "function") count += this._h.push(handler);
            else if (handler instanceof Array) count += this._h.push(...handler);
        });
        return count;
    }

    public clearHandler() {
        this._h = [];
    }

    public process(arg?: any) {
        this._proc(arg);
    }

    public abort() {
        this._abort();
    }

    public static delay(h: Function, span: number | boolean, justPrepare?: boolean) {
        let procToken: any;
        if (span == null || span === false)
            h();
        else if (span === true)
            procToken = setTimeout(() => {
                procToken = null;
                h();
            }, 0);
        else if (typeof span === "number")
            procToken = setTimeout(() => {
                procToken = null;
                h();
            }, span);
        return {
            dispose() {
                if (procToken) clearTimeout(procToken);
                procToken = null;
            }
        }
    }

    public static throttle(h: HitTaskHandlerContract | HitTaskHandlerContract[], span: number, justPrepare?: boolean) {
        let task = new HitTask();
        task.setOptions({
            span,
            maxCount: 1
        });
        task.pushHandler(h);
        if (!justPrepare) task.process();
        return task;
    }

    /**
     * Processes a handler delay or immediately in debounce mode.
     * @param h  The handler to process.
     * @param delay  true if process delay; false if process immediately; or a number if process after the specific milliseconds.
     * @param justPrepare  true if just set up a task which will not process immediately; otherwise, false.
     */
    public static debounce(h: HitTaskHandlerContract | HitTaskHandlerContract[], delay: number | boolean, justPrepare?: boolean) {
        let task = new HitTask();
        task.setOptions({
            delay,
            mergeMode: "debounce"
        });
        task.pushHandler(h);
        if (!justPrepare) task.process();
        return task;
    }

    /**
     * Processes a handler delay or immediately in mono mode.
     * @param h  The handler to process.
     * @param delay  true if process delay; false if process immediately; or a number if process after the specific milliseconds.
     * @param justPrepare  true if just set up a task which will not process immediately; otherwise, false.
     */
    public static mono(h: HitTaskHandlerContract | HitTaskHandlerContract[], delay: number | boolean, justPrepare?: boolean) {
        let task = new HitTask();
        task.setOptions({
            delay,
            mergeMode: "mono"
        });
        task.pushHandler(h);
        if (!justPrepare) task.process();
        return task;
    }

    /**
     * Processes a handler in multiple hits task.
     * @param h  The handler to process.
     * @param min  The minimum hit count.
     * @param max  The maximum hit count.
     * @param span  The hit reset span.
     * @param justPrepare  true if just set up a task which will not process immediately; otherwise, false.
     */
    public static multiHit(h: HitTaskHandlerContract | HitTaskHandlerContract[], minCount: number, maxCount: number, span: number, justPrepare?: boolean) {
        let task = new HitTask();
        task.setOptions({
            minCount,
            maxCount,
            span
        });
        task.pushHandler(h);
        if (!justPrepare) task.process();
        return task;
    }
}

}