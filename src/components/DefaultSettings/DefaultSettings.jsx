import React from 'react';
import './DefaultSettings.css'
import DefaultHoldingCost from './DefaultHoldingCost/DefaultHoldingCost';
import DefaultRepairItems from './DefaultRepairItems/DefaultRepairItems';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom/cjs/react-router-dom.min';
import Swal from 'sweetalert2';
import '../PropertyPage/PropertyModal/PropertyModal.css';
import '../../../public/info.png'


function DefaultSettings() {
  const user = useSelector(store => store.user);
  const defaultSettings = useSelector(store => store.defaultSettings);
  const [showText, setShowText] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

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
  }, [defaultSettingsId])

  //runs when the user clicks "save" next to the holding period
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

  //tracks the mouse position for the onHover info icon
  const handleMouseMove = (e) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="defaultSettings">
      <div className='title-icon'>
        <h2 className="defaultSettingsTitle">Default Settings </h2>
        <div onMouseMove={handleMouseMove}>
        <img className='info-icon' src='info.png'onMouseEnter={() => setShowText(true)} onMouseLeave={() => setShowText(false)}/>
        {showText && (
          <div 
            className='info-text'
            style={{
              position: 'absolute', 
              left: position.x - 90, 
              top: position.y - 250 
            }}>
            All changes made in Default Settings will be applied to future properties added or properties that are "Set to Default Settings".
          </div>
        )}
      </div>
    </div>
      <div>
      <div className='holdingPeriodDefault'>
        <span className='defaultSettingsText'>Holding Period (in months):</span>
        <input className='holdingPeriodInput'
              type='number'
              value={holdingPeriod}
              onChange={e => setHoldingPeriod(e.target.value)}
              />
              <button className='defaultSaveBtn'
                      onClick={updateHoldingPeriod}>Save</button>
              
              
      </div>
      <div className=" section grid-container">
      <DefaultHoldingCost defaultHoldings={defaultHoldings} />
      <DefaultRepairItems defaultRepairs={defaultRepairs} />

    </div>
    </div>
    </div>
  );
}

export default DefaultSettings;

// reducer name for default => defaultSettings
