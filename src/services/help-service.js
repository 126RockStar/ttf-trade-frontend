import axios from "axios";
import { getToken } from "./token-service.js";
import { env } from "utils/globals.js";
import { errorCustom } from "utils/errorCustom.js";

async function loadFaqs() {
	try {
		return await axios.get(
			`${env.TRADE_URL}/help/faqs`,
			{
				headers: {
					Authorization: `Bearer ${getToken()}`
				}
			}
		)
	} catch (err) {
		return errorCustom(err);
	}
}

async function loadTags() {
	try {
		return await axios.get(
			`${env.TRADE_URL}/help/tags`,
			{
				headers: {
					Authorization: `Bearer ${getToken()}`
				}
			}
		)
	} catch (err) {
		return errorCustom(err);
	}
}

async function loadTopic() {
	try {
		return await axios.get(
			`${env.TRADE_URL}/help/topics`,
			{
				headers: {
					Authorization: `Bearer ${getToken()}`
				}
			}
		)
	} catch (err) {
		return errorCustom(err);
	}
}

async function loadTopicContent() {
	try {
		return await axios.get(
			`${env.TRADE_URL}/help/topics/contents`,
			{
				headers: {
					Authorization: `Bearer ${getToken()}`
				}
			}
		)
	} catch (err) {
		return errorCustom(err);
	}
}

export { loadFaqs, loadTags, loadTopic, loadTopicContent };
