import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import Trade from "pages/Home/components/Trade";
import TradeTable from "./TradeTable";
import CryptoGraph from "./CryptoGraph";
import { getSymbolOrders, cancelOrder } from "services/order-service";
import { updateOrder } from "store/modules/preferences/actions";
import {
  handleErr,
  closeErrName
} from "store/modules/error/actions";
import "../styles/ExpandedInfo.scss";

const ExpandedInfo = ({ userInfo, balances, symbol, coinName, base, owned }) => {

  const preferences = useSelector((state) => state.preferences);
  const auth = useSelector((state) => state.auth);

  const dispatch = useDispatch();

  const [symbolOrders, setSymbolOrders] = useState([]);
  const [markets, setMarkets] = useState(null);

  useEffect(() => {
    if (auth.selectExchange) {
      async function fetchData() {
        const symbolOrderRes = await getSymbolOrders(symbol, auth.selectExchange.exchange);
  
        if (symbolOrderRes.data.status === "success") {
          const symbolOrderData = symbolOrderRes.data.data.map(item => ({
            ...item,
            loading: false
          }))
          setSymbolOrders(symbolOrderData);

          dispatch(closeErrName({ name: 'expandedInfo-getSymbolOrders-1' }));
        } else {
          dispatch(handleErr({ data: symbolOrderRes.data, name: 'expandedInfo-getSymbolOrders-1' }));
        }     
      }
  
      const interval = setInterval(() => {
        fetchData();
      }, 10000);
      return () => {
          clearInterval(interval);
      };
    }
  }, [symbol, auth.selectExchange]);

  useEffect(() => {
    async function fetchData() {
      const res = await getSymbolOrders(symbol, auth.selectExchange.exchange);

      if (res.data.status === "success") {
        const symbolOrderData = res.data.data.map(item => ({
          ...item,
          loading: false
        }))
        setSymbolOrders(symbolOrderData);

        dispatch(closeErrName({ name: 'expandedInfo-getSymbolOrders-2' }));
      } else {
        dispatch(handleErr({ data: res.data, name: 'expandedInfo-getSymbolOrders-2' }));
      }     
    }
    
    fetchData();
  }, [preferences.order.state])

  useEffect(() => {
    if (preferences.marketData.length > 0) {
      setMarkets(preferences.marketData);
    }
  }, [preferences.marketData])

  const handleOrderCancel = async (data) => {
    try {
      setSymbolOrders(state=>state.map(item => ({
        ...item,
        loading: item.id === data.id ? true:false
      })));
  
      const cancelOrderData = {
        exchange: data.exchange,
        exchangeAccountId: data.exchangeAccountId,
        tenantId: data.tenantId,
        orderId: data.id,
        symbol: data.symbol
      }
      
      let res;
      res = await cancelOrder(cancelOrderData);
  
      if (res.data.status === "success") {    
        const orderUpdate = {
          ...preferences.order,
          state: !preferences.order.state,
        };
        dispatch(updateOrder(orderUpdate));

        dispatch(closeErrName({ name: 'expandedInfo-orderCancel' }));
      } else {
        dispatch(handleErr({ data: res.data, name: 'expandedInfo-orderCancel' }));
      }      
    } catch (err) {

    }
  }

  return (
    <>
      <tr>
        <td colSpan="10">
          <div className="expanded-info">
            <div className="expanded-info--top">
              <div className="expanded-info--top--trading">
                <Trade
                  userInfo={userInfo}
                  balances={balances}
                  symbol={symbol}
                  owned={owned}
                />
              </div>
              <div className="expanded-info--top--graph">
                {
                  userInfo&&symbol&&base&&
                    <CryptoGraph
                      userInfo={userInfo}
                      symbol={symbol}
                      coinName={coinName}
                      base={base}
                    />
                }
              </div>
            </div>
            <div className="expanded-info--bottom">
              {
                auth.adminPermissions?
                  auth.adminPermissions.find((item) => item === "AccountDiagnostics") ?
                    markets&&<TradeTable symbolOrders={symbolOrders} symbol={symbol} diagnostics={true} onOrderCancel={(data)=>handleOrderCancel(data)} markets={markets}/>:
                    markets&&<TradeTable symbolOrders={symbolOrders} symbol={symbol} diagnostics={false} onOrderCancel={(data)=>handleOrderCancel(data)} markets={markets}/>
                  :
                  auth.userInfo.permissions.find((item) => item === "AccountDiagnostics") ?
                    markets&&<TradeTable symbolOrders={symbolOrders} symbol={symbol} diagnostics={true} onOrderCancel={(data)=>handleOrderCancel(data)} markets={markets}/>:
                    markets&&<TradeTable symbolOrders={symbolOrders} symbol={symbol} diagnostics={false} onOrderCancel={(data)=>handleOrderCancel(data)} markets={markets}/>
              }

            </div>
          </div>
        </td>
      </tr>
    </>
  );
};

export default ExpandedInfo;
