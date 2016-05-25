const CURSOR_SYMBOL = '@@IS_CURSOR' + Math.random();

function _getMutableValue(value) {
    if (Array.isArray(value)) {
        return value.slice();
    } else if (value instanceof Object) {
        return Object.assign({}, value);
    }

    return value;
}

export default function getCursor(value, changeParentProperty, key, transactionDescriptor) {
    let mutableValue = null;
    let mutableValueCreated = false;
    let isSetMutableValueToParent = false;

    function checkTransactionState() {
        if (transactionDescriptor.isClosed) {
            throw new Error(`Cursor is closed becauze transaction ended`);
        }
    }

    const childChangeParentProperty = (key, newValue) => {
        cursor.setKey(key, newValue);
    };

    function getMutableValue() {
        const value = cursor.value();
        if (!mutableValueCreated) {
            mutableValue = _getMutableValue(value);
            mutableValueCreated = true;
        }

        return mutableValue;
    }

    const cursor = {
        get(key) {
            checkTransactionState();

            if (!(value instanceof Object)) {
                throw new Error(`Get could be perform only on objects, not on primitives ${key}`);
            }

            return getCursor(value[key], childChangeParentProperty, key, transactionDescriptor);
        },

        set(newValue) {
            checkTransactionState();

            if (newValue !== mutableValue) {
                mutableValue = _getMutableValue(newValue);
                newValue = mutableValue;
                isSetMutableValueToParent = false;
            }

            if (isSetMutableValueToParent) {
                return;
            }

            isSetMutableValueToParent = true;

            changeParentProperty(key, newValue);
        },

        value() {
            checkTransactionState();

            if (mutableValueCreated) {
                return mutableValue;
            }

            return value;
        }
    };

    Object.defineProperty(cursor, [CURSOR_SYMBOL], {
        value: true,
        writable: false,
        enumerable: false
    });

    if (value instanceof Object) {
        cursor.setKey = (keyToSet, value) => {
            checkTransactionState();

            const newValue = getMutableValue();

            if (value[CURSOR_SYMBOL]) {
                throw new Error(`Value must not be Cursor`);
            }

            newValue[keyToSet] = value;

            cursor.set(newValue);
        };
    }

    if (Array.isArray(value)) {
        cursor.push = (...values) => {
            const newValue = getMutableValue();
            newValue.push(...values);

            cursor.set(newValue);

            return cursor;
        };

        cursor.pop = () => {
            const newValue = getMutableValue();
            newValue.pop();

            cursor.set(newValue);

            return cursor;
        };

        cursor.unshift = (...values) => {
            const newValue = getMutableValue();
            newValue.unshift(...values);

            cursor.set(newValue);

            return cursor;
        };

        cursor.shift = () => {
            const newValue = getMutableValue();
            newValue.shift();

            cursor.set(newValue);

            return cursor;
        };

        cursor.length = () => cursor.value().length;
    } else if (typeof value === 'number') {
        cursor.increment = (count = 1) => {
            const value = cursor.value();
            const newValue = value + count;

            if (value !== newValue) {
                cursor.set(newValue);
            }
        };

        cursor.decrement = (count = 1) => {
            const value = cursor.value();
            const newValue = value - count;

            if (value !== newValue) {
                cursor.set(newValue);
            }
        };
    }

    return cursor;
}