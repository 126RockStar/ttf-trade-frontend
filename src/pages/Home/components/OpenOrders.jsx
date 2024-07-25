import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { checkOpenOrders, getExchangeOrders, cancelOrder } from "services/order-service";
import { updateOrder } from "store/modules/preferences/actions";
import {
  handleErr,
  closeErrName
} from "store/modules/error/actions"; 
import TradeTable from "./TradeTable";
import "..//styles/OpenOrders.scss";

const OpenOrders = ({}) => {

    const dispatch = useDispatch();

    const auth = useSelector((state) => state.auth);
    const preferences = useSelector((state) => state.preferences);

    const [showOpen, setShowOpen] = useState(false);
    const [openOrders, setOpenOrders] = useState([]);

    const [markets, setMarkets] = useState(null);

    useEffect(() => {
        if (auth.selectExchange) {
            async function fetchData() {
                const res = await checkOpenOrders({
                    exchangeAccountId: auth.selectExchange.exchangeAccountId,
                    exchange: auth.selectExchange.exchange
                })

                if (res.data.status === 'success') {
                    setOpenOrders(res.data.data);

                    dispatch(closeErrName({ name: 'openOrders-checkOpenOrders-1' }));
                } else {
                    dispatch(handleErr({ data: res.data, name: 'openOrders-checkOpenOrders-1' }));
                }
            }

            fetchData();

            const interval = setInterval(() => {
                fetchData();
            }, 15000);
            return () => {
                clearInterval(interval);
            };
        }
    }, [auth.selectExchange]);

    useEffect(() => {
        if (auth.selectExchange) {
            async function fetchData() {
                const res = await checkOpenOrders({
                    exchangeAccountId: auth.selectExchange.exchangeAccountId,
                    exchange: auth.selectExchange.exchange
                })

                if (res.data.status === 'success') {
                    setOpenOrders(res.data.data);

                    dispatch(closeErrName({ name: 'openOrders-checkOpenOrders-2' }));
                } else {
                    dispatch(handleErr({ data: res.data, name: 'openOrders-checkOpenOrders-2'}));
                }
            }

            fetchData();
        }
    }, [auth.selectExchange, preferences.order.state]);

    useEffect(() => {
        const orderUpdate = {
            ...preferences.order,
            state: !preferences.order.state,
        };
        dispatch(updateOrder(orderUpdate));
    }, [openOrders.length])

    useEffect(() => {
        if (preferences.marketData.length > 0) {
          setMarkets(preferences.marketData);
        }
    }, [preferences.marketData])

    const handleOpenClick = () => {
        setShowOpen(state=>!state);
    }

    const handleOrderCancel = async (data) => {
        try {
            setOpenOrders(state=>state.map(item => ({
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
            
            const cancelRes = await cancelOrder(cancelOrderData);
        
            if (cancelRes.data.status === "success") {    
                setOpenOrders(state=>state.filter(item => (item.id !== data.id)));
                
                const checkOpenRes = await checkOpenOrders({
                    exchangeAccountId: auth.selectExchange.exchangeAccountId,
                    exchange: auth.selectExchange.exchange
                })
    
                if (checkOpenRes.data.status === 'success') {
                    setOpenOrders(checkOpenRes.data.data);

                    dispatch(closeErrName({ name: 'openOrders-checkOpenOrders-3' }));
                } else {
                    dispatch(handleErr({ data: checkOpenRes.data, name: 'openOrders-checkOpenOrders-3' }));
                }

                dispatch(closeErrName({ name: 'openOrders-cancelRes' }));
            } else {
                dispatch(handleErr({ data: cancelRes.data, name: 'openOrders-cancelRes' }));
            }
            
        } catch (err) {
      
        }
    }

    return (
        <div className="open-orders">
            <div className="open-orders--button" onClick={handleOpenClick}>
                <div className="title">
                    <span>Open Orders ({openOrders.length})</span>
                </div>            
                <div className="arrow">
                    <span>
                        {
                            showOpen ?
                                <KeyboardArrowDownIcon />:
                                <KeyboardArrowUpIcon />
                        }
                    </span>
                </div>            
            </div>
            {
                showOpen &&
                    <div className="open-orders--table">
                        {markets&&<TradeTable symbolOrders={openOrders} symbol={''} diagnostics={false} onOrderCancel={(data)=>handleOrderCancel(data)} markets={markets}/>}
                    </div>
            }      
        </div>
    );
};

export default OpenOrders;