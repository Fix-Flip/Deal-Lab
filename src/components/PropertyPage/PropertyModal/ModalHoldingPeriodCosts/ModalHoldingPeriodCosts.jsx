import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import { useState } from 'react';


function ModalHoldingPeriodCosts() {

  const dispatch = useDispatch();

  const propertyOfInterest = useSelector((store) => store.propertyOfInterest);
  const mortgageCalculator = useSelector(store => store.mortgageCalculator);

  const [holdingName, setHoldingName] = useState("");
  const [holdingItemCost, setHoldingItemCost] = useState(""); 
  const [loanTerm, setLoanTerm] = useState(30);

  const addHoldingItem = () => {
    dispatch ({
        type: 'ADD_PROPERTY_HOLDING_ITEM',
        payload: {propertyId: propertyOfInterest.property[0].id, holdingName: holdingName, holdingCost: holdingItemCost }
    })
    setHoldingName("");
    setHoldingItemCost("");
}

const deleteHoldingItem = (itemId) => {
  dispatch ({
      type: 'DELETE_PROPERTY_HOLDING_ITEM',
      payload: {itemId: itemId, propertyId: propertyOfInterest.property[0].id}
  })
}

const updateTaxes = (propertyId) => {
  console.log('updateTaxes in holding period costs modal')
  dispatch ({
      type: 'UPDATE_PROPERTY_TAXES',
      payload: propertyId
  })
}

  const formattedCurrency = (value) => {
    const number = parseFloat(value);
    return `$${number.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const holdingPeriodInput = () => {
    dispatch({
      type: 'UPDATE_PROPERTY_HOLDING_PERIOD', 
      payload: 4
    })
  }

  const updateHoldingInputOne = () => {
    // setHoldingName('Yard Work')
    // setHoldingItemCost('150')
  }
  const updateHoldingInputTwo = () => {
    // setHoldingName('Utilities')
    // setHoldingItemCost('450')
  }

  return (
    <div className="container">
      {Object.keys(propertyOfInterest).length && 
        <>

        {/* <label>Loan Term </label>
          <select
            id="demo-simple-select-standard"
            value={loanTerm}
            onChange={e => setLoanTerm(e.target.value)}
          >
            <option value=""></option>
            <option value={15}>15 Yr</option>
            <option value={20}>20 Yr</option>
            <option value={30}>30 Yr</option>
          </select>
          <br /> */}

        {/* <label>Interest Rate:</label>
          <input 
            className="percentage-input"
            value={(mortgageCalculator.interest_rate) + '%' }
          />
        <p className="mortgageCalculatorLoanItems">Loan Interest Rate (Annual): {mortgageCalculator.interest_rate_annual}</p>
        <p className="mortgageCalculatorLoanItems">Loan Interest Rate (Monthly): {mortgageCalculator.interest_rate_monthly}</p>
         */}

        <div className = "property-data">
          <p onClick={holdingPeriodInput}>Holding Period:</p>
            <input 
              className= "property-data-input width-30"
              value= {Number(propertyOfInterest.property[0].holding_period)}
              onChange={e => {e.preventDefault; dispatch({type: 'UPDATE_PROPERTY_HOLDING_PERIOD', payload: e.target.value})}}
            /> 
          <p>months</p>
        </div>

          <p className="top-border"><span onClick={updateHoldingInputOne}>Holding</span> <span onClick={updateHoldingInputTwo}>Items:</span></p>
          <div className = 'item-form'>
          <input 
            type='text'
            placeholder='Holding Name'
            value={holdingName}
            onChange={e => setHoldingName(e.target.value)}
          />
          <input 
            type='text'
            placeholder='Holding Cost'
            value={holdingItemCost}
            onChange={e => setHoldingItemCost(e.target.value)}
          />
          <button className="modal-btn-2" onClick={addHoldingItem}>Add</button>
          </div>
          <table className="table">
            {propertyOfInterest.property[0].taxes_yearly && propertyOfInterest.property[0].taxes_yearly > 0 ? 
            
            <div className="unordered-list">
              {/* <thead></thead> */}
              <tr>
                <td className="list-items">Taxes:</td> 
                <td className="list-cost">{formattedCurrency(propertyOfInterest.property[0].taxes_yearly/12)}</td>
                <td className="list-delete"><img onClick={() => {updateTaxes(propertyOfInterest.property[0].id)}} className="deleteBtn" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgy6cH4pk8uBtQ-_MBHx5MtDO8ms62KxR0UQ&s" /></td>
              </tr>
              {/* <tr>
                <td className="list-items">Mortgage Interest:</td> 
                <td className="list-cost">{mortgageCalculator.interest_payment_monthly}</td>
                <td className="list-delete"><img className="deleteBtn" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgy6cH4pk8uBtQ-_MBHx5MtDO8ms62KxR0UQ&s" /></td>
              </tr> */}
            </div> : ''}
            {propertyOfInterest.holdingItems.map((item) => {
              return (
                <div className="unordered-list" key = {item.id}>
                  <tr>
                    <td className="list-items" >{item.holding_name}: </td>
                    <td className="list-cost">{formattedCurrency(item.holding_cost)} </td>
                    <td className="list-delete"><img className="deleteBtn" onClick={() => {deleteHoldingItem(item.id)}}  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgy6cH4pk8uBtQ-_MBHx5MtDO8ms62KxR0UQ&s" /></td>
                  </tr>
                </div>
                
              )
            })}
          {/* </ul> */}
          <p className = "item-list-total">Monthly Holding Cost: {formattedCurrency(propertyOfInterest.property[0].monthly_holding_cost )}</p>

          </table>
          
        <p className="section-totals">
          <span className="bold-text">Total Holding Cost: {formattedCurrency(propertyOfInterest.property[0].total_holding_cost)}</span>
          </p>
          <p className="calculation-explanation">(Monthly Holding Cost x Holding Period)</p>
        </>
      }
    </div>
  );
}

export default ModalHoldingPeriodCosts;