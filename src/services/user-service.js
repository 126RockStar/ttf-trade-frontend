import axios from "axios";
import { getToken } from "./token-service.js";
import { env } from "utils/globals.js";
import { errorCustom } from "utils/errorCustom.js";
import { useDispatch, useSelector } from "react-redux";

async function getEnvironment() {
	try {
		return await axios.post(`${env.TRADE_URL}/frontend-environment`);
	} catch (err) {
		return errorCustom(err);
	}
}

async function validateDevAccounts(accounts) {
	try {
		return await axios.post(`${env.TRADE_URL}/user/check-dev-user`, { ...accounts });
	} catch (err) {
		return errorCustom(err);
	}
}

async function validateAccounts(iframeToken) {
	try {
		return await axios.post(`${env.TRADE_URL}/user/check-user`, { iframeToken });
	} catch (err) {
		return errorCustom(err);
	}
}

async function getUser(account) {
	try {
		return await axios.post(
			`${env.TRADE_URL}/user/load-user`,
			{ account },
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

async function changeFavorites(favorites, exchangeAccountId, exchange) {
	try {
		return await axios.post(
			`${env.TRADE_URL}/user/favorites`,
			{ favorites: favorites, exchangeAccountId: exchangeAccountId, exchange: exchange },
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

async function changeFlag(tutorialFlag) {
	try {
		return await axios.post(
			`${env.TRADE_URL}/user/tutorialFlag`,
			{ tutorialFlag: tutorialFlag },
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

export { getEnvironment, getUser, changeFlag, changeFavorites, validateDevAccounts, validateAccounts };
