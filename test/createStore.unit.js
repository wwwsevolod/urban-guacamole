import createStore from 'createStore';
import Transaction from 'Transaction';

describe('createStore', () => {
    it('should work', () => {
        const store = createStore({
            asd: {
                wtf: 123
            }
        });

        expect(store.getState()).to.deep.equal({
            asd: {
                wtf: 123
            }
        });

        let callCount = 0;
        const subscriber = () => {
            callCount++;

            expect(callCount).to.equal(1);
        };
        const unsubscribe = store.subscribe(subscriber);

        expect(store.change({
            asd: 111
        }).getState()).to.deep.equal({
            asd: 111
        });

        unsubscribe();

        store.change({
            asd: {
                wtf: 123
            }
        });

        const testTransaction = Transaction.create('test', (store, {param1}) => {
            expect(param1).to.equal(1);

            store.commit((cursor) => {
                cursor.get('asd').get('wtf').replaceIt(456);
            });
        });

        store.runTransaction(testTransaction.start({
            param1: 1
        }));

        expect(store.getState()).to.deep.equal({
            asd: {
                wtf: 456
            }
        });

        const testInplaceTransaction = Transaction.create('test', (store) => {
            store.getCursor().get('asd').get('wtf').replaceIt(888);
        });

        store.runTransaction(testInplaceTransaction.start());

        expect(store.getState()).to.deep.equal({
            asd: {
                wtf: 888
            }
        });

        const testFailingAsyncTransaction = Transaction.create('test', (store) => {
            store.getCursor().get('asd').get('wtf').replaceIt(777);

            return Promise.resolve();
        });

        expect(() => {
            store.runTransaction(testFailingAsyncTransaction.start());
        }).to.throw();

        expect(store.getState().asd.wtf).to.not.equal(777);
    });
});