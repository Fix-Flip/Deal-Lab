
import React from 'react';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ModalUpfrontCosts from './ModalUpfrontCosts/ModalUpfrontCosts'; // Import your specific components
import ModalHoldingPeriodCosts from './ModalHoldingPeriodCosts/ModalHoldingPeriodCosts';
import ModalProfitEstimation from './ModalProfitEstimation/ModalProfitEstimation';
import ModalMortgageCalculator from './ModalMortgageCalculator/ModalMortgageCalculator';
import Swal from 'sweetalert2';


const PropertyModal = ({ isOpen, onClose, propertyCard, userId, setSelectedProperty }) => {

  const dispatch = useDispatch();

  const propertyOfInterest = useSelector((store) => store.propertyOfInterest);
  const mortgageCalculator = useSelector(store => store.mortgageCalculator);

  const [downPaymentUpdate, setDownPaymentUpdate] = useState('')
  const [downPaymentPercentageUpdate, setDownPaymentPercentageUpdate] = useState('')
  const [closingCostsUpdate, setClosingCostsUpdate] = useState('')
  const [closingCostsPercentageUpdate, setClosingCostsPercentageUpdate] = useState('')
  
  
  useEffect(() => {
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    }

  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackToDefault = () => {
    Swal.fire({
      title: "Are you sure you want to apply the Default Settings?",
      text: "You can change the settings manually if you change your mind.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, apply default settings",
      cancelButtonText: "Cancel",
      // reverseButtons: true
    }).then((result) => {
    if (result.isConfirmed) {
    dispatch({
      type: 'UPDATE_BACK_TO_DEFAULT',
      payload: propertyOfInterest.property[0].id
    })
    Swal.fire({
      icon: "success",
      title: "Default Settings have been applied.",
      showConfirmButton: false,
      timer: 1500
    });
  }
  else if (
    /* Read more about handling dismissals below */
    result.dismiss === Swal.DismissReason.cancel
  ) {
    Swal.fire({
      icon: "error",
      title: "Default Settings have NOT been applied.",
      showConfirmButton: false,
      timer: 1500
    });
  }
});
  }

  //sends a dispatch to the properties saga
  const saveUpdatedPropertyInfo = () => {
    dispatch({
      type: 'UPDATE_PROPERTY',
      payload: {
        propertyId: propertyOfInterest.property[0].id,
        holdingPeriod: propertyOfInterest.property[0].holding_period,
        purchasePrice: propertyOfInterest.property[0].purchase_price,
        afterRepairValue: propertyOfInterest.property[0].after_repair_value,
        userId: userId,
        downPayment: mortgageCalculator.down_payment,
        downPaymentPercentage: mortgageCalculator.down_payment_percentage,
        closingCosts: mortgageCalculator.closing_costs,
        closingCostsPercentage: mortgageCalculator.closing_costs_percentage
    }
  })
  setSelectedProperty(propertyOfInterest.property[0])
  Swal.fire({
    icon: "success",
    title: "Your work has been saved",
    showConfirmButton: false,
    timer: 1500
  });
}

const formattedCurrency = (value) => {
  const number = parseFloat(value);
  return `$${number.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
  


  return (

    <div className="modal-overlay" >

      <div className="modal-content" onClick={(e) => e.stopPropagation()}>

        <div>
          <button onClick={() =>onClose(propertyOfInterest, propertyCard)} className="modal-close">X</button>
          <h2 className="modal-header">{propertyCard.address}</h2>
        </div>
        <div className = "modal-buttons">
          <button className="modal-default-btn" onClick={handleBackToDefault}>Set to Default Settings</button>
          {/* {Object.keys(propertyOfInterest).length && 
          <div className = "main-focus">
            <p className='bold-text section-totals center' >Monthly Profit: {formattedCurrency(propertyOfInterest.property[0].monthly_profit)}</p>
            <p  className="calculation-explanation center">(Profit / Holding Period)</p>
          </div>
          } */}
          <button className="modal-save-btn" onClick={saveUpdatedPropertyInfo}>Save</button>
        </div>
        <div className="modal-body">
        <div className="modalRight grid-container">
          <div className='section upfront-costs'>
            <h3 className='section-header'>Upfront Costs</h3>
            <ModalUpfrontCosts setDownPaymentUpdate={setDownPaymentUpdate}
                              setDownPaymentPercentageUpdate={setDownPaymentPercentageUpdate}
                              setClosingCostsUpdate={setClosingCostsUpdate}
                              setClosingCostsPercentageUpdate={setClosingCostsPercentageUpdate} />
          </div>

          <div className='section'>
            <h3 className='section-header'>Holding Period Costs</h3>
            <ModalHoldingPeriodCosts />
          </div>

          {/* <div className='section mortgage-calculator'>
            <h3 className='section-header'>Mortgage Calculator</h3>
            <ModalMortgageCalculator />
          </div> */}

          <div className='section-profit-estimation' style={{ gridColumn: '1 / -1' }}>
            <h3 className='section-header'>Profit Estimation</h3>
            <ModalProfitEstimation />
          </div>
          </div>
      </div>
    </div>
    </div>
  );
};

export default PropertyModal;