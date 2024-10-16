import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import { useState } from 'react';


function ModalHoldingPeriodCosts() {

  const dispatch = useDispatch();

  const propertyOfInterest = useSelector((store) => store.propertyOfInterest);

  const [holdingName, setHoldingName] = useState("");



  
  // const [loanTerm, setLoanTerm] = useState(30);




  const [holdingItemCost, setHoldingItemCost] = useState("");
  
  // runs when the user clicks "add" on holding item
  const addHoldingItem = () => {
    dispatch ({
        type: 'ADD_PROPERTY_HOLDING_ITEM',
        payload: {propertyId: propertyOfInterest.property[0].id, holdingName: holdingName, holdingCost: holdingItemCost }
    })
    setHoldingName("");
    setHoldingItemCost("");
}

//runs when the user clicks the trash can next to a holding item
const deleteHoldingItem = (itemId) => {
  dispatch ({
      type: 'DELETE_PROPERTY_HOLDING_ITEM',
      payload: {itemId: itemId, propertyId: propertyOfInterest.property[0].id}
  })
}

//runs when the user clicks the trash can next to taxes
const updateTaxes = (propertyId) => {
  dispatch ({
      type: 'UPDATE_PROPERTY_TAXES',
      payload: propertyId
  })
}

  const formattedCurrency = (value) => {
    const number = parseFloat(value);
    return `$${number.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };


  return (
    <div className="container">
      {Object.keys(propertyOfInterest).length && 
        <>
        <div className = "property-data">
          <p>Holding Period:</p>
            <input 
              className= "property-data-input width-30"
              value= {Number(propertyOfInterest.property[0].holding_period)}
              onChange={e => {e.preventDefault; dispatch({type: 'UPDATE_PROPERTY_HOLDING_PERIOD', payload: e.target.value})}}
            /> 
          <p>months</p>
        </div>

          <p className="top-border">HoldingItems:</p>
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
              <tr>
                <td className="list-items">Taxes:</td> 
                <td className="list-cost">{formattedCurrency(propertyOfInterest.property[0].taxes_yearly/12)}</td>
                <td className="list-delete"><img onClick={() => {updateTaxes(propertyOfInterest.property[0].id)}} className="deleteBtn" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgy6cH4pk8uBtQ-_MBHx5MtDO8ms62KxR0UQ&s" /></td>
              </tr>
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