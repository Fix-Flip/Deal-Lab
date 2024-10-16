import { put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';

//runs when "add" is clicked in modal next to repair item
function* addPropertyRepairItem(action) {
  try {
    yield axios.post(`api/properties/repairItem`, action.payload)
    yield put({
        type: 'GET_PROPERTY_OF_INTEREST',
        payload: action.payload.propertyId
    })
  } catch (error) {
    console.log('Error adding property repair item:', error);
  }
}


//runs when trash can is clicked in modal next to repair item
function* deletePropertyRepairItem(action) {
  try {
    yield axios.delete(`api/properties/repairItem/${action.payload.itemId}`)
    yield put({
        type: 'GET_PROPERTY_OF_INTEREST',
        payload: action.payload.propertyId
    })
  } catch (error) {
    console.log('Error deleting property repair item:', error);
  }
}


function* propertyRepairItemsSaga() {
    yield takeLatest('ADD_PROPERTY_REPAIR_ITEM', addPropertyRepairItem);
    yield takeLatest('DELETE_PROPERTY_REPAIR_ITEM', deletePropertyRepairItem);
  }
  
  export default propertyRepairItemsSaga;