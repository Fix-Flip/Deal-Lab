import React from 'react';
import LogOutButton from '../App/LogOutButton/LogOutButton';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import PropertyList from './PropertyList/PropertyList';
import PropertySearchForm from './PropertySeachForm/PropertySearchForm';
import PropertyModal from './PropertyModal/PropertyModal';
import './PropertyModal/PropertyModal.css';
import Swal from 'sweetalert2';

function PropertyPage({ userId }) {
  
  const user = useSelector((store) => store.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  // const [dataFromDatabase, setDataFromDatabase] = useState({})

  const handleOpenModal = (property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handleCloseModal = (propertyOfInterest, dataFromDatabase) => {
  //  console.log('properyofinterest: ', propertyOfInterest)
  //   console.log('datafromdatabase: ', dataFromDatabase)
    const purchasePriceFromDatabase = dataFromDatabase.purchase_price
    const purchasePrice = propertyOfInterest.property[0].purchase_price

    const holdingPeriodFromDatabase = dataFromDatabase.holding_period
    const holdingPeriod = propertyOfInterest.property[0].holding_period

    const afterRepairValueFromDatabase = dataFromDatabase.after_repair_value
    const afterRepairValue = propertyOfInterest.property[0].after_repair_value
    
    let formattedPurchasePriceFromDatabase = '';
    let formattedPurchasePrice = '';
    let breakConditionDatabase = false;
    let breakCondition = false;
    for(let char of purchasePriceFromDatabase) {
      if(char === ".") {
        breakConditionDatabase = true;
      }
      else if (!breakConditionDatabase) {
        formattedPurchasePriceFromDatabase += char;
      }
    }
    for(let char of purchasePrice) {
      if(char === ".") {
        breakCondition = true
      }
      else if (!breakCondition) {
        formattedPurchasePrice += char;
      }
    }
    let formattedAfterRepairValueFromDatabase = '';
    let formattedAfterRepairValue = '';
    let breakConditionARVDatabase = false;
    let breakConditionARV = false;
    for(let char of afterRepairValueFromDatabase) {
      if(char === ".") {
        breakConditionARVDatabase = true;
      }
      else if (!breakConditionARVDatabase) {
        formattedAfterRepairValueFromDatabase += char;
      }
    }
    for(let char of afterRepairValue) {
      if(char === ".") {
        breakConditionARV = true
      }
      else if (!breakConditionARV) {
        formattedAfterRepairValue += char;
      }
    }

    // console.log('formattedpurchasepricefromdatabase: ', formattedPurchasePriceFromDatabase, formattedPurchasePrice)
    if(formattedPurchasePrice != formattedPurchasePriceFromDatabase || holdingPeriodFromDatabase != holdingPeriod || formattedAfterRepairValue != formattedAfterRepairValueFromDatabase) {
      Swal.fire({
        title: "Your changes aren't saved",
        text: "Do you want to close without saving?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, I do not want to save my changes",
        cancelButtonText: "Cancel",
        // reverseButtons: true
      }).then((result) => {
        //If the user confirms they wish to delete the property
        if (result.isConfirmed) {
          setIsModalOpen(false);
          setSelectedProperty(null);
        }})
    }
    else {
      setIsModalOpen(false);
      setSelectedProperty(null);
    }
  };
  
  return (
    <div className="container">
      {/* <h2>Welcome, {user.username}!</h2> */}
      <PropertySearchForm userId={userId}/>
      <PropertyList userId={userId} onOpenModal={handleOpenModal} />
      <PropertyModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        propertyCard={selectedProperty}
        setSelectedProperty = {setSelectedProperty}/>
    </div>
  );
}

// this allows us to use <App /> in index.js
export default PropertyPage;
