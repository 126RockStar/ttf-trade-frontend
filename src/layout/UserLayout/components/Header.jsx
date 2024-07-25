import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  changeAccount
} from "store/modules/auth/actions"
import irafiBrand from "assets/images/irafi_brand.png";
import HamburgerMenu from "./HamburgerMenu";
import {
  handleErr,
  closeErrName
} from "store/modules/error/actions";
import ttf from "assets/images/ttf-logo.png";
import "../styles/Header.scss";

const getWindowDimensions = () => {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

const useWindowDimensions = () => {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}

const Header = (props) => {
  const { onChangeAccount } = props;

  const dispatch = useDispatch();
  const accounts = useSelector((state) => state.auth.accounts);
  const { height, width } = useWindowDimensions();

  const [selectAccount, setSelectAccount] = useState("");
  const [openExchange, setOpenExchange] = useState(false);

  useEffect(() => {
    if (accounts&&accounts.length > 0) {
      try {
        //ID_TODO: is this the logically correct Id to use here?
        const exchange = accounts[0].exchange;
        const clientAccountId = accounts[0].clientAccountId;
        const clientAccountName = accounts[0].clientAccountName;

        const value = `${exchange};${clientAccountId};${clientAccountName}`;
        setSelectAccount(value);

        dispatch(changeAccount({
          clientAccountId,
          exchange
        }))

        dispatch(closeErrName({ name: 'header-accounts-error' }));
      } catch (err) {
        dispatch(handleErr({
          data: {
            status: 'Failed',
            message: err.message
          },
          name: 'header-accounts-error'
        }));
      }      
    } else {
      setSelectAccount("");
    }
  }, [accounts]);

  const handleChange = (event) => {
    const { value } = event.target;
    setSelectAccount(value);

    //TODO: consider referencing items by: valueArray["name"] to improve general case handling
    const valueArray = value.split(";");
    const exchange = valueArray[0];
    const clientAccountId= valueArray[1];

    dispatch(changeAccount({
      clientAccountId,
      exchange
    }))
  };

  const handleChangeExchange = () => {
    setOpenExchange(state=>!state);
  }

  const handleChangeExchangeMobile = (value) => {
    setSelectAccount(value);

    setOpenExchange(false);

    //TODO: consider referencing items by: valueArray["name"] to improve general case handling
    const valueArray = value.split(";");
    const exchange = valueArray[0];
    const clientAccountId= valueArray[1];

    dispatch(changeAccount({
      clientAccountId,
      exchange
    }))
  }

  return (
    <header className="header">
      <div className="side-menu">
      </div>
      <div className="main-menu">
        <div className="header-icon">
          <img src={irafiBrand} alt="brand" width="180" />
        </div>
        <div className="header-summary">
          {
            accounts&&accounts.length > 0 && width > 576 && (
              <div className="account-summary">
                <div className="select">
                  <select
                    onChange={handleChange}
                    name="account"
                    value={selectAccount}
                  >
                    {//ID_TODO: is this logically the correct ID to use here?
                      accounts.map((item, index) => (
                        <option key={`${item.exchange}-${item.clientAccountId}-${index}`} value={`${item.exchange};${item.clientAccountId};${item.clientAccountName}`}>
                          {item.exchange} - {item.clientAccountId} - {item.clientAccountName}
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>
            )
          }
          {
            accounts&&accounts.length > 0 && width <= 576 && (
              <div className="account-summary-mobile">
                <div className="title" onClick={() => handleChangeExchange()}>
                  <span>
                    { selectAccount } 	&#11167;
                  </span>
                </div>
                {
                  openExchange ? 
                    <div className="title-menu">
                      {//ID_TODO: is this logically the correct ID to use here?
                        accounts.map((item, index) => (
                          <div 
                            key={`${item.exchange}-${item.clientAccountId}-${index}`} 
                            className="title-menu--item"
                            onClick={() => handleChangeExchangeMobile(`${item.exchange};${item.clientAccountId};${item.clientAccountName}`)}
                          >
                            <span 
                              style={{
                                fontWeight: selectAccount === `${item.exchange};${item.clientAccountId};${item.clientAccountName}` ? 'bold':'initial',
                                fontSize: selectAccount === `${item.exchange};${item.clientAccountId};${item.clientAccountName}` ? '13px':'12px',
                                color: selectAccount === `${item.exchange};${item.clientAccountId};${item.clientAccountName}` ? 'yellow':'white'
                              }}
                            >
                              {item.exchange} - {item.clientAccountId} - {item.clientAccountName}
                            </span>
                          </div>
                        ))
                      }
                    </div>:
                    <></>
                }
              </div>
            )
          }
          {
            accounts&&accounts.length === 0 && (
              <div className="account-error">
                <span>Sorry:  We found no valid accounts – please return to the main application and register a service request or engage the chat helper</span>
              </div>
            )
          }
        </div>
        <div className="header-icon ttf-image">
          <img src={ttf} alt="ttf" width="30" />
        </div>
      </div>
      <div className="side-menu">
        <HamburgerMenu />
      </div>
    </header>
  );
};

export default Header;
