namespace DataSense {

/**
 * Disposable instance.
 */
export interface DisposableContract {
    /**
     * Disposes the instance.
     */
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

/**
 * Disposable container.
 */
export interface DisposableArrayContract extends DisposableContract {
    /**
     * Adds disposable objects so that they will be disposed when this instance is disposed.
     * @param items  The objects to add.
     */
    pushDisposable(...items: DisposableContract[]): number;
}

/**
 * A container for store and manage a number of disposable object.
 * @param items  The objects to add.
 */
export class DisposableArray implements DisposableArrayContract {
    private _list: DisposableContract[] = [];

    /**
     * Adds disposable objects so that they will be disposed when this instance is disposed.
     * @param items  The objects to add.
     */
    public push(...items: DisposableContract[]) {
        let count = 0;
        items.forEach(item => {
            if (!item || this._list.indexOf(item) >= 0) return;
            this._list.push(item);
            count++;
        });
        return count;
    }

    /**
     * Adds disposable objects so that they will be disposed when this instance is disposed.
     * @param items  The objects to add.
     */
    public pushDisposable(...items: DisposableContract[]) {
        return this.push(...items);
    }

    /**
     * Removes the ones added here.
     * @param items  The objects to add.
     */
    public remove(...items: DisposableContract[]) {
        let count = 0;
        items.forEach(item => {
            if (item && Collection.remove(this._list, item) < 1) return;
            count++;
        });
        return count;
    }

    /**
     * Disposes the instance.
     */
    public dispose() {
        this._list.forEach(item => {
            if (!item || typeof item.dispose !== "function") return;
            item.dispose();
        });
        this._list = [];
    }
}

}