import { UPDATE_ORDER, UPDATE_TRADES, UPDATE_BALANCES, UPDATE_MAREKT_DATA } from "./types.js";

const initialState = {
	order: {
		tradeSymbol: null,
		state: false,
		owned: false,
	},
	trades: [],
	balances: [],
	marketData: []
};

const variable = (state = initialState, action) => {
	switch (action.type) {
		case UPDATE_ORDER:
			return {
				...state,
				order: action.payload,
			};
		case UPDATE_TRADES:
			return {
				...state,
				trades: action.payload,
			};
		case UPDATE_BALANCES:
			return {
				...state,
				balances: action.payload,
			};
		case UPDATE_MAREKT_DATA:
			return {
				...state,
				marketData: action.payload
			}
		default:
			return state;
	}
};

export default variable;
