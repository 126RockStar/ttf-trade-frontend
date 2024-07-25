import axios from "axios";
import { getToken } from "./token-service.js";
import { env } from "utils/globals.js";
import { errorCustom } from "utils/errorCustom.js";

async function loadTutorial() {
	try {
		return await axios.post(
			`${env.TRADE_URL}/tutorial`,
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

export { loadTutorial };