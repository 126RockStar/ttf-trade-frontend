let env = {
	TRADE_URL: process.env.REACT_APP_TRADE_URL || "http://localhost:3001/api/trade",
	CANDLES_URL: process.env.REACT_APP_CANDLES_URL || "http://localhost:3003/api/candles",
};

export { env };
