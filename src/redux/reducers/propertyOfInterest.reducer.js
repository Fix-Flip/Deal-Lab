const propertyOfInterestReducer = (state = {}, action) => {
    switch (action.type) {
        case 'SET_PROPERTY_OF_INTEREST':
          return action.payload;
        case 'UPDATE_PROPERTY_PURCHASE_PRICE':
          let newPrice = ''; 
          for(let char of action.payload) {
            if(char === "$") {
            }
            else if (char === ','){
            }
            else{
              newPrice += char;
            }
          }
          let property = [{...state.property[0], purchase_price: newPrice}];
          return {
            holdingItems: state.holdingItems,
            repairItems: state.repairItems,
            property: property
          };
        case 'UPDATE_PROPERTY_HOLDING_PERIOD':
          let prop = [{...state.property[0], holding_period: action.payload}];
          return {
            holdingItems: state.holdingItems,
            repairItems: state.repairItems,
            property: prop
          };
          
        case 'UPDATE_PROPERTY_AFTER_REPAIR_VALUE':
          let newValue = '';  
          for(let char of action.payload) {
            if(char === "$") {
            }
            else if (char === ','){
            }
            else{
              newValue += char;
            }
          }
          let newProperty = [{...state.property[0], after_repair_value: newValue}];
          return {
            holdingItems: state.holdingItems,
            repairItems: state.repairItems,
            property: newProperty
          };
        default:
          return state;
      }
};

export default propertyOfInterestReducer;