// Purpose: To place  trades to the backend and
// Strategy: use axios or equivalent to post ordedr requests
// results -> return raw results
// Note:  Axios tends to remove content when responding with errors, so we modified the backend to always send status code 200 with a status flag (success, failed)

import axios from "axios";
import { getToken } from "./token-service.js";
import { env } from "utils/globals.js";
import { errorCustom } from "utils/errorCustom.js";

async function placeOrder(orderData) {
	try {
		return await axios.post(`${env.TRADE_URL}/place-order`, orderData, {
			headers: {
				Authorization: `Bearer ${getToken()}`,
			},
		})
	} catch (err) {
		return errorCustom(err);
	}
}

export { placeOrder };
