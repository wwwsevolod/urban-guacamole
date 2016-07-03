import {getCursor} from 'data-cursor';

import createSubscriber from './createSubscriber';

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

export default function createStore(initialState) {
    let state = initialState;
    initialState = null;

    const subscriber = createSubscriber();

    const store = {
        getState() {
            return state;
        },

        change(newState, changes = []) {
            state = newState;

            subscriber.emitChange(changes, state);

            return store;
        },

        subscribe(paths, cb) {
            if (!cb && typeof paths === 'function') {
                cb = paths;
                paths = [];
            }

            if (!paths || !paths.length) {
                paths = [];
            }

            if (typeof cb !== 'function') {
                throw new Error('Change handler is not a function');
            }

            let subscribed = true;

            const finalCb = (...args) => {
                if (!subscribed) {
                    return;
                }

                cb(...args);
            };

            const unsubscribe = subscriber.subscribe(paths, finalCb);

            return () => {
                if (!subscribed) {
                    return;
                }
                
                subscribed = false;

                unsubscribe();
            };
        },

        runTransaction(transactionDescriptor) {
            transactionDescriptor = Object.assign({}, transactionDescriptor);

            let currentState = state;
            let performedCursorNotInCommit = false;
            const changes = [];

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

                    return getCursor(currentState, undefined, (
                        newState, prevState, operationPath, operation, args
                    ) => {
                        currentState = newState;

                        changes.push({
                            path: operationPath.slice().reverse(),
                            operation,
                            args
                        });
                    }, params);
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
                        store.change(currentState, changes);
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