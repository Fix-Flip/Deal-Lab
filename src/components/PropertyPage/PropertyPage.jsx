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

  //variables for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  //when the user clicks on a property card
  const handleOpenModal = (property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  //When the 'x' is clicked to close the modal
  const handleCloseModal = (propertyOfInterest, dataFromDatabase) => {
    
    //dataFromDatabase is saved upon modal open
    const purchasePriceFromDatabase = dataFromDatabase.purchase_price
    //purchase price is the current input in the modal purchase price
    const purchasePrice = propertyOfInterest.property[0].purchase_price

    const holdingPeriodFromDatabase = dataFromDatabase.holding_period
    const holdingPeriod = propertyOfInterest.property[0].holding_period

    const afterRepairValueFromDatabase = dataFromDatabase.after_repair_value
    const afterRepairValue = propertyOfInterest.property[0].after_repair_value
    
    let formattedPurchasePriceFromDatabase = '';
    let formattedPurchasePrice = '';
    let breakConditionDatabase = false;
    let breakCondition = false;

    //reformats the purchase price so the purchase price from the 
    //database and the reducer are rounded to the whole number
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

    //checks if the purchase price, holding period, or after repair value need to be saved 
    if(formattedPurchasePrice != formattedPurchasePriceFromDatabase || holdingPeriodFromDatabase != holdingPeriod || formattedAfterRepairValue != formattedAfterRepairValueFromDatabase) {
      //if there are unsaved changes a sweet alert prompts the user to save their changes
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
      //if there are no unsaved changes, the modal closes
      setIsModalOpen(false);
      setSelectedProperty(null);
    }
  };
  
  return (
    <div className="container">
      {/* Contains the google address autocomplete, add button, and sort by feature */}
      <PropertySearchForm userId={userId}/>
      {/* Contains the property cards */}
      <PropertyList userId={userId} onOpenModal={handleOpenModal} />
      {/* The modal that appears when the property card is clicked */}
      <PropertyModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        propertyCard={selectedProperty}
        setSelectedProperty = {setSelectedProperty}/>
    </div>
  );
}

export default PropertyPage;
