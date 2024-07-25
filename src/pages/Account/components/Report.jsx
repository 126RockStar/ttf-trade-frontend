import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { Template, TemplatePlaceholder } from "@devexpress/dx-react-core";
import {
  GroupingState,
  IntegratedGrouping,
  IntegratedSummary,
  SummaryState,
} from "@devexpress/dx-react-grid";
import {
  DragDropProvider,
  Grid,
  Table,
  TableColumnVisibility,
  TableGroupRow,
  TableHeaderRow,
  Toolbar,
} from "@devexpress/dx-react-grid-material-ui";
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  Fade,
  InputLabel,
  FormControl,
  Select,
  Typography
} from "@mui/material";
import Popup from "reactjs-popup";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Moment from "moment";
import { extendMoment } from "moment-range";
import { dynamicExpand } from "utils/dynamicExpand";
import { getExchangeOrders } from "services/order-service";
import {
  handleErr,
  closeErrName
} from "store/modules/error/actions";
import "../styles/Report.scss";

const moment = extendMoment(Moment);

const headers = [
  { label: "Date", key: "date" },
  { label: "Month", key: "month" },
  { label: "Year", key: "year" },
  { label: "Time", key: "time" },
  { label: "Timestamp", key: "timestamp" },
  { label: "Pair", key: "pair" },
  { label: "Transaction", key: "transaction" },
  { label: "Side", key: "side" },
  { label: "Amount", key: "amount" },
  { label: "Price", key: "price" },
  { label: "Fee", key: "fee" },
  { label: "Cost", key: "cost" },
  { label: "Total", key: "total" },
  { label: "Value Today", key: "valueToday" },
];

const columns = [
  { name: "status", title: "Status" },
  { name: "year", title: "Year" },
  { name: "date", title: "Date" },
  { name: "month", title: "Month" },
  { name: "pair", title: "Pair" },
  { name: "space", title: " " },
  { name: "time", title: "Time" },
  { name: "transaction", title: "Transaction" },
  { name: "side", title: "Side" },
  { name: "amount", title: "Amount" },
  { name: "price", title: "Price" },
  { name: "cost", title: "Cost" },
  { name: "fee", title: "Fee" },
  { name: "total", title: "Total" },
  { name: "valueToday", title: "Value Today" },
];

const styles = {
  year: {
    backgroundColor: "#379EFB",
  },
  month: {
    backgroundColor: "#61B3FC",
  },
  date: {
    backgroundColor: "#9DCFFD",
  },
  pair: {
    backgroundColor: "#CAF7C4",
  },
  transaction: {
    backgroundColor: "#F8C6C2",
  },
  side: {
    backgroundColor: "#FAC0FA",
  },
};

const stylesBetId = {
  year: {
    backgroundColor: "#0475DB",
    color: "#000000",
  },
  month: {
    backgroundColor: "#0485F9",
    color: "#000000",
  },
  date: {
    backgroundColor: "#2696FB",
    color: "#000000",
  },
  pair: {
    backgroundColor: "#50E43A",
    color: "#000000",
  },
  transaction: {
    backgroundColor: "#EC665B",
    color: "#000000",
  },
  side: {
    backgroundColor: "#F25EF2",
    color: "#000000",
  },
};

const StatusComponent = ({ status }) => {

  const [open, setOpen] = useState(true);

  return (
    <>
      {
        open ?
          <div className='w-100'>
            <div className='d-flex justify-content-between'>
              <div className='d-flex align-items-center'>
                <div>
                  <span>{status.type}</span>
                </div>
                {
                  (status.type==='error' || status.type==='pending') &&
                    <div style={{ cursor: 'pointer' }} onClick={() => setOpen(false)}>
                      <KeyboardArrowRightIcon />
                    </div>
                }
              </div>
            </div>
          </div> :
          <div className='w-100'>
            <div className='d-flex justify-content-between'>
              <div className='d-flex align-items-center'>
                <div>
                  <span>{status.type}</span>
                </div>
                <div style={{ cursor: 'pointer' }} onClick={() => setOpen(true)}>
                  <KeyboardArrowDownIcon />
                </div>
              </div>
            </div>
            <div className='d-flex justify-content-between' style={{ color: 'gray' }}>
              <div className='ml-1'>
                <span style={{'white-space':'initial'}}>{status.message}</span>
              </div>
            </div>
          </div>
      }
    </>
  )
}

const TableCell = (props) => {
  const { style, column, value, ...restProps } = props;

  let customValue = `${!Number.isNaN(Number(value)) ? Number(value) : ""}`;

  return (
    <Table.Cell
      {...restProps}
      style={{
        paddingTop: 5,
        paddingBottom: 5,
        ...style,
      }}
    >
      {column.name === "status" && <StatusComponent status={value} /> }
      {/* {column.name === "status" && <span>{value.message}</span> } */}
      {column.name === "date" && <span>{value}</span>}
      {column.name === "total" && (
        <span style={{ color: Number(customValue) > 0 ? "green" : "red" }}>
          ${!Number.isNaN(Number(value)) ? Number(value).toFixed(4) : ""}
        </span>
      )}
      {column.name === "time" && (
        <span style={{ fontWeight: "bold" }}>{value}</span>
      )}
      {column.name === "transaction" && (
        <span style={{ fontWeight: "bold" }}>
          {String(value).toUpperCase()}
        </span>
      )}
      {column.name === "side" && (
        <span
          style={{
            color: value === "buy" || value === "in" ? "green" : "red",
            fontWeight: "bold",
          }}
        >
          {String(value).toUpperCase()}
        </span>
      )}
      {column.name === "amount" && (
        <span style={{ color: Number(customValue) > 0 ? "green" : "red" }}>
          {!Number.isNaN(Number(value)) ? Number(value).toFixed(8) : ""}
        </span>
      )}
      {column.name === "price" && (
        <span style={{ color: Number(customValue) > 0 ? "green" : "red" }}>
          ${!Number.isNaN(Number(value)) ? Number(value).toFixed(8) : ""}
        </span>
      )}
      {column.name === "cost" && (
        <span style={{ color: Number(customValue) > 0 ? "green" : "red" }}>
          ${!Number.isNaN(Number(value)) ? Number(value).toFixed(4) : ""}
        </span>
      )}
      {column.name === "fee" && (
        <span style={{ color: Number(customValue) > 0 ? "green" : "red" }}>
          ${!Number.isNaN(Number(value)) ? Number(value).toFixed(4) : ""}
        </span>
      )}
      {column.name === "valueToday" && <span></span>}
    </Table.Cell>
  );
};

