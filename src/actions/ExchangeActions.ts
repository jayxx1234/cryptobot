import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../constants/ActionTypes';

export default {
	chooseExchange: (exchange: string) => {
		AppDispatcher.dispatch({
			actionType: ActionTypes.CHOOSE_EXCHANGE,
			payload: exchange,
		});
	},
	chooseAlgorithm: (algorithm: any) => {
		AppDispatcher.dispatch({
			actionType: ActionTypes.CHOOSE_ALGORITHM,
			payload: algorithm,
		});
	},
};
