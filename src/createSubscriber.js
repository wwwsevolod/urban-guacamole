
const CURRENT_LEVEL_SYMBOL = '@@currentLevel';

export default function createSubscriber() {
    const reducerToId = new Map();
    const subscribers = new Map();

    let orderedIdCounter = 0;

    function traverseAndSubscribe(path, reducer) {
        let subscribersMap = subscribers;

        reducerToId.set(reducer, orderedIdCounter++);

        for (let fragment of path) {
            if (!subscribersMap.has(fragment)) {
                const fragmentSubscriber = new Map();

                fragmentSubscriber.set(CURRENT_LEVEL_SYMBOL, new Set());

                subscribersMap.set(fragment, fragmentSubscriber);
            }

            subscribersMap = subscribersMap.get(fragment);
        }

        if (!subscribersMap.has(CURRENT_LEVEL_SYMBOL)) {
            subscribersMap.set(CURRENT_LEVEL_SYMBOL, new Set());
        }

        subscribersMap.get(CURRENT_LEVEL_SYMBOL).add(reducer);
    }

    function traverseAndUnsubscribe(path, reducer) {
        let subscribersMap = subscribers;

        reducerToId.delete(reducer);

        for (let fragment of path) {
            if (!subscribersMap.has(fragment)) {
                return;
            }

            subscribersMap = subscribersMap.get(fragment);
        }

        if (!subscribersMap || !subscribersMap.has(CURRENT_LEVEL_SYMBOL)) {
            return;
        }

        subscribersMap.get(CURRENT_LEVEL_SYMBOL).delete(reducer);
    }

    return {
        subscribe(paths, reducer) {
            if (!paths || !paths.length) {
                traverseAndSubscribe([], reducer);

                return () => traverseAndUnsubscribe([], reducer);
            }

            paths.forEach((path) => traverseAndSubscribe(path, reducer));

            return () => paths.forEach((path) => traverseAndUnsubscribe(path, reducer));
        },

        emitChange(paths, argsForReducers) {
            const reducers = [];

            const rootReducers = subscribers.get(CURRENT_LEVEL_SYMBOL);

            if (rootReducers && rootReducers.size) {
                reducers.push(...Array.from(rootReducers));
            }

            paths.forEach((change) => {
                const path = change.path;

                let subscribersMap = subscribers;

                for (let fragment of path) {
                    subscribersMap = subscribersMap.get(fragment);

                    if (!subscribersMap) {
                        return;
                    }

                    const currentLevelReducers = subscribersMap.get(CURRENT_LEVEL_SYMBOL);

                    if (currentLevelReducers && currentLevelReducers.size) {
                        reducers.push(...Array.from(currentLevelReducers));
                    }
                }
            });

            const finalReducers = Array.from(new Set(reducers)).sort((reducer1, reducer2) => {
                return reducerToId.get(reducer1) - reducerToId.get(reducer2);
            });

            finalReducers.forEach((reducer) => {
                reducer(...(argsForReducers || []));
            });
        }
    };
}