import moment from "moment";
import React, { useMemo } from "react";
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import { useSortBy, useTable } from "react-table";
import { roundMe, precisionRound } from "utils/roundMe";
import "../styles/TradeTable.scss";

const LightTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} placement="right"/>
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#FA0559',
    color: '#ffffff',
    boxShadow: theme.shadows[1],
    fontSize: 12,
  },
}));

function Table({ symbol, columns, data, onCancelOrder }) {
  
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns,
        data,
      },
      useSortBy
    );

  const firstPageRows = rows.slice(0, 5);

  return (
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                {column.render("Header")}
                <span>
                  {column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}
                </span>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map((cell) => {
                return (
                  <td {...cell.getCellProps()}>
                    {cell.column.Header === "Id" && (
                      <span className="date-column">
                        {cell.value}
                      </span>
                    )}
                    {cell.column.Header === "Date" && (
                      <span className="date-column">
                        {cell.value}
                      </span>
                    )}
                    {cell.column.Header === "Status" && (
                      cell.value === 'error' ?
                        <LightTooltip title={row.original.error&&row.original.error.message}>
                          <span
                            className='error-status'
                          >
                            {cell.render("Cell")}
                          </span>
                        </LightTooltip>
                        :
                        <span
                          className={
                            cell.value === 'open' ? 
                              'open-status':cell.value === 'canceled' ?
                                'canceled-status':cell.value === 'closed' ?
                                  'closed-status':cell.value === 'error'?
                                    'error-status': 'normal-status'
                          }
                        >
                          {cell.render("Cell")}
                        </span>
                    )}
                    {
                      cell.column.Header === 'Action' && (
                        !(row.original.status === 'canceled' || row.original.status === 'closed' || row.original.status === 'error') &&
                          <button 
                            type="button" 
                            className={'cancel-btn'}
                            onClick={()=>onCancelOrder(row.original)}
                          >
                            { row.original.loading ? 'Canceling':'Cancel'}
                          </button>
                      )
                    }
                    {cell.column.Header === "Date/Time" && (
                      <span>
                        {cell.value.split(" ")[0]}
                        <br />
                        {cell.value.split("\n")[1]}
                      </span>
                    )}
                    {cell.column.Header === "Side" && (
                      <span
                        className={ cell.value === 'buy' ? 'side-buy':'side-sell'}
                      >
                        {cell.render("Cell")}
                      </span>
                    )}
                    {cell.column.Header !== "Status" &&
                      cell.column.Header !== "Date/Time" &&
                      cell.column.Header !== "Side" && (
                        <span>{cell.render("Cell")}</span>
                      )}
                  </td>
                );
              })}
            </tr>
          );
        })}
        {firstPageRows.length === 0 && (
          <tr>
            <td colSpan={10}>
              There have been no orders for {String(symbol).replace("/USD", "")}{" "}
              asset yet
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

const TradeTable = ({ symbolOrders, symbol, diagnostics, onOrderCancel, markets }) => {
  const columns = [
    {
      Header: "Date/Time",
      accessor: "datetime",
    },
    {
      Header: "Side",
      accessor: "typeInstance.side",
    },
    {
      Header: "Status",
      accessor: "status",
    },
    {
      Header: "Action"
    },
    {
      Header: "Pair",
      accessor: "symbol",
    },
    {
      Header: "Ordered",
      accessor: "amount",
    },
    {
      Header: "Filled",
      accessor: "filled",
    },
    {
      Header: "Price",
      accessor: "price",
    },
    {
      Header: "Fee",
      accessor: "fee",
    },
    {
      Header: "Total",
      accessor: "total",
    },
  ];

  const data = useMemo(() => {
    try {
      let precision;
      let market;

      if (symbol !== '') {
        market = markets.find(a=>a.tradeSymbol === symbol);
        precision = precisionRound(market);
      }

      const locale = navigator.language;
      moment.locale(locale);

      let realData;

      if (diagnostics) {
        realData = symbolOrders.map((item) => {
          if (symbol === '') {
            market = markets.find(a=>a.tradeSymbol === item.symbol);
            precision = precisionRound(market);
          }
          
          let realFee;
          let realTotal;
          if(item.status == "error"){
              realTotal = 0;
              realFee = 0;
          } else {
            realFee = item.fee.svcCost ? roundMe(Number(item.fee.svcCost), precision.amountPrecision) : 0
            if(item.typeInstance.side === "sell"){
              //seems like the use of "Number" may be able to be reduced
              realTotal = 0 - Number(roundMe(Number(Number(item.typeInstance.cost) - Number(item.fee.svcCost)), precision.amountPrecision))
            } else {
              realTotal = Number(roundMe(Number(Number(item.typeInstance.cost) + Number(item.fee.svcCost)), precision.amountPrecision))
            }
          }
          

          const filterItem = {
            ...item,
            datetime: `${moment(item.datetime).format("MM/DD/YYYY")},
            ${moment(item.datetime).format("hh:mm:ss A")}`,
            amount: roundMe(Number(item.amount), precision.amountPrecision),
            filled: item.typeInstance?roundMe(item.typeInstance.filled, precision.amountPrecision):Number(0).toFixed(precision.amountPrecision),
            price: item.status == "error" ? 
              roundMe(Number(item.typeInstance.price), precision.pricePrecision):
              roundMe(Number(item.typeInstance.average), precision.pricePrecision),
            fee: roundMe(realFee, 2),
            total: roundMe(realTotal, 2),
          };

          return filterItem;
        });
      } else {
        const _realData = symbolOrders.map((item) => {
          if (symbol === '') {
            market = markets.find(a=>a.tradeSymbol === item.symbol);
            precision = precisionRound(market);
          }

          let realFee;
          let realTotal;
          if(item.status == "error"){
              realTotal = 0;
              realFee = 0;
          } else {
            realFee = item.fee.svcCost ? roundMe(Number(item.fee.svcCost), precision.amountPrecision) : 0
            if(item.typeInstance.side === "sell"){
              //seems like the use of "Number" may be able to be reduced
              realTotal = 0 - Number(roundMe(Number(Number(item.typeInstance.cost) - Number(item.fee.svcCost)), precision.amountPrecision))
            } else {
              realTotal = Number(roundMe(Number(Number(item.typeInstance.cost) + Number(item.fee.svcCost)), precision.amountPrecision))
            }
          }

          const filterItem = {
            ...item,
            datetime: `${moment(item.datetime).format("MM/DD/YYYY")},
            ${moment(item.datetime).format("hh:mm:ss A")}`,          
            amount: roundMe(Number(item.amount), precision.amountPrecision),
            filled: item.typeInstance?roundMe(item.typeInstance.filled, precision.amountPrecision):Number(0).toFixed(precision.amountPrecision),
            price: item.status == "error" ? 
              roundMe(Number(item.typeInstance.price), precision.pricePrecision): 
              roundMe(Number(item.typeInstance.average), precision.pricePrecision),
            fee: roundMe(realFee, 2),
            total: roundMe(realTotal, 2),
          };

          return filterItem;
        });

        realData = _realData.filter(item=>(item.status !== 'pending' && item.status !== 'error'))
      }
      return realData;
    } catch(err) {

    }    
  });

  const handleOrderCancel = (data) => {
    onOrderCancel(data);
  }

  return (
    <>
      <div className="trade-table">
        <Table symbol={symbol} columns={columns} data={data} onCancelOrder={(data)=>handleOrderCancel(data)}/>
      </div>
    </>
  );
};

export default TradeTable;
