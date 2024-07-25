import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import MenuIcon from "@mui/icons-material/Menu";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import TradingIcon from "assets/images/trading_icon.png";
import ReportIcon from "assets/images/report_icon.png";
import HospitalIcon from "assets/images/hospital_icon.png";
import {
  AiFillQuestionCircle,
  AiFillDollarCircle,
} from "react-icons/ai";
import { MdAccountBalanceWallet } from "react-icons/md";
import LogoutIcon from '@mui/icons-material/Logout';
import HelpIcon from "assets/images/help_icon.png";
import LogOutIcon from "assets/images/log_out_icon.png";
import { env } from "utils/globals.js";

export default function TemporaryDrawer() {
  const history = useHistory();
  const [currentPath, setCurrentPath] = useState();

  useEffect(() => {
    const unlisten = history.listen((location) => {
      setCurrentPath(location.pathname);
    });
    return function cleanup() {
      unlisten();
    };
  }, []);
  const [state, setState] = React.useState({
    right: false,
  });

  const toggleDrawer = (anchor, open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setState({ ...state, [anchor]: open });
  };

  const list = (anchor) => (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(anchor, false)}
      onKeyDown={toggleDrawer(anchor, false)}
    >
      <List>
				{
					env.REPORT_URL_TURN==='on'?
						["Trading", "History", "Help", "Issue", "Log out"].map((text, index) => (
							<ListItem key={text} disablePadding>
								<ListItemButton 
									onClick={() => {
										if (text === "Trading") {
											history.push("/home")
										}
										if (text === "History") {
											history.push("/account")
										}
										if (text === "Help") {
											history.push("/help")
										}
										if (text === "Issue") {
											window.open(env.REPORT_URL, '_blank')
										}
										if (text === "Log out") {
											const message = {
												ttfLogout: true
											};
											window.parent.postMessage(message, "*");
										}
									}}
								>
									<ListItemIcon>
										{text === "Trading" && <img src={TradingIcon} alt="TradingIcon" width="40" />}
										{text === "History" && <img src={ReportIcon} alt="ReportIcon" width="35" />}
										{text === "Help" && <img src={HelpIcon} alt="ReportIcon" width="35" />}
										{text === "Issue" && <img src={HospitalIcon} alt="HospitalIcon" width="35" />}
										{text === "Log out" && <img src={LogOutIcon} alt="ReportIcon" width="35" />}
									</ListItemIcon>
									<ListItemText primary={text} />
								</ListItemButton>
							</ListItem>
						)):
						["Trading", "History", "Help", "Log out"].map((text, index) => (
							<ListItem key={text} disablePadding>
								<ListItemButton
									onClick={() => {
										if (text === "Trading") {
											history.push("/home")
										}
										if (text === "History") {
											history.push("/account")
										}
										if (text === "Help") {
											history.push("/help")
										}
										if (text === "Log out") {
											const message = {
												ttfLogout: true
											};
											window.parent.postMessage(message, "*");
										}
									}}
								>
									<ListItemIcon>
										{text === "Trading" && <img src={TradingIcon} alt="TradingIcon" width="40" />}
										{text === "History" && <img src={ReportIcon} alt="ReportIcon" width="35" />}
										{text === "Help" && <img src={HelpIcon} alt="ReportIcon" width="35" />}
										{text === "Log out" && <img src={LogOutIcon} alt="ReportIcon" width="35" />}
									</ListItemIcon>
									<ListItemText primary={text} />
								</ListItemButton>
							</ListItem>
						))
				}
      </List>
    </Box>
  );

  return (
    <div>
      {["right"].map((anchor) => (
        <React.Fragment key={anchor}>
          <IconButton aria-label="delete" onClick={toggleDrawer(anchor, true)}>
            <MenuIcon style={{ color: "white" }} />
          </IconButton>
          <Drawer
            anchor={anchor}
            open={state[anchor]}
            onClose={toggleDrawer(anchor, false)}
          >
            {list(anchor)}
          </Drawer>
        </React.Fragment>
      ))}
    </div>
  );
}
