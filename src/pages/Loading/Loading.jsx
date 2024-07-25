import React from "react";
import "./Loading.scss";

const Loading = (props) => {
  return (
    <>
      <div className="ring">
        Loading
        <span className="loading-span"></span>
      </div>
    </>
  );
};

export default Loading;
