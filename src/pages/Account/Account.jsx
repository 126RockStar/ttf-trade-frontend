import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Loading from "pages/Loading/Loading";
import { getPriceLists } from "services/candles-service";
import {
  handleErr,
  closeErrName
} from "store/modules/error/actions";
import ReportPage from "./components/Report";
import "./styles/Account.scss";

const Account = () => {

  const dispatch = useDispatch();

  const auth = useSelector((state) => state.auth);
  const userInfo = useSelector((state) => state.auth.userInfo);

  const [loading, setLoading] = useState(true);
  const [cryptoPrices, setCryptoPrices] = useState(null);

  useEffect(() => {
    if (auth.changeAccount) {
      setLoading(true);

      const fetchData = async () => {

        const res = await getPriceLists({
          exchange: auth.changeAccount.exchange,
          tenantId: userInfo?.tenantId,
          //ID_TODO: likely wont need these
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
          setCryptoPrices(res.data);

          dispatch(closeErrName({ name: 'account-getPriceLists' }));
        } else {
          dispatch(handleErr({ data: res.data, name: 'account-getPriceLists'}));
        }

        setLoading(false);
      };
      fetchData();
    }
  }, [userInfo?.exchangeIds, auth.changeAccount]);

  return (
    <div className="account-page">
      <div className="account-page--title">
        <span>Trade History</span>
      </div>
      {!loading && cryptoPrices ? (
        <ReportPage cryptoPrices={cryptoPrices} />
      ) : (
        <Loading />
      )}
    </div>
  );
};

export default Account;
