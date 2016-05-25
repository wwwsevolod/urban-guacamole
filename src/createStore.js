import getCursor from 'getCursor';

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

export default function createStore(initialState) {
    let state = initialState;
    initialState = null;

    const subscribers = [];

    const store = {
        getState() {
            return state;
        },

        change(newState) {
            state = newState;

            subscribers.forEach((subscriber) => subscriber(state));

            return store;
        },

        subscribe(cb, paths = null) {
            let subscribed = true;
            subscribers.push(cb);

            return function unsubscribe() {
                if (!subscribed) {
                    return;
                }
                
                subscribed = false;

                const index = subscribers.indexOf(cb);

                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
            };
        },

        runTransaction(transactionDescriptor) {
            transactionDescriptor = Object.assign({}, transactionDescriptor);

            let currentState = state;
            let performedCursorNotInCommit = false;

            const transactionStore = {
                getState() {
                    return state;
                },

                commit(callback) {
                    currentState = state;
                    const commitState = {isClosed: false};

                    callback(transactionStore.getCursor(commitState, true));

                    commitState.isClosed = true;

                    if (currentState !== state) {
                        store.change(currentState);
                    }
                },

                getCursor(params = transactionDescriptor, isInCommit = false) {
                    if (!isInCommit) {
                        performedCursorNotInCommit = true;
                    }

                    return getCursor(currentState, (_, newState) => {
                        currentState = newState;
                    }, '', params);
                },

                runTransaction(...args) {
                    return store.runTransaction(...args);
                }
            };

            try {
                const result = transactionDescriptor.transaction(
                    transactionStore,
                    transactionDescriptor.payload
                );

                if (result instanceof Promise) {
                    if (performedCursorNotInCommit) {
                        throw new Error(`Don't use 'getCursor' manually in async transaction`);
                    }
                    return result.then((res) => {
                        transactionDescriptor.isClosed = true;
                        return res;
                    }).catch((e) => {
                        throw e;
                    });
                } else {
                    transactionDescriptor.isClosed = true;
                    if (currentState !== state) {
                        store.change(currentState);
                    }

                    return result;
                }
            } catch (e) {
                throw e;
            }
        }
    };

    return store;
}