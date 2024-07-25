import axios from "axios";
import { getToken } from "./token-service.js";
import { env } from "utils/globals.js";
import { errorCustom } from "utils/errorCustom.js";

async function getPrices(exchange) {
	try {
		return await axios.post(
			`${env.TRADE_URL}/pricing/prices?exchange=${exchange}`,
			{},
			{
				headers: {
					Authorization: `Bearer ${getToken()}`,
				},
			}
		);
	} catch (err) {
		return errorCustom(err);
	}
}

async function getOrderBook(exchange, symbol) {
	try {
		return await axios.post(
			`${env.TRADE_URL}/pricing/order-book?exchange=${exchange}&symbol=${symbol}`,
			{},
			{
				headers: {
					Authorization: `Bearer ${getToken()}`,
				},
			}
		);
	} catch (err) {
		return errorCustom(err);
	}
}

export { getOrderBook, getPrices };
