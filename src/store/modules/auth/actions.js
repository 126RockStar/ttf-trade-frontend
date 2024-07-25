import {
	UPDATE_USER,
	UPDATE_ADMIN_PERMISSION,
	UPDATE_EXCHANGE,
	UPDATE_ACCOUNTS,
	UPDATE_BALANCES,
	UPDATE_TRADES,
	CHANGE_ACCOUNT,
} from "./types.js";

export const updateUser = (data) => dispatch => {
  dispatch({
    type: UPDATE_USER,
    payload: data
  })
}

export const updateAdminPermission = (data) => dispatch => {
  dispatch({
    type: UPDATE_ADMIN_PERMISSION,
    payload: data
  })
}

export const updateExchange = (data) => dispatch => {
  dispatch({
    type: UPDATE_EXCHANGE,
    payload: data
  })
}

export const updateAccounts = (data) => dispatch => {
  dispatch({
    type: UPDATE_ACCOUNTS,
    payload: data
  })
}

export const updateBalances = (data) => dispatch => {
  dispatch({
    type: UPDATE_BALANCES,
    payload: data
  })
}

export const updateTrades = (data) => dispatch => {
  dispatch({
    type: UPDATE_TRADES,
    payload: data
  })
}

export const changeAccount = (data) => dispatch => {
  dispatch({
    type: CHANGE_ACCOUNT,
    payload: data
  })
}