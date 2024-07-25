import axios from "axios";
import { getToken } from "./token-service.js";
import { env } from "utils/globals.js";
import { errorCustom } from "utils/errorCustom.js";

async function getPriceLists(body) {
	try {
		return await axios.post(`${env.CANDLES_URL}/price-list`, body, {
			headers: { Authorization: `Bearer ${getToken()}` },
		});
	} catch (err) {
		return errorCustom(err);
	}
}

async function getGraphData(body) {
	try {
		return await axios.post(`${env.CANDLES_URL}/graph-data`, body, {
			headers: { Authorization: `Bearer ${getToken()}` },
		});
	} catch (err) {
		return errorCustom(err);
	}
}

export { getGraphData, getPriceLists };
