namespace DataSense.Collection {

    export type CompareConditionContract = string | number | ((a: any, b: any) => boolean);

    /**
     * Gets the index of the specific item in an array.
     * @param {Array} list  The array to find a specific item.
     * @param {*} item  The item for comparing.
     * @param {string | number | Function} compare  The property key; or, a function.
     */
    export function findIndex(list: any[], item: any, compare?: CompareConditionContract) {
        if (!list || item == null) return -1;
        if (!list.findIndex) list.findIndex = (callback) => {
            let resultIndex = -1;
            list.some((ele, eleIndex, eleArr) => {
                if (!callback(ele, eleIndex, eleArr)) return false;
                resultIndex = eleIndex;
                return true;
            });
            return resultIndex;
        };
        if (!compare) return list.findIndex(ele => ele === item);
        switch (typeof compare) {
            case "string":
            case "number":
                return list.findIndex(ele => ele[compare as (string | number)] === item);
            case "function":
                return list.findIndex(ele => (compare as Function)(ele, item));
            default:
                return -1;
        }
    }

    /**
     * Removes an item from given array.
     * @param {Array} originalList  The array to be merged.
     * @param {*} item  An item to remove.
     * @param {string | function} compare  The property key; or, a function.
     */
    export function remove(list: any[], item: any, compare?: CompareConditionContract) {
        let count = 0;
        while (true) {
            let index = findIndex(list, item, compare);
            if (index < 0) break;
            list.splice(index, 1);
            count++;
        }

        return count;
    }

}
