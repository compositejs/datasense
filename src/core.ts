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

    export interface DelayOptionsContract {
        duration?: number | boolean;
    }

    export class DisposableArray implements DisposableArrayContract {
        private _list: DisposableContract[] = [];

        public push(...items: DisposableContract[]) {
            var count = 0;
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
            var count = 0;
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
