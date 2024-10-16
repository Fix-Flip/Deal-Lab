import React from 'react';
import { useState } from 'react';
import { useDispatch} from 'react-redux';

function DefaultRepairItems({defaultRepairs}) {
  const dispatch = useDispatch();
  const [repairName, setRepairName] = useState('');
  const [repairCost, setRepairCost] = useState('');

  //runs when the user clicks "add" next to repair item
  const addDefaultRepairItem = () => {
    dispatch({
      type: 'ADD_DEFAULT_REPAIR_ITEM',
      payload: {
        repairName: repairName,
        repairCost: repairCost
      }
    })

    setRepairCost('');
    setRepairName('');
  }

  const formattedCurrency = (value) => {
    const number = parseFloat(value);
    return ` $${number.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className='defaultRepair'>
      <form className='defaultRepairForm'>
        <label className='defaultSettingsText'>Repair Items:</label><br />
        <input className='defaultRepairNameInput'
                type='text'
                placeholder='Repair Name'
                value={repairName}
                onChange={e => setRepairName(e.target.value)}/>
        <input className='defaultRepairCostInput'
                type='number'
                placeholder='Repair Cost'
                value={repairCost}
                onChange={e => setRepairCost(e.target.value)}/>
        <span className='addBtn'
              onClick={addDefaultRepairItem}>Add</span>
      </form>


      <div className='defaultRepairItems'>
        {!defaultRepairs ? '' : defaultRepairs.map((item) => {
            return (
              <table className='defaultRepairItemsTable'>
                <tr className='defaultRepairItem' key={item.id}>
                  <td className='defaultRepairItemName'>{item.repair_name}:</td>
                  <td className='defaultRepairItemCost'>{formattedCurrency(item.repair_cost)}</td>
                  <td className='deleteDefaultRepairBtn'
                      onClick={e => {
                        e.preventDefault();
                        dispatch({
                          type: 'DELETE_DEFAULT_REPAIR_ITEM',
                          payload: item.id
                        })
                      }}>

                        <img className="deleteDefaultRepairBtn" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgy6cH4pk8uBtQ-_MBHx5MtDO8ms62KxR0UQ&s" />
                        </td>
                  </tr>
                        
              </table>
            )
          })}
      </div>
      <h4 className="total">Total: 
        <span>
          {formattedCurrency(!defaultRepairs ? '' : defaultRepairs.reduce((total, item) => {
            total = total + Number(item.repair_cost)
            return total
          }, 0))}
        </span>
      </h4>
    </div>

  );
}

export default DefaultRepairItems;