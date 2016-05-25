
export default class Transaction {
    static create(name, transaction) {
        return new Transaction(name, transaction);
    }

    constructor(name, transaction) {
        Object.defineProperty(this, 'name', {
            value: name,
            writable: false,
            enumerable: true
        });

        Object.defineProperty(this, 'transaction', {
            value: transaction,
            writable: false,
            enumerable: true
        });
    }

    start(payload) {
        return {
            name: this.name,
            transaction: this.transaction,
            payload,
            isClosed: false
        };
    }
}
