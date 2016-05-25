import {Component, PropTypes} from 'react';

class ConnectComponent extends Component {
    consturctor(...args) {
        super(...args);
    }
}

export default function connect(stateReducer = null, transactions = null) {
    return (WrappedComponent) => {
        class ConnectedComponent extends ConnectComponent {
            consturctor(...args) {
                super(...args);

                this.WrappedComponent = WrappedComponent;
            }
        }

        return ConnectedComponent;
    };
}