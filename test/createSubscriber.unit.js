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

    it('should subscribe to branch and be notified all levels to that branch, called in chronological order', () => {
        const subscriber = createSubscriber();

        let callCount = 0;

        let allReducerCallCount = 0;
        let firstReducerCallCount = 0;
        let anotherReducerCallCount = 0;
        let thirdReducerCallCount = 0;

        let unsubscribeFromAll = subscriber.subscribe([[]], () => {
            allReducerCallCount++;
            expect(callCount).equals(0);

            callCount++;
        });
        
        let unsubscribeFromAnother = subscriber.subscribe([['another']], () => {
            anotherReducerCallCount++;
        });

        let unsubscribeFromThird = subscriber.subscribe([[
            'first', 'second', 'third'
        ]], () => {
            thirdReducerCallCount++;

            expect(callCount).equals(1);

            callCount++;
        });

        let unsubscribeFromFirst = subscriber.subscribe([['first']], () => {
            firstReducerCallCount++;

            expect(callCount).equals(2);

            callCount++;
        });

        subscriber.emitChange([{
            path: ['first', 'second', 'third']
        }], []);

        callCount = 0;

        expect(allReducerCallCount).equals(1);
        expect(firstReducerCallCount).equals(1);
        expect(anotherReducerCallCount).equals(0);
        expect(thirdReducerCallCount).equals(1);
    });
});