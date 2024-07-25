import { HANDLE_ERR, CLOSE_ERR, CONTINUE_ERR, CLOSE_ERR_NAME } from "./types.js";

export const handleErr = (data) => dispatch => {
  dispatch({
    type: HANDLE_ERR,
    payload: data
  })
}

export const handleContinueErr = () => dispatch => {
  dispatch({
    type: CONTINUE_ERR,
  })
}

export const closeErrName = (data) => dispatch => {
  dispatch({
    type: CLOSE_ERR_NAME,
    payload: data
  })
}

export const closeErr = () => dispatch => {
  dispatch({
    type: CLOSE_ERR
  })
}