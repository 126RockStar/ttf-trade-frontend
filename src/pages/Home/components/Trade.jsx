import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-crypto-icons";
import { BsArrowDownShort } from "react-icons/bs";
import { getOrderBook } from "services/pricing-service";
import { placeOrder } from "services/trade-service";
import { updateOrder } from "store/modules/preferences/actions";
import {
  handleErr,
  closeErrName
} from "store/modules/error/actions";
import moment from "moment";
import "../styles/Trade.scss";
import { env } from "utils/globals.js";

// PRECISION TYPE
const BASE = 0;
const QUOTE = 1;

// PURCHASE MODE
const BUY_MODE = 'buy';
const SELL_MODE = 'sell';

// TRADING MODE
const LIMIT_TRADING = 0;
const MARKET_TRADING = 1;
const STOP_LIMIT_TRADING = 2;

// LAST CHANGE VAL
const LAST_BASE_VAL = 0;
const LAST_QUOTE_VAL = 1;

// TARGET PRICE BID MODE
const T_PRICE_BID = 0;
const T_PRICE_BID_ONE = 1;
const T_PRICE_BID_FIVE = 2;
const T_PRICE_BID_TEN = 3;
const T_PRICE_BID_ANY = 4;

// TARGET PRICE ASK MODE
const T_PRICE_ASK = 0;
const T_PRICE_ASK_ONE = 1;
const T_PRICE_ASK_FIVE = 2;
const T_PRICE_ASK_TEN = 3;
const T_PRICE_ASK_ANY = 4;

// PERMISSION ACCOUNT_TRADE
const P_ACCOUNT_TRADE = 'AccountTrade';

