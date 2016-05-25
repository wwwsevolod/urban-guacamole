import getCursor from 'getCursor';

describe('getCursor', () => {
    it('should work', () => {
        let state = {
            keyA: {
                keyB: {
                    keyC: {
                        number: 123,
                        array: [1, {
                            value: 456
                        }, 3]
                    }
                }
            }
        };

        const transactionState = {
            isClosed: false
        };

        const originalState = state;

        const rootCursor = getCursor(state, (_, newState) => {
            state = newState;
        }, '', transactionState);

        const keyCCursor = rootCursor.get('keyA').get('keyB').get('keyC');

        const numberCursor = keyCCursor.get('number');

        expect(numberCursor.value()).to.equals(123);
        expect(state).to.have.deep.property('keyA.keyB.keyC.number').to.equals(123);

        numberCursor.set(1);

        expect(keyCCursor.value().number).to.equals(1);

        expect(state !== originalState).to.be.true;
        expect(state).to.have.deep.property('keyA.keyB.keyC.number').to.equals(1);

        const obj = {
            asd: 123
        };

        rootCursor.get('keyA').get('keyB').set(obj);

        expect(state).to.have.deep.property('keyA.keyB.asd').to.equals(123);
        expect(state.keyA.keyB !== obj).to.be.true;

        numberCursor.set(2);

        expect(state).to.have.deep.property('keyA.keyB.asd').to.equals(123);
        expect(state).not.to.have.deep.property('keyA.keyB.keyC');

        rootCursor.get('keyA').get('keyB').set({
            keyC: keyCCursor.value()
        });

        expect(state.keyA.keyB.keyC.number).to.equals(2);

        numberCursor.set(123);

        expect(state.keyA.keyB.keyC.number).to.equals(123);

        transactionState.isClosed = true;

        expect(() => rootCursor.get('keyB')).to.throw();
    });
});
