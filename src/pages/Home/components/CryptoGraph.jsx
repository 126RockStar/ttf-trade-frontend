import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Moment from "moment";
import { extendMoment } from "moment-range";
import Popup from "reactjs-popup";
import Highcharts from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";
import Icon from "react-crypto-icons";
import { getGraphData } from "services/candles-service";
import {
  handleErr,
  closeErrName
} from "store/modules/error/actions";
import { highChartOption } from "utils/highcharts.options";
import { currencyFormat } from "utils/homeTable";
import "../styles/CryptoGraph.scss";

require("highcharts/modules/exporting")(Highcharts);
require("highcharts/modules/export-data")(Highcharts);
highChartOption(Highcharts);

const moment = extendMoment(Moment);

const CryptoGraph = ({ symbol, userInfo, coinName, base }) => {
  const auth = useSelector((state) => state.auth);

  const dispatch = useDispatch();

  const [data, setData] = useState(null);
  const [timeFrame, setTimeFrame] = useState("1Y");
  const [timeFrameData, setTimeFrameData] = useState(null);
  const [minDate, setMinDate] = useState(null);
  const [maxDate, setMaxDate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [config, setConfig] = useState(null);
  const [salePrice, setSalePrice] = useState(0);

  useEffect(() => {
    if (auth.selectExchange) {
      async function fetchData() {
        setConfig(null);

        const res = await getGraphData({
          exchange: auth.selectExchange.exchange,
          tenantId: userInfo?.tenantId,
          //TODO: shouldn't need these
          //clientAccountId: userInfo?.clientAccountId,
          symbol: symbol,
          timeFrames: [
            { timeFrame: "1H" },
            { timeFrame: "1D" },
            { timeFrame: "1W" },
            { timeFrame: "1M" },
            { timeFrame: "3M" },
            { timeFrame: "6M" },
            { timeFrame: "1Y" },
            { timeFrame: "LiFE" },
          ],
        });

        if (res.data.status === "success") {
          dispatch(closeErrName({ name: 'cryptoGraph-getGraphData' }));

          try {
            const timeFrames = res.data.data[0].timeFrames;
            setData(timeFrames);

            const getSalePrice =
              timeFrames[0].candles.length !== 0
                ? timeFrames[0].candles[timeFrames[0].candles.length - 1][1]
                : 0;
            setSalePrice(getSalePrice);

            dispatch(closeErrName({ name: 'try-cryptoGraph-getGraphData' }));
          } catch (err) {
            dispatch(handleErr({
              data: {
                status: 'Failed',
                message: err.message
              },
              name: 'try-cryptoGraph-getGraphData'
            }));
          }          
        } else {
          dispatch(handleErr({ data: res.data, name: 'cryptoGraph-getGraphData'}));
        }
      }

      fetchData();

      const interval = setInterval(() => {
        fetchData();
      }, 30000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [symbol, userInfo?.clientAccountId, auth.selectExchange]);

  useEffect(() => {
    if (data) {
      try {
        if (data[0].candles.length === 0 ) {
          dispatch(handleErr({
            data: {
              status: 'Failed',
              message: 'Sorry, we are having problems with prices, Prices may be Zero for several minutes.'
            },
            name: 'cryptoGraph-candles-zero'
          }));

          return;
        }

        dispatch(closeErrName({ name: 'cryptoGraph-candles-zero' }));

        const timeFrameDataValue = data.find(
          (item) => item.timeFrame === timeFrame
        );
        setTimeFrameData(timeFrameDataValue);
        setStartDate(
          moment(
            timeFrameDataValue.candles.length !== 0
              ? timeFrameDataValue.candles[0][0]
              : ""
          ).format("YYYY-MM-DD")
        );
        setEndDate(
          moment(
            timeFrameDataValue.candles.length !== 0
              ? timeFrameDataValue.candles[
                  timeFrameDataValue.candles.length - 1
                ][0]
              : ""
          ).format("YYYY-MM-DD")
        );
  
        setMinDate(
          timeFrameDataValue.candles.length !== 0
            ? moment(timeFrameDataValue.candles[0][0]).format("YYYY-MM-DD")
            : ""
        );
        setMaxDate(
          moment(
            timeFrameDataValue.candles.length !== 0
              ? timeFrameDataValue.candles[
                  timeFrameDataValue.candles.length - 1
                ][0]
              : ""
          ).format("YYYY-MM-DD")
        );
  
        const customCandles = timeFrameDataValue.candles.map((item) => {
          return [item[0], item[1]];
        });
  
        if (timeFrame === "1H") {
          setConfig({
            xAxis: {
              tickInterval: 1 * 60 * 1000,
              type: "datetime",
              labels: {
                format: "{value: %b-%e-%y/%l:%M %p }",
                rotation: -35,
              },
            },
            yAxis: [
              {
                labels: {
                  style: {
                    color: "#B5B5B5",
                    fontSize: "12px",
                  },
                  align: "right",
                  x: 0,
                  y: -10,
                },
              },
            ],
            chart: {
              height: "400px",
              renderTo: "container",
              events: {
                load: function () {
                  const max = this.xAxis[0].max;
                  const min = this.xAxis[0].min;
  
                  this.xAxis[0].setExtremes(min, max);
  
                  const yMax = this.yAxis[0].dataMax;
                  const yMin = this.yAxis[0].dataMin;
  
                  this.yAxis[0].setExtremes(yMin, yMax);
                },
              },
            },
            navigator: {
              enabled: false,
            },
            rangeSelector: {
              enabled: false,
            },
            scrollbar: {
              enabled: false,
            },
            credits: {
              enabled: false,
            },
            exporting: {
              filename: "chart",
              buttons: {
                contextButton: {
                  align: 'right',
                  x: 0,
                  y: 0,
                  verticalAlign: 'bottom',
                  menuItems: [
                    "printChart",
                    "separator",
                    "downloadCSV",
                  ],
                },
              },
            },
            tooltip: {
              formatter: function () {
                return [
                  "<b>" + moment(this.x).format("MM-DD-YYYY/hh:mm A") + "</b>",
                ].concat(
                  this.points
                    ? this.points.map(function (point) {
                        return "<b>" + currencyFormat(point.y, "$") + "</b>";
                      })
                    : []
                );
              },
              split: true,
              style: {
                color: 'green'
              }
            },
            series: [
              {
                name: "",
                data: customCandles,
                type: "area",
                fillColor: {
                  linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1,
                  },
                  stops: [
                    [0, Highcharts.getOptions().colors[0]],
                    [
                      1,
                      Highcharts.color(Highcharts.getOptions().colors[0])
                        .setOpacity(0)
                        .get("rgba"),
                    ],
                  ],
                },
              },
            ],
          });
        } else if (timeFrame === "1W" || timeFrame === "1D") {
          setConfig({
            xAxis: {
              tickInterval: timeFrame === "1W" ? 60 * 60 * 1000 : 15 * 60 * 1000,
              type: "datetime",
              // labels: {
              //   formatter: function () {
              //     if (timeFrame === "1W") {
              //       return moment(this.value).format("MM-DD-YY hh:mm A");
              //     }
              //     if (timeFrame === "1D") {
              //       return moment(this.value).format("hh:mm A");
              //     }
              //   },
              //   rotation: -35,
              // },
              labels: {
                format: "{value: %b-%e-%y/%l:%M %p }",
                rotation: -35,
              },
            },
            yAxis: [
              {
                labels: {
                  style: {
                    color: "#B5B5B5",
                    fontSize: "12px",
                  },
                  align: "right",
                  x: 0,
                  y: -10,
                },
              },
            ],
            chart: {
              height: "400px",
              renderTo: "container",
              events: {
                load: function () {
                  const max = this.xAxis[0].max;
                  const min = this.xAxis[0].min;
  
                  this.xAxis[0].setExtremes(min, max);
  
                  const yMax = this.yAxis[0].dataMax;
                  const yMin = this.yAxis[0].dataMin;
  
                  this.yAxis[0].setExtremes(yMin, yMax);
                },
              },
            },
            navigator: {
              enabled: false,
            },
            rangeSelector: {
              enabled: false,
            },
            scrollbar: {
              enabled: false,
            },
            credits: {
              enabled: false,
            },
            exporting: {
              filename: "chart",
              buttons: {
                contextButton: {
                  align: 'right',
                  x: 0,
                  y: 0,
                  verticalAlign: 'bottom',
                  menuItems: [
                    "printChart",
                    "separator",
                    "downloadCSV",
                  ],
                },
              },
            },
            tooltip: {
              formatter: function () {
                return [
                  "<b>" + moment(this.x).format("MM-DD-YYYY/hh:mm A") + "</b>",
                ].concat(
                  this.points
                    ? this.points.map(function (point) {
                        return "<b>" + currencyFormat(point.y, "$") + "</b>";
                      })
                    : []
                );
              },
              split: true,
              style: {
                color: 'green'
              }
            },
            series: [
              {
                name: "",
                data: customCandles,
                type: "area",
                fillColor: {
                  linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1,
                  },
                  stops: [
                    [0, Highcharts.getOptions().colors[0]],
                    [
                      1,
                      Highcharts.color(Highcharts.getOptions().colors[0])
                        .setOpacity(0)
                        .get("rgba"),
                    ],
                  ],
                },
              },
            ],
          });
        } else {
          setConfig({
            xAxis: {
              type: "datetime",
              tickInterval: undefined,
              // labels: {
              //   formatter: function () {
              //     return moment(this.value).format("MM-DD-YY");
              //   },
              //   rotation: -35,
              // },
              labels: {
                format: "{value: %b-%e-%y/%l:%M %p }",
                rotation: -35,
              },
            },
            yAxis: [
              {
                labels: {
                  style: {
                    color: "#B5B5B5",
                    fontSize: "12px",
                  },
                  align: "right",
                  x: 0,
                  y: -10,
                },
              },
            ],
            chart: {
              height: "400px",
              renderTo: "container",
              events: {
                load: function () {
                  const max = this.xAxis[0].max;
                  const min = this.xAxis[0].min;
                  this.xAxis[0].setExtremes(min, max);
  
                  const yMax = this.yAxis[0].dataMax;
                  const yMin = this.yAxis[0].dataMin;
  
                  this.yAxis[0].setExtremes(yMin, yMax);
                },
              },
            },
            series: [
              {
                name: "",
                data: customCandles,
                type: "area",
                fillColor: {
                  linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1,
                  },
                  stops: [
                    [0, Highcharts.getOptions().colors[0]],
                    [
                      1,
                      Highcharts.color(Highcharts.getOptions().colors[0])
                        .setOpacity(0)
                        .get("rgba"),
                    ],
                  ],
                },
              },
            ],
            tooltip: {
              formatter: function () {
                return [
                  "<b>" + moment(this.x).format("MM-DD-YYYY/hh:mm A") + "</b>",
                ].concat(
                  this.points
                    ? this.points.map(function (point) {
                        return "<b>" + currencyFormat(point.y, "$") + "</b>";
                      })
                    : []
                );
              },
              split: true,
              style: {
                color: 'green'
              }
            },
            navigator: {
              enabled: false,
            },
            rangeSelector: {
              enabled: false,
            },
            scrollbar: {
              enabled: false,
            },
            credits: {
              enabled: false,
            },
            exporting: {
              filename: "chart",
              buttons: {
                contextButton: {
                  align: 'right',
                  x: 0,
                  y: 0,
                  verticalAlign: 'bottom',
                  menuItems: [
                    "printChart",
                    "separator",
                    "downloadCSV",
                  ],
                },
              },
            },
            responsive: {
              rules: [
                {
                  condition: {
                    maxWidth: 500,
                  },
                  chartOptions: {
                    legend: {
                      align: "center",
                      verticalAlign: "bottom",
                      layout: "horizontal",
                      enabled: false,
                    },
                    yAxis: {
                      labels: {
                        align: "right",
                        x: 0,
                        // y: -10,
                      },
                      title: {
                        text: null,
                      },
                    },
                    subtitle: {
                      text: null,
                    },
                    credits: {
                      enabled: false,
                    },
                  },
                },
              ],
            },
          });
        }

        dispatch(closeErrName({ name: 'try-cryptoGraph-timeFrame-effect' }));
      } catch (err) {
        dispatch(handleErr({
          data: {
            status: 'Failed',
            message: err.message
          },
          name: 'try-cryptoGraph-timeFrame-effect'
        }));
      }      
    }
  }, [timeFrame, data]);

  const handleChangeTimeFrame = (event) => {
    const { value } = event.target;
    setTimeFrame(value);
    setConfig(null);
  };

  const handleStartDateChange = (e) => {
    const { value } = e.target;
    setStartDate(value);
  };

  const handleEndDateChange = (e) => {
    const { value } = e.target;
    setEndDate(value);
    setTimeFrame("1Y");

    try {
      const timeFrameDataValue = data.find((item) => item.timeFrame === "1Y");
      setTimeFrameData(timeFrameDataValue);

      const filterCandles = timeFrameDataValue.candles.filter((item) => {
        const range = moment.range(startDate, value);
        if (range.contains(moment(item[0]))) {
          return true;
        } else {
          return false;
        }
      });
      const customCandles = filterCandles.map((item) => {
        return [item[0], item[1]];
      });

      setConfig({
        series: [
          {
            data: customCandles,
          },
        ],
      });

      dispatch(closeErrName({ name: 'try-cryptoGraph-endDateChange' }));
    } catch (err) {
      dispatch(handleErr({
        data: {
          status: 'Failed',
          message: err.message
        },
        name: 'try-cryptoGraph-endDateChange'
      }));
    }
  };
  
  return (
    <div className="graph-section">
      <div className="graph-section-title">
        <div className="graph-section-title-one">
          <div className="info-one">
            <div className="info-one--item">
              <Icon className="icon" name={String(base).toLowerCase()} />
            </div>
            <div>
              <span>{coinName}</span>
            </div>
          </div>
          <div className="info-two">
            <span>${Number(salePrice)}</span>
          </div>
        </div>
        <div className="info-three">
          <div
            style={{
              color:
                timeFrameData && timeFrameData.profitLossAmt > 0
                  ? "#84F766"
                  : "red",
            }}
          >
            <span>${timeFrameData && timeFrameData.profitLossAmt}</span>
          </div>
          <div
            style={{
              color:
                timeFrameData && timeFrameData.profitLossPct > 0
                  ? "#84F766"
                  : "red",
              marginLeft: "5px",
            }}
          >
            <span>({timeFrameData && timeFrameData.profitLossPct}%)</span>
          </div>
        </div>
      </div>
      {data && data[0].candles.length === 0 ? (
        <div className="graph-section-error">
          <div>
            <span>Sorry.</span>
          </div>
          <div>
            <span>We have no historical prices from the Exchange.</span>
          </div>
          <div>
            <span>This means the exchange data is rebuilding.</span>
          </div>
          <div>
            <span>This sometimes takes a few minutes, try again later.</span>
          </div>
          <div>
            <a href="#">
              Please enter a request for service from your IRAF service system
            </a>
          </div>
        </div>
      ) : (
        <div>
          <div className="graph-section-date">
            <div className="timeframe">
              <label htmlFor="range-1H">
                <input
                  type="radio"
                  className="range"
                  id="range-1H"
                  value="1H"
                  readOnly
                  checked={timeFrame === "1H"}
                  onChange={handleChangeTimeFrame}
                />
                <div className="range">1H</div>
              </label>
              <label htmlFor="range-1D">
                <input
                  type="radio"
                  className="range"
                  id="range-1D"
                  value="1D"
                  readOnly
                  checked={timeFrame === "1D"}
                  onChange={handleChangeTimeFrame}
                />
                <div className="range">1D</div>
              </label>
              <label htmlFor="range-1W">
                <input
                  type="radio"
                  className="range"
                  id="range-1W"
                  value="1W"
                  readOnly
                  checked={timeFrame === "1W"}
                  onChange={handleChangeTimeFrame}
                />
                <div className="range">1W</div>
              </label>
              <label htmlFor="range-1M">
                <input
                  type="radio"
                  className="range"
                  id="range-1M"
                  value="1M"
                  readOnly
                  checked={timeFrame === "1M"}
                  onChange={handleChangeTimeFrame}
                />
                <div className="range">1M</div>
              </label>
              <label htmlFor="range-3M">
                <input
                  type="radio"
                  className="range"
                  id="range-3M"
                  value="3M"
                  readOnly
                  checked={timeFrame === "3M"}
                  onChange={handleChangeTimeFrame}
                />
                <div className="range">3M</div>
              </label>
              <label htmlFor="range-6M">
                <input
                  type="radio"
                  className="range"
                  id="range-6M"
                  value="6M"
                  readOnly
                  checked={timeFrame === "6M"}
                  onChange={handleChangeTimeFrame}
                />
                <div className="range">6M</div>
              </label>
              <label htmlFor="range-1Y">
                <input
                  type="radio"
                  className="range"
                  id="range-1Y"
                  value="1Y"
                  readOnly
                  checked={timeFrame === "1Y"}
                  onChange={handleChangeTimeFrame}
                />
                <div className="range">1Y</div>
              </label>
              <label htmlFor="range-life">
                <input
                  type="radio"
                  className="range"
                  id="range-life"
                  value="LiFE"
                  readOnly
                  checked={timeFrame === "LiFE"}
                  onChange={handleChangeTimeFrame}
                />
                <div className="range">Life</div>
              </label>
            </div>
            {timeFrameData && (
              <div className="date-text">
                <Popup
                  trigger={
                    <div className="start-date">
                      <span>{startDate}</span>
                    </div>
                  }
                  open={false}
                  arrow={false}
                  position={["center right"]}
                  closeOnDocumentClick
                >
                  <input
                    type="date"
                    id="start"
                    name="trip-start"
                    value={startDate}
                    min={minDate}
                    max={maxDate}
                    onChange={handleStartDateChange}
                  ></input>
                </Popup>
                <div>
                  <span> - </span>
                </div>
                <Popup
                  trigger={
                    <div className="end-date">
                      <span>{endDate}</span>
                    </div>
                  }
                  arrow={false}
                  open={false}
                  position={["center right"]}
                  closeOnDocumentClick
                >
                  <input
                    type="date"
                    id="start"
                    name="trip-start"
                    value={endDate}
                    min={startDate}
                    max={maxDate}
                    onChange={handleEndDateChange}
                  ></input>
                </Popup>
              </div>
            )}
          </div>
          {config && (
            <HighchartsReact
              highcharts={Highcharts}
              constructorType={"stockChart"}
              options={config}
              allowChartUpdate={true}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default CryptoGraph;
