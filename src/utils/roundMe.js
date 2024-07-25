function roundMe(val, precision) {
	return Number(`${Math.round(`${val}e${precision}`)}e-${precision}`).toFixed(`${precision}`);
}

const precisionRound = (marketData) => {
    try {
      let amountPrecision;
      let pricePrecision;
      let precision = marketData?.precision;
      if (marketData?.base === "USD") {
        pricePrecision = 2;
      } else if (
        precision?.price
          .toString()
          .split("")
          .some((char) => char === "e")
      ) {
        pricePrecision = parseInt(precision?.price.toString().split("-")[1]);
      } else if (precision?.price.toString().split(".").length > 1) {
        // Gemini, Others
        pricePrecision = precision?.price.toString().split(".")[1].length;
      } else {
        // bitStamp, others
        pricePrecision = Number(precision?.price);
      }
      if (
        precision?.amount
          .toString()
          .split("")
          .some((char) => char === "e")
      ) {
        amountPrecision = parseInt(precision?.amount.toString().split("-")[1]);
      } else if (precision?.amount.toString().split(".").length > 1) {
        // Gemini, others
        amountPrecision = precision?.amount.toString().split(".")[1].length;
      } else {
        amountPrecision = Number(precision?.amount); // BitStamp, others
      }
      return { pricePrecision, amountPrecision };
    } catch (err) {
	  console.log(err.message)
    }    
};

export { roundMe, precisionRound };
