import React from 'react';
import './DefaultSettings.css'
import DefaultHoldingCost from './DefaultHoldingCost/DefaultHoldingCost';
import DefaultRepairItems from './DefaultRepairItems/DefaultRepairItems';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom/cjs/react-router-dom.min';
import Swal from 'sweetalert2';
// import './PropertyModal/PropertyModal.css';


function DefaultSettings() {
  const user = useSelector(store => store.user);
  const defaultSettings = useSelector(store => store.defaultSettings);
  const defaultHoldings = defaultSettings.defaultHoldings;
  const defaultRepairs = defaultSettings.defaultRepairs;
  const dispatch = useDispatch();
  const params = useParams();
  const defaultSettingsId = params.id;


  // QUESTION:
  // 'user.holding_period_default' doesn't change with the db update.
  // Should be okay if we don't clear the holding period input?
  // Or should we make a dispatch call to fetch the new user data?
  const [holdingPeriod, setHoldingPeriod] = useState(user.holding_period_default)

  useEffect(() => {
    dispatch({
      type: "GET_DEFAULTS"
    })
    console.log('default repairs are : ', defaultRepairs)
  }, [defaultSettingsId])

  const updateHoldingPeriod = () => {
    dispatch({
      type: 'UPDATE_DEFAULT_HOLDING_PERIOD',
      payload: holdingPeriod
    })
    //successful save sweet alert
    Swal.fire({
      icon: "success",
      title: "Your work has been saved",
      showConfirmButton: false,
      timer: 1500
    });
  }

  console.log('defaultSettings data:', defaultSettings);
  console.log('user data:', user);
  

  return (
    <div className="defaultSettings">
      <h2 className="defaultSettingsTitle">Default Settings</h2>
      <div>
      <div className='holdingPeriodDefault'>
        <span className='defaultSettingsText'>Holding Period (in months):</span>
        <input className='holdingPeriodInput'
              type='number'
              value={holdingPeriod}
              onChange={e => setHoldingPeriod(e.target.value)}
              />
      </div>
      <div className=" section grid-container">
      <DefaultHoldingCost defaultHoldings={defaultHoldings} />
      <DefaultRepairItems defaultRepairs={defaultRepairs} />

      <button className='defaultSaveBtn'
              onClick={updateHoldingPeriod}>Save</button>
    </div>
    </div>
    </div>
  );
}

export default DefaultSettings;

// reducer name for default => defaultSettings
