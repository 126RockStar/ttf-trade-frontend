import coinMarketCap from "assets/images/coin_market_cap.png";
import { cryptoSymbol } from "crypto-symbol";
import { linkLookup } from "data/link-lookup";
import React, { useEffect, useState } from "react";
import Icon from "react-crypto-icons";
import Iframe from "react-iframe";
import Modal from "react-modal";
import { useDispatch } from "react-redux";
import Popup from "reactjs-popup";
import {
  handleErr,
  closeErrName
} from "store/modules/error/actions";
import { checkNegative } from "utils/homeTable";
import { roundMe } from "utils/roundMe";
import "../styles/CryptoInfoNoCandles.scss";
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
  crypto,
  balances,
  trades,
}) => {
  const dispatch = useDispatch();

  const [profitLoss, setProfitLoss] = useState({
    number: "",
    percent: "",
  });

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
          //costBasis += trade.fee?.svcCost || 0;
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

      dispatch(closeErrName({ name: 'try-cryptoInfoNoCandles-calcPL' }));
    } catch (err) {
      dispatch(handleErr({
        data: {
          status: 'Failed',
          message: err.message
        },
        name: 'try-cryptoInfoNoCandles-calcPL'
      }));
    }    
  };

  useEffect(() => {
    calcPL();
  }, [trades, balances]);

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
        <td className="data-column asset-column">
          <p>
            {Number(Number(crypto.balance.free)) === Infinity ||
            Number.isNaN(Number(crypto.balance.free))
              ? "0.0000"
              : Number(crypto.balance.free).toFixed("4")}
          </p>
        </td>
        <td className="data-column asset-column">
          <p className="price-column">
            {`$${(Number(Number(crypto?.currentPrice))===Infinity || Number.isNaN(Number(crypto?.currentPrice))) ? '0.00000': crypto?.currentPrice?.toFixed("5")}`}
          </p>
        </td>
        <td className="data-column asset-column">
          <p>
            {`$${(Number(Number(crypto.value))===Infinity || Number.isNaN(Number(crypto.value))) ? '0.00': roundMe(Number(crypto.value), 2)}`}
          </p>
        </td>
        <td className="data-column asset-column">
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
        </td>
      </tr>
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
