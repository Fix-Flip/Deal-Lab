import { put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';

//runs upon default settings page load
function* getDefaults(action) {
  try {
    const response = yield axios.get('/api/defaultSettings')
    
    yield put({
      type: 'SET_DEFAULTS',
      payload: response.data
    })
  } catch (error) {
    console.log('Error getting defaults', error);
    
  }
}


//runs when "save" next to default holding period is clicked
function* updateDefaultHoldingPeriod(action) {
  const holdingPeriod = action.payload;
  try {
    yield axios.put(`/api/defaultSettings/`, {holdingPeriod})
    yield put({
      type: 'GET_DEFAULTS'
    })
  } catch (error) {
    console.log('Error updating default holding period', error);
  }
}


//runs when "add" is clicked on default holding item 
function* addDefaultHoldingItem(action) {
  const holdingName = action.payload.holdingName;
  const holdingCost = action.payload.holdingCost;
  try {
    yield axios.post(`/api/defaultSettings/holdingItem`, {holdingName, holdingCost})
    yield put({
      type: 'GET_DEFAULTS'
    })
  } catch (error) {
    console.log('Error adding default holding item:', error);
  }
}


//runs when trash can next to default holding item is clicked
function* deleteDefaultHoldingItem(action) {
  const holdingId = action.payload;
  try {
    yield axios.delete(`/api/defaultSettings/holdingItem/${holdingId}`)
    yield put({
      type: 'GET_DEFAULTS'
    })
  } catch (error) {
    console.log('Error deleting default holding item:', error);
  }
}


//runs when "add" next to default repair items is clicked
function* addDefaultRepairItem(action) {
  const repairName = action.payload.repairName;
  const repairCost = action.payload.repairCost;
  try {
    yield axios.post(`/api/defaultSettings/repairItem`, {repairName, repairCost})
    yield put({
      type: 'GET_DEFAULTS'
    })
  } catch (error) {
    console.log('Error adding default repair item:', error);
  }
}


//runs when trash can next to repair item is clicked
function* deleteDefaultRepairItem(action) {
  const repairId = action.payload;
  try {
    yield axios.delete(`/api/defaultSettings/repairItem/${repairId}`)
    yield put({
      type: 'GET_DEFAULTS'
    })
  } catch (error) {
    console.log('Error deleting default repair item:', error);
  }
}


function* defaultSettingsSaga() {
    yield takeLatest('GET_DEFAULTS', getDefaults);
    yield takeLatest('UPDATE_DEFAULT_HOLDING_PERIOD', updateDefaultHoldingPeriod);
    yield takeLatest('ADD_DEFAULT_HOLDING_ITEM', addDefaultHoldingItem);
    yield takeLatest('DELETE_DEFAULT_HOLDING_ITEM', deleteDefaultHoldingItem);
    yield takeLatest('ADD_DEFAULT_REPAIR_ITEM', addDefaultRepairItem);
    yield takeLatest('DELETE_DEFAULT_REPAIR_ITEM', deleteDefaultRepairItem);
  }
  
  export default defaultSettingsSaga;