let USDollar = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const Trade = ({
  userInfo,
  symbol,
  balances,
  owned
}) => {

  const dispatch = useDispatch();
  const preferences = useSelector((state) => state.preferences);
  const auth = useSelector((state) => state.auth);

  const [orderBook, setOrderBook] = useState(null);
  const [baseVal, setBaseVal] = useState('');
  const [quoteVal, setQuoteVal] = useState('');
  const [marketData, setMarketData] = useState();
  const [base, setBase] = useState();
  const [quote, setQuote] = useState();
  const [purchaseMode, setPurchaseMode] = useState(BUY_MODE);
  const [lastChangeVal, setLastChangeVal] = useState();
  const [baseBal, setBaseBal] = useState();
  const [quoteBal, setQuoteBal] = useState();
  const [precision, setPrecision] = useState(null);
  const [orderPrice, setOrderPrice] = useState();
  const [spreadFee, setSpreadFee] = useState();

  const [loading, setLoading] = useState(false);
  const [tradeResponseMessage, setTradeResponseMessage] = useState(false); // this is for split message 'Max Check' and 'Trade response'
  const [newPriceLoading, setNewPriceLoading] = useState({
    time: "",
    message: "",
  });
  
  const [message, setMessage] = useState({
    error: false,
    title: '',
    content: ''
  })
  const [slippage, setSlippage] = useState(1.01); // Slippage is the amount that we will increase/decrease to ensure limit order is set

  // trading mode variables
  const [tradingMode, setTradingMode] = useState(MARKET_TRADING);
  const [targetPriceBidMode, setTargetPriceBidMode] = useState(T_PRICE_BID);
  const [targetPriceAskMode, setTargetPriceAskMode] = useState(T_PRICE_ASK);

  const [tPriceBidAnyPercent, setTPriceBidAnyPercent] = useState(0);
  const [tPriceAskAnyPercent, setPriceAskAnyPercent] = useState(0);

  const [targetPriceBid, setTargetPriceBid] = useState(0);
  const [targetPriceAsk, setTargetPriceAsk] = useState(0);
  const [bidInputChange, setBidInputChange] = useState(false);
  const [askInputChange, setAskInputChange] = useState(false);

  const [marketPrice, setMarketPrice] = useState(null);

  const [subTotal, setSubTotal] = useState(0);
  const [fee, setFee] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (preferences.marketData.length > 0) {
      try {
        const market = preferences.marketData.find(item=>item.tradeSymbol === symbol);

        if (market) {
          setMarketData(market);
          setBase(market.base);
          setQuote(market.quote);
          setPrecision(precisionRound(market));
        }

        dispatch(closeErrName({ name: 'try-trade-symbol' }));
      } catch (err) {
        dispatch(handleErr({
          data: {
            status: 'Failed',
            message: err.message
          },
          name: 'try-trade-symbol'
        }));
      }
    }
  }, [symbol, preferences.marketData]);

  useEffect(() => {
    if (auth.selectExchange) {
      try {
        const baseBalObject = balances.find((bal) => base === bal.asset);
        setBaseBal(baseBalObject?.free ? baseBalObject.free : "0.00");
        const quoteBalObject = balances.find((bal) => quote === bal.asset);
        setQuoteBal(quoteBalObject?.free ? quoteBalObject.free : "0.00");

        dispatch(closeErrName({ name: 'try-trade-balances' }));
      } catch (err) {
        dispatch(handleErr({
          data: {
            status: 'Failed',
            message: err.message
          },
          name: 'try-trade-balances'
        }));
      }
    }
  }, [balances, base, quote, auth.selectExchange])

  useEffect(() => {
    if (auth.selectExchange) {
      try {  
        fetchOrderBook();
  
        const interval = setInterval(() => {
          fetchOrderBook();
          setNewPriceLoading((state) => ({
            time: moment().format("hh:mm:ss A"),
            message: "New Prices Loaded",
          }));
        }, 30000);
        
        dispatch(closeErrName({ name: 'try-trade-fetchOrderBook' }));

        return () => {
          clearInterval(interval);
        };
      } catch (err) {
        dispatch(handleErr({
          data: {
            status: 'Failed',
            message: err.message
          },
          name: 'try-trade-fetchOrderBook'
        }));
      }
    }
  }, [auth.selectExchange]);

  useEffect(() => {
    if (precision && orderBook) {
      try {
        if (orderBook.asks.length > 0 && orderBook.bids.length > 0) {
          // calculate the fee
          let spreadFee = 0.0; // spread fee is the ratio of spread between lowest bid (buyer) and lowest ask (seller)
          if (env.SPREAD_FEE_FLAG === true) {
            //
            // if the SPREADFEEFLAG IS True TODO: move to tennant database so it can be changed by the administrator
            if (orderBook.bids.length !== 0 && orderBook.asks.length !== 0) {
              spreadFee = Math.abs(Number(orderBook.bids[0][0]) / Number(orderBook.asks[0][0]) - 1.0);
            }
          }
          setSpreadFee(spreadFee);
          // ask the backend what the fee pct should be via api
          let allFeePct = Math.max(Number(env.TRANSFER_SVC_FEE), Number(env.TRANSFER_EXCHANGE_FEE)) + spreadFee;  
    
          let newSubTotal, newFee, newTotal = 0;
    
          if (purchaseMode === BUY_MODE) {
            if (lastChangeVal === LAST_BASE_VAL) {
    
              switch (tradingMode) {
                case LIMIT_TRADING:
                  
                  if (baseVal === '') {
                    setQuoteVal('');
                    setMessage({
                      error: false,
                      title: '',
                      content: ''
                    })
                    return;
                  }
                  
                  const baseNum = Number(baseVal);
        
                  // calculate subTotal, fee, total
                  newSubTotal = Number(baseNum * targetPriceBid);
                  newFee = Number(newSubTotal * allFeePct);
                  newTotal = Number(newSubTotal + newFee);
                  
                  setFee(newFee);
                  setTotal(newTotal);
                  setSubTotal(newSubTotal);
        
                  showVal(QUOTE, newTotal);
        
                  setOrderPrice(roundMe(targetPriceBid, precision.pricePrecision));                     

                  // max check
                  const limitMaxToBuyQty = (quoteBal / (1 + allFeePct)) / targetPriceBid;
    
                  if ( newTotal !== 0 && !tradeResponseMessage) {
                    // only check if new values have been entered
                    setMessage({
                      error: false,
                      title: 'Max Check',
                      content: `Max you can buy with ${roundMe(quoteBal,2)}(${quote}) is ${roundMe(limitMaxToBuyQty, precision.amountPrecision)}(${base}).`
                    });
                  }

                  // limit order
                  if (Number(targetPriceBid) >= orderBook.asks[0][0] && !tradeResponseMessage) {
                    setMessage({
                      error: true,
                      title: 'Warning',
                      content: 'You may proceed, but at this price, this is not a true limit order because the price is above the bid and equal or higher than the Lowest Ask.  It will likely be executed immediately at best market price.'
                    })
                  }
                  
                  // warning error
                  if ( roundMe(newTotal, 2) > quoteBal && !tradeResponseMessage ) {
                    setMessage({
                      error: true,
                      title: 'Warning - Not Enough Funds',
                      content: `Max you can buy with ${roundMe(quoteBal,2)}(${quote}) is ${roundMe(limitMaxToBuyQty, precision.amountPrecision)}(${base}).`
                    });
                  }         

                  // min check
                  if (auth.selectExchange.exchange === 'Bitstamp' || auth.selectExchange.exchange === 'Bitstamp-Sandbox') {
                    const quoteUSD = handleCalcUSD(newTotal, quote);
                    
                    if (quoteUSD < 10.1) {
                      setMessage({
                        error: true,
                        title: 'Minimum Check',
                        content: `You must enter a transaction > 10.10 USD value before you can proceed.`
                      });
                    }
                  }
    
                  break;
                case MARKET_TRADING:
                  
                  if (baseVal === '') {
                    setQuoteVal('');
                    setMarketPrice(null);
                    setMessage({
                      error: false,
                      title: '',
                      content: ''
                    })
                    return;
                  }
                  
                  let baseNum2 = Number(baseVal);

                  let estimatedPrice = 0;
                  let quoteSubTotal = 0; // amount to buy starts at 0
                  // each ask row is an array of 2 numbers, price and qty to sell  [.0320303, 39000.45]
                  for (let i = 0; i < orderBook.asks.length; i++) {
                    // Travers the asks array of sell prices and their qty (we are buying qty's that others are selling)
                    const ask = orderBook.asks[i];
                    estimatedPrice = ask[0];    
                    const totalCostOfAsk = Number(ask[0]) * Number(ask[1]); // this ask row total value (price*qty)
                    
                    if (ask[1] > baseNum2) {                    
                      quoteSubTotal += baseNum2 * Number(ask[0]); // finish totaling amount for this remaneder
                      baseNum2 = 0;
                      break;
                    }else if (ask[1] < baseNum2) {
                      quoteSubTotal += totalCostOfAsk;
                      baseNum2 -= ask[1];
                    } else {
                      quoteSubTotal += totalCostOfAsk;
                      baseNum2 = 0;
                      break;
                    }
                  }

                  setMarketPrice(roundMe(estimatedPrice, precision.pricePrecision));

                  const orderPrice = roundMe(estimatedPrice * slippage, precision.pricePrecision);
                  setOrderPrice(orderPrice);                

                  // calculate subTotal, fee, total
                  newSubTotal = quoteSubTotal;
                  newFee = newSubTotal * allFeePct;                
                  newTotal = newSubTotal + newFee;
                  
                  setSubTotal(newSubTotal);
                  setFee(newFee);
                  setTotal(newTotal);

                  showVal(QUOTE, newTotal);

                  // maxToBuy
                  const updateQuoteBal = roundMe((quoteBal - quoteBal * Math.abs(1 - slippage)), 2);
                  let maxQuoteSubTotal = updateQuoteBal / (1 + allFeePct);
                  let maxBaseTotal = 0;
                  
                  for (let j = 0; j < orderBook.asks.length; j++) {
                    const ask = orderBook.asks[j]; // Asks are the selling prices and quantities
                    const totalCostOfAsk = Number(ask[0]) * Number(ask[1]); // this ask value (Price*quantitiy)
                    
                    if (totalCostOfAsk < maxQuoteSubTotal) {
                      // if this ask value will not  use up all our money
                      maxBaseTotal += Number(ask[1]); // increase the base (amount to buy, by the qty available )
                      maxQuoteSubTotal -= totalCostOfAsk; // deduct the Price * the volume from the remining availble
                    } else if (totalCostOfAsk > maxQuoteSubTotal) {
                      // if the total amount > what we can still buy
                      maxBaseTotal += maxQuoteSubTotal / Number(ask[0]); // increase the base buy the remaining money to spend/the price
                      maxQuoteSubTotal = 0; // we are now out of spending cash
                      break;
                    } else {
                      // the totalFor this askrow exactly matches what we have lefft
                      //          baseTotal += totalCostOfAsk;                         // This is wrong increases quantity by the total amount to buy
                      maxBaseTotal += Number(ask[1]); // increase the BaseTotal by the quantity (exact match)
                      maxQuoteSubTotal = 0;
                      break;
                    } 
                  }

                  if ( newTotal !== 0 && !tradeResponseMessage) {
                    // only check if new values have been entered
                    setMessage({
                      error: false,
                      title: 'Max Check',
                      content: `Max you can buy with ${roundMe(updateQuoteBal,2)}(${quote}) is ${roundMe(maxBaseTotal, precision.amountPrecision)}(${base}). 1% has been reserved from your available USD to allow for price slippage.`
                    });
                  }
    
                  if (roundMe(newTotal, 2) > updateQuoteBal && !tradeResponseMessage ) {
                    setMessage({
                      error: true,
                      title: 'Warning - Not Enough Funds',
                      content: `Max you can buy with ${roundMe(updateQuoteBal,2)}(${quote}) is ${roundMe(maxBaseTotal, precision.amountPrecision)}(${base}). 1% has been reserved from your available USD to allow for price slippage.`
                    });
                  }  

                  // min check
                  if (auth.selectExchange.exchange === 'Bitstamp' || auth.selectExchange.exchange === 'Bitstamp-Sandbox') {
                    const quoteUSD = handleCalcUSD(newTotal, quote);

                    if (quoteUSD < 10.1) {
                      setMessage({
                        error: true,
                        title: 'Minimum Check',
                        content: `You must enter a transaction > 10.10 USD value before you can proceed.`
                      });
                    }
                  }

                  break;
              }          
            } else if (lastChangeVal === LAST_QUOTE_VAL) {
              switch (tradingMode) {
                case LIMIT_TRADING:              

                  if (quoteVal === '') {
                    setBaseVal('');
                    setMessage({
                      error: false,
                      title: '',
                      content: ''
                    })
                    return;
                  }
    
                  const quoteNum = Number(quoteVal);
    
                  // calculate subTotal, fee, total.
                  newSubTotal = quoteNum / ( 1 + allFeePct);
                  newFee = Number(newSubTotal * allFeePct);
                  newTotal = quoteNum;
    
                  setFee(newFee);
                  setTotal(newTotal);
                  setSubTotal(newSubTotal);
    
                  const newBaseVal = newSubTotal / targetPriceBid;
                  showVal(BASE, newBaseVal);
    
                  setOrderPrice(roundMe(targetPriceBid, precision.pricePrecision));  

                  // maxToBuy
                  const limitMaxToBuyQty = (quoteBal / (1 + allFeePct)) / targetPriceBid;
                  
                  if ( newBaseVal !== 0 && !tradeResponseMessage) {
                    // only check if new values have been entered
                    setMessage({
                      error: false,
                      title: 'Max Check',
                      content: `Max you can buy with ${roundMe(quoteBal,2)}(${quote}) is ${roundMe(limitMaxToBuyQty, precision.amountPrecision)}(${base}).`
                    });
                  }

                  // limit order
                  if (Number(targetPriceBid) >= orderBook.asks[0][0] && !tradeResponseMessage) {
                    setMessage({
                      error: true,
                      title: 'Warning',
                      content: 'You may proceed, but at this price, this is not a true limit order because the price is above the bid and equal or higher than the Lowest Ask.  It will likely be executed immediately at best market price.'
                    })
                  }
    
                  if ( roundMe(newTotal, 2) > quoteBal && !tradeResponseMessage ) {
                    setMessage({
                      error: true,
                      title: 'Warning - Not Enough Funds',
                      content: `Max you can buy with ${roundMe(quoteBal,2)}(${quote}) is ${roundMe(limitMaxToBuyQty, precision.amountPrecision)}(${base}).`
                    });
                  } 

                  // min check
                  if (auth.selectExchange.exchange === 'Bitstamp' || auth.selectExchange.exchange === 'Bitstamp-Sandbox') {
                    const quoteUSD = handleCalcUSD(newTotal, quote);

                    if (quoteUSD < 10.1) {
                      setMessage({
                        error: true,
                        title: 'Minimum Check',
                        content: `You must enter a transaction > 10.10 USD value before you can proceed.`
                      });
                    }
                  }
                  
                  break;
                case MARKET_TRADING:
                  if (quoteVal === '') {
                    setBaseVal('');
                    setMarketPrice(null);
                    setMessage({
                      error: false,
                      title: '',
                      content: ''
                    })
                    return;
                  }
                  
                  let estimatedPrice = 0;
                  let quoteSubTotal = Number(quoteVal) / (1 + allFeePct); // calculate the quoteNUm to use for determining amount to purchase.  Remove the 0 // remove the fee before filling the ordder                
                  let baseTotal = 0;                

                  // while quoteNum > 0, keep looking for more quantity
                  // we are calculating the total base qty that we can purchase
                  // while we have more to spend (quoteNum), add each vollume from the ask to the base
                  // when we are out of spending money, add the
                  
                  for (let i = 0; i < orderBook.asks.length; i++) {
                    const ask = orderBook.asks[i]; // Asks are the selling prices and quantities
                    estimatedPrice = ask[0];
                    const totalCostOfAsk = Number(ask[0]) * Number(ask[1]); // this ask value (Price*quantitiy)
                    if (totalCostOfAsk < quoteSubTotal) {
                      // if this ask value will not  use up all our money
                      baseTotal += Number(ask[1]); // increase the base (amount to buy, by the qty available )
                      quoteSubTotal -= totalCostOfAsk; // deduct the Price * the volume from the remining availble
                    } else if (totalCostOfAsk > quoteSubTotal) {
                      // if the total amount > what we can still buy
                      baseTotal += quoteSubTotal / Number(ask[0]); // increase the base buy the remaining money to spend/the price
                      quoteSubTotal = 0; // we are now out of spending cash
                      break;
                    } else {
                      // the totalFor this askrow exactly matches what we have lefft
                      //          baseTotal += totalCostOfAsk;                         // This is wrong increases quantity by the total amount to buy
                      baseTotal += Number(ask[1]); // increase the BaseTotal by the quantity (exact match)
                      quoteSubTotal = 0;
                      break;
                    }
                  }                

                  setMarketPrice(roundMe(estimatedPrice, precision.pricePrecision));

                  const orderPrice = roundMe(estimatedPrice * slippage, precision.pricePrecision);
                  setOrderPrice(orderPrice);                
                  
                  // calculate subTotal, fee, total
                  newTotal = Number(quoteVal);
                  newSubTotal = Number(quoteVal) / (1 + allFeePct);
                  newFee = newTotal - newSubTotal;

                  setSubTotal(newSubTotal);
                  setFee(newFee);
                  setTotal(newTotal);

                  showVal(BASE, baseTotal);

                  // maxToBuy                
                  const updateQuoteBal = roundMe((quoteBal - quoteBal * Math.abs(1 - slippage)), 2);
                  let maxQuoteSubTotal = updateQuoteBal / (1 + allFeePct);
                  let maxBaseTotal = 0;
                  
                  for (let j = 0; j < orderBook.asks.length; j++) {
                    const ask = orderBook.asks[j]; // Asks are the selling prices and quantities
                    const totalCostOfAsk = Number(ask[0]) * Number(ask[1]); // this ask value (Price*quantitiy)
                    
                    if (totalCostOfAsk < maxQuoteSubTotal) {
                      // if this ask value will not  use up all our money
                      maxBaseTotal += Number(ask[1]); // increase the base (amount to buy, by the qty available )
                      maxQuoteSubTotal -= totalCostOfAsk; // deduct the Price * the volume from the remining availble
                    } else if (totalCostOfAsk > maxQuoteSubTotal) {
                      // if the total amount > what we can still buy
                      maxBaseTotal += maxQuoteSubTotal / Number(ask[0]); // increase the base buy the remaining money to spend/the price
                      maxQuoteSubTotal = 0; // we are now out of spending cash
                      break;
                    } else {
                      // the totalFor this askrow exactly matches what we have lefft
                      //          baseTotal += totalCostOfAsk;                         // This is wrong increases quantity by the total amount to buy
                      maxBaseTotal += Number(ask[1]); // increase the BaseTotal by the quantity (exact match)
                      maxQuoteSubTotal = 0;
                      break;
                    } 
                  }
                  
                  if ( newTotal !== 0 && !tradeResponseMessage) {
                    // only check if new values have been entered
                    setMessage({
                      error: false,
                      title: 'Max Check',
                      content: `Max you can buy with ${roundMe(updateQuoteBal,2)}(${quote}) is ${roundMe(maxBaseTotal, precision.amountPrecision)}(${base}). 1% has been reserved from your available USD to allow for price slippage.`
                    });
                  }
    
                  if ( roundMe(newTotal, 2) > updateQuoteBal && !tradeResponseMessage ) {
                    setMessage({
                      error: true,
                      title: 'Warning - Not Enough Funds',
                      content: `Max you can buy with ${roundMe(updateQuoteBal,2)}(${quote}) is ${roundMe(maxBaseTotal, precision.amountPrecision)}(${base}). 1% has been reserved from your available USD to allow for price slippage.`
                    });
                  }  

                  // min check
                  if (auth.selectExchange.exchange === 'Bitstamp' || auth.selectExchange.exchange === 'Bitstamp-Sandbox') {
                    const quoteUSD = handleCalcUSD(newTotal, quote);

                    if (quoteUSD < 10.1) {
                      setMessage({
                        error: true,
                        title: 'Minimum Check',
                        content: `You must enter a transaction > 10.10 USD value before you can proceed.`
                      });
                    }
                  }

                  break;
              }
            }
          }
    
          if (purchaseMode === SELL_MODE) {
            if (lastChangeVal === LAST_BASE_VAL) {
              switch (tradingMode) {
                case LIMIT_TRADING:
                  
                  if (baseVal === '') {
                    setQuoteVal('');
                    setMessage({
                      error: false,
                      title: '',
                      content: ''
                    })
                    return;
                  }
                  
                  const baseNum = Number(baseVal);
        
                  // calculate subTotal, fee, total
                  newFee = Number(baseNum * targetPriceAsk * allFeePct);
                  newSubTotal = Number(baseNum * targetPriceAsk);                
                  newTotal = Number(newSubTotal - newFee);
                  
                  setFee(newFee);
                  setTotal(newTotal);
                  setSubTotal(newSubTotal);
        
                  const newQuoteVal = newTotal;
                  showVal(QUOTE, newQuoteVal);
        
                  setOrderPrice(roundMe(targetPriceAsk, precision.pricePrecision)); 

                  // maxToSell         
                  const maxToSell = Number(baseBal * targetPriceAsk) - Number(baseBal * targetPriceAsk * allFeePct);

                  if ( newQuoteVal !== 0 && !tradeResponseMessage) {
                    // only check if new values have been entered
                    setMessage({
                      error: false,
                      title: 'Max Check',
                      content: `The max of ${base} you can sell is ${roundMe(baseBal, precision.amountPrecision)} resulting  in $${roundMe(maxToSell, 2)} ${quote}`
                    });
                  }

                  // limit order
                  if (Number(targetPriceAsk) <= orderBook.bids[0][0] && !tradeResponseMessage) {
                    setMessage({
                      error: true,
                      title: 'Warning',
                      content: 'You may proceed, but at this price, this is not a true limit order because the price is lower than the market price and may be executed immediately at best market price.'
                    })
                  }

                  // waring error
                  if ( roundMe(baseNum, precision.amountPrecision) > baseBal && !tradeResponseMessage) {
                    setMessage({
                      error: true,
                      title: 'Warning - Not Enough Funds',
                      content: `The max of ${base} you can sell is ${roundMe(baseBal, precision.amountPrecision)} resulting  in $${roundMe(maxToSell, 2)} ${quote}`,
                    });
                  }

                   // min check
                  if (auth.selectExchange.exchange === 'Bitstamp' || auth.selectExchange.exchange === 'Bitstamp-Sandbox') {
                    const quoteUSD = handleCalcUSD(newTotal, quote);

                    if (quoteUSD < 10.1) {
                      setMessage({
                        error: true,
                        title: 'Minimum Check',
                        content: `You must enter a transaction > 10.10 USD value before you can proceed.`
                      });
                    }
                  }
                  
                  break;
                case MARKET_TRADING:

                  if (baseVal === '') {
                    setQuoteVal('');
                    setMarketPrice(null);
                    setMessage({
                      error: false,
                      title: '',
                      content: ''
                    })
                    return;
                  }
                  
                  // user changed the base value ex: (BTC/USD) is the base, which is always on top in our UI
                  let baseNum2 = Number(baseVal); // create a copy of the baseVal, which we will decrease until 0
                  let quoteSubTotal = 0; // resulting Qty to order in the sell will be the total Quote
                  let estimatedPrice = 0;

                  // use the bids to determine what we will be able to immediately recieve if we buy immediately.

                  for (let i = 0; i < orderBook.bids.length; i++) {
                    // keep looking in the bids list until you have sold all your base currency (ex: BTC)

                    let bid = orderBook.bids[i]; // bid is one bid pair  [price, qty]   bid[0] is price, bid[1] is qty
                    estimatedPrice = Number(bid[0]);
                    
                    let totalValueOfBid = Number(bid[0]) * Number(bid[1]); // the total value of this bid is price * qty
                    if (bid[1] > baseNum2) {
                      quoteSubTotal += baseNum2 * bid[0]; // add the remaining baseAmount * that row price to finalize the quote amt you will recieve.
                      baseNum2 = 0; // no more to sell

                      break;
                    } else if (bid[1] < baseNum2) {
                      // this bid has less than you have to sell, consume it and add more
                      quoteSubTotal += totalValueOfBid; // add the current value to the quote value
                      baseNum2 -= bid[1]; // decrease the amount to sell
                    } else {
                      // there is an exact amount of base in this bid row to sell that matches your remaining baseNum to sell
                      quoteSubTotal += totalValueOfBid; // add the current value to the quote value
                      baseNum2 = 0; // no more to sell

                      break;
                    }
                  }

                  setMarketPrice(roundMe(estimatedPrice, precision.pricePrecision));

                  let orderPrice = 0;
                  if (roundMe(estimatedPrice / slippage, precision.pricePrecision) === 0) {
                    orderPrice = estimatedPrice;
                    setOrderPrice(roundMe(orderPrice, precision.pricePrecision)); // set to price                  
                  } else {
                    orderPrice = roundMe(estimatedPrice / slippage, precision.pricePrecision);
                    setOrderPrice(roundMe(orderPrice, precision.pricePrecision));
                  }

                  // calculate subTotal, fee, total
                  newSubTotal = quoteSubTotal;
                  newFee = newSubTotal * allFeePct;
                  newTotal = newSubTotal - newFee;

                  setSubTotal(newSubTotal);
                  setFee(newFee);
                  setTotal(newTotal);

                  showVal(QUOTE, newTotal);     

                  // maxToSell                    
                  let maxBaseNum = Number(baseBal); // create a copy of the baseVal, which we will decrease until 0
                  let maxQuoteSubTotal = 0; // resulting Qty to order in the sell will be the total Quote

                  // use the bids to determine what we will be able to immediately recieve if we buy immediately.

                  for (let i = 0; i < orderBook.bids.length; i++) {
                    // keep looking in the bids list until you have sold all your base currency (ex: BTC)

                    let bid = orderBook.bids[i]; // bid is one bid pair  [price, qty]   bid[0] is price, bid[1] is qty
                    
                    let totalValueOfBid = Number(bid[0]) * Number(bid[1]); // the total value of this bid is price * qty
                    if (bid[1] > maxBaseNum) {
                      maxQuoteSubTotal += maxBaseNum * bid[0]; // add the remaining baseAmount * that row price to finalize the quote amt you will recieve.
                      maxBaseNum = 0; // no more to sell

                      break;
                    } else if (bid[1] < maxBaseNum) {
                      // this bid has less than you have to sell, consume it and add more
                      maxQuoteSubTotal += totalValueOfBid; // add the current value to the quote value
                      maxBaseNum -= bid[1]; // decrease the amount to sell
                    } else {
                      // there is an exact amount of base in this bid row to sell that matches your remaining baseNum to sell
                      maxQuoteSubTotal += totalValueOfBid; // add the current value to the quote value
                      maxBaseNum = 0; // no more to sell

                      break;
                    }
                  }

                  const maxToSell2 = maxQuoteSubTotal - maxQuoteSubTotal * allFeePct;         

                  if ( newTotal !== 0 && !tradeResponseMessage) {
                    // only check if new values have been entered
                    setMessage({
                      error: false,
                      title: 'Max Check',
                      content: `The max of ${base} you can sell is ${roundMe(baseBal, precision.amountPrecision)} resulting  in $${roundMe(maxToSell2, 2)} ${quote}`
                    });
                  }
                  
                  if ( roundMe(baseVal, precision.amountPrecision) > baseBal && !tradeResponseMessage) {
                    setMessage({
                      error: true,
                      title: 'Warning - Not Enough Funds',
                      content: `The max of ${base} you can sell is ${roundMe(baseBal, precision.amountPrecision)} resulting  in $${roundMe(maxToSell2, 2)} ${quote}`
                    });
                  }

                  // min check
                  if (auth.selectExchange.exchange === 'Bitstamp' || auth.selectExchange.exchange === 'Bitstamp-Sandbox') {
                    const quoteUSD = handleCalcUSD(newTotal, quote);

                    if (quoteUSD < 10.1) {
                      setMessage({
                        error: true,
                        title: 'Minimum Check',
                        content: `You must enter a transaction > 10.10 USD value before you can proceed.`
                      });
                    }
                  }

                  break;
              }
            } else if (lastChangeVal === LAST_QUOTE_VAL) {
              switch (tradingMode) {
                case LIMIT_TRADING:

                  if (quoteVal === '') {
                    setBaseVal('');
                    setMessage({
                      error: false,
                      title: '',
                      content: ''
                    })
                    return;
                  }
                  
                  const quoteNum = Number(quoteVal);
        
                  // calculate subTotal, fee, total        
                  newTotal = Number(quoteNum);
                  newSubTotal = newTotal / (1 - allFeePct);
                  newFee = newSubTotal * allFeePct;
                  
                  setFee(newFee);
                  setTotal(newTotal);
                  setSubTotal(newSubTotal);
        
                  const newBaseVal = newSubTotal / targetPriceAsk;
                  showVal(BASE, newBaseVal);
        
                  setOrderPrice(roundMe(targetPriceAsk, precision.pricePrecision));   

                  // maxToSell
                  const maxToSell = Number(baseBal * targetPriceAsk) - Number(baseBal * targetPriceAsk * allFeePct);

                  if ( newBaseVal !== 0 && !tradeResponseMessage) {
                    // only check if new values have been entered
                    setMessage({
                      error: false,
                      title: 'Max Check',
                      content: `The max of ${base} you can sell is ${roundMe(baseBal, precision.amountPrecision)} resulting  in $${roundMe(maxToSell, 2)} ${quote}`
                    });
                  }

                  // limit order
                  if (Number(targetPriceAsk) <= orderBook.bids[0][0] && !tradeResponseMessage) {
                    setMessage({
                      error: true,
                      title: 'Warning',
                      content: 'You may proceed, but at this price, this is not a true limit order because the price is lower than the market price and may be executed immediately at best market price.'
                    })
                  }

                  // warning error
                  if ( roundMe(newBaseVal, precision.amountPrecision) > baseBal && !tradeResponseMessage) {
                    setMessage({
                      error: true,
                      title: 'Warning - Not Enough Funds',
                      content: `The max of ${base} you can sell is ${roundMe(baseBal, precision.amountPrecision)} resulting  in $${roundMe(maxToSell, 2)} ${quote}`
                    });
                  }

                  // min check
                  if (auth.selectExchange.exchange === 'Bitstamp' || auth.selectExchange.exchange === 'Bitstamp-Sandbox') {
                    const quoteUSD = handleCalcUSD(newTotal, quote);

                    if (quoteUSD < 10.1) {
                      setMessage({
                        error: true,
                        title: 'Minimum Check',
                        content: `You must enter a transaction > 10.10 USD value before you can proceed.`
                      });
                    }
                  }

                  break;
                case MARKET_TRADING:

                  if (quoteVal === '') {
                    setBaseVal('');
                    setMarketPrice(null);
                    setMessage({
                      error: false,
                      title: '',
                      content: ''
                    })
                    return;
                  }
                        
                  // user entered the Quote Amount To Sell (Lower Part of UI Screen)                
                  let quoteNum2 = Number(quoteVal) / (1 - allFeePct); // this is actual amount (When selling, we charge USD, so reduce by the calculated fees // remove the fee before filling the ordder

                  let estimatedPrice = 0;
                  let totalBase = 0;

                  // remember Base is what we are selling, which is in the top part of the bid.
                  // quote is the amount we will get (I know it seams upside down, but the user is specifying they want result to be: eg: $50.00)
                  for (let i = 0; i < orderBook.bids.length; i++) {
                    // travers all the bids (sellers)
                    const bid = orderBook.bids[i]; // each bid is an array of Price bid[0] and qty bid[1]
                    estimatedPrice = bid[0];
                    const totalValueOfBid = Number(bid[0]) * Number(bid[1]); // total value of each bid is the product of Price * Qty

                    if (totalValueOfBid < quoteNum2) {
                      // if this value does not satisfy the remining qty to sell, take the entire amount, keep going
                      totalBase += Number(bid[1]); // increase the base amount (what we get, by the qty in this bid)
                      quoteNum2 -= totalValueOfBid; // decrease the amount remaining to sell by the Total Value
                    } else if (totalValueOfBid > quoteNum2) {
                      totalBase += quoteNum2 / Number(bid[0]); // increase the base amount (what we get, by whatever this remaining amt will can be used to sell)
                      quoteNum2 = 0; // we are out of funds to sell
                      break;
                    } else {
                      // totalValue of this Bid exactly matches remaining to fill
                      totalBase += totalValueOfBid;
                      quoteNum2 = 0;
                      break;
                    }
                  }

                  setMarketPrice(roundMe(estimatedPrice, precision.pricePrecision));

                  let orderPrice;
                  if (roundMe(estimatedPrice / slippage, precision.pricePrecision) === 0) {
                    orderPrice = estimatedPrice;
                    setOrderPrice(roundMe(orderPrice, precision.pricePrecision)); // set to price                  
                  } else {
                    orderPrice = roundMe(estimatedPrice / slippage, precision.pricePrecision);
                    setOrderPrice(roundMe(orderPrice, precision.pricePrecision));
                  }

                  // calculate subTotal, fee, total
                  newSubTotal = Number(quoteVal) / (1 - allFeePct);
                  newFee = Number(newSubTotal * allFeePct);
                  newTotal = Number(quoteVal);

                  setFee(newFee);
                  setTotal(newTotal);
                  setSubTotal(newSubTotal);

                  showVal(BASE, totalBase);

                  // maxToSell               
                  let maxBaseNum = Number(baseBal); // create a copy of the baseVal, which we will decrease until 0
                  let maxQuoteSubTotal = 0; // resulting Qty to order in the sell will be the total Quote

                  // use the bids to determine what we will be able to immediately recieve if we buy immediately.

                  for (let i = 0; i < orderBook.bids.length; i++) {
                    // keep looking in the bids list until you have sold all your base currency (ex: BTC)

                    let bid = orderBook.bids[i]; // bid is one bid pair  [price, qty]   bid[0] is price, bid[1] is qty
                    
                    let totalValueOfBid = Number(bid[0]) * Number(bid[1]); // the total value of this bid is price * qty
                    if (bid[1] > maxBaseNum) {
                      maxQuoteSubTotal += maxBaseNum * bid[0]; // add the remaining baseAmount * that row price to finalize the quote amt you will recieve.
                      maxBaseNum = 0; // no more to sell

                      break;
                    } else if (bid[1] < maxBaseNum) {
                      // this bid has less than you have to sell, consume it and add more
                      maxQuoteSubTotal += totalValueOfBid; // add the current value to the quote value
                      maxBaseNum -= bid[1]; // decrease the amount to sell
                    } else {
                      // there is an exact amount of base in this bid row to sell that matches your remaining baseNum to sell
                      maxQuoteSubTotal += totalValueOfBid; // add the current value to the quote value
                      maxBaseNum = 0; // no more to sell

                      break;
                    }
                  }

                  const maxToSell2 = maxQuoteSubTotal - maxQuoteSubTotal * allFeePct;  

                  if ( newTotal !== 0 && !tradeResponseMessage) {
                    // only check if new values have been entered
                    setMessage({
                      error: false,
                      title: 'Max Check',
                      content: `The max of ${base} you can sell is ${roundMe(baseBal, precision.amountPrecision)} resulting  in $${roundMe(maxToSell2, 2)} ${quote}`
                    });
                  }

                  if ( roundMe(totalBase, precision.amountPrecision) > baseBal && !tradeResponseMessage) {
                    setMessage({
                      error: true,
                      title: 'Warning - Not Enough Funds',
                      content: `The max of ${base} you can sell is ${roundMe(baseBal, precision.amountPrecision)} resulting  in $${roundMe(maxToSell2, 2)} ${quote}`
                    });
                  }

                  // min check
                  if (auth.selectExchange.exchange === 'Bitstamp' || auth.selectExchange.exchange === 'Bitstamp-Sandbox') {
                    const quoteUSD = handleCalcUSD(newTotal, quote);

                    if (quoteUSD < 10.1) {
                      setMessage({
                        error: true,
                        title: 'Minimum Check',
                        content: `You must enter a transaction > 10.10 USD value before you can proceed.`
                      });
                    }
                  }

                  break;
              }
            }
          }
        }

        if (orderBook.asks.length === 0) {
          dispatch(handleErr({
            data: {
              status: 'Failed',
              message: 'There is no data for orderbook asks.'
            },
            name: 'orderBook-ask'
          }));
        } else {
          dispatch(closeErrName({ name: 'orderBook-ask' }));
        }

        if (orderBook.bids.length === 0) {
          dispatch(handleErr({
            data: {
              status: 'Failed',
              message: 'There is no data for orderbook bids.'
            },
            name: 'orderBook-bid'
          }));
        } else {
          dispatch(closeErrName({ name: 'orderBook-bid' }));
        }

        dispatch(closeErrName({ name: 'try-trade-baseVal' }));
        
      } catch (err) {
        dispatch(handleErr({
          data: {
            status: 'Failed',
            message: err.message
          },
          name: 'try-trade-baseVal'
        }));
      }
    }    
  }, [baseVal, quoteVal, purchaseMode, targetPriceBid, targetPriceAsk, precision, tradingMode, orderBook]);

  useEffect(() => {
    fetchOrderBook();
    
    if (tradingMode === LIMIT_TRADING && purchaseMode === BUY_MODE) {      
      setTargetPriceBidMode(T_PRICE_BID);
    }

    if (tradingMode === LIMIT_TRADING && purchaseMode === SELL_MODE) {
      setTargetPriceAskMode(T_PRICE_ASK);
    }
  }, [tradingMode])

  useEffect(() => {
    fetchOrderBook();
  }, [purchaseMode])

  useEffect(() => {  
    fetchOrderBook();  
  }, [targetPriceBidMode, targetPriceAskMode])

  useEffect(() => {
    setBidInputChange(false);
  }, [targetPriceBidMode])

  useEffect(() => {
    setAskInputChange(false);
  }, [targetPriceAskMode])

  useEffect(() => {
    if (tPriceBidAnyPercent !== 0) {      
      const timeOutFunc = setTimeout(() => {    
        fetchOrderBook();   
      }, 150);

      return () => clearTimeout(timeOutFunc);
    }
  }, [tPriceBidAnyPercent]);

  useEffect(() => {
    if (tPriceAskAnyPercent !== 0) {      
      const timeOutFunc = setTimeout(() => {    
        fetchOrderBook();
      }, 150);

      return () => clearTimeout(timeOutFunc);
    }
  }, [tPriceAskAnyPercent]);

  useEffect(() => {
    if (orderBook && precision) {
      // targetPriceBidMode
      try {
        if (orderBook.asks.length > 0 && orderBook.bids.length > 0) {
          if (!bidInputChange) {
            const tPriceBid = orderBook.bids[0][0];
            let customPriceBid;
    
            if (targetPriceBidMode === T_PRICE_BID) {     
              customPriceBid = tPriceBid;
            }
    
            if (targetPriceBidMode === T_PRICE_BID_ONE) {
              customPriceBid = Number(tPriceBid) * (1 - 0.01);
            }
    
            if (targetPriceBidMode === T_PRICE_BID_FIVE) {
              customPriceBid = Number(tPriceBid) * (1 - 0.05);
            }
    
            if (targetPriceBidMode === T_PRICE_BID_TEN) {
              customPriceBid = Number(tPriceBid) * (1 - 0.1);
            }
    
            if (targetPriceBidMode === T_PRICE_BID_ANY) {
              if (tPriceBidAnyPercent !== 0) {
                customPriceBid = Number(tPriceBid) * (1 - (Number(tPriceBidAnyPercent)/100));
              } else {
                customPriceBid = 0;
              }
            }
    
            customPriceBid = roundMe(customPriceBid, precision.pricePrecision);
            setTargetPriceBid(customPriceBid);
          }      
    
          // targetPriceAskMode
          if (!askInputChange) {
            const tPriceAsk = orderBook.asks[0][0];
            let customPriceAsk;
        
            if (targetPriceAskMode === T_PRICE_ASK) {     
              customPriceAsk = tPriceAsk;
            }
        
            if (targetPriceAskMode === T_PRICE_ASK_ONE) {
              customPriceAsk = Number(tPriceAsk) * (1 + 0.01);
            }
        
            if (targetPriceAskMode === T_PRICE_ASK_FIVE) {
              customPriceAsk = Number(tPriceAsk) * (1 + 0.05);
            }
        
            if (targetPriceAskMode === T_PRICE_ASK_TEN) {
              customPriceAsk = Number(tPriceAsk) * (1 + 0.1);
            }
    
            if (targetPriceAskMode === T_PRICE_ASK_ANY) {
              if (tPriceAskAnyPercent !== 0) {
                customPriceAsk = Number(tPriceAsk) * (1 + (Number(tPriceAskAnyPercent)/100));
              } else {
                customPriceAsk = 0;
              }
            }
            
            customPriceAsk = roundMe(customPriceAsk, precision.pricePrecision);
            setTargetPriceAsk(customPriceAsk);
          }
        }

        if (orderBook.asks.length === 0) {
          dispatch(handleErr({
            data: {
              status: 'Failed',
              message: 'There is no data for orderbook asks.'
            },
            name: 'trade-orderBook-error'
          }));
        } else {
          dispatch(closeErrName({ name: 'orderBook-ask' }));
        }

        if (orderBook.bids.length === 0) {
          dispatch(handleErr({
            data: {
              status: 'Failed',
              message: 'There is no data for orderbook bids.'
            },
            name: 'trade-orderBook-error'
          }));
        } else {
          dispatch(closeErrName({ name: 'orderBook-bid' }));
        }
        
        dispatch(closeErrName({ name: 'try-trade-orderbookEffect' }));
      } catch (err) {
        dispatch(handleErr({
          data: {
            status: 'Failed',
            message: err.message
          },
          name: 'try-trade-orderbookEffect'
        }));
      }      
    }
    
  }, [orderBook, precision, bidInputChange, askInputChange])
  
  const fetchOrderBook = async () => {
    try {
      const apiOrderBook = await getOrderBook(
        auth.selectExchange.exchange,
        symbol
      );
  
      if (apiOrderBook.data.status === "success") {
        setOrderBook(apiOrderBook.data.data);

        dispatch(closeErrName({ name: 'getOrderBook' }));
      } else {
        dispatch(handleErr({ data: apiOrderBook.data, name: 'getOrderBook' }));
      }
    } catch (err) {

    }    
  }

  const handleReplaceState = () => {
    setPurchaseMode(purchaseMode === BUY_MODE ? SELL_MODE : BUY_MODE);
  };

  const roundMe = (val, precision) => {
    const roundVal = Number(`${Math.round(`${val}e${precision}`)}e-${precision}`);
    return roundVal;
  };

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

      dispatch(closeErrName({ name: 'try-trade-precisionRound' }));

      return { pricePrecision, amountPrecision };
    } catch (err) {
      dispatch(handleErr({
        data: {
          status: 'Failed',
          message: err.message
        },
        name: 'try-trade-precisionRound'
      }));
    }    
  };

  const changePurchaseMode = (mode) => {
    setPurchaseMode(mode);

    setMessage({
      error: false,
      title: '',
      content: ''
    })
    setTradeResponseMessage(false);
  };

  const changeValue = (event) => {    
    try {
      const { name, value } = event.target;

      let precisionAmount;

      if (name === 'baseVal') {
        precisionAmount = precision.amountPrecision;
        const regex = new RegExp(`^[0-9]*(\.[0-9]{0,`+precisionAmount+`})?$`);
        
        if (regex.test(value)) {
          setBaseVal(value);
          setLastChangeVal(LAST_BASE_VAL);
        }
      } else {
        precisionAmount = 2;
        const regex = new RegExp(`^[0-9]*(\.[0-9]{0,`+precisionAmount+`})?$`);

        if (regex.test(value)) {
          setQuoteVal(value);
          setLastChangeVal(LAST_QUOTE_VAL);
        }
      }

      setTradeResponseMessage(false);

      dispatch(closeErrName({ name: 'try-trade-changeValue' }));
    } catch (err) {
      dispatch(
        handleErr({
            data: {
                status: "Failed",
                message: err.message
            },
            name: 'try-trade-changeValue'
        })
      );
    }
  };

  const executeTrade = async (evt) => {
    if ( quoteVal === '' || baseVal === '') {
      setMessage({
        error: true,
        title: 'Error',
        content: 'You did not input values. Please input values.'
      })
    } else if (!message.error || (message.error && message.content.includes('at this price'))) {
      try {
        evt.preventDefault();
        setLoading(true);
        setMessage({
          error: false,
          title: '',
          content: ''
        })
        setTradeResponseMessage(true);

        const orderData = {
          exchange: auth.selectExchange.exchange,
          tenantId: userInfo.tenantId,
          exchangeAccountId: auth.selectExchange.exchangeAccountId,
          action: purchaseMode,
          orderQty: baseVal,
          orderPrice: orderPrice,
          base: base,
          quote: quote,
          symbol: marketData.tradeSymbol,
          svcRate: env.TRANSFER_SVC_FEE,
          svcExchRate: env.TRANSFER_EXCHANGE_FEE,
          svcSpreadRate: spreadFee,
        };

        const result = await placeOrder(orderData);

        setLoading(false);

        if (result.data.status === "success") {
          setMessage({
            error: false,
            title: 'Trade Succeeded',
            content: result.data.message
          });

          setQuoteVal('');
          setBaseVal('');

          setMarketPrice(null);
        } else {
          setMessage({
            error: true,
            title: 'Trade Failed',
            content: result.data.message
          });
        }

        const orderUpdate = {
          tradeSymbol: marketData.tradeSymbol,
          state: !preferences.order.state,
          owned
        };
        dispatch(updateOrder(orderUpdate));

        dispatch(closeErrName({ name: 'try-trade-excuteTrade' }));
      } catch (err) {
        dispatch(handleErr({
          data: {
            status: 'Failed',
            message: err.message
          },
          name: 'try-trade-excuteTrade'
        }));
      } 
    }
  };

  const percentChange = (entity, percent) => {
    setLastChangeVal(entity);
    if (precision) {
      if (entity === LAST_BASE_VAL) {
        const newBaseVal = roundMe(baseBal * percent, precision.amountPrecision);
        setBaseVal(newBaseVal);
      } else if (entity === LAST_QUOTE_VAL){
        if (purchaseMode === BUY_MODE && tradingMode === MARKET_TRADING && percent === 1) {
          const updateQuoteVal = quoteBal - quoteBal * Math.abs(1 - slippage);
          const newQuoteVal = roundMe(updateQuoteVal, 2);
          setQuoteVal(newQuoteVal);
        } else {
          const newQuoteVal = roundMe(quoteBal * percent, 2);
          setQuoteVal(newQuoteVal);
        }
      }

      setTradeResponseMessage(false);
    }
  };

  const showVal = (type, value) => {    
    if (type === BASE) {
      const baseVal = roundMe(value, precision.amountPrecision);

      setBaseVal(baseVal);
    }

    if (type === QUOTE) {
      // we need to get the precision of the quote
      let quoteVal;

      if (quote === 'USD') {
        quoteVal = roundMe(value, 2);
      } else {
        // we need to change the precision of the quote
        quoteVal = roundMe(value, precision.amountPrecision);
      }
      
      setQuoteVal(quoteVal);
    }
  } 

  // trading mode functions - Bid
  const handleTPriceBidAnyKeyDown = (event) => {    
    if ([69, 187, 188, 187, 189].includes(event.keyCode)) {
        event.preventDefault();
    }
  }

  const handleTPriceBidAnyChange = (event) => {   
    const { value } = event.target; 
    
    if (Number(value) < 100) {
      setTPriceBidAnyPercent(value);
    }
  }

  const handleTPriceBidModeChange = (mode) => {
    setTargetPriceBidMode(mode);
    setBidInputChange(false);
    setTradeResponseMessage(false);
  }
  
  const handleTPriceBidKeyDown = (event) => {    
    if ([69, 187, 188, 187, 189].includes(event.keyCode)) {
        event.preventDefault();
    }
  }

  const handleTPriceBidChange = (event) => {   
    const { value } = event.target; 

    const pricePrecision = precision.pricePrecision;
    const regex = new RegExp(`^[0-9]*(\.[0-9]{0,`+pricePrecision+`})?$`);
    
    if (regex.test(value)) {
      setTargetPriceBid(value);
      setBidInputChange(true);
    } 
  }

  // trading mode function - Ask
  const handleTPriceAskAnyKeyDown = (event) => {    
    if ([69, 187, 188, 187, 189].includes(event.keyCode)) {
        event.preventDefault();
    }
  }
  
  const handleTPriceAskAnyChange = (event) => {   
    const { value } = event.target; 
    
    if (Number(value) < 100) {
      setPriceAskAnyPercent(value);
    }
  }

  const handleTPriceAskModeChange = (mode) => {
    setTargetPriceAskMode(mode);
    setAskInputChange(false);
    setTradeResponseMessage(false);
  }
  
  const handleTPriceAskKeyDown = (event) => {    
    if ([69, 187, 188, 187, 189].includes(event.keyCode)) {
        event.preventDefault();
    }
  }

  const handleTPriceAskChange = (event) => {   
    const { value } = event.target; 

    const pricePrecision = precision.pricePrecision;
    const regex = new RegExp(`^[0-9]*(\.[0-9]{0,`+pricePrecision+`})?$`);
    
    if (regex.test(value)) {
      setTargetPriceAsk(value);
      setAskInputChange(true);
    } 
  }

  const handleCalcUSD = (quoteQty, quoteCoin) => {
    if (quoteCoin === 'USD') {
      return quoteQty;
    } else {
      return 0;
    }
  }

  return (
    <>
      <div className="trading-section">
        <div className="trading-section--top">
          <div className="trade-buttons">
            <div style={{marginRight:'1px'}}>
              <button
                type="button"
                className={
                  purchaseMode === BUY_MODE
                    ? "buy-btn--selected trade-buttons--btn buy-btn "
                    : "trade-buttons--btn buy-btn"
                }
                onClick={() => changePurchaseMode(BUY_MODE)}
              >
                <span>Buy</span>
              </button>
            </div>
            <div>
              <button
                type="button"
                className={
                  purchaseMode === SELL_MODE
                    ? "sell-btn--selected trade-buttons--btn sell-btn "
                    : "trade-buttons--btn sell-btn"
                }
                onClick={() => changePurchaseMode(SELL_MODE)}
              >
                <span>Sell</span>
              </button>
            </div>
          </div>
          <div className="trade-mode">
            <div className="filter-list">
              <label htmlFor="market" className="market-mode">
                <input
                  type="radio"
                  className="filter"
                  id="market"
                  value="market"
                  readOnly
                  checked={tradingMode === MARKET_TRADING}
                  onChange={() => setTradingMode(MARKET_TRADING)}
                />
                <div 
                  className="filter" 
                  style={{
                    borderBottom: 
                      (purchaseMode === BUY_MODE && tradingMode === MARKET_TRADING) ? 
                        '3px solid #24b624':
                        (purchaseMode === SELL_MODE && tradingMode === MARKET_TRADING) ?
                          '3px solid #e22e2e':'0px',
                    color:  (purchaseMode === BUY_MODE && tradingMode === MARKET_TRADING) ? 
                              '3px solid #24b624':
                              (purchaseMode === SELL_MODE && tradingMode === MARKET_TRADING) ?
                                '3px solid #e22e2e':'0px'
                  }}
                >
                  Instant Order (Market)
                </div>
              </label>
              <label htmlFor="limit" className="limit-mode">
                <input
                  type="radio"
                  className="filter"
                  id="limit"
                  value="limit"
                  readOnly
                  checked={tradingMode === LIMIT_TRADING}
                  onChange={() => setTradingMode(LIMIT_TRADING)}
                />
                <div 
                  className="filter"
                  style={{
                    borderBottom: 
                      (purchaseMode === BUY_MODE && tradingMode === LIMIT_TRADING) ? 
                        '3px solid #24b624':
                        (purchaseMode === SELL_MODE && tradingMode === LIMIT_TRADING) ?
                          '3px solid #e22e2e':'0px',
                    color: (purchaseMode === BUY_MODE && tradingMode === LIMIT_TRADING) ? 
                            '3px solid #24b624':
                            (purchaseMode === SELL_MODE && tradingMode === LIMIT_TRADING) ?
                              '3px solid #e22e2e':'0px'
                  }}
                >
                  Target Price (Limit)
                </div>
              </label>
            </div>
          </div>
        </div>
        <div
          className={
            purchaseMode === BUY_MODE
              ? "trading-section-buy"
              : "trading-section-sell"
          }
        >
          <div className="buy-sell--share">
            <div className="left">
              <div className="crypto">
                <div className="crypto-line">
                  <div className="crypto-line--icon">
                    <Icon name={String(quote).toLowerCase()} size={25} />
                  </div>
                  <div className="crypto-line--name">
                    <span>{quote}</span>
                  </div>
                </div>
                <div
                  className="percent"
                  style={{ display: purchaseMode === SELL_MODE ? "none" : "block" }}
                >
                  <button
                    type="button"
                    onClick={() => percentChange(LAST_QUOTE_VAL, 0.25)}
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => percentChange(LAST_QUOTE_VAL, 0.5)}
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => percentChange(LAST_QUOTE_VAL, 0.75)}
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => percentChange(LAST_QUOTE_VAL, 1)}
                  >
                    100%
                  </button>
                </div>
              </div>
              <div className="main-value">
                <div className="main">
                  <input
                    autoComplete='off'
                    autoCorrect='off'
                    type='number'
                    placeholder={ purchaseMode === SELL_MODE ? 'Amt you Get':'Amt to Spend'}
                    name='quoteVal'
                    value={(quoteVal === 0 && baseVal === 0) ? '':quoteVal}
                    onChange={(event)=>changeValue(event)}
                    className='main-input'
                    onKeyDown={(event)=>{
                      if (event.key==='+' || event.key === '-' || event.key === 'e' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                        event.preventDefault();
                        return false;
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="right">
              <div className="balance">
                <div className="balance__title">
                  <span>
                    {
                      purchaseMode === SELL_MODE ? 'Balance':'Available'
                    }
                  </span>
                </div>
                <div className="balance__value">
                  <span>{Number(quoteBal).toFixed(2)}</span>
                </div>
              </div>
              {
                tradingMode === LIMIT_TRADING ?
                  purchaseMode === SELL_MODE ?
                    <div className="balance-summary">
                      <div className="balance-summary__title">
                        <div>
                          <span>Subtotal:</span>
                        </div>
                        <div>
                          <span>Fee:</span>
                        </div>
                        <div>
                          <span>Total:</span>
                        </div>
                      </div>
                      <div className="balance-summary__values">
                        <div>
                          <span>{USDollar.format(subTotal)}</span>
                        </div>
                        <div>
                          <span>{USDollar.format(fee)}</span>
                        </div>
                        <div>
                          <span>{USDollar.format(total)}</span>
                        </div>
                      </div>
                    </div>
                    :
                    <div className="limit-trading">
                      <div className="limit-trading__target-price">
                        <div className="price-title">
                          <span>Target Price</span>
                        </div>
                        <div className="price-value">
                          <input
                            type="number"
                            value={targetPriceBid}
                            onKeyDown={(event) => handleTPriceBidKeyDown(event)}
                            onChange={(event) => handleTPriceBidChange(event)}
                          />
                        </div>
                      </div>
                      <div className="filter-list limit-trading__buttons">
                        <label htmlFor="bid" className="bid-mode">
                          <input
                            type="radio"
                            className="filter"
                            id="bid"
                            readOnly
                            checked={targetPriceBidMode === T_PRICE_BID}
                            onClick={() => { handleTPriceBidModeChange(T_PRICE_BID) }}
                          />
                          <div className="filter">BID</div>
                        </label>
                        <label htmlFor="one-p" className="one-p-mode">
                          <input
                            type="radio"
                            className="filter"
                            id="one-p"
                            readOnly
                            checked={targetPriceBidMode === T_PRICE_BID_ONE}
                            onClick={() => handleTPriceBidModeChange(T_PRICE_BID_ONE)}
                          />
                          <div className="filter">1% &#8595;</div>
                        </label>
                        <label htmlFor="five-p" className="five-p-mode">
                          <input
                            type="radio"
                            className="filter"
                            id="five-p"
                            readOnly
                            checked={targetPriceBidMode === T_PRICE_BID_FIVE}
                            onClick={() => handleTPriceBidModeChange(T_PRICE_BID_FIVE)}
                          />
                          <div className="filter">5% &#8595;</div>
                        </label>
                        <label htmlFor="ten-p" className="ten-p-mode">
                          <input
                            type="radio"
                            className="filter"
                            id="ten-p"
                            readOnly
                            checked={targetPriceBidMode === T_PRICE_BID_TEN}
                            onClick={() => handleTPriceBidModeChange(T_PRICE_BID_TEN)}
                          />
                          <div className="filter">10% &#8595;</div>
                        </label>
                        <label htmlFor="any-p" className="any-p-mode">
                          <input
                            type="radio"
                            className="filter"
                            id="any-p"
                            readOnly
                            checked={targetPriceBidMode === T_PRICE_BID_ANY}
                            onClick={() => handleTPriceBidModeChange(T_PRICE_BID_ANY)}
                          />
                          {
                            targetPriceBidMode === T_PRICE_BID_ANY ?
                              <label htmlFor="target-price-any" className="target-price-any">
                                <input 
                                  type="number"
                                  style={{textAlign:'center', background:'white', color:'#444', opacity:'0.7'}}
                                  id="target-price-any"
                                  maxLength={2}
                                  autoFocus={true} 
                                  value={tPriceBidAnyPercent}
                                  onKeyDown={(event) => handleTPriceBidAnyKeyDown(event)}
                                  onChange={(event) => handleTPriceBidAnyChange(event)}
                                />
                                <span>%</span>
                              </label>
                              :
                              <div className="filter">{tPriceBidAnyPercent === 0? `_%`:`${tPriceBidAnyPercent}%`}</div>
                          }
                        </label>
                      </div>
                    </div>
                  :
                  purchaseMode === SELL_MODE ?
                  <div className="balance-summary">
                    <div className="balance-summary__title">
                      <div>
                        <span>Subtotal:</span>
                      </div>
                      <div>
                        <span>Fee:</span>
                      </div>
                      <div>
                        <span>Total:</span>
                      </div>
                    </div>
                    <div className="balance-summary__values">
                      <div>
                        <span>{USDollar.format(subTotal)}</span>
                      </div>
                      <div>
                        <span>{USDollar.format(fee)}</span>
                      </div>
                      <div>
                        <span>{USDollar.format(total)}</span>
                      </div>
                    </div>
                  </div>
                  :
                  <div className="market-trading">
                    <div className="market-trading__title">
                      <span>Estimated Market Price</span>
                    </div>
                    <div className="market-trading__value">
                      <span>{marketPrice?marketPrice:'__'}</span>
                    </div>
                  </div>
              }
            </div>
          </div>
          <div className="change-icon">
            <button type="button" onClick={handleReplaceState}>
              <BsArrowDownShort />
            </button>
          </div>
          <div className="buy-sell--share">
            <div className="left">
              <div className="crypto">
                <div className="crypto-line">
                  <div className="crypto-line--icon">
                    <Icon name={String(base).toLowerCase()} size={25} />
                  </div>
                  <div className="crypto-line--name">
                    <span>{base}</span>
                  </div>
                </div>
                <div
                  className="percent"
                  style={{ display: purchaseMode === SELL_MODE ? "block" : "none" }}
                >
                  <button
                    type="button"
                    onClick={() => percentChange(LAST_BASE_VAL, 0.25)}
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => percentChange(LAST_BASE_VAL, 0.5)}
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => percentChange(LAST_BASE_VAL, 0.75)}
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => percentChange(LAST_BASE_VAL, 1)}
                  >
                    100%
                  </button>
                </div>
              </div>
              <div className="main-value">
                <div className="main">
                  <input
                    type='number'
                    autoComplete='off'
                    autoCorrect='off'
                    placeholder={ purchaseMode === SELL_MODE ? 'Amt you Sell':'Amt you Get'}
                    name='baseVal'
                    value={(quoteVal === 0 && baseVal === 0) ? '':baseVal}
                    className='main-input'
                    onChange={(event)=>changeValue(event)}
                    onKeyDown={(event)=>{
                      if (event.key==='+' || event.key === '-' || event.key === 'e' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                        event.preventDefault();
                        return false;
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="right">
              <div className="balance">
                <div className="balance__title">
                    {
                      purchaseMode === SELL_MODE ? 'Available':'Balance'
                    }
                </div>
                <div className="balance__value">
                  {
                    precision && roundMe(baseBal, precision.amountPrecision)
                  }
                </div>            
              </div>
              {
                tradingMode === LIMIT_TRADING ?
                  purchaseMode === SELL_MODE ?
                    <div className="limit-trading">
                      <div className="limit-trading__target-price">
                        <div className="price-title">
                          <span>Target Price</span>
                        </div>
                        <div className="price-value">
                          <input
                            type="number"
                            value={targetPriceAsk}
                            onKeyDown={(event) => handleTPriceAskKeyDown(event)}
                            onChange={(event) => handleTPriceAskChange(event)}
                          />
                        </div>
                      </div>
                      <div className="filter-list limit-trading__buttons">
                        <label htmlFor="ask" className="ask-mode">
                          <input
                            type="radio"
                            className="filter"
                            id="ask"
                            readOnly
                            checked={targetPriceAskMode === T_PRICE_ASK}
                            onClick={() => handleTPriceAskModeChange(T_PRICE_ASK)}
                          />
                          <div className="filter">ASK</div>
                        </label>
                        <label htmlFor="one-p" className="one-p-mode">
                          <input
                            type="radio"
                            className="filter"
                            id="one-p"
                            readOnly
                            checked={targetPriceAskMode === T_PRICE_ASK_ONE}
                            onClick={() => handleTPriceAskModeChange(T_PRICE_ASK_ONE)}
                          />
                          <div className="filter">1% &#8593;</div>
                        </label>
                        <label htmlFor="five-p" className="five-p-mode">
                          <input
                            type="radio"
                            className="filter"
                            id="five-p"
                            readOnly
                            checked={targetPriceAskMode === T_PRICE_ASK_FIVE}
                            onClick={() => handleTPriceAskModeChange(T_PRICE_ASK_FIVE)}
                          />
                          <div className="filter">5% &#8593;</div>
                        </label>
                        <label htmlFor="ten-p" className="ten-p-mode">
                          <input
                            type="radio"
                            className="filter"
                            id="ten-p"
                            readOnly
                            checked={targetPriceAskMode === T_PRICE_ASK_TEN}
                            onClick={() => handleTPriceAskModeChange(T_PRICE_ASK_TEN)}
                          />
                          <div className="filter">10% &#8593;</div>
                        </label>
                        <label htmlFor="any-p" className="any-p-mode">
                          <input
                            type="radio"
                            className="filter"
                            id="any-p"
                            readOnly
                            checked={targetPriceAskMode === T_PRICE_ASK_ANY}
                            onClick={() => handleTPriceAskModeChange(T_PRICE_ASK_ANY)}
                          />
                          {
                            targetPriceAskMode === T_PRICE_ASK_ANY ?
                              <label className="target-price-any">
                                <input 
                                  type="number"
                                  style={{textAlign:'center', background:'white', color:'#444', opacity:'0.7'}}
                                  maxLength={2}
                                  autoFocus={true} 
                                  value={tPriceAskAnyPercent}
                                  onKeyDown={(event) => handleTPriceAskAnyKeyDown(event)}
                                  onChange={(event) => handleTPriceAskAnyChange(event)}
                                />
                                <span>%</span>
                              </label>
                              :
                              <div className="filter">{tPriceAskAnyPercent === 0 ? `_%`:`${tPriceAskAnyPercent}%`}</div>
                          }
                        </label>
                      </div>
                    </div>
                    :
                    <div className="balance-summary">
                      <div className="balance-summary__title">
                        <div>
                          <span>Subtotal:</span>
                        </div>
                        <div>
                          <span>Fee:</span>
                        </div>
                        <div>
                          <span>Total:</span>
                        </div>
                      </div>
                      <div className="balance-summary__values">
                        <div>
                          <span>{USDollar.format(subTotal)}</span>
                        </div>
                        <div>
                          <span>{USDollar.format(fee)}</span>
                        </div>
                        <div>
                          <span>{USDollar.format(total)}</span>
                        </div>
                      </div>
                    </div>
                  :
                  purchaseMode === SELL_MODE ?
                    <div className="market-trading">
                      <div className="market-trading__title">
                        <span>Estimated Market Price</span>
                      </div>
                      <div className="market-trading__value">
                        <span>{marketPrice ? marketPrice:'__'}</span>
                      </div>
                    </div>
                    :
                    <div className="balance-summary">
                      <div className="balance-summary__title">
                        <div>
                          <span>Subtotal:</span>
                        </div>
                        <div>
                          <span>Fee:</span>
                        </div>
                        <div>
                          <span>Total:</span>
                        </div>
                      </div>
                      <div className="balance-summary__values">
                        <div>
                          <span>{USDollar.format(subTotal)}</span>
                        </div>
                        <div>
                          <span>{USDollar.format(fee)}</span>
                        </div>
                        <div>
                          <span>{USDollar.format(total)}</span>
                        </div>
                      </div>
                    </div>                  
              }
            </div>
          </div>
        </div>
        <div className="trading-section--bottom">
          <button
            type="button"
            className={
              auth.adminPermissions
                ? auth.adminPermissions.find((item) => item === P_ACCOUNT_TRADE)
                  ? (message.error && !message.content.includes('at this price')) ? 'disable-btn':purchaseMode === BUY_MODE?'buy-place-btn':'sell-place-btn'
                  : 'disable-btn'
                : auth.userInfo.permissions.find((item) => item === P_ACCOUNT_TRADE)
                  ? (message.error && !message.content.includes('at this price'))? 'disable-btn':purchaseMode === BUY_MODE?'buy-place-btn':'sell-place-btn'
                  : 'disable-btn'
            }
            disabled={
              auth.adminPermissions
                ? auth.adminPermissions.find((item) => item === P_ACCOUNT_TRADE)
                  ? (message.error && !message.content.includes('at this price')) ? true:loading?true:false
                  : true
                : auth.userInfo.permissions.find((item) => item === P_ACCOUNT_TRADE)
                  ? (message.error && !message.content.includes('at this price')) ? true:loading?true:false
                  : true
            }
            onClick={(e)=>executeTrade(e)}
          >
            {
              loading
                ? "Please wait..."
                  : purchaseMode === BUY_MODE ?
                    baseVal ? `Buy ${baseVal} ${String(base)}`:'Buy'
                    : baseVal ? `Sell ${baseVal} ${String(base)}`:'Sell'
            }
          </button>
          <div className="message">
            <div className="message-price-loading">
              <span>
                {newPriceLoading.message} {newPriceLoading.time}
              </span>
            </div>
            <div className="message-main">
              <span
                style={{
                  color: message.error ? 'red':'white',
                }}
              >
                {message.title}
              </span>
            </div>
            <div className="message-detail">
              <span
                style={{
                  color: message.error ? 'red':'white',
                }}
              >
                {message.content}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Trade;
