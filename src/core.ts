namespace DataSense {

    export interface DisposableContract {
        dispose(): void;
    }

    export type SubscriberCompatibleResultContract = DisposableContract & (() => void);

    export type SubscriberResultContract = DisposableContract | (() => void) | SubscriberCompatibleResultContract;

    export interface KeyValueContract<T> {
        key: string;
        value: T;
    }

    export interface SubscriberContract<T> {
        subscribe(h: (value: T) => void): SubscriberResultContract;
    }

    export interface DisposableArrayContract extends DisposableContract {
        pushDisposable(...items: DisposableContract[]): number;
    }

    /**
     * Processes a handler delay or immediately.
     * @param h  The handler to process.
     * @param delay  true if process delay; false if process immediately; or a number if process after the specific milliseconds.
     * @param justPrepare  true if just set up a task which will not process immediately; otherwise, false.
     */
    export function delay(h: Function, delay: number | boolean, justPrepare?: boolean) {
        let procToken: number;
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
            delay(value: number) {
                if (arguments.length > 0) delay = value;
                return delay;
            },
            pending() {
                return !!procToken;
            },
            latest() {
                return latest;
            },
            count() {
                return count;
            },
            dispose() {
                if (procToken) clearTimeout(procToken);
            }
        }
    }

    export class DisposableArray implements DisposableArrayContract {
        private _list: DisposableContract[] = [];

        public push(...items: DisposableContract[]) {
            let count = 0;
            items.forEach(item => {
                if (!item || this._list.indexOf(item) >= 0) return;
                this._list.push(item);
                count++;
            });
            return count;
        }

        public pushDisposable(...items: DisposableContract[]) {
            return this.push(...items);
        }

        public remove(...items: DisposableContract[]) {
            let count = 0;
            items.forEach(item => {
                if (item && Collection.remove(this._list, item) < 1) return;
                count++;
            });
            return count;
        }

        public dispose() {
            this._list.forEach(item => {
                if (!item || typeof item.dispose !== "function") return;
                item.dispose();
            });
            this._list = [];
        }
    }
}

// For asynchronous modules loaders.
(function () {
    if (typeof define === 'function') {
        if (define.amd || typeof __webpack_require__ !== "undefined") {
            define(["exports"], function (exports: any) {
                return DataSense;
            });
        }
    } else if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        module["exports"] = DataSense;
    }
})();
