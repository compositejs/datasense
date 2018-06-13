namespace DataSense {

export type HitTaskHandlerContract = (arg: any, ev: {
    readonly initDate: Date,
    readonly processDate: Date,
    readonly latestProcessDate: Date,
    readonly count: number,
    readonly hitCount: number
}) => void;

export type ScheduleTaskSourceContract = "start" | "restart" | "plan" | "replan" | "resume" | "schedule" | "immediate" | "unknown";

/**
 * The options for hit task.
 */
export interface HitTaskOptionsContract {
    /**
     * true if process after current thread;
     * or false, if process immediately.
     * or a time span number in millisecond to delay to process.
     */
    delay?: number | boolean;

    /**
     * Used to control the processing behavior during there is a pending processing when another is raised.
     * "debounce": will process the last one and ignore the previous in pending list;
     * "mono": will process the first one and ignore the up coming ones before beginning to process;
     * "none": will process all and one by one scheduled.
     */
    mergeMode?: "debounce" | "mono" | "none";

    /**
     * A time span number in millisecond to reset the hits count.
     */
    span?: number;

    /**
     * The minimum hits count to respond.
     */
    minCount?: number;

    /**
     * The maximum hits count to respond.
     */
    maxCount?: number;
}

export interface ScheduleTaskInfoContract {
    readonly startDate: Date;
    readonly latestStopDate: Date;
    readonly processDate: Date;
    readonly latestProcessDate: Date;
    readonly span: number;
    readonly source: ScheduleTaskSourceContract;
}

/**
 * The scheduler.
 */
export interface ScheduleTaskResultContract {
    /**
     * Starts, plans, restarts, replans.
     * @param isPlan  true if start after the time span; or false, if start immediately; or a number in millisecond to delay to start.
     */
    start(isPlan?: number | boolean): void;

    /**
     * Processes the handler immediately.
     */
    process(): void;

    /**
     * Resumes.
     * @param isPlan  A value used when the task is not alive.
     */
    resume(isPlan?: number | boolean): void;

    /**
     * Pauses.
     */
    pause(): void;

    /**
     * Stops.
     */
    stop(): void;

    /**
     * Gets a value inidcating whether the task is alive.
     */
    readonly alive: boolean;
}

/**
 * A task for processing with times limitation and delay options.
 */
export class HitTask {

    private _proc: (arg?: any) => void;
    private _abort: () => void;
    private _options: HitTaskOptionsContract = {};
    private _h: HitTaskHandlerContract[] = [];

    /**
     * Initializes a new instance of the HitTask class.
     */
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

    /**
     * Sets the options.
     * @param value  The options.
     * @param merge  true if merge the properties into the current one; otherwise, false.
     */
    public setOptions(value: HitTaskOptionsContract, merge?: boolean) {
        if (!merge) {
            this._options = value || {};
        } else if (value) {
            this._options = { ...this._options, ...value };
        }
    }

    /**
     * Registers the handler to process when need.
     * @param h  One or more handlers.
     */
    public pushHandler(...h: (HitTaskHandlerContract | HitTaskHandlerContract[])[]) {
        let count = 0;
        h.forEach(handler => {
            if (typeof handler === "function") count += this._h.push(handler);
            else if (handler instanceof Array) count += this._h.push(...handler);
        });
        return count;
    }

    /**
     * Clears all handlers.
     */
    public clearHandler() {
        this._h = [];
    }

    /**
     * Tries to process.
     * The handlers registered may not be proceeded unless pass the condition.
     * @param arg  An argument to pass to the handlers registered.
     */
    public process(arg?: any) {
        this._proc(arg);
    }

    /**
     * Tries to abort the pending processing.
     */
    public abort() {
        this._abort();
    }

    /**
     * Delays to process a speicific handler.
     * @param h  The handler.
     * @param span  true if process delay; false if process immediately; or a number if process after the specific milliseconds.
     */
    public static delay(h: Function, span: number | boolean): DisposableContract {
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

    /**
     * Processes a handler and ignore the up coming ones in a specific time span.
     * @param h  The handler to process.
     * @param span  A time span in millisecond to avoid up coming.
     * @param justPrepare  true if just set up a task which will not process immediately; otherwise, false.
     */
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

    /**
     * Schedule to process a specific handler.
     * @param h  The handler to process.
     * @param span  A time span in millisecond of duration.
     */
    public static schedule(h: (info: ScheduleTaskInfoContract) => void, span: number): ScheduleTaskResultContract {
        let token: any;
        let token2: DisposableContract;
        let startDate: Date;
        let processDate: Date;
        let stopDate: Date;
        let latest: Date;
        let isInit = true;
        let clearToken = () => {
            if (token2) token2.dispose();
            token2 = null;
            if (!token) return;
            clearInterval(token);
            token = null;
        };
        let process = (source: ScheduleTaskSourceContract) => {
            processDate = new Date();
            h({
                startDate,
                latestStopDate: stopDate,
                processDate,
                latestProcessDate: latest,
                span,
                source
            });
            latest = new Date();
        };
        let startProc = (delay: number | boolean, source: ScheduleTaskSourceContract) => {
            isInit = false;
            clearToken();
            token2 = HitTask.delay(() => {
                token2 = null;
                process(source);
                token = setInterval(() => {
                    process("schedule");
                }, span);
            }, delay);
        };
        let task = {
            start(isPlan?: number | boolean) {
                let delay: number | boolean = false;
                let source: ScheduleTaskSourceContract = isPlan ? "plan" : "start";
                if (startDate) source = ("re" + source) as any;
                if (typeof isPlan === "number") delay = isPlan;
                else if (isPlan === true) delay = span;
                startProc(delay, source);
            },
            process() {
                process("immediate");
            },
            resume(isPlan?: number | boolean) {
                if (token || token2) return;
                if (isInit || !stopDate || !startDate) {
                    startProc(isPlan, startDate ? "restart" : "resume");
                    return;
                }

                let delay: boolean | number = span - stopDate.getTime() - startDate.getTime();
                if (delay <= 0) delay = false;
                startProc(delay, "resume");
            },
            pause() {
                clearToken();
                stopDate = new Date();
            },
            stop() {
                clearToken();
                stopDate = new Date();
                isInit = true;
            },
            get alive() {
                return token || token2;
            }
        };
        return task;
    }
}

}