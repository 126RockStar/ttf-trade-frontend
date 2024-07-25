import { combineReducers } from 'redux';
import preferences from "./preferences/reducer.js";
import auth from "./auth/reducer.js";
import error from "./error/reducer.js";

const variables = () => combineReducers({
    preferences,
    auth,
    error
})

export default variables;