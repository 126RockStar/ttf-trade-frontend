import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from '@mui/material/styles';
import { env } from "utils/globals.js";
import TradingIcon from "assets/images/trading_icon.png";
import ReportIcon from "assets/images/report_icon.png";
import HospitalIcon from "assets/images/hospital_icon.png";
import HelpIcon from "assets/images/help_icon.png";
import { closeErr, handleContinueErr } from "store/modules/error/actions";
import "../styles/NavBar.scss";

const LightTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: theme.shadows[1],
    fontSize: 11,
  },
}));

const NavBar = () => {
  const history = useHistory();
  const location = useLocation();

  const [currentPath, setCurrentPath] = useState();

  const error = useSelector((state) => state.error);
  const dispatch = useDispatch();

  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    const unlisten = history.listen((location) => {
      setCurrentPath(location.pathname);
    })
    return function cleanup() {
      unlisten()
    }
  }, [])

  useEffect(()=>{
    if (error.open) {
      const message = `${error.message} ${error.error}`; 
      setErrorMessage(message);
    }
  }, [error.open])

  const handleErrorClose = () => {
    dispatch(closeErr());
  }

  const handleContinue = () => {
    dispatch(handleContinueErr());
  }

  return (
    <nav className="lower-navbar">
      {
        error.open &&
          <div className="error-message">
            <div></div>
            <div className="message">
              <span>{errorMessage}</span>
            </div>
            <div className="action-bar">
              {/* <div>
                <button className="continue-btn" type="button" onClick={handleContinue}>Try again</button>
              </div> */}
              <div>
                <IconButton
                  color="inherit"
                  onClick={handleErrorClose}
                  aria-label="close"
                >
                  <CloseIcon style={{fontSize: '15px'}}/>
                </IconButton> 
              </div>
            </div>
          </div>
      }
      <LightTooltip title="Trading">
        <div 
          data-testid="home-btn" 
          className={env.REPORT_URL_TURN==='on'?'nav-item-four':'nav-item-three'} 
          style={{ background: location.pathname === '/home' ? '#ccd4ff':'#ffffff' }}
          onClick={() => history.push("/home")}
        >
            <img src={TradingIcon} alt="TradingIcon" width="40" />               
        </div>
      </LightTooltip>
      <LightTooltip title="History">
        <div 
          data-testid="account-btn" 
          className={env.REPORT_URL_TURN==='on'?'nav-item-four':'nav-item-three'} 
          style={{ background: location.pathname === '/account' ? '#ccd4ff':'#ffffff' }}
          onClick={() => history.push("/account")}
        >
          <img src={ReportIcon} alt="ReportIcon" width="40" />   
        </div>
      </LightTooltip>
      <LightTooltip title="Help">
        <div 
          data-testid="help-btn" 
          className={env.REPORT_URL_TURN==='on'?'nav-item-four':'nav-item-three'} 
          style={{ background: location.pathname === '/help' ? '#ccd4ff':'#ffffff' }}
          onClick={() => history.push("/help")}
        >
          <img src={HelpIcon} alt="ReportIcon" width="40" />   
        </div>
      </LightTooltip>
      {
        env.REPORT_URL_TURN==='on'&&
          <LightTooltip title="Issue">
            <div data-testid="report-btn" className={env.REPORT_URL_TURN==='on'?'nav-item-four':'nav-item-three'} onClick={() => window.open(env.REPORT_URL, '_blank')}>
              <img src={HospitalIcon} alt="HospitalIcon" width="40" />   
            </div>
          </LightTooltip>
      }
    </nav>
  );
};

export default NavBar;
