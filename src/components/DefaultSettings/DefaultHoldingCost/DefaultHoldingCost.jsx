import React from 'react';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import '../PropertyPage/PropertyModal/PropertyModal.css';

function DefaultHoldingCost({defaultHoldings}) {
  const dispatch = useDispatch();
  const [holdingName, setHoldingName] = useState('');
  const [holdingCost, setHoldingCost] = useState('');

  const addDefaultHoldingItem = () => {
    dispatch({
      type: 'ADD_DEFAULT_HOLDING_ITEM',
      payload: {
        holdingName: holdingName,
        holdingCost: holdingCost
      }
    })

    setHoldingName('');
    setHoldingCost('');
  }

  const formattedCurrency = (value) => {
    const number = parseFloat(value);
    return ` $${number.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const autoHoldingItemOne = () => {
    setHoldingName('Yard Work')
    setHoldingCost('150')
  }

  const autoHoldingItemTwo = () => {
    // setHoldingName('budgettwo')
    // setHoldingCost('15000')
  }


// Getting error for not having an unique key prop.
// Might not recognize 'default_holding_id' as an id.
  return (
    <div className='defaultHolding'>
      <form className='defaultHoldingForm'>
        <label className='defaultSettingsText'> <span onClick={autoHoldingItemOne}>Holding Period</span> <span onClick={autoHoldingItemTwo}> Costs (per month):</span></label>
        <br />
        <input className='defaultHoldingNameInput'
                type='text'
                placeholder='Expense Name'
                value={holdingName}
                onChange={e => setHoldingName(e.target.value)} />
        <input className='defaultHoldingCostInput'
                type='number'
                placeholder='Expense Cost'
                value={holdingCost}
                onChange={e => setHoldingCost(e.target.value)} />
        <span className='addBtn'
                onClick={addDefaultHoldingItem}>Add</span>
      </form>


      <div className='defaultHoldingItems'>
        {!defaultHoldings ? '' : defaultHoldings.map((item) => {
          return (
            <table className='defaultHoldingItemsTable'>
              <tr className='defaultHoldingItem' key={item.id}>
                <td className='defaultHoldingItemName'>{item.holding_name}:</td>
                <td className='defaultHoldingItemCost'>{formattedCurrency(item.holding_cost)}</td>
                <td className='deleteDefaultRepairBtn'
                    onClick={e => {
                      e.preventDefault();
                      dispatch({
                        type: 'DELETE_DEFAULT_HOLDING_ITEM',
                        payload: item.id
                      })
                    }}>
                      <span>
                      <img className="deleteDefaultRepairBtn" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgy6cH4pk8uBtQ-_MBHx5MtDO8ms62KxR0UQ&s" />
                    </span>
                  </td>
                </tr>
            </table>
          )
        })}
      </div>
      <h4 className="total">Total: 
        <span>
          {formattedCurrency(!defaultHoldings ? '' : defaultHoldings.reduce((total, item) => {
            total = total + Number(item.holding_cost)
            return total
          }, 0))}
        </span>
      </h4>
    </div>
  );
}

export default DefaultHoldingCost;