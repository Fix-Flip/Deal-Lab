import { put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';

//runs when "add" is clicked in modal next to holding item
function* addPropertyHoldingItem(action) {
  try {
    yield axios.post(`api/properties/holdingItem`, action.payload)
    yield put({
        type: 'GET_PROPERTY_OF_INTEREST',
        payload: action.payload.propertyId
    })
  } catch (error) {
    console.log('Error adding property repair item:', error);
  }
}


//runs when trash can next to holding item in modal is clicked
function* deletePropertyHoldingItem(action) {
  try {
    yield axios.delete(`api/properties/holdingItem/${action.payload.itemId}`)
    yield put({
        type: 'GET_PROPERTY_OF_INTEREST',
        payload: action.payload.propertyId
    })
  } catch (error) {
    console.log('Error deleting property repair item:', error);
  }
}


function* propertyHoldingItemsSaga() {
    yield takeLatest('ADD_PROPERTY_HOLDING_ITEM', addPropertyHoldingItem);
    yield takeLatest('DELETE_PROPERTY_HOLDING_ITEM', deletePropertyHoldingItem);
  }
  
  export default propertyHoldingItemsSaga;