const GroupTableRow = (props) => {
  const { row, column, expanded, ...restProps } = props;

  return (
    <Table.Row
      {...restProps}
      style={{
        cursor: "pointer",
        height: 0,
        ...styles[String(row.groupedBy).toLowerCase()],
      }}
    />
  );
};

const GroupTableCell = (props) => {
  const {
    style,
    colSpan,
    row,
    column,
    expanded,
    onToggle,
    classes,
    children,
    className,
    tableRow,
    tableColumn,
    inlineSummaries,
    contentComponent,
    iconComponent,
    containerComponent,
    inlineSummaryComponent,
    inlineSummaryItemComponent,
    getMessage,
    grouping,
    data,
    ...restProps
  } = props;

  const handleClick = () => onToggle();
  const columnToStyleName = String(column.title)
    .toLowerCase()
    .replace(" ", "_");

  return (
    <Table.Cell
      {...restProps}
      colSpan={colSpan}
      style={{
        ...style,
        paddingTop: 0,
        paddingBottom: 0,
      }}
      onClick={handleClick}
    >
      <IconButton size="small">
        {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
      </IconButton>
      <span
        style={{
          color: stylesBetId[columnToStyleName].color,
          background: stylesBetId[columnToStyleName].backgroundColor,
          padding: "2px 15px",
          borderRadius: "15px",
        }}
      >
        {children || column.title}
      </span>
      <span
        className="text-capitalize"
        style={{
          marginLeft: "15px",
          fontWeight: "bold",
          color: stylesBetId[columnToStyleName].color,
        }}
      >
        {children || row.value}
      </span>
    </Table.Cell>
  );
};

const getGroupChildernAmount = (compoundKey, grouping, data) => {
  const valueArray = String(compoundKey).split("|");

  let tempArray = data;
  valueArray.forEach((value, index) => {
    const key = grouping[index].columnName;
    tempArray = tempArray.filter((b) => b[key] === value);
  });

  const reducer = (accumulator, curr) => accumulator + curr;

  const b = tempArray.map((c) => c.amount);

  if (b.length === 0) {
    return 0;
  } else {
    const bb = b.reduce(reducer);

    return bb;
  }
};

const SummaryCell = (props) => {
  const {
    colSpan,
    row,
    column,
    children,
    grouping,
    data,
    style,
    cryptoPrices,
    groupControl,
  } = props;

  const compoundKey = props.row.compoundKey;
  const compoundKeyValues = compoundKey.split("|");

  let filterData = data.filter(item=>{
    if (compoundKeyValues.length === 1) {
      return item[grouping[0].columnName] === compoundKeyValues[0] &&
        item.status !== "error" &&
        item.status !== "pending"
    }

    if (compoundKeyValues.length === 2) {
      return item[grouping[0].columnName] === compoundKeyValues[0] &&
        item[grouping[1].columnName] === compoundKeyValues[1] &&
        item.status !== "error" &&
        item.status !== "pending"
    }

    if (compoundKeyValues.length === 3) {
      return item[grouping[0].columnName] === compoundKeyValues[0] &&
        item[grouping[1].columnName] === compoundKeyValues[1] &&
        item[grouping[2].columnName] === compoundKeyValues[2] &&
        item.status !== "error" &&
        item.status !== "pending"
    }

    if (compoundKeyValues.length === 4) {
      return item[grouping[0].columnName] === compoundKeyValues[0] &&
        item[grouping[1].columnName] === compoundKeyValues[1] &&
        item[grouping[2].columnName] === compoundKeyValues[2] &&
        item[grouping[3].columnName] === compoundKeyValues[3] &&
        item.status !== "error" &&
        item.status !== "pending"
    }

    if (compoundKeyValues.length === 5) {
      return item[grouping[0].columnName] === compoundKeyValues[0] &&
        item[grouping[1].columnName] === compoundKeyValues[1] &&
        item[grouping[2].columnName] === compoundKeyValues[2] &&
        item[grouping[3].columnName] === compoundKeyValues[3] &&
        item[grouping[4].columnName] === compoundKeyValues[4] &&
        item.status !== "error" &&
        item.status !== "pending"
    }
  })


  let summaryDataAmount;

  let amount = filterData.reduce((accumulator, object) => {
    return accumulator + object.amount;
  }, 0);

  let cost = filterData.reduce((accumulator, object) => {
    if (object.amount !== 0) {
      return accumulator + object.cost;
    } else {
      return accumulator + 0;
    }    
  }, 0);
  
  let fee = filterData.reduce((accumulator, object) => {
    if (object.status.type !== 'canceled') {
      return accumulator + object.fee;
    } else if (object.amount !== 0){
      return accumulator + object.fee;
    } else {
      return accumulator + 0;
    }
  }, 0);

  let total = filterData.reduce((accumulator, object) => {
    if (object.amount !== 0) {
      return accumulator + object.total;
    } else {
      return accumulator + 0;
    }
  }, 0);
  
  let valueToday;

  if (column.name === "valueToday") {
    summaryDataAmount = getGroupChildernAmount(compoundKey, grouping, data);

    const valueArray = String(compoundKey).split("|");
    let pairValue = "";
    valueArray.forEach((value, index) => {
      const key = grouping[index].columnName;
      if (key === "pair") {
        pairValue = value;
      }
    });

    if (pairValue !== "") {
      valueToday = `$${Number(
        cryptoPrices.find((item) => item.symbol === pairValue).currentPrice *
          summaryDataAmount
      ).toFixed(2)}`;
    }
  }

  if (groupControl === "date-pair") {
    if (
      row.groupedBy === "date" ||
      row.groupedBy === "month" ||
      row.groupedBy === "year"
    ) {
      amount = "";
      valueToday = "";
    }
  }

  if (groupControl === "pair-date") {
    // pass
  }

  if (groupControl === "transaction-pair-date") {
    if (row.groupedBy === "transaction") {
      amount = "";
      valueToday = "";
    }
  }

  if (groupControl === "transaction-date-pair") {
    if (
      row.groupedBy === "transaction" ||
      row.groupedBy === "date" ||
      row.groupedBy === "month" ||
      row.groupedBy === "year"
    ) {
      amount = "";
      valueToday = "";
    }
  }

  if (groupControl === "side-date-pair") {
    if (
      row.groupedBy === "side" ||
      row.groupedBy === "date" ||
      row.groupedBy === "month" ||
      row.groupedBy === "year"
    ) {
      amount = "";
      valueToday = "";
    }
  }

  return (
    <Table.Cell
      colSpan={colSpan}
      style={{
        ...style,
        paddingTop: 0,
        paddingBottom: 0,
        fontWeight: "bold",
      }}
      {...props.restProps}
    >
      {column.name === "amount" && (
        <span style={{ color: Number(amount) > 0 ? "green" : "red" }}>
          {amount !== "" ? Number(amount).toFixed(8) : ""}
        </span>
      )}
      {column.name === "fee" && row.groupedBy !== "transaction" && (
        <span
          style={{
            color:
              Number(fee) > 0
                ? "green"
                : "red",
          }}
        >
          ${Number(fee).toFixed(4)}
        </span>
      )}
      {column.name === "cost" && (
        <span
          style={{ color: Number(cost) > 0 ? "green" : "red" }}
        >
          ${Number(cost).toFixed(4)}
        </span>
      )}
      {column.name === "total" && (
        <span
          style={{
            color: Number(total) > 0 ? "green" : "red",
          }}
        >
          ${Number(total).toFixed(4)}
        </span>
      )}
      {column.name === "valueToday" && (
        <span
          style={{
            color: Number(valueToday.replace("$", "")) > 0 ? "green" : "red",
          }}
        >
          {valueToday}
        </span>
      )}
    </Table.Cell>
  );
};

const Report = ({ cryptoPrices }) => {
  const dispatch = useDispatch();

  const auth = useSelector((state) => state.auth);
  const userInfo = useSelector((state) => state.auth.userInfo);

  const [initData, setInitData] = useState(null);
  const [data, setData] = useState(null);
  const [grouping, setGrouping] = useState([
    { columnName: "date" },
    { columnName: "pair" },
  ]);
  const [hiddenColumnNames] = useState([
    "month",
    "year",
    "valueToday",
  ]);
  const [groupingStateColumnExtensions] = useState([
    { columnName: "time", groupingEnabled: false },
    { columnName: "amount", groupingEnabled: false },
    { columnName: "price", groupingEnabled: false },
    { columnName: "fee", groupingEnabled: false },
    { columnName: "cost", groupingEnabled: false },
    { columnName: "valueToday", groupingEnabled: false },
  ]);

  const [groupSummaryItems] = useState([
    {
      columnName: "amount",
      type: "sum",
      showInGroupFooter: false,
      alignByColumn: true,
    },
    {
      columnName: "fee",
      type: "sum",
      showInGroupFooter: false,
      alignByColumn: true,
    },
    {
      columnName: "cost",
      type: "sum",
      showInGroupFooter: false,
      alignByColumn: true,
    },
    {
      columnName: "total",
      type: "sum",
      showInGroupFooter: false,
      alignByColumn: true,
    },
    {
      columnName: "valueToday",
      type: "sum",
      showInGroupFooter: false,
      alignByColumn: true,
    },
  ]);

  const [expandedGroup, setExpandedGroup] = useState([]);

  const [period, setPeriod] = useState("all-years");
  const [startDate, setStartDate] = useState(
    moment().isoWeekday(1).format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(
    moment().isoWeekday(7).format("YYYY-MM-DD")
  );

  const [groupControl, setGroupControl] = useState("date-pair");
  const [groupDate, setGroupDate] = useState("date"); // year, month, date;

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const [csvFileName, setCSVFileName] = useState("");

  useEffect(() => {
    if (auth.changeAccount && userInfo) {
      async function fetchData() {
        const res = await getExchangeOrders(
          auth.changeAccount.exchange
        );

        if (res.data.status === "success") {
          dispatch(closeErrName({ name: 'report-getExchangeOrders' }));

          try {
            const filterExchangeOrders = res.data.data.filter(
              (item) => item.typeInstance.orderId !== null
            );
  
            const orders = filterExchangeOrders.map((item) => {
              let transaction; // trade, deposit, withdrawal (summary)
              if(item.type == "tradeOrder") transaction = "trade";
              else if(item.type == "transfer") transaction = "transfer";
              else transaction = "";
              const customCost = Number.isNaN(Number(item.typeInstance.cost || (item.typeInstance.value||0)*(item.amount||0)))
                ? 0
                : Number(item.typeInstance.cost|| (item.typeInstance.value||0)*(item.amount||0));
              const customeSvcCost = Number.isNaN(Number(item.fee.svcCost))
                ? 0
                : Number(item.fee.svcCost) ;
  
              let errorMessage = '';
              if (item.status === 'pending' || item.status === 'error') {
                errorMessage = item.error?item.error.name ? item.error.name:item.error.message:'';
              }
              let amt;
              if(transaction == "trade") {
                if(item.typeInstance.side === "sell") {//|| transaction === "withdrawal") 
                  if (item.status === 'pending') {
                    amt = 0 - Number(item.amount);
                  } else {
                    amt = 0 - Number(item.typeInstance.filled);
                  }                  
                } else {
                  if (item.status === 'pending') {
                    amt = Number(item.amount);
                  } else {
                    amt = Number(item.typeInstance.filled);
                  }                  
                }
              } else if( transaction == "transfer") {
                if(item.typeInstance.direction === "in"){
                  amt = Number(item.amount);
                } else {
                  amt = 0 - Number(item.amount);
                }
              }
              return {
                status: { type: item.status, message: errorMessage },
                date: `${moment(item.datetime).format("YYYY-MM-DD")}`,              
                month: `${moment(item.datetime).format("YYYY-MM")}`,
                year: `${moment(item.datetime).format("YYYY")}`,
                time: `${moment(item.datetime).format("hh:mm:ss A")}`,
                timestamp: item.datetime,
                pair: item.symbol,
                transaction: transaction,
                side: item.typeInstance.side || item.typeInstance.direction,
                amount: amt,
                price: item.status == "error" ? item.typeInstance.price : transaction === "trade" ? item.typeInstance.average : transaction === 'transfer'? item.typeInstance.value : null,
                fee: item.status == "error" ? 0 : item.fee.svcCost
                  ? Number(item.fee.svcCost)
                  : 0, //?
                cost: item.status == "error" ? 0 : item.typeInstance.side === "sell" || item.typeInstance.direction === "out"//|| transaction === "withdrawal"
                    ? 0 - Number(customCost)
                    : Number(customCost),
                total:
                  item.status == "error" ? 0 : item.typeInstance.side === "sell" || item.typeInstance.direction === "out" //|| transaction === "withdrawal"
                    ? -1 * (Number(customCost) - Number(customeSvcCost))
                    : Number(customCost) + Number(customeSvcCost),
                valueToday: 0,
              };
            });
  
            let filterOrders;
            
            if (auth.adminPermissions) {
              const checkAdminPermission = auth.adminPermissions.find((item) => item === "AccountDiagnostics");
  
              if (checkAdminPermission) {
                filterOrders = orders;              
              } else {
                filterOrders = orders.filter(item=>item.status !== 'pending' && item.status !== 'error');
              }
            } else {
              const checkUserPermission = auth.userInfo.permissions.find((item) => item === "AccountDiagnostics");
  
              if (checkUserPermission) {
                filterOrders = orders;
              } else {              
                filterOrders = orders.filter(item=>item.status !== 'pending' && item.status !== 'error');
              }
            }
  
            setInitData(filterOrders);
  
            const sDate = moment("1/1/1970").format("YYYY-MM-DD");
            const eDate = moment("1/1/2099").format("YYYY-MM-DD");
            setStartDate(sDate);
            setEndDate(eDate);
  
            const range = moment.range(sDate, eDate);
            const updateOrders = filterOrders.filter((item) =>
              range.contains(moment(item.date))
            );
  
            setData(updateOrders);

            dispatch(closeErrName({ name: 'try-report-getExchangeOrders' }));
          } catch (err) {
            dispatch(handleErr({
              data: {
                status: 'Failed',
                message: err.message
              },
              name: 'try-report-getExchangeOrders'
            }));
          }
        } else {
          dispatch(handleErr({ data: res.data, name: 'report-getExchangeOrders'}));
        }
      }
      fetchData();
      //ID_TODO: seems like this Id may be better served by the exchangeID
      const getCSVFileName =
        auth.changeAccount.exchange +
        "_" +
        userInfo.clientAccountId +
        "_TransactionDetail_" +
        moment().format("YYYY-MM-DD") +
        ".csv";
      setCSVFileName(getCSVFileName);
    }
  }, [auth.changeAccount, userInfo]);

  useEffect(() => {
    let sDate, eDate;
    if (initData) {
      if (period === "this-week") {
        sDate = moment().isoWeekday(1).format("YYYY-MM-DD");
        eDate = moment().isoWeekday(7).format("YYYY-MM-DD");
        setStartDate(sDate);
        setEndDate(eDate);

        const range = moment.range(sDate, eDate);
        const updateOrders = initData.filter((item) =>
          range.contains(moment(item.date))
        );

        setData(updateOrders);
      }
      if (period === "last-week") {
        sDate = moment().isoWeekday(-6).format("YYYY-MM-DD");
        eDate = moment().isoWeekday(0).format("YYYY-MM-DD");
        setStartDate(sDate);
        setEndDate(eDate);

        const range = moment.range(sDate, eDate);
        const updateOrders = initData.filter((item) =>
          range.contains(moment(item.date))
        );

        setData(updateOrders);
      }
      if (period === "this-month") {
        sDate = moment().startOf("month").format("YYYY-MM-DD");
        eDate = moment().endOf("month").format("YYYY-MM-DD");
        setStartDate(sDate);
        setEndDate(eDate);

        const range = moment.range(sDate, eDate);
        const updateOrders = initData.filter((item) =>
          range.contains(moment(item.date))
        );

        setData(updateOrders);
      }
      if (period === "last-month") {
        sDate = moment()
          .subtract(1, "months")
          .startOf("month")
          .format("YYYY-MM-DD");
        eDate = moment()
          .subtract(1, "months")
          .endOf("month")
          .format("YYYY-MM-DD");
        setStartDate(sDate);
        setEndDate(eDate);

        const range = moment.range(sDate, eDate);
        const updateOrders = initData.filter((item) =>
          range.contains(moment(item.date))
        );

        setData(updateOrders);
      }
      if (period === "this-quarter") {
        sDate = moment()
          .quarter(moment().quarter())
          .startOf("quarter")
          .format("YYYY-MM-DD");
        eDate = moment()
          .quarter(moment().quarter())
          .endOf("quarter")
          .format("YYYY-MM-DD");
        setStartDate(sDate);
        setEndDate(eDate);

        const range = moment.range(sDate, eDate);
        const updateOrders = initData.filter((item) =>
          range.contains(moment(item.date))
        );

        setData(updateOrders);
      }
      if (period === "last-quarter") {
        sDate = moment()
          .quarter(moment().quarter() - 1)
          .startOf("quarter")
          .format("YYYY-MM-DD");
        eDate = moment()
          .quarter(moment().quarter() - 1)
          .endOf("quarter")
          .format("YYYY-MM-DD");
        setStartDate(sDate);
        setEndDate(eDate);

        const range = moment.range(sDate, eDate);
        const updateOrders = initData.filter((item) =>
          range.contains(moment(item.date))
        );

        setData(updateOrders);
      }
      if (period === "this-year") {
        sDate = moment().startOf("year").format("YYYY-MM-DD");
        eDate = moment().endOf("year").format("YYYY-MM-DD");
        setStartDate(sDate);
        setEndDate(eDate);

        const range = moment.range(sDate, eDate);
        const updateOrders = initData.filter((item) =>
          range.contains(moment(item.date))
        );

        setData(updateOrders);
      }
      if (period === "last-year") {
        sDate = moment()
          .subtract(1, "year")
          .startOf("year")
          .format("YYYY-MM-DD");
        eDate = moment().subtract(1, "year").endOf("year").format("YYYY-MM-DD");
        setStartDate(sDate);
        setEndDate(eDate);

        const range = moment.range(sDate, eDate);
        const updateOrders = initData.filter((item) =>
          range.contains(moment(item.date))
        );

        setData(updateOrders);
      }
      if (period === "all-years") {
        sDate = moment("1/1/1970").format("YYYY-MM-DD");
        eDate = moment("1/1/2099").format("YYYY-MM-DD");
        setStartDate(sDate);
        setEndDate(eDate);

        const range = moment.range(sDate, eDate);
        const updateOrders = initData.filter((item) =>
          range.contains(moment(item.date))
        );

        setData(updateOrders);
      }
    }
  }, [period]);

  const expandClick = () => {
    if (expandedGroup.length === 0) {
      const dateUnique = data
        .map((a) => a.date)
        .filter((value, index, self) => self.indexOf(value) === index);
      const monthUnique = data
        .map((a) => a.month)
        .filter((value, index, self) => self.indexOf(value) === index);
      const yearUnique = data
        .map((a) => a.year)
        .filter((value, index, self) => self.indexOf(value) === index);
      const pairUnique = data
        .map((a) => a.pair)
        .filter((value, index, self) => self.indexOf(value) === index);
      const transactionUnique = data
        .map((a) => a.transaction)
        .filter((value, index, self) => self.indexOf(value) === index);
      const sideUnique = data
        .map((a) => a.side)
        .filter((value, index, self) => self.indexOf(value) === index);

      const initData = {
        date: dateUnique,
        month: monthUnique,
        year: yearUnique,
        pair: pairUnique,
        transaction: transactionUnique,
        side: sideUnique,
      };

      const cusGrouping = grouping.map((item) => item.columnName);

      const mergeData = dynamicExpand(initData, cusGrouping);

      setExpandedGroup(mergeData);
    } else {
      setExpandedGroup([]);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExportSummary = () => {
    const report = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [1600, 1200],
    });

    let periodText;

    if (period === "this-week") {
      periodText = `Period: This Week (${startDate} - ${endDate})`;
    }

    if (period === "last-week") {
      periodText = `Period: Last Week (${startDate} - ${endDate})`;
    }

    if (period === "this-month") {
      periodText = `Period: This Month (${startDate} - ${endDate})`;
    }

    if (period === "last-month") {
      periodText = `Period: Last Month (${startDate} - ${endDate})`;
    }

    if (period === "this-quarter") {
      periodText = `Period: This Quarter (${startDate} - ${endDate})`;
    }

    if (period === "last-quarter") {
      periodText = `Period: Last Quarter (${startDate} - ${endDate})`;
    }

    if (period === "this-year") {
      periodText = `Period: This Year (${startDate} - ${endDate})`;
    }

    if (period === "last-year") {
      periodText = `Period: Last Year (${startDate} - ${endDate})`;
    }

    if (period === "all-years") {
      periodText = `Period: All Years (${startDate} - ${endDate})`;
    }

    let summaryText;

    if (groupDate === "none") {
      summaryText = `Date Summary: None`;
    }

    if (groupDate === "date") {
      summaryText = `Date Summary: Date`;
    }

    if (groupDate === "month") {
      summaryText = `Date Summary: Month`;
    }

    if (groupDate === "year") {
      summaryText = `Date Summary: Year`;
    }

    let groupText;

    if (groupControl === "date-pair") {
      groupText = `Grouping: Date -> Pair`;
    }

    if (groupControl === "pair-date") {
      groupText = `Grouping: Pair -> Date`;
    }

    if (groupControl === "transaction-pair-date") {
      groupText = `Grouping: Transaction -> Pair -> Date`;
    }

    if (groupControl === "transaction-date-pair") {
      groupText = `Grouping: Transaction -> Date -> Pair`;
    }

    if (groupControl === "side-date-pair") {
      groupText = `Grouping: Side -> Date -> Pair`;
    }

    report.setFontSize(20);
    report.text(50, 35, periodText);
    report.text(50, 60, summaryText);
    report.text(50, 85, groupText);

    const opt = {
      margin: [90, 0, 50, 0],
    };

    report
      .html(document.querySelector(".TableContainer-root"), opt)
      .then(() => {
        //ID_TODO: seems like this Id may be better served by the exchangeID
        const fileName =
          auth.changeAccount.exchange +
          "_" +
          userInfo.clientAccountId +
          "_TransactionSummary_" +
          moment().format("YYYY-MM-DD") +
          ".pdf";

        report.save(fileName);

        handleClose();
      });
  };

  const expandedGroupsChange = (expandedGroups) => {
    setExpandedGroup(expandedGroups);
  };

  const handlePeriodChange = (event) => {
    const { value } = event.target;
    setPeriod(value);
  };

  const handleStartDateChange = (e) => {
    const { value } = e.target;
    setStartDate(value);
  };

  const handleEndDateChange = (e) => {
    const { value } = e.target;
    setEndDate(value);
  };

  const handleApplyClick = () => {
    const range = moment.range(startDate, endDate);
    const updateOrders = initData.filter((item) =>
      range.contains(moment(item.date))
    );

    setData(updateOrders);
  };

  const handleGroupChange = (event) => {
    const { value } = event.target;
    setGroupControl(value);

    setExpandedGroup([]);

    if (value === "date-pair") {
      if (groupDate === "none") {
        setGrouping([{ columnName: "pair" }]);
      }

      if (groupDate === "date") {
        setGrouping([{ columnName: "date" }, { columnName: "pair" }]);
      }

      if (groupDate === "month") {
        setGrouping([
          { columnName: "month" },
          { columnName: "date" },
          { columnName: "pair" },
        ]);
      }

      if (groupDate === "year") {
        setGrouping([
          { columnName: "year" },
          { columnName: "month" },
          { columnName: "date" },
          { columnName: "pair" },
        ]);
      }
    }

    if (value === "pair-date") {
      if (groupDate === "none") {
        setGrouping([{ columnName: "pair" }]);
      }

      if (groupDate === "date") {
        setGrouping([{ columnName: "pair" }, { columnName: "date" }]);
      }

      if (groupDate === "month") {
        setGrouping([
          { columnName: "pair" },
          { columnName: "month" },
          { columnName: "date" },
        ]);
      }

      if (groupDate === "year") {
        setGrouping([
          { columnName: "pair" },
          { columnName: "year" },
          { columnName: "month" },
          { columnName: "date" },
        ]);
      }
    }

    if (value === "transaction-pair-date") {
      if (groupDate === "none") {
        setGrouping([{ columnName: "transaction" }, { columnName: "pair" }]);
      }

      if (groupDate === "date") {
        setGrouping([
          { columnName: "transaction" },
          { columnName: "pair" },
          { columnName: "date" },
        ]);
      }

      if (groupDate === "month") {
        setGrouping([
          { columnName: "transaction" },
          { columnName: "pair" },
          { columnName: "month" },
          { columnName: "date" },
        ]);
      }

      if (groupDate === "year") {
        setGrouping([
          { columnName: "transaction" },
          { columnName: "pair" },
          { columnName: "year" },
          { columnName: "month" },
          { columnName: "date" },
        ]);
      }
    }

    if (value === "transaction-date-pair") {
      if (groupDate === "none") {
        setGrouping([{ columnName: "transaction" }, { columnName: "pair" }]);
      }

      if (groupDate === "date") {
        setGrouping([
          { columnName: "transaction" },
          { columnName: "date" },
          { columnName: "pair" },
        ]);
      }

      if (groupDate === "month") {
        setGrouping([
          { columnName: "transaction" },
          { columnName: "month" },
          { columnName: "date" },
          { columnName: "pair" },
        ]);
      }

      if (groupDate === "year") {
        setGrouping([
          { columnName: "transaction" },
          { columnName: "year" },
          { columnName: "month" },
          { columnName: "date" },
          { columnName: "pair" },
        ]);
      }
    }

    if (value === "side-date-pair") {
      if (groupDate === "none") {
        setGrouping([{ columnName: "side" }, { columnName: "pair" }]);
      }

      if (groupDate === "date") {
        setGrouping([
          { columnName: "side" },
          { columnName: "date" },
          { columnName: "pair" },
        ]);
      }

      if (groupDate === "month") {
        setGrouping([
          { columnName: "side" },
          { columnName: "month" },
          { columnName: "date" },
          { columnName: "pair" },
        ]);
      }

      if (groupDate === "year") {
        setGrouping([
          { columnName: "side" },
          { columnName: "year" },
          { columnName: "month" },
          { columnName: "date" },
          { columnName: "pair" },
        ]);
      }
    }
  };

  const handleGroupDateChange = (event) => {
    const { value } = event.target;
    setGroupDate(value);

    setExpandedGroup([]);

    if (value === "none") {
      if (groupControl === "date-pair") {
        setGrouping([{ columnName: "pair" }]);
      }

      if (groupControl === "pair-date") {
        setGrouping([{ columnName: "pair" }]);
      }

      if (groupControl === "transaction-pair-date") {
        setGrouping([{ columnName: "transaction" }, { columnName: "pair" }]);
      }

      if (groupControl === "transaction-date-pair") {
        setGrouping([{ columnName: "transaction" }, { columnName: "pair" }]);
      }

      if (groupControl === "side-date-pair") {
        setGrouping([{ columnName: "side" }, { columnName: "pair" }]);
      }
    }

    if (value === "date") {
      if (groupControl === "date-pair") {
        setGrouping([{ columnName: "date" }, { columnName: "pair" }]);
      }

      if (groupControl === "pair-date") {
        setGrouping([{ columnName: "pair" }, { columnName: "date" }]);
      }

      if (groupControl === "transaction-pair-date") {
        setGrouping([
          { columnName: "transaction" },
          { columnName: "pair" },
          { columnName: "date" },
        ]);
      }

      if (groupControl === "transaction-date-pair") {
        setGrouping([
          { columnName: "transaction" },
          { columnName: "date" },
          { columnName: "pair" },
        ]);
      }

      if (groupControl === "side-date-pair") {
        setGrouping([
          { columnName: "side" },
          { columnName: "date" },
          { columnName: "pair" },
        ]);
      }
    }

    if (value === "month") {
      if (groupControl === "date-pair") {
        setGrouping([
          { columnName: "month" },
          { columnName: "date" },
          { columnName: "pair" },
        ]);
      }

      if (groupControl === "pair-date") {
        setGrouping([
          { columnName: "pair" },
          { columnName: "month" },
          { columnName: "date" },
        ]);
      }

      if (groupControl === "transaction-pair-date") {
        setGrouping([
          { columnName: "transaction" },
          { columnName: "pair" },
          { columnName: "month" },
          { columnName: "date" },
        ]);
      }

      if (groupControl === "transaction-date-pair") {
        setGrouping([
          { columnName: "transaction" },
          { columnName: "month" },
          { columnName: "date" },
          { columnName: "pair" },
        ]);
      }

      if (groupControl === "side-date-pair") {
        setGrouping([
          { columnName: "side" },
          { columnName: "month" },
          { columnName: "date" },
          { columnName: "pair" },
        ]);
      }
    }

    if (value === "year") {
      if (groupControl === "date-pair") {
        setGrouping([
          { columnName: "year" },
          { columnName: "month" },
          { columnName: "date" },
          { columnName: "pair" },
        ]);
      }

      if (groupControl === "pair-date") {
        setGrouping([
          { columnName: "pair" },
          { columnName: "year" },
          { columnName: "month" },
          { columnName: "date" },
        ]);
      }

      if (groupControl === "transaction-pair-date") {
        setGrouping([
          { columnName: "transaction" },
          { columnName: "pair" },
          { columnName: "year" },
          { columnName: "month" },
          { columnName: "date" },
        ]);
      }

      if (groupControl === "transaction-date-pair") {
        setGrouping([
          { columnName: "transaction" },
          { columnName: "year" },
          { columnName: "month" },
          { columnName: "date" },
          { columnName: "pair" },
        ]);
      }

      if (groupControl === "side-date-pair") {
        setGrouping([
          { columnName: "side" },
          { columnName: "year" },
          { columnName: "month" },
          { columnName: "date" },
          { columnName: "pair" },
        ]);
      }
    }
  };

  return (
    <div className="report-page my-container">
      <div className="date-filters">
        <div className="date-period">
          <label htmlFor="range-this-week">
            <input
              type="radio"
              className="range"
              id="range-this-week"
              value="this-week"
              readOnly
              checked={period === "this-week"}
              onChange={handlePeriodChange}
            />
            <div className="range">This week</div>
          </label>
          <label htmlFor="range-last-week">
            <input
              type="radio"
              className="range"
              id="range-last-week"
              value="last-week"
              readOnly
              checked={period === "last-week"}
              onChange={handlePeriodChange}
            />
            <div className="range">Last week</div>
          </label>
          <label htmlFor="range-this-month">
            <input
              type="radio"
              className="range"
              id="range-this-month"
              value="this-month"
              readOnly
              checked={period === "this-month"}
              onChange={handlePeriodChange}
            />
            <div className="range">This month</div>
          </label>
          <label htmlFor="range-last-month">
            <input
              type="radio"
              className="range"
              id="range-last-month"
              value="last-month"
              readOnly
              checked={period === "last-month"}
              onChange={handlePeriodChange}
            />
            <div className="range">Last Month</div>
          </label>
          <label htmlFor="range-this-quarter">
            <input
              type="radio"
              className="range"
              id="range-this-quarter"
              value="this-quarter"
              readOnly
              checked={period === "this-quarter"}
              onChange={handlePeriodChange}
            />
            <div className="range">This Quarter</div>
          </label>
          <label htmlFor="range-last-quarter">
            <input
              type="radio"
              className="range"
              id="range-last-quarter"
              value="last-quarter"
              readOnly
              checked={period === "last-quarter"}
              onChange={handlePeriodChange}
            />
            <div className="range">Last Quarter</div>
          </label>
          <label htmlFor="range-this-year">
            <input
              type="radio"
              className="range"
              id="range-this-year"
              value="this-year"
              readOnly
              checked={period === "this-year"}
              onChange={handlePeriodChange}
            />
            <div className="range">This Year</div>
          </label>
          <label htmlFor="range-last-year">
            <input
              type="radio"
              className="range"
              id="range-last-year"
              value="last-year"
              readOnly
              checked={period === "last-year"}
              onChange={handlePeriodChange}
            />
            <div className="range">Last Year</div>
          </label>
          <label htmlFor="range-all-years">
            <input
              type="radio"
              className="range"
              id="range-all-years"
              value="all-years"
              readOnly
              checked={period === "all-years"}
              onChange={handlePeriodChange}
            />
            <div className="range">All Years</div>
          </label>
        </div>
        <div className="date-range">
          <Popup
            trigger={
              <div className="start-date">
                <span>{moment(startDate).format("MMM-DD-YYYY")}</span>
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
              onChange={handleStartDateChange}
            ></input>
          </Popup>
          <div>
            <span>&nbsp;-&nbsp;</span>
          </div>
          <Popup
            trigger={
              <div className="end-date">
                <span>{moment(endDate).format("MMM-DD-YYYY")}</span>
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
              name="trip-end"
              value={endDate}
              min={startDate}
              onChange={handleEndDateChange}
            ></input>
          </Popup>
          <Button
            className="apply-btn"
            variant="contained"
            onClick={handleApplyClick}
          >
            Apply
          </Button>
        </div>
      </div>
      {data && (
        <div className="card" id="report">
          <Grid rows={data} columns={columns}>
            <DragDropProvider />
            <GroupingState
              grouping={grouping}
              onGroupingChange={setGrouping}
              columnExtensions={groupingStateColumnExtensions}
              expandedGroups={expandedGroup}
              onExpandedGroupsChange={expandedGroupsChange}
            />
            <SummaryState groupItems={groupSummaryItems} />
            <IntegratedGrouping />
            <IntegratedSummary />
            <Table cellComponent={(props) => <TableCell {...props} />} />
            <TableHeaderRow />
            <TableColumnVisibility hiddenColumnNames={hiddenColumnNames} />
            <TableGroupRow
              rowComponent={GroupTableRow}
              cellComponent={(props) => (
                <GroupTableCell {...props} grouping={grouping} data={data} />
              )}
              summaryCellComponent={(props) => (
                <SummaryCell
                  {...props}
                  grouping={grouping}
                  data={data}
                  cryptoPrices={cryptoPrices}
                  groupControl={groupControl}
                />
              )}
            />
            <Toolbar />
            <Template name="toolbarContent">
              <TemplatePlaceholder />
              <div className="control-bar">
                <div className="control-bar--group--date">
                  <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                    <InputLabel id="demo-select-small">Date Summary</InputLabel>
                    <Select
                      value={groupDate}
                      label="Date Summary"
                      name="group-date"
                      onChange={handleGroupDateChange}
                    >
                      <MenuItem value="none">None</MenuItem>
                      <MenuItem value="date">Date</MenuItem>
                      <MenuItem value="month">Month</MenuItem>
                      <MenuItem value="year">Year</MenuItem>
                    </Select>
                  </FormControl>
                </div>
                <div className="control-bar--group">
                  <FormControl sx={{ m: 1, minWidth: 260 }} size="small">
                    <InputLabel id="demo-select-small">Grouping</InputLabel>
                    <Select
                      value={groupControl}
                      label="Grouping"
                      name="group"
                      onChange={handleGroupChange}
                    >
                      <MenuItem value="date-pair">DATE-&gt;PAIR</MenuItem>
                      <MenuItem value="pair-date">PAIR-&gt;DATE</MenuItem>
                      <MenuItem value="transaction-pair-date">
                        TRANSACTION-&gt;PAIR-&gt;DATE
                      </MenuItem>
                      <MenuItem value="transaction-date-pair">
                        TRANSACTION-&gt;DATE-&gt;PAIR
                      </MenuItem>
                      <MenuItem value="side-date-pair">
                        SIDE-&gt;DATE-&gt;PAIR
                      </MenuItem>
                    </Select>
                  </FormControl>
                </div>
                <Button
                  className="expand-btn"
                  variant="contained"
                  onClick={expandClick}
                >
                  {expandedGroup.length === 0 ? "Expand all" : "Collapse all"}
                </Button>
                <Button
                  className="expand-btn"
                  variant="contained"
                  onClick={handleClick}
                >
                  Export
                </Button>
                <Menu
                  id="fade-menu"
                  MenuListProps={{
                    "aria-labelledby": "fade-button",
                  }}
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  TransitionComponent={Fade}
                >
                  <MenuItem onClick={handleExportSummary}>
                    Export Summary
                  </MenuItem>
                  <MenuItem>
                    <CSVLink
                      filename={csvFileName}
                      data={data}
                      headers={headers}
                      style={{ textDecoration: "none", color: "black" }}
                    >
                      Export Detail
                    </CSVLink>
                  </MenuItem>
                </Menu>
              </div>
            </Template>
          </Grid>
        </div>
      )}
    </div>
  );
};

export default Report;
