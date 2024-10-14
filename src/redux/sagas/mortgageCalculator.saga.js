import { put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';


function* addCalculations(action) {
    const propertyId = action.payload;
    console.log('Calculator propertyId:', propertyId);
    
    try {
        const response = yield axios.post(`/api/mortgageCalculator/${propertyId}`)
        console.log('Mortgage Calculations data:', response.data);
        yield put({
            type: 'SET_CALCULATIONS',
            payload: response.data
        })
    } catch (error) {
        console.log('Error posting calculations for property:', error);
    }
}

function* updateCalculations(action) {
    const propertyId = action.payload.propertyId;
    const updateObj = {
        downPayment: action.payload.downPaymentUpdate,
        downPaymentPercentage: action.payload.downPaymentPercentageUpdate,
        closingCosts: action.payload.closingCostsUpdate,
        closingCostsPercentage: action.payload.closingCostsPercentageUpdate
    }
    console.log('updateObj in saga:', updateObj);

    try {
        yield axios.put(`/api/mortgageCalculator/${propertyId}`, updateObj)
        yield put({
            type: 'GET_PROPERTY_OF_INTEREST',
            payload: propertyId
        })
    } catch (error) {
        console.log('Error updating calculations for property:', error);
    }
}

// function* updateDownClosingInputs(action) {
//     const propertyId = action.payload.propertyId;
//     console.log('data from UPDATING OMG:', action.payload);
    
//     try {
//         yield axios.put(`/api/mortgageCalculator/inputs/${propertyId}`, action.payload)
//         yield put({
//             type: 'UPDATE_CALCULATIONS',
//             payload: propertyId
//         })
//     } catch (error) {
//         console.log('Error updating calculations for down && closing inputs:', error);
//     }
// }

function* mortgageCalculatorSaga() {
    yield takeLatest('GET_PROPERTY_OF_INTEREST', addCalculations);
    yield takeLatest('UPDATE_PROPERTY', updateCalculations);
    // yield takeLatest('UPDATE_DOWN_PAYMENT', updateDownClosingInputs);
    // yield takeLatest('UPDATE_DOWN_PAYMENT_PERCENTAGE', updateDownClosingInputs);
    // yield takeLatest('UPDATE_CLOSING_COSTS', updateDownClosingInputs);
    // yield takeLatest('UPDATE_CLOSING_COSTS_PERCENTAGE', updateDownClosingInputs);
}

export default mortgageCalculatorSaga;

// reducer: 'SET_CALCULATIONS'
// url: '/api/mortgageCalculator'
// GET_PROPERTY_OF_INTEREST

