import {
	UPDATE_USER,
	UPDATE_ADMIN_PERMISSION,
	UPDATE_EXCHANGE,
	UPDATE_ACCOUNTS,
	UPDATE_BALANCES,
	UPDATE_TRADES,
	CHANGE_ACCOUNT,
} from "./types.js";

const initialState = {
  userInfo: null,
  adminPermissions: null,
  selectExchange: null,
  accounts: null,
  balances: [],
  trades: [],
  changeAccount: null
}

const variable = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_USER:
      return {
        ...state,
        userInfo: action.payload
      }
    case UPDATE_ADMIN_PERMISSION:
      return {
        ...state,
        adminPermissions: action.payload
      }
    case UPDATE_EXCHANGE:
      return {
        ...state,
        selectExchange: action.payload
      }
    case UPDATE_ACCOUNTS:
      return {
        ...state,
        accounts: action.payload
      }
    case UPDATE_BALANCES:
      return {
        ...state,
        balances: action.payload
      }
    case UPDATE_TRADES:
      return {
        ...state,
        trades: action.payload
      }
    case CHANGE_ACCOUNT:
      return {
        ...state,
        changeAccount: action.payload
      }
    default:
      return state
  }
}

export default variable;