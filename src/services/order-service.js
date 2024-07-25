import axios from "axios";
import { getToken } from "./token-service.js";
import { env } from "utils/globals.js";
import { errorCustom } from "utils/errorCustom.js";
import { async } from "validate.js";

async function getAll() {
	try {
		return await axios.post(`${env.TRADE_URL}/get-order/all`, {
			headers: {
				Authorization: `Bearer ${getToken()}`,
			},
		});
	} catch (err) {
		return errorCustom(err);
	}
}

async function getSymbolOrders(_symbol, _exchange) {
	try {
		return await axios.post(
			`${env.TRADE_URL}/get-order/symbol`,
			{ symbol: _symbol, exchange: _exchange },
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

async function getExchangeOrders(exchange) {
	try {
		return await axios.post(
			`${env.TRADE_URL}/get-order/exchange/${exchange}`,
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

async function cancelOrder(orderData) {
	try {
		return await axios.post(`${env.TRADE_URL}/cancel-order`, orderData, {
			headers: {
				Authorization: `Bearer ${getToken()}`,
			},
		})
	} catch (err) {
		return errorCustom(err);
	}
}

async function checkOpenOrders(data) {
	try {
		return await axios.post(`${env.TRADE_URL}/check-open-orders`, data, {
			headers: {
				Authorization: `Bearer ${getToken()}`,
			},
		})
	} catch (err) {
		return errorCustom(err);
	}
}

export { getAll, getSymbolOrders, getExchangeOrders, cancelOrder, checkOpenOrders };
