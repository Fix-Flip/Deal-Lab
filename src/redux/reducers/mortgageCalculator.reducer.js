const mortgageCalculatorReducer = (state = {}, action) => {
  switch (action.type) {
    case 'SET_CALCULATIONS':
      return action.payload;


    case 'UNSET_CALCULATIONS':
      return {};


    case 'UPDATE_DOWN_PAYMENT':
      let newDownPayment = ''; 

      for (let char of action.payload.downPayment) {
        if(char === "$") {
        }
        else if (char === ',') {
        }
        else {
          newDownPayment += char;
        }
      }

      let newDownPaymentPercentage = (Number(newDownPayment)/Number(action.payload.purchasePrice)).toFixed(4)*100
      return {...state, down_payment: newDownPayment,  down_payment_percentage: newDownPaymentPercentage};


    case 'UPDATE_DOWN_PAYMENT_PERCENTAGE':
      let newNewDownPayment = (Number(action.payload.purchasePrice)*(Number(action.payload.downPaymentPercent)/100)).toFixed(0)
      return {...state, down_payment: newNewDownPayment,  down_payment_percentage: action.payload.downPaymentPercent};


    case 'UPDATE_CLOSING_COSTS':
      let newClosingCosts = ''; 

      for (let char of action.payload.closingCosts) {
        if (char === "$") {
        }
        else if (char === ',') {
        }
        else {
          newClosingCosts += char;
        }
      }

      let newClosingCostsPercentage = (Number(newClosingCosts)/Number(action.payload.purchasePrice)).toFixed(4)*100
      return {...state, closing_costs: newClosingCosts,  closing_costs_percentage: newClosingCostsPercentage};


    case 'UPDATE_CLOSING_COSTS_PERCENTAGE':
      console.log('update closing costs: ', action.payload)
      let newCloseCosts = (Number(action.payload.purchasePrice)*(Number(action.payload.closingCostsPercentage)/100)).toFixed(0)
      console.log('update closing costs new: ', newCloseCosts);
      return {...state, closing_costs: newCloseCosts,  closing_costs_percentage: action.payload.closingCostsPercentage};
        
        
    default:
      return state;
  }
};

export default mortgageCalculatorReducer;