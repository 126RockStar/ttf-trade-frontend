import { linkLookup } from "data/link-lookup";
import Loading from "pages/Loading/Loading";
import React, { useEffect, useState } from "react";
import {
  BsFillArrowDownCircleFill,
  BsFillArrowUpCircleFill,
} from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { getPriceLists } from "services/candles-service";
import { changeFavorites } from "services/user-service";
import {
  updateExchange,
  updateUser
} from "store/modules/auth/actions";
import {
  handleErr,
  closeErrName
} from "store/modules/error/actions";
import { updateOrder } from "store/modules/preferences/actions";
import { checkNegative } from "utils/homeTable";
import { roundMe } from "utils/roundMe";
import CryptoInfo from "./components/CryptoInfo";
import CryptoInfoNoCandles from "./components/CryptoInfoNoCandles";
import OpenOrders from "./components/OpenOrders";
import "./styles/Home.scss";

const Home = () => {

  const dispatch = useDispatch();
  const preferences = useSelector((state) => state.preferences);
  const auth = useSelector((state) => state.auth);
  const userInfo = useSelector((state) => state.auth.userInfo);
  const trades = useSelector((state) => state.auth.trades);
  const balances = useSelector((state) => state.auth.balances);

  const [cryptoOwned, setCryptoOwned] = useState([]);
  const [allCrypto, setAllCrypto] = useState([]);
  const [accountInfo, setAccountInfo] = useState({
    usdBal: {free: 0},
    totalValue: 0,
    costBasis: 0,
    profitLoss: 0,
  });
  const [allCryptoFilter, setAllCryptoFilter] = useState("all");
  const [allCryptoFilteredArr, setAllCryptoFilteredArr] = useState([]);

  // cryptoNoCandles
  const [cryptoNoCandles, setCryptoNoCandles] = useState(null);

  // direction -1 is descending, 1 is ascending
  const [sortOwned, setSortOwned] = useState({
    column: "",
    direction: -1,
  });
  const [sortUnowned, setSortUnowned] = useState({
    column: "",
    direction: -1,
  });
  const [loading, setLoading] = useState(true);

  const changeOwnExpanded = (crypto) => {
    try {  
      const newOwnCrypto = cryptoOwned.map((coin) => {
        return {
          ...coin,
          expanded:
            coin.tradeSymbol === crypto.tradeSymbol ? !coin.expanded : false,
        };
      });

      const cryptoItem = cryptoOwned.find(item=>item.tradeSymbol === crypto.tradeSymbol);
      
      const orderUpdate = {
        tradeSymbol: cryptoItem.expanded ? null:crypto.tradeSymbol,
        state: false,
        owned: true
      };
      dispatch(updateOrder(orderUpdate));

      setCryptoOwned(newOwnCrypto);

      dispatch(closeErrName({ name: 'home-changeOwnExpanded' }));
    } catch (err) {
      dispatch(handleErr({
        data: {
          status: 'Failed',
          message: err.message
        },
        name: 'home-changeOwnExpanded'
      }));
    }    
  };

  const changeAllExpanded = (crypto) => {
    try {
      const newAllCrypto = allCrypto.map((coin) => {
        return {
          ...coin,
          expanded:
            coin.tradeSymbol === crypto.tradeSymbol ? !coin.expanded : false,
        };
      });

      const cryptoItem = allCrypto.find(item=>item.tradeSymbol === crypto.tradeSymbol);
      
      const orderUpdate = {
        tradeSymbol: cryptoItem.expanded ? null:crypto.tradeSymbol,
        state: false,
        owned: true
      };
      dispatch(updateOrder(orderUpdate));

      setAllCrypto(newAllCrypto); 
      
      dispatch(closeErrName({ name: 'home-changeAllExpanded' }));
    } catch (err) {
      dispatch(handleErr({
        data: {
          status: 'Failed',
          message: err.message
        },
        name: 'home-changeAllExpanded'
      }));
    }   
  };

  useEffect(() => {
    setLoading(true);

    setCryptoOwned([]);
    setAccountInfo({
      usdBal: {free: 0},
      totalValue: 0,
      costBasis: 0,
      profitLoss: 0,
    });
    setAllCryptoFilter('all');
    setAllCryptoFilteredArr([]);

  }, [auth.changeAccount])

  useEffect(() => {
    if (auth.selectExchange && userInfo) {
      const fetchData = async () => {
        const res = await getPriceLists({
          exchange: auth.selectExchange.exchange,
          tenantId: userInfo?.tenantId,
          //ID_TODO: these shouldn't be needed
          //clientAccountId: userInfo?.clientAccountId,
          timeFrames: [
            { timeFrame: "1D" },
            { timeFrame: "1W" },
            { timeFrame: "1M" },
            { timeFrame: "3M" },
            { timeFrame: "1Y" },
          ],
        });

        if (res.data.status === "success") {
          dispatch(closeErrName({ name: 'home-getPriceLists' }));
          try {
            let findBal = balances?.find((bal) => bal?.asset === "USD");
            let accountStats = {
              usdBal: findBal ? findBal : {free: 0.00},
              totalValue: 0,
              costBasis: 0,
              profitLoss: 0,
            };
            let owned = await res.data.data.filter((crypto) => {
              return balances.find((bal) => bal.asset === crypto.base);
            });
  
            await owned.forEach((crypto) => {
              // crypto.balance = balances.find(bal => bal.asset === crypto.base)
              // crypto.value = crypto.balance?.free * crypto.last
              // let asset = userInfo.balances.find(asset => asset.asset === crypto.base)
              // crypto.pl = {
              //   percent: (((crypto.last / asset?.cost) - 1) * 100),
              //   number: (crypto.last - asset?.cost)
              // }
              // accountStats.totalValue += crypto.value
              // crypto.expanded = false
              crypto.priceList = res.data.data.find(
                (entry) => entry.symbol === crypto.tradeSymbol
              );
              crypto.links = linkLookup.find(
                (entry) => entry.coin === crypto.base
              );
            });
            accountStats.totalValue += Number(accountStats.usdBal?.free);
            // setCryptoOwned(owned)
            let allCoins = res.data.data;
            await allCoins.forEach((crypto) => {
              // crypto.expanded = false
              // crypto.priceList = res.find(entry => entry.symbol === crypto.tradeSymbol)
              crypto.links = linkLookup.find(
                (entry) => entry.coin === crypto.base
              );
            });
  
            setAllCrypto(allCoins);
            setAllCryptoFilteredArr(allCoins);
            setAccountInfo(accountStats);

            dispatch(closeErrName({ name: 'try-home-getPriceLists' }));
          } catch (err) {
            dispatch(handleErr({
              data: {
                status: 'Failed',
                message: err.message
              },
              name: 'try-home-getPriceLists'
            }));
          }          
        } else {
          if (res.data.message === "Network Error") {
            let findBal = balances?.find((bal) => bal?.asset === "USD");
            let accountStats = {
              usdBal: findBal ? findBal : 0.00,
              totalValue: 0,
              costBasis: 0,
              profitLoss: 0,
            };

            accountStats.totalValue += Number(accountStats.usdBal?.free);

            let pl2 = {
              number: 0,
              percent: 0,
            };

            const noCandles = balances.map(item=>{
              const value = Number(item.free) * 0; // balance && Number(balance.free) * Number(crypto.currentPrice)
              
              let pl2 = {
                number: 0,
                percent: 0,
              };

              return {  
                ...item,
                base: item.asset,
                balance: {
                  free: item.free
                },
                item,
                value,
                pl: {
                  percent: 0,
                  number: 0
                },
                pl2,
                links: linkLookup.find((entry) => entry.coin === crypto.base),
                expanded: false,
              }
            })

            setCryptoNoCandles(noCandles);
            setAccountInfo(accountStats);

            dispatch(handleErr({
              data: {
                status: 'Failed',
                message: 'Sorry, we are having problems with prices, Prices may be Zero for several minutes.'
              },
              name: 'home-getPriceLists'
            }));
          } else {
            dispatch(handleErr({ data: res.data, name: 'home-getPriceLists' }));
          }
        }
      };
      fetchData();      

      const interval = setInterval(() => {
        fetchData();
      }, 60000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [userInfo, auth.selectExchange.exchange]);

  useEffect(() => {
    resetBalData();
  }, [trades, balances, allCrypto]);  // trades, balances, allCrypto

  const resetBalData = async () => {
    try {
      const cryptoItems = [...allCrypto];
      let findBal = balances?.find((bal) => bal?.asset === "USD");
      let accountStats = {
        usdBal: findBal ? findBal : {free: 0.00},
        totalValue: 0,
        costBasis: 0,
        profitLoss: 0,
      };

      const owned = cryptoItems.filter((crypto) => {
        return balances.find((bal) => bal.asset === crypto.base);
      });

      const newOwned = owned.map((crypto) => {
        // let asset = userInfo.balances.find(
        //   (asset) => asset.asset === crypto.base
        // );
        
        const balance = balances.find((bal) => bal.asset === crypto.base);
        const value =
          balance && Number(balance.free) * Number(crypto.currentPrice);
        accountStats.totalValue += value;
        let pl2 = {
          number: 0,
          percent: 0,
        };
        let costBasis = 0;
        // we are only running the cost calculation on currencies that we own.
        // find all trades that match crypto.tradeSymbol and do cost
        const filterTrade =
          trades &&
          trades.filter((trade) => {
            return crypto.tradeSymbol.includes(trade.symbol);
          });
        //TODO: seems like most the work is done by the same calc but lower - consider if we can avoid running the same calculation twice for efficiency?
        filterTrade.forEach((trade) => {
          if (trade.type === "tradeOrder") {
            let orderCost = 0;
            if(trade.status === "closed" || trade.status === "canceled"){
              orderCost = trade.typeInstance.average * trade.amount;
            } else if (trade.status === "open" || trade.status === "pending") {
              orderCost = trade.typeInstance.price * trade.amount;
            }
            //fees should already be the predicted fees at this point
            if(trade.typeInstance.side === "buy"){
              costBasis += orderCost;
            } else if (trade.typeInstance.side === "sell") {
              costBasis -= orderCost;
            }
            costBasis += trade.fee?.svcCost || 0;
          } else if(trade.type === "transfer" ) {
            //TODO: are pending transfers a thing, what do they look like?
            if(trade.symbol!=='USD' && trade.typeInstance.direction === 'in'){//USD should not be accounted for in Total Cost
              costBasis += trade.amount * trade.typeInstance.value;
            } else if( trade.symbol!=='USD' && trade.typeInstance.direction === 'out'){
              costBasis -= trade.amount * trade.typeInstance.value;
            }
            costBasis += trade.fee?.svcCost || 0;
          }
        });
        pl2.number = (value - costBasis);
        pl2.percent = roundMe((pl2.number / costBasis) * 100, 2);
        pl2.number = roundMe((value - costBasis), 2);
        costBasis = roundMe(costBasis, 2);
        const newCryptox = {
          ...crypto,
          balance,
          value,
          // pl: {
          //   percent:
          //     (crypto.currentPrice / asset && Number(asset.cost) - 1) * 100,
          //   number: crypto.currentPrice - asset && Number(asset.cost),
          // },
          pl2,
          links: linkLookup.find((entry) => entry.coin === crypto.base),
          expanded: crypto.tradeSymbol === preferences.order.tradeSymbol && preferences.order.owned ? true : false,
        };

        return newCryptox;
      });

      accountStats.totalValue += Number(accountStats.usdBal?.free);
      await trades.forEach((trade) => {
        if (trade.type === "tradeOrder") {
            let orderCost = 0;
            if(trade.status === "closed" || trade.status === "canceled"){
              // orderCost = trade.typeInstance.average * trade.amount;
              orderCost = trade.typeInstance.average * trade.typeInstance.filled;
              accountStats.costBasis += trade.fee?.svcCost || 0;
            } else if (trade.status === "open" || trade.status === "pending") {
              // orderCost = trade.typeInstance.price * trade.amount;
              orderCost = trade.typeInstance.price * trade.typeInstance.filled;
            }
            //fees should already be the predicted fees at this point
            if(trade.typeInstance.side === "buy"){
              accountStats.costBasis += orderCost;
            } else if (trade.typeInstance.side === "sell") {
              accountStats.costBasis -= orderCost;
            }
            // accountStats.costBasis += trade.fee?.svcCost || 0;
          } else if(trade.type === "transfer" ) {
            if(trade.symbol!=='USD' && trade.typeInstance.direction === 'in'){//USD should not be accounted for in Total Cost
              accountStats.costBasis += trade.amount * trade.typeInstance.value;
            } else if( trade.symbol!=='USD' && trade.typeInstance.direction === 'out'){
              accountStats.costBasis -= trade.amount * trade.typeInstance.value;
            }
            accountStats.costBasis += trade.fee?.svcCost || 0;
          }
      });
      accountStats.profitLoss =
        accountStats.totalValue -
        accountStats.costBasis -
        accountStats?.usdBal?.free;
      accountStats.profitLossPercent = (accountStats.profitLoss / accountStats.costBasis) * 100
      accountStats.profitLoss = roundMe(accountStats.profitLoss, 2);
      accountStats.costBasis = roundMe(accountStats.costBasis, 2);
      setCryptoOwned(newOwned); 
      setAccountInfo(accountStats);
      // Todo loading needs better rendering logic
      setTimeout(() => {
        setLoading(false);
      }, 500);

      dispatch(closeErrName({ name: 'home-resetBalData' }));
    } catch (err) {
      dispatch(handleErr({
        data: {
          status: 'Failed',
          message: err.message
        },
        name: 'home-resetBalData'
      }));
    }    
  };  

  const sortOwnedCoins = (column) => {
    try {
      if (column === sortOwned.column) {
        cryptoOwned.reverse();
        setSortOwned({
          column: column,
          direction: sortOwned.direction * -1,
        });
      } else {
        if (column === "Symbol") {
          cryptoOwned.sort((first, second) =>
            first.base.localeCompare(second.base)
          );
        } else if (column === "Balance") {
          cryptoOwned.sort(
            (first, second) =>
              parseFloat(first.balance.free) - parseFloat(second.balance.free)
          );
        } else if (column === "Value") {
          cryptoOwned.sort((first, second) => first.value - second.value);
        } else if (column === "Price") {
          cryptoOwned.sort(
            (first, second) => first.currentPrice - second.currentPrice
          );
        } else if (column === "PL") {
          cryptoOwned.sort(
            (first, second) => first.pl2.percent - second.pl2.percent
          );
        }
        setSortOwned({
          column: column,
          direction: -1,
        });
      }

      dispatch(closeErrName({ name: 'try-home-sortOwned' }));
    } catch (err) {
      dispatch(handleErr({
        data: {
          status: 'Failed',
          message: err.message
        },
        name: 'try-home-sortOwned'
      }));
    }
  };

  const sortUnownedCoins = (column) => {
    try {
      if (column === sortUnowned.column) {
        allCryptoFilteredArr.reverse();
        setSortUnowned({
          column: column,
          direction: sortUnowned.direction * -1,
        });
      } else {
        if (column === "Symbol") {
          allCryptoFilteredArr.sort((first, second) =>
            first.base.localeCompare(second.base)
          );
        } else if (column === "Price") {
          allCryptoFilteredArr.sort(
            (first, second) => first.currentPrice - second.currentPrice
          );
        } else if (column === "24H") {
          allCryptoFilteredArr.sort((first, second) => {
            let first24hObj;
            let second24hObj;
  
            if (Array.isArray(first.timeFrames)) {
              first24hObj = first.timeFrames.find(
                (item) => item.timeFrame === "1D"
              );
            } else {
              first24hObj = {
                profitLossPct: 0,
              };
            }
  
            if (Array.isArray(second.timeFrames)) {
              second24hObj = second.timeFrames.find(
                (item) => item.timeFrame === "1D"
              );
            } else {
              second24hObj = {
                profitLossPct: 0,
              };
            }
  
            return first24hObj.profitLossPct - second24hObj.profitLossPct;
          });
        } else if (column === "1W") {
          allCryptoFilteredArr.sort((first, second) => {
            let first24hObj;
            let second24hObj;
  
            if (Array.isArray(first.timeFrames)) {
              first24hObj = first.timeFrames.find(
                (item) => item.timeFrame === column
              );
            } else {
              first24hObj = {
                profitLossPct: 0,
              };
            }
  
            if (Array.isArray(second.timeFrames)) {
              second24hObj = second.timeFrames.find(
                (item) => item.timeFrame === column
              );
            } else {
              second24hObj = {
                profitLossPct: 0,
              };
            }
  
            return first24hObj.profitLossPct - second24hObj.profitLossPct;
          });
        } else if (column === "1M") {
          allCryptoFilteredArr.sort((first, second) => {
            let first24hObj;
            let second24hObj;
  
            if (Array.isArray(first.timeFrames)) {
              first24hObj = first.timeFrames.find(
                (item) => item.timeFrame === column
              );
            } else {
              first24hObj = {
                profitLossPct: 0,
              };
            }
  
            if (Array.isArray(second.timeFrames)) {
              second24hObj = second.timeFrames.find(
                (item) => item.timeFrame === column
              );
            } else {
              second24hObj = {
                profitLossPct: 0,
              };
            }
  
            return first24hObj.profitLossPct - second24hObj.profitLossPct;
          });
        } else if (column === "3M") {
          allCryptoFilteredArr.sort((first, second) => {
            let first24hObj;
            let second24hObj;
  
            if (Array.isArray(first.timeFrames)) {
              first24hObj = first.timeFrames.find(
                (item) => item.timeFrame === column
              );
            } else {
              first24hObj = {
                profitLossPct: 0,
              };
            }
  
            if (Array.isArray(second.timeFrames)) {
              second24hObj = second.timeFrames.find(
                (item) => item.timeFrame === column
              );
            } else {
              second24hObj = {
                profitLossPct: 0,
              };
            }
  
            return first24hObj.profitLossPct - second24hObj.profitLossPct;
          });
        } else if (column === "1Y") {
          allCryptoFilteredArr.sort((first, second) => {
            let first24hObj;
            let second24hObj;
  
            if (Array.isArray(first.timeFrames)) {
              first24hObj = first.timeFrames.find(
                (item) => item.timeFrame === column
              );
            } else {
              first24hObj = {
                profitLossPct: 0,
              };
            }
  
            if (Array.isArray(second.timeFrames)) {
              second24hObj = second.timeFrames.find(
                (item) => item.timeFrame === column
              );
            } else {
              second24hObj = {
                profitLossPct: 0,
              };
            }
  
            return first24hObj.profitLossPct - second24hObj.profitLossPct;
          });
        }
        setSortUnowned({
          column: column,
          direction: -1,
        });
      }

      dispatch(closeErrName({ name: 'try-home-sortUnowned' }));
    } catch (err) {
      dispatch(handleErr({
        data: {
          status: 'Failed',
          message: err.message
        },
        name: 'try-home-sortUnowned'
      }));
    }
  };

  useEffect(() => {
    try {
      let temp = [...allCrypto];
      let filter;
      switch (allCryptoFilter) {
        case "held":
          filter = temp.filter((crypto) => {
            return balances.find((bal) => bal.asset === crypto.base);
          });
          setAllCryptoFilteredArr(filter);
          break;
        case "watch":
          filter = temp.filter((crypto) => {
            return auth.selectExchange?.favorites?.indexOf(crypto?.base) !== -1;
          });
          setAllCryptoFilteredArr(filter);
          break;
        default:
          setAllCryptoFilteredArr(allCrypto);
          break;
      }

      dispatch(closeErrName({ name: 'try-home-effect-1' }));
    } catch (err) {
      dispatch(handleErr({
        data: {
          status: 'Failed',
          message: err.message
        },
        name: 'try-home-effect-1'
      }));
    }    
  }, [auth.selectExchange?.favorites, balances, allCrypto, allCryptoFilter]);

  const changeFilter = (filter) => {
    setAllCryptoFilter(filter);
  };

  const updateFavorites = async (favorites) => {
    const res = await changeFavorites(favorites, auth.selectExchange?.exchangeAccountId, auth.selectExchange?.exchange);
    if (res.data.status === "success") {
      dispatch(updateUser(res.data.data.updatedUser));
      let tmp = res.data.data.updatedUser.exchangeIds.find(id => id.exchange == auth.selectExchange.exchange);
      dispatch(updateExchange(tmp));

      dispatch(closeErrName({ name: 'home-updateFavorites' }));
    } else {
      dispatch(handleErr({ data: res.data, name: 'home-updateFavorites' }));
    }
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="home-header">
            <div className="totalValue header-sec">
              <div>
                <p className="header-text">Total Value</p>
              </div>
              <div>
                <p className="header-text">
                  $
                  {Number(Number(accountInfo?.totalValue)) === Infinity ||
                  Number.isNaN(Number(accountInfo?.totalValue))
                    ? "0.00"
                    : roundMe(accountInfo?.totalValue, 2)}
                </p>
              </div>
            </div>
            <div className="costBasis header-sec">
              <div>
                <p className="header-text">Total Cost</p>
              </div>
              <div>
                <p className="header-text">
                  $
                  {Number(accountInfo?.costBasis) === Infinity ||
                  Number.isNaN(Number(accountInfo?.costBasis))
                    ? "0.00"
                    : accountInfo?.costBasis}
                </p>
              </div>
            </div>
            <div className="balance header-sec">
              <div>
                <p className="header-text">Available USD</p>
              </div>
              <div>
                <p className="header-text">
                  $
                  {Number(accountInfo?.usdBal?.free) === Infinity ||
                  Number.isNaN(Number(accountInfo?.usdBal?.free))
                    ? "0.00"
                    : roundMe(accountInfo?.usdBal?.free, 2)}
                </p>
              </div>
            </div>
            <div className="unrealizedGains header-sec">
              <div>
                <p className="header-text">Profit/Loss</p>
              </div>
              <div>
                <p
                  className={`header-text ${
                    checkNegative(accountInfo?.profitLoss)[0]
                  }`}
                >
                  {accountInfo?.profitLoss > 0 ? "" : "-"}$
                  {Number(Number(accountInfo?.profitLoss)) === Infinity ||
                  Number.isNaN(Number(accountInfo?.profitLoss))
                    ? "0.00"
                    : checkNegative(accountInfo?.profitLoss)[1]}
                </p>
                <p
                  className={`header-text ${
                    checkNegative(
                      accountInfo?.profitLossPercent
                    )[0]
                  }`}
                >
                  {accountInfo?.profitLoss > 0 ? "" : "-"}
                  {Number(
                    Number(accountInfo?.profitLossPercent)
                  ) === Infinity ||
                  Number.isNaN(
                    Number(accountInfo?.profitLossPercent)
                  )
                    ? "0.00"
                    : roundMe(checkNegative(
                        accountInfo?.profitLossPercent
                      )[1], 2)}
                  %
                </p>
              </div>
            </div>
          </div>
          <OpenOrders />
          <div className="my-container">
            <div className="title">
              <span className="holdings-header">My Assets</span>
            </div>
            <table className="crypto-list">
              <colgroup>
                <col span="1" style={{ width: "100px" }} />
                <col span="1" style={{ width: "200px" }} />
                <col span="1" style={{ width: "20%" }} />
                <col span="1" style={{ width: "20%" }} />
                <col span="1" style={{ width: "20%" }} />
                <col span="1" style={{ width: "20%" }} />
              </colgroup>
              <thead className="table-header-row">
                <tr>
                  <th className="data-column expander"></th>
                  <th
                    className="data-column symbol-column-header"
                    onClick={() => sortOwnedCoins("Symbol")}
                  >
                    <span>
                      Symbol
                      {sortOwned.column === "Symbol" &&
                        sortOwned.direction === -1 && (
                          <BsFillArrowUpCircleFill className="filter-arrow" />
                        )}
                      {sortOwned.column === "Symbol" &&
                        sortOwned.direction === 1 && (
                          <BsFillArrowDownCircleFill className="filter-arrow" />
                        )}
                    </span>
                  </th>
                  <th
                    className="data-column asset-column"
                    onClick={() => sortOwnedCoins("Balance")}
                  >
                    <span>
                      Amount
                      {sortOwned.column === "Balance" &&
                        sortOwned.direction === -1 && (
                          <BsFillArrowUpCircleFill className="filter-arrow" />
                        )}
                      {sortOwned.column === "Balance" &&
                        sortOwned.direction === 1 && (
                          <BsFillArrowDownCircleFill className="filter-arrow" />
                        )}
                    </span>
                  </th>
                  <th
                    className="data-column asset-column"
                    onClick={() => sortOwnedCoins("Price")}
                  >
                    <span>
                      Price
                      {sortOwned.column === "Price" &&
                        sortOwned.direction === -1 && (
                          <BsFillArrowUpCircleFill className="filter-arrow" />
                        )}
                      {sortOwned.column === "Price" &&
                        sortOwned.direction === 1 && (
                          <BsFillArrowDownCircleFill className="filter-arrow" />
                        )}
                    </span>
                  </th>
                  <th
                    className="data-column asset-column"
                    onClick={() => sortOwnedCoins("Value")}
                  >
                    <span>
                      Value
                      {sortOwned.column === "Value" &&
                        sortOwned.direction === -1 && (
                          <BsFillArrowUpCircleFill className="filter-arrow" />
                        )}
                      {sortOwned.column === "Value" &&
                        sortOwned.direction === 1 && (
                          <BsFillArrowDownCircleFill className="filter-arrow" />
                        )}
                    </span>
                  </th>
                  <th
                    className="data-column asset-column"
                    onClick={() => sortOwnedCoins("PL")}
                  >
                    <span>
                      Profit/Loss
                      {sortOwned.column === "PL" &&
                        sortOwned.direction === -1 && (
                          <BsFillArrowUpCircleFill className="filter-arrow" />
                        )}
                      {sortOwned.column === "PL" &&
                        sortOwned.direction === 1 && (
                          <BsFillArrowDownCircleFill className="filter-arrow" />
                        )}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody style={{ padding: 10 }} className="tbody-crypto">
                {cryptoOwned.map((c, idx) => (
                  <CryptoInfo
                    changeExpanded={changeOwnExpanded}
                    userInfo={userInfo}
                    owned={true}
                    balances={balances}
                    crypto={c}
                    key={`own-${c.tradeSymbol}`}
                    updateFavorites={updateFavorites}
                    trades={trades.filter((trade) => {
                      //transfer objects arent coin pairs so must check this way
                      try {
                        return c.tradeSymbol.includes(trade.symbol);
                      } catch (err) {
                        dispatch(handleErr({
                          data: {
                            status: 'Failed',
                            message: err.message
                          },
                          name: 'home-cryptoInfo'
                        }));
                      }                      
                    })}
                  />
                ))}
                {
                  cryptoNoCandles&&cryptoNoCandles.map((c, idx) => (
                    <CryptoInfoNoCandles
                      crypto={c}
                      balances={balances}
                      trades={trades.filter((trade) => {
                        //transfer objects arent coin pairs so must check this way
                        try {
                          return c.tradeSymbol.includes(trade.symbol);
                        } catch (err) {
                          dispatch(handleErr({
                            data: {
                              status: 'Failed',
                              message: err.message
                            },
                            name: 'home-cryptoInfoNoCandles'
                          }));
                        }                        
                      })}
                    />
                  ))
                }
              </tbody>
            </table>
          </div>
          <div className="my-container">
            <div className="title">
              <div className="filter-list">
                <label htmlFor="watch">
                  <input
                    type="radio"
                    className="filter"
                    id="watch"
                    value="watch"
                    readOnly
                    checked={allCryptoFilter === "watch"}
                    onChange={() => changeFilter("watch")}
                  />
                  <div className="filter">Watch</div>
                </label>
                <label htmlFor="held">
                  <input
                    type="radio"
                    className="filter"
                    id="held"
                    value="held"
                    readOnly
                    checked={allCryptoFilter === "held"}
                    onChange={() => changeFilter("held")}
                  />
                  <div className="filter">Held</div>
                </label>
                <label htmlFor="all">
                  <input
                    type="radio"
                    className="filter"
                    id="all"
                    value="all"
                    readOnly
                    checked={allCryptoFilter === "all"}
                    onChange={() => changeFilter("all")}
                  />
                  <div className="filter">All</div>
                </label>
              </div>
              <span className="holdings-header">Tradable Assets</span>
            </div>
            <table className="crypto-list">
              <colgroup>
                <col span="1" style={{ width: "100px" }} />
                <col span="1" style={{ width: "800px" }} />
              </colgroup>
              <thead className="table-header-row">
                <tr>
                  <th className="data-column expander"></th>
                  <th
                    className="data-column symbol-column-header"
                    onClick={() => sortUnownedCoins("Symbol")}
                  >
                    <span>
                      Symbol
                      {sortUnowned.column === "Symbol" &&
                        sortUnowned.direction === -1 && (
                          <BsFillArrowDownCircleFill className="filter-arrow" />
                        )}
                      {sortUnowned.column === "Symbol" &&
                        sortUnowned.direction === 1 && (
                          <BsFillArrowUpCircleFill className="filter-arrow" />
                        )}
                    </span>
                  </th>
                  <th
                    className="data-column asset-column"
                    onClick={() => sortUnownedCoins("Price")}
                  >
                    <span>
                      Price
                      {sortUnowned.column === "Price" &&
                        sortUnowned.direction === -1 && (
                          <BsFillArrowDownCircleFill className="filter-arrow" />
                        )}
                      {sortUnowned.column === "Price" &&
                        sortUnowned.direction === 1 && (
                          <BsFillArrowUpCircleFill className="filter-arrow" />
                        )}
                    </span>
                  </th>
                  <th
                    className="data-column"
                    onClick={() => sortUnownedCoins("24H")}
                  >
                    <span>
                      24 Hours
                      {sortUnowned.column === "24H" &&
                        sortUnowned.direction === -1 && (
                          <BsFillArrowDownCircleFill className="filter-arrow" />
                        )}
                      {sortUnowned.column === "24H" &&
                        sortUnowned.direction === 1 && (
                          <BsFillArrowUpCircleFill className="filter-arrow" />
                        )}
                    </span>
                  </th>
                  <th
                    className="data-column"
                    onClick={() => sortUnownedCoins("1W")}
                  >
                    <span>
                      1 Week
                      {sortUnowned.column === "1W" &&
                        sortUnowned.direction === -1 && (
                          <BsFillArrowDownCircleFill className="filter-arrow" />
                        )}
                      {sortUnowned.column === "1W" &&
                        sortUnowned.direction === 1 && (
                          <BsFillArrowUpCircleFill className="filter-arrow" />
                        )}
                    </span>
                  </th>
                  <th
                    className="data-column"
                    onClick={() => sortUnownedCoins("1M")}
                  >
                    <span>
                      1 Month
                      {sortUnowned.column === "1M" &&
                        sortUnowned.direction === -1 && (
                          <BsFillArrowDownCircleFill className="filter-arrow" />
                        )}
                      {sortUnowned.column === "1M" &&
                        sortUnowned.direction === 1 && (
                          <BsFillArrowUpCircleFill className="filter-arrow" />
                        )}
                    </span>
                  </th>
                  <th
                    className="data-column"
                    onClick={() => sortUnownedCoins("3M")}
                  >
                    <span>
                      3 Months
                      {sortUnowned.column === "3M" &&
                        sortUnowned.direction === -1 && (
                          <BsFillArrowDownCircleFill className="filter-arrow" />
                        )}
                      {sortUnowned.column === "3M" &&
                        sortUnowned.direction === 1 && (
                          <BsFillArrowUpCircleFill className="filter-arrow" />
                        )}
                    </span>
                  </th>
                  <th
                    className="data-column month-12"
                    onClick={() => sortUnownedCoins("1Y")}
                  >
                    <span>
                      12 Months
                      {sortUnowned.column === "1Y" &&
                        sortUnowned.direction === -1 && (
                          <BsFillArrowDownCircleFill className="filter-arrow" />
                        )}
                      {sortUnowned.column === "1Y" &&
                        sortUnowned.direction === 1 && (
                          <BsFillArrowUpCircleFill className="filter-arrow" />
                        )}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="tbody-crypto">
                {allCryptoFilteredArr.map((c, idx) => (
                  <CryptoInfo
                    updateFavorites={updateFavorites}
                    key={`all-${c.tradeSymbol}`}
                    changeExpanded={changeAllExpanded}
                    userInfo={userInfo}
                    owned={false}
                    balances={balances}
                    crypto={c}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
};

export default React.memo(Home);
