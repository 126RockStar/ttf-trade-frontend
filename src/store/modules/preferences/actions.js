import { UPDATE_ORDER, UPDATE_BALANCES, UPDATE_TRADES, UPDATE_MAREKT_DATA } from "./types.js";

export const updateOrder = (data) => dispatch => {
  dispatch({
    type: UPDATE_ORDER,
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

export const updateMarketData = (data) => dispatch => {
  dispatch({
    type: UPDATE_MAREKT_DATA,
    payload: data
  })
}