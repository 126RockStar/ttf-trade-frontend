import React, { useState } from "react";
import Header from "./components/Header";
import NavBar from "./components/NavBar";

const UserLayout = (props) => {
  const { children } = props;

  return (
    <>
      <Header />
        <main>{children}</main>
      <NavBar />
    </>
  );
};

export default UserLayout;
