import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import { useState } from 'react';

function ModalUpfrontCosts({setDownPaymentUpdate, setDownPaymentPercentageUpdate, setClosingCostsUpdate, setClosingCostsPercentageUpdate}) {
  const dispatch = useDispatch();
  const propertyOfInterest = useSelector((store) => store.propertyOfInterest);
  const mortgageCalculator = useSelector(store => store.mortgageCalculator);

  const [repairName, setRepairName] = useState("");
  const [repairItemCost, setRepairItemCost] = useState("");
  const [showText, setShowText] = useState(false);
  const [showLoanText, setShowLoanText] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // const totalDownClosing = (Object.keys(mortgageCalculator).length && 
  //       (Number(mortgageCalculator.down_payment.replace(/[^0-9.-]+/g, "")) +
  //       Number(mortgageCalculator.closing_costs.replace(/[^0-9.-]+/g, ""))))
  // console.log('totalDownClosing:', totalDownClosing);

  const purchasePrice = (Object.keys(propertyOfInterest).length && propertyOfInterest.property[0].purchase_price);
  const propertyId = (Object.keys(propertyOfInterest).length && propertyOfInterest.property[0].id)

  const addRepairItem = () => {
      dispatch ({
          type: 'ADD_PROPERTY_REPAIR_ITEM',
          payload: {propertyId: propertyOfInterest.property[0].id, repairName: repairName, repairCost: repairItemCost }
      })
      setRepairName("");
      setRepairItemCost("");
  }

  const deleteRepairItem = (itemId) => {
    dispatch ({
        type: 'DELETE_PROPERTY_REPAIR_ITEM',
        payload: {itemId: itemId, propertyId: propertyOfInterest.property[0].id}
    })
  }

  const formattedCurrency = (value) => {
    const number = parseFloat(value);
    return `$${number.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const handleMouseMove = (e) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  console.log('mortgageCalculator data:', mortgageCalculator);

  return (
    <div className="container">
      {Object.keys(propertyOfInterest).length && 
      <>

        {/* Info Icon */}
        <div className = "property-data">

          <div onMouseMove={handleMouseMove}>
            <img className='info-icon-data' src='info.png'onMouseEnter={() => setShowText(true)} onMouseLeave={() => setShowText(false)}/>
            {showText && (
              <div 
                className='info-text'
                style={{
                  position: 'absolute', 
                  left: position.x - 240, 
                  top: position.y - 110 
                }}>
                  The current listing price for the property selected
              </div>
            )}
          </div>

          {/* Purchase Price */}
          <p> Purchase Price:</p> 
          <input
            className = "property-data-input" 
            placeholder="Purchase Price"
            value={formattedCurrency(Number(propertyOfInterest.property[0].purchase_price))}
            onChange={e => {e.preventDefault; dispatch({type: 'UPDATE_PROPERTY_PURCHASE_PRICE', payload: e.target.value})}}
          />
        </div>

        <label>Down Payment:</label>
        <div className="label">
          <input 
            placeholder="Down Payment"
            className="mortgage-input"
            value={formattedCurrency(Number(mortgageCalculator.down_payment))}
            onChange={e => {e.preventDefault; 
              dispatch({
                type: 'UPDATE_DOWN_PAYMENT', 
                payload: {
                  downPayment: e.target.value, 
                  downPaymentPercent: mortgageCalculator.down_payment_percentage, 
                  purchasePrice: propertyOfInterest.property[0].purchase_price,
                  propertyId: propertyId,
                  input: 'downPayment'
                }})}} 
          />
          <label className="label">at</label>
          <input 
            placeholder="%"
            className="percentage-input"
            value={mortgageCalculator.down_payment_percentage}
            onChange={e => {e.preventDefault; 
              dispatch({type: 'UPDATE_DOWN_PAYMENT_PERCENTAGE', 
                payload: {
                  downPayment:mortgageCalculator.down_payment,  
                  downPaymentPercent: e.target.value, 
                  purchasePrice: propertyOfInterest.property[0].purchase_price,
                  propertyId: propertyId,
                  input: 'downPaymentPercentage'
                }})}} 
          />
          <label className="label">%</label>
        </div>

        <p className="mortgageCalculatorLoanItems">Base Loan Amount: {mortgageCalculator.base_loan_amount}</p>

        <div className = "property-data">
          <div onMouseMove={handleMouseMove}>
              <img className='info-icon-data' src='info.png'onMouseEnter={() => setShowLoanText(true)} onMouseLeave={() => setShowLoanText(false)}/>
              {showLoanText && (
                <div 
                  className='info-text'
                  style={{
                    position: 'absolute', 
                    left: position.x - 240, 
                    top: position.y - 110 
                  }}>
                    Purchase Price - Down Payment
                </div>
              )}
            </div>
          <p className="mortgageCalculatorLoanItems">Loan Amount: {mortgageCalculator.base_loan_amount}</p>
        </div>

        <div className = "property-data">
          <label>Closing Costs:</label>
          <div className="label">
            <input 
              placeholder="Closing Costs" 
              className="mortgage-input"
              value={formattedCurrency(Number(mortgageCalculator.closing_costs))}
              onChange= {e => {e.preventDefault; 
                dispatch({type: 'UPDATE_CLOSING_COSTS', 
                  payload: {
                    closingCosts: e.target.value, 
                    closingCostsPercentage: mortgageCalculator.closing_costs_percentage, 
                    purchasePrice: propertyOfInterest.property[0].purchase_price,
                    propertyId: propertyId,
                    input: 'closingCosts'
                  }})}} 
            />
            <label className="label">at</label>
            <input 
              placeholder="%"
              className="percentage-input"
              value={mortgageCalculator.closing_costs_percentage}
              onChange={e => {e.preventDefault; dispatch({
                type: 'UPDATE_CLOSING_COSTS_PERCENTAGE', 
                payload: {
                  closingCosts: mortgageCalculator.closing_costs, 
                  closingCostsPercentage: e.target.value, 
                  purchasePrice: propertyOfInterest.property[0].purchase_price,
                  propertyId: propertyId,
                  input: 'closingCostsPercentage'
                }})}} 
            />
            <label> % </label>
          </div>
        </div>

        <div className = 'item-form'>
          <input 
            type='text'
            placeholder='Repair Name'
            value={repairName}
            onChange={e => setRepairName(e.target.value)}
          />
          <input
            type='text'
            placeholder='Repair Cost'
            value={repairItemCost}
            onChange={e => setRepairItemCost(e.target.value)}
          />
          <button className="modal-btn-2"onClick={addRepairItem}>Add</button>
        </div>

        <table className="table">
        {propertyOfInterest.repairItems.map((item) => {
          return (
            <div key = {item.id} className="unordered-list">
              <tr>
                <td className="list-items" >{item.repair_name}: </td>
                <td className="list-cost">{formattedCurrency(item.repair_cost)} </td>
                <td className="list-delete"><img className="deleteBtn" onClick={() => {deleteRepairItem(item.id)}} src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgy6cH4pk8uBtQ-_MBHx5MtDO8ms62KxR0UQ&s" /></td>
              </tr>
            </div>
            )
          })}
        </table>

        {/* Total Costs */}
        <p className = "item-list-total">Total Repair Cost: {formattedCurrency(propertyOfInterest.property[0].total_repair_cost)}</p>
        <p className="section-totals">
          <span className="bold-text">Total Upfront Cost: {formattedCurrency(Number(propertyOfInterest.property[0].total_upfront_cost))}</span>
        </p>
        <p className="calculation-explanation">(Purchase Price + Total Repair Cost)</p>
        </>

      }
    </div>
  );
}

export default ModalUpfrontCosts;