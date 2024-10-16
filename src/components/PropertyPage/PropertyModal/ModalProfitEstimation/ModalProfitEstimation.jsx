import React from 'react';
import {useSelector, useDispatch} from 'react-redux';


function ModalProfitEstimation() {

  const dispatch = useDispatch();

  const propertyOfInterest = useSelector((store) => store.propertyOfInterest);

  const formattedCurrency = (value) => {
    const number = parseFloat(value);
    return `$${number.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const updateAfterRepairValue = () => {
    dispatch({
      type: 'UPDATE_PROPERTY_AFTER_REPAIR_VALUE', 
      payload: '527000'
    })
  }

  return (
    <div className="grid-container-2">
      {Object.keys(propertyOfInterest).length && 
        <>
          <p className ="bottom-margin-3">
            <span className='bold-text' onClick={updateAfterRepairValue}>After Repair Value: </span>
            <input
              value= {formattedCurrency(Number(propertyOfInterest.property[0].after_repair_value))}
              onChange={e => {e.preventDefault; dispatch({type: 'UPDATE_PROPERTY_AFTER_REPAIR_VALUE', payload: e.target.value})}}
            />
          </p>
          <p className="calculation-explanation botttom-margin-30">(based on the value of similar houses in the area)</p>
          <p className='bold-text bottom-margin-3'>Total Cost: {formattedCurrency(propertyOfInterest.property[0].total_cost)}</p>
          <p className="calculation-explanation botttom-margin-30">(Total Upfront Cost + Total Holding Cost)</p>
          <p className='bold-text bottom-margin-3'>Profit: {formattedCurrency(propertyOfInterest.property[0].profit)}</p>
          <p className="calculation-explanation botttom-margin-30">(After Repair Value - Total Cost)</p>
          <div className = "main-focus">
            <p className='bold-text section-totals center' >Monthly Profit: {formattedCurrency(propertyOfInterest.property[0].monthly_profit)}</p>
            <p  className="calculation-explanation center">(Profit / Holding Period)</p>
          </div>
        </>
      }
    </div>
  );
}

export default ModalProfitEstimation;