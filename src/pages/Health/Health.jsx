import React from "react";
import "./Health.scss";

const Health = ({ status }) => {

  return (
    <div className="health-page my-container">
      <h3>
        {
          status === 200 && 'All Good'
        }
        {
          status === 400 && 'Trading Down for maintenance'
        }
      </h3>
    </div>
  );
};

export default Health;
