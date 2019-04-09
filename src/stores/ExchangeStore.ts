import { EventEmitter } from 'events';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../constants/ActionTypes';

const CHANGE_EVENT = 'change';

let _exchange: string | null = null;

function setExchange(exchange: string | null) {
	_exchange = exchange;
}

class ExchangeStoreClass extends EventEmitter {
	dispatchToken: string | undefined;

	emitChange() {
		this.emit(CHANGE_EVENT);
	}

	addChangeListener(callback: (...args: any[]) => void) {
		this.on(CHANGE_EVENT, callback);
	}

	removeChangeListener(callback: (...args: any[]) => void) {
		this.removeListener(CHANGE_EVENT, callback);
	}

	getExchange() {
		return _exchange;
	}
}

const ExchangeStore = new ExchangeStoreClass();

// Here we register a callback for the dispatcher
// and look for our various action types so we can
// respond appropriately
const actionListener = (action: any) => {
	switch (action.actionType) {
		case ActionTypes.CHOOSE_EXCHANGE:
			setExchange(action.payload);
			// We need to call emitChange so the event listener
			// knows that a change has been made
			ExchangeStore.emitChange();
			break;

		default:
	}
};

ExchangeStore.dispatchToken = AppDispatcher.register(actionListener);

export default ExchangeStore;
