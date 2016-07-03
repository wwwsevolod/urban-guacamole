import createSubscriber from 'createSubscriber';

describe('createSubscriber', () => {
    it('should subscribe to all and unsubscribe successfully', () => {
        const subscriber = createSubscriber();

        let allReducerCallCount = 0;

        const unsubscribeFromAll = subscriber.subscribe([], () => allReducerCallCount++);

        subscriber.emitChange([], []);

        expect(allReducerCallCount).equals(1);

        subscriber.emitChange([], []);

        expect(allReducerCallCount).equals(2);

        unsubscribeFromAll();

        subscriber.emitChange([], []);

        expect(allReducerCallCount).equals(2);
    });

    it('should subscribe to branch and be notified all levels to that branch, sorted right', () => {
        const subscriber = createSubscriber();

        let allReducerCallCount = 0;
        let firstReducerCallCount = 0;
        let anotherReducerCallCount = 0;
        let thirdReducerCallCount = 0;

        let unsubscribeFromAll = subscriber.subscribe([[]], () => allReducerCallCount++);
        let unsubscribeFromFirst = subscriber.subscribe([['first']], () => firstReducerCallCount++);
        let unsubscribeFromAnother = subscriber.subscribe([['another']], () => anotherReducerCallCount++);
        let unsubscribeFromThird = subscriber.subscribe([[
            'first', 'second', 'third'
        ]], () => thirdReducerCallCount++);

        subscriber.emitChange([{
            path: ['first', 'second', 'third']
        }], []);

        expect(allReducerCallCount).equals(1);
        expect(firstReducerCallCount).equals(1);
        expect(anotherReducerCallCount).equals(0);
        expect(thirdReducerCallCount).equals(1);
    });
});