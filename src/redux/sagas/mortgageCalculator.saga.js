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
    console.log('action.payload UPDATE:', action.payload);
    
    const propertyId = action.payload.propertyId;
    const updateObj = {
        downPayment: action.payload.downPayment,
        downPaymentPercentage: action.payload.downPaymentPercentage,
        closingCosts: action.payload.closingCosts,
        closingCostsPercentage: action.payload.closingCostsPercentage
    }
    console.log('updateObj in saga:', updateObj);

    try {
        yield axios.put(`/api/mortgageCalculator/${propertyId}`, updateObj)
        yield put({
            type: 'UPDATE_PROPERTY',
            payload: action.payload
        })
    } catch (error) {
        console.log('Error updating calculations for property:', error);
    }
}

function* mortgageCalculatorSaga() {
    yield takeLatest('GET_PROPERTY_OF_INTEREST', addCalculations);
    yield takeLatest('UPDATE_CALCULATIONS', updateCalculations);
}

export default mortgageCalculatorSaga;



