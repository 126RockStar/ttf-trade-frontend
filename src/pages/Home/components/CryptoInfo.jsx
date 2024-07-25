import coinMarketCap from "assets/images/coin_market_cap.png";
import { cryptoSymbol } from "crypto-symbol";
import { linkLookup } from "data/link-lookup";
import React, { useEffect, useState } from "react";
import Icon from "react-crypto-icons";
import {
  AiFillMinusCircle,
  AiFillPlusCircle,
  AiFillStar,
  AiOutlineStar,
} from "react-icons/ai";
import Iframe from "react-iframe";
import Modal from "react-modal";
import { useDispatch, useSelector } from "react-redux";
import Popup from "reactjs-popup";
import {
  handleErr,
  closeErrName
} from "store/modules/error/actions";
import { checkNegative } from "utils/homeTable";
import { roundMe } from "utils/roundMe";
import "../styles/CryptoInfo.scss";
import ExpandedInfo from "./ExpandedInfo";


const { nameLookup } = cryptoSymbol({});

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
};

const CryptoInfo = ({
  changeExpanded,
  owned,
  crypto,
  balances,
  userInfo,
  updateFavorites,
  trades,
}) => {
  const dispatch = useDispatch();

  const auth = useSelector((state) => state.auth);
  const [favorites, setFavorites] = useState([]);
  const [profitLoss, setProfitLoss] = useState({
    number: "",
    percent: "",
  });
  const [oneDay, setOneDay] = useState();
  const [oneWeek, setOneWeek] = useState();
  const [oneMonth, setOneMonth] = useState();
  const [threeMonths, setThreeMonths] = useState();
  const [oneYear, setOneYear] = useState();

  useEffect(() => {
    if (crypto?.timeFrames?.length) {
      try {
        let day = crypto.timeFrames.find((time) => time.timeFrame === "1D");
        setOneDay(day);
        let week = crypto.timeFrames.find((time) => time.timeFrame === "1W");
        setOneWeek(week);
        let month = crypto.timeFrames.find((time) => time.timeFrame === "1M");
        setOneMonth(month);
        month = crypto.timeFrames.find((time) => time.timeFrame === "3M");
        setThreeMonths(month);
        let year = crypto.timeFrames.find((time) => time.timeFrame === "1Y");
        setOneYear(year);

        dispatch(closeErrName({ name: 'try-cryptoInfo-effect' }));
      } catch (err) {
        dispatch(handleErr({
          data: {
            status: 'Failed',
            message: err.message
          },
          name: 'try-cryptoInfo-effect'
        }));
      }      
    }
  }, [crypto]);

  useEffect(() => {
    setFavorites(auth.selectExchange?.favorites);
  }, [auth.selectExchange?.favorites]);

  const calcPL = async () => {
    try {
      let temp = {
        number: 0,
        percent: 0,
      };
      let costBasis = 0;
      await trades?.forEach((trade) => {
        if (trade.type === "tradeOrder") {
          let orderCost = 0;

          if(trade.status === "closed" || trade.status === "canceled"){
            // orderCost = trade.typeInstance.average * trade.amount;
            orderCost = trade.typeInstance.average * trade.typeInstance.filled;
            costBasis += trade.fee?.svcCost || 0;
          } else if (trade.status === "open" || trade.status === "pending") {
            // orderCost = trade.typeInstance.price * trade.amount;
            orderCost = trade.typeInstance.price * trade.typeInstance.filled;
          }
          //fees should already be the predicted fees at this point
          if(trade.typeInstance.side === "buy"){
            costBasis += orderCost;
          } else if (trade.typeInstance.side === "sell") {
            costBasis -= orderCost;
          }
          // costBasis += trade.fee?.svcCost || 0;
        } else if(trade.type === "transfer" ) {
          //TODO: are pending transfers a thing, what do they look like?
          let transferUSDValue = trade.amount * trade.typeInstance.value;
          if(trade.symbol!=='USD' && trade.typeInstance.direction === 'in'){//USD should not be accounted for in Total Cost
            costBasis += transferUSDValue;
          } else if( trade.symbol!=='USD' && trade.typeInstance.direction === 'out'){
            costBasis -= transferUSDValue;
          }
          costBasis += trade.fee?.svcCost || 0;
        }
      });
      
      temp.number = crypto.value - costBasis;
      temp.percent = roundMe((temp.number / costBasis) * 100, 2);
      temp.number = roundMe(temp.number, 2);
      costBasis = roundMe(costBasis, 2);
      setProfitLoss(temp);

      dispatch(closeErrName({ name: 'try-cryptoInfo-calcPL' }));
    } catch (err) {
      dispatch(handleErr({
        data: {
          status: 'Failed',
          message: err.message
        },
        name: 'try-cryptoInfo-calcPL'
      }));
    }    
  };

  useEffect(() => {
    calcPL();
  }, [trades, balances]);

  const changeFavorites = (action, base) => {
    let temp = [...favorites];
    if (action === "add") {
      temp.push(base);
    } else {
      let idx = temp.indexOf(base);
      temp.splice(idx, 1);
    }
    setFavorites(temp);
    updateFavorites(temp);
  };

  const [modalIsOpen, setIsOpen] = React.useState(false);

  function openModal() {
    if (coinObj) {
      window.open(coinObj.coinMarketCapLink, '_blank');
    } else {
    }
  }

  function closeModal() {
    setIsOpen(false);
  }

  const coinObj = linkLookup.find((item) => item.coin === String(crypto?.base));
  const coinName = nameLookup(crypto?.base, { exact: true });

  return (
    <>
      <tr className="crypto-info-row">
        <td className="expander">
          <div className="expander-div">
            {crypto.expanded && (
              <AiFillMinusCircle
                size={25}
                cursor="pointer"
                color="white"
                className="expand-icon"
                onClick={() => changeExpanded(crypto)}
              />
            )}
            {!crypto.expanded && (
              <AiFillPlusCircle
                size={25}
                cursor="pointer"
                color="white"
                className="expand-icon"
                onClick={() => changeExpanded(crypto)}
              />
            )}
            {!owned && favorites?.includes(crypto?.base) && (
              <AiFillStar
                size={30}
                cursor="pointer"
                color="gold"
                onClick={() => changeFavorites("remove", crypto?.base)}
              />
            )}
            {!owned && !favorites?.includes(crypto?.base) && (
              <AiOutlineStar
                size={30}
                cursor="pointer"
                color="gold"
                onClick={() => changeFavorites("add", crypto?.base)}
              />
            )}
          </div>
        </td>
        <td className="data-column symbol-column">
          <Popup
            trigger={
              <button className="popup-button">
                <div className="popup-button--text">
                  <div className="icon">
                    <Icon
                      className="cryptoIcon"
                      name={String(crypto?.base).toLowerCase()}
                    />
                  </div>
                  <div className="description">
                    <div className="description--abb">
                      <span>{crypto?.base}</span>
                    </div>
                    <div className="description--name">
                      <span>{coinName}</span>
                    </div>
                  </div>
                </div>
              </button>
            }
            open={false}
            position={["bottom left"]}
            closeOnDocumentClick
            arrow={false}
          >
            <div className="popup-window">
              <div className="popup-window--top">
                <div>
                  <span>{crypto?.base}</span>
                </div>
                <div>
                  <img
                    src={coinMarketCap}
                    alt="coinMarketCap"
                    width={150}
                    onClick={openModal}
                    style={{ cursor: "pointer" }}
                  />
                </div>
              </div>
              <div
                className="popup-window--description"
                dangerouslySetInnerHTML={{
                  __html: coinObj && coinObj.description,
                }}
              ></div>
            </div>
          </Popup>
        </td>
        <td className={owned ? "data-column asset-column" : "data-column"}>
          {owned && (
            <p>
              {Number(Number(crypto.balance.free)) === Infinity ||
              Number.isNaN(Number(crypto.balance.free))
                ? "0.0000"
                : Number(crypto.balance.free).toFixed("4")}
            </p>
          )}
          {!owned && (
            <p className="price-column">
              {Number(Number(crypto?.currentPrice)) === Infinity ||
              Number.isNaN(Number(crypto?.currentPrice))
                ? "0.00000"
                : crypto?.currentPrice?.toFixed("5")}
            </p>
          )}
        </td>
        <td className={owned ? "data-column asset-column" : "data-column"}>
          {owned && (
            <p className="price-column">
              {`$${(Number(Number(crypto?.currentPrice))===Infinity || Number.isNaN(Number(crypto?.currentPrice))) ? '0.00000': crypto?.currentPrice?.toFixed("5")}`}
            </p>
          )}
          {!owned && (
            <>
              <p className={checkNegative(Number(oneDay?.profitLossAmt))[0]}>
                {(Number(Number(oneDay?.profitLossAmt))===Infinity || Number.isNaN(Number(oneDay?.profitLossAmt))) ? '0.00': roundMe(Number(oneDay?.profitLossAmt), 2)}
              </p>
              <p className={checkNegative(Number(oneDay?.profitLossPct))[0]}>
                {(Number(Number(oneDay?.profitLossPct))===Infinity || Number.isNaN(Number(oneDay?.profitLossPct))) ? '0.00': oneDay?.profitLossPct}
                %
              </p>
            </>
          )}
        </td>
        <td className={owned ? "data-column asset-column" : "data-column"}>
          {owned && (
            <p>
              {`$${(Number(Number(crypto.value))===Infinity || Number.isNaN(Number(crypto.value))) ? '0.00': roundMe(Number(crypto.value), 2)}`}
            </p>
          )}
          {!owned && (
            <>
              <p className={checkNegative(Number(oneWeek?.profitLossAmt))[0]}>
                {(Number(Number(oneWeek?.profitLossAmt))===Infinity || Number.isNaN(Number(oneWeek?.profitLossAmt))) ? '0.00': roundMe(Number(oneWeek?.profitLossAmt), 2)}
              </p>
              <p className={checkNegative(Number(oneWeek?.profitLossPct))[0]}>
                {(Number(Number(oneWeek?.profitLossPct))===Infinity || Number.isNaN(Number(oneWeek?.profitLossPct))) ? '0.00': oneWeek?.profitLossPct}
                %
              </p>
            </>
          )}
        </td>
        <td className={owned ? "data-column asset-column" : "data-column"}>
          {owned && (
            <>
              <p
                className={`${
                  checkNegative(profitLoss.number)[0]
                } profit-column`}
              >
                ${(Number(Number(profitLoss.number))===Infinity || Number.isNaN(Number(profitLoss.number))) ? '0.00': profitLoss.number}
              </p>
              <p
                className={`${
                  checkNegative(profitLoss.percent)[0]
                } profit-column`}
              >
                {(Number(Number(profitLoss.percent))===Infinity || Number.isNaN(Number(profitLoss.percent))) ? '0.00': profitLoss.percent}
                %
              </p>
            </>
          )}
          {!owned && (
            <>
              <p className={checkNegative(Number(oneMonth?.profitLossAmt))[0]}>
                {(Number(Number(oneMonth?.profitLossAmt))===Infinity || Number.isNaN(Number(oneMonth?.profitLossAmt))) ? '0.00': roundMe(Number(oneMonth?.profitLossAmt), 2)}
              </p>
              <p className={checkNegative(Number(oneMonth?.profitLossPct))[0]}>
                {(Number(oneMonth?.profitLossPct)===Infinity || Number.isNaN(Number(oneMonth?.profitLossPct))) ? '0.00': oneMonth?.profitLossPct}
                %
              </p>
            </>
          )}
        </td>
        {!owned && (
          <td className="data-column">
            <>
              <p
                className={checkNegative(Number(threeMonths?.profitLossAmt))[0]}
              >
                {(Number(Number(threeMonths?.profitLossAmt))===Infinity || Number.isNaN(Number(threeMonths?.profitLossAmt))) ? '0.00': roundMe(Number(threeMonths?.profitLossAmt), 2)}
              </p>
              <p
                className={checkNegative(Number(threeMonths?.profitLossPct))[0]}
              >
                {(Number(threeMonths?.profitLossPct)===Infinity || Number.isNaN(Number(threeMonths?.profitLossPct))) ? '0.00': threeMonths?.profitLossPct}
                %
              </p>
            </>
          </td>
        )}
        {!owned && (
          <td className="data-column month-12">
            <>
              <p className={checkNegative(Number(oneYear?.profitLossAmt))[0]}>
                {(Number(oneYear?.profitLossAmt)===Infinity || Number.isNaN(Number(oneYear?.profitLossAmt))) ? '0.00': roundMe(Number(oneYear?.profitLossAmt), 2)}
              </p>
              <p className={checkNegative(Number(oneYear?.profitLossPct))[0]}>
                {(Number(oneYear?.profitLossPct)===Infinity || Number.isNaN(Number(oneYear?.profitLossPct))) ? '0.00': oneYear?.profitLossPct}
                %
              </p>
            </>
          </td>
        )}
      </tr>
      {crypto.expanded && (
        <ExpandedInfo
          userInfo={userInfo}
          balances={balances}
          symbol={crypto.tradeSymbol}
          coinName={coinName}
          base={crypto?.base}
          owned={owned}
        />
      )}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Example Modal"
        overlayClassName="modal-overlay"
      >
        <div className="iframe-popup">
          <Iframe
            url={coinObj&&coinObj.coinMarketCapLink}
            width="100%"
            height="100%"
            id="myId"
            className="myClassname"
            display="initial"
            position="relative"
          />
        </div>
      </Modal>
    </>
  );
};

export default CryptoInfo;
