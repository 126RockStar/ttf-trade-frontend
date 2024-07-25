import { HANDLE_ERR, CLOSE_ERR, CONTINUE_ERR, CLOSE_ERR_NAME } from "./types.js";
import { errMessage } from "utils/errorCustom.js";

const initialState = {
	message: "",
	error: "",
	name: '',
	open: false,
	continue: false,
};

const variable = (state = initialState, action) => {
	switch (action.type) {
		case HANDLE_ERR:
			if (!state.open) {
				const message = errMessage(String(action.payload.data.status), action.payload.data.message);
				return {
					...state,
					message: message,
					name: action.payload.name,
					error: action.payload.data.error !== undefined ? action.payload.data.error : "",
					open: true,
				};
			} else {
				return {
					...state,
				};
			}
		case CLOSE_ERR_NAME:
			if (state.name === action.payload.name) {
				return {
					...initialState
				}
			} else {
				return {
					...state
				}
			}
		case CLOSE_ERR:
			return {
				...initialState,
			};
		case CONTINUE_ERR:
			return {
				...state,
				continue: true,
			};
		default:
			return state;
	}
};

export default variable;
