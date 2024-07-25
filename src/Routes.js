import React, { useEffect } from "react";
import { Switch, Route, Redirect } from 'react-router-dom';
import { useSelector } from "react-redux";
import {
  Button
} from "@mui/material";
import UserLayout from "layout/UserLayout/UserLayout.jsx";
import InitInfo from "./InitInfo.jsx";
import Loading from "pages/Loading/Loading.jsx";
import Account from "pages/Account/Account.jsx";
import Help from "pages/Help/Help.jsx";
import Home from "pages/Home/Home.jsx";
import Tutorial from "pages/Tutorial/Tutorial.jsx";
import Health from "./pages/Health/Health.jsx";

const Routes = () => {

  const userInfo = useSelector((state) => state.auth.userInfo);

  return (
    <InitInfo>
      <UserLayout>
        <Switch>
          <Redirect
            exact
            from='/'
            to='/home'
          />
          <Route path="/home">
            {userInfo ? <Home />:<Loading />}
          </Route>
          <Route path="/tutorial">
            <Tutorial />
          </Route>
          <Route path="/help">
            <Help />
          </Route>
          <Route path="/account">
            <Account />
          </Route>
          <Route
            path="/healthz"
            render={({ staticContext }) => {
              if (staticContext) {
                staticContext.statusCode = 200;
              }
              return <Health status={200} />;
            }}
          />
          <Route
            path="/healthz"
            render={({ staticContext }) => {
              if (staticContext) {
                staticContext.statusCode = 400;
              }
              return <Health status={400} />;
            }}
          />
        </Switch>
      </UserLayout>
    </InitInfo>
  );
};

export default Routes;
