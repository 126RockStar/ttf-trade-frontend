import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getBalances } from "services/balance-service";
import { getExchangeOrders } from "services/order-service";
import { setToken } from "services/token-service";
import {
  getUser,
  validateDevAccounts,
  validateAccounts,
  getEnvironment,
} from "services/user-service";
import {
  loadMarkets
} from 'services/market-data-service';
import {
  updateExchange,
  updateUser,
  updateAdminPermission,
  updateAccounts,
  updateBalances,
  updateTrades
} from "store/modules/auth/actions";
import {
  updateMarketData
} from 'store/modules/preferences/actions';
import {
  handleErr,
  closeErrName,
  closeErr
} from "store/modules/error/actions";
import { env } from "utils/globals.js";

let timeout;

const InitInfo = (props) => {
  const { children } = props;

  const dispatch = useDispatch();
  const preferences = useSelector((state) => state.preferences);
  const auth = useSelector((state) => state.auth);

  const [onlineStatus, setOnlineStatus] = useState(true);

  const [accounts, setAccounts] = useState(null);
  const [iframeRun, setIframeRun] = useState(false);
  const [delayMode, setDelayMode] = useState(false);

  const checkAccounts = async (payloadObj) => {
    const res = await validateAccounts(payloadObj);

    if (res.data.status === "success") {
      
      setToken(res.data.data.token);
      setAccounts(res.data.data.existAccounts);

      dispatch(updateAccounts(res.data.data.existAccounts));

      dispatch(closeErrName({ name: 'initInfo-validateAccounts' }));
    } else {
      dispatch(handleErr({ data: res.data, name: 'initInfo-validateAccounts' }));
    }
  };

  const checkDevAccounts = async (payloadObj) => {
    const res = await validateDevAccounts(payloadObj);

    if (res.data.status === "success") {
      setToken(res.data.data.token);
      setAccounts(res.data.data.existAccounts);

      dispatch(updateAccounts(res.data.data.existAccounts));

      dispatch(closeErrName({ name: 'initInfo-validateDevAccounts' }));
    } else {
      dispatch(handleErr({ data: res.data, name: 'initInfo-validateDevAccounts'}));
    }
  };

  const getNewUserInfo = async (data) => {
    //TODO: we are providing the exchange in the backend request here
    //      why not let the backend find the valid exchange Id and return only that Id?
    try {
      const res = await getUser(data);

      if (res.data.status === "success") {
        setToken(res.data.data.token);
        const exchangeObj = res.data.data.user.exchangeIds.find(
          (item) => item.exchange === data.exchange
        );

        const exchange = exchangeObj.exchange;
        const tenantId = res.data.data.user.tenantId;
        const exchangeAccountId = exchangeObj.exchangeAccountId;

        await setBalData(exchange, tenantId, exchangeAccountId);

        await getExchangeTrades(exchange);

        dispatch(updateUser(res.data.data.user));
        dispatch(updateAdminPermission(res.data.data.adminPermissions));
        dispatch(
          updateExchange({
            ...exchangeObj,
            tenantId,
          })
        );

        dispatch(closeErrName({ name: 'initInfo-getUser' }));
      } else {
        dispatch(handleErr({ data: res.data, name: 'initInfo-getUser' }));
      }

      // get marketData
      const marketRes = await loadMarkets(data.exchange);

      if (marketRes.data.status === 'success') {
        dispatch(updateMarketData(marketRes.data.data));

        dispatch(closeErrName({ name: 'initInfo-loadMarkets' }));
      } else {
        dispatch(handleErr({ data: marketRes.data, name: 'initInfo-loadMarkets'}));
      }

      dispatch(closeErrName({ name: 'try-initInfo-getNewUserInfo' }));
    } catch (err) {
      dispatch(handleErr({
        data: {
          status: 'Failed',
          message: err.message
        },
        name: 'try-initInfo-getNewUserInfo'
      }));
    }    
  };

  const setBalData = async (exchange, tenantId, exchangeAccountId) => {
    const res = await getBalances(exchange, tenantId, exchangeAccountId);

    if (res.data.status === "success") {
      const tempBals = [...res.data.data.balances];
      dispatch(updateBalances(tempBals));

      dispatch(closeErrName({ name: 'initInfo-setBalData' }));
    } else {
      dispatch(updateBalances([]));
      dispatch(handleErr({ data: res.data, name: 'initInfo-setBalData'}));
    }
  };

  const getExchangeTrades = async (exchange) => {
    const res = await getExchangeOrders(exchange);

    if (res.data.status === "success") {
      dispatch(updateTrades(res.data.data));

      dispatch(closeErrName({ name: 'initInfo-getExchangeTrades' }));
    } else {
      dispatch(handleErr({ data: res.data, name: 'initInfo-getExchangeTrades'}));
    }
  };

  async function setEnvironment() {
    const res = await getEnvironment();
    
    if (res.data.status === "success") {
      let envTmp = Object.entries(res.data.data);

      for (let i = 0; i < envTmp.length; i++) {
        env[envTmp[i][0]] = envTmp[i][1];
      }
      
      dispatch(closeErrName({ name: 'initInfo-setEnvironment' }))
    } else {
      dispatch(handleErr({ data: res.data, name: 'initInfo-setEnvironment'}));
      setOnlineStatus(status=>!status);
      setDelayMode(false);
    }
  }

  useEffect(() => {
    //need env variables before they are used
    setEnvironment().then(() => {
      //TODO: delete This if else and then setDelayMode(true) immediately after environment is set
      if (env.NO_IFRAME) {
        setDelayMode(true);
      } else {
        timeout = setTimeout(() => {
          setDelayMode(true);
        }, 8000);
      }
      // Ken's version
    });

    window.addEventListener("message", (event) => {
      if (event.data.clientAccountToken) {
        window.parent.postMessage("received-ok", "*");

        checkAccounts(event.data.clientAccountToken);
        setIframeRun(true);
        setDelayMode(true);
      }
    });
  }, [onlineStatus]);

  useEffect(() => {
    if (delayMode) {
      if (!iframeRun) {
        if (env.ENVIORNMENT === "dev") {
          dispatch(closeErrName({ name: 'initInfo-env-dev' }));

          if (env.DEFAULT_ACCOUNTS) {
            checkDevAccounts(env.DEFAULT_ACCOUNTS);

            dispatch(closeErrName({ name: 'initInfo-default-accounts' }));
          } else {
            dispatch(handleErr({
              data: {
                status: "ERROR",
                message: "We still didn't receive account information.",
              },
              name: 'initInfo-default-accounts'
            }))
          }
        } else {
          dispatch(handleErr({
            data: {
              status: "ERROR",
              message: "We still didn't receive account information.",
            },
            name: 'initInfo-env-dev'
          }))
        }
      }
    }
    //TODO: if we add Iframe run here and delete the delay, then I think it will jjust work
    // then delay mode will be triggered after the environment is retreived. If delaymode = true but iframeRun = false, then it wont run
    // BUT the minut that iframeRun = true, this will execute again. This should work vice versa as well?
  }, [delayMode]);

  useEffect(() => {
    if (auth.selectExchange) {
      const updateResponse = async () => {
        await setBalData(
          auth.selectExchange.exchange,
          auth.selectExchange.tenantId,
          auth.selectExchange.exchangeAccountId
        );

        await getExchangeTrades(auth.selectExchange.exchange);
      };

      updateResponse();
    }
  }, [preferences.order.state]);

  useEffect(() => {
    if (auth.changeAccount) {
      const {
        clientAccountId,
        exchange
      } = auth.changeAccount;

      getNewUserInfo({
        clientAccountId,
        exchange
      });

      dispatch(closeErr());
    }
  }, [auth.changeAccount])

  return <>{children}</>;
};

export default InitInfo;
