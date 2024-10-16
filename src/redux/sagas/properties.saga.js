import { put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';

function* getProperties(action) {
  const userId = action.payload;
  try {
    const response = yield axios.get(`/api/properties/${userId}`)
    yield put({
      type: 'SET_PROPERTIES',
      payload: response.data
    })
  } catch (error) {
    console.log('Error in getting properties:', error);
  }
}


function* addProperty(action) {
  console.log('Payload data:', action.payload);
  const address = action.payload.address;
  const userId = action.payload.userId
  const addressId = action.payload.addressId
  try {
    const response = yield axios.post(`api/properties`, {address:address, addressId: addressId})
    console.log('addProperty data:', response.data);

    yield put({
      type: 'SET_CALCULATIONS',
      payload: response.data
    })
    console.log('SET_CALCULATIONS worked!');
    
    yield put({
        type: 'GET_PROPERTIES',
        payload: userId
    })
    console.log('GET_PROPERTIES worked!');
  } catch (error) {
    console.log('Error in getting property details:', error);
  }
}


function* deleteProperty(action) {
  // console.log('deleteProperty saga received a dispatch: ', action.payload)
  const propertyId = action.payload.propertyId;
  const userId = action.payload.userId;
  try {
    const response = yield axios.delete(`/api/properties/${propertyId}`)
    // console.log('response from server is delete property route: ', response.data)
    yield put({
      type: 'GET_PROPERTIES',
      payload: userId
    })
  } catch (error) {
    console.log('Error in getting properties:', error);
    
  }
}


//receives updated property information, sends the infomaiton to the server,
//and gets new property and properties 
function* updateProperty(action) {
  console.log('in update property: ', action.payload)
  try {
    //sends a put request to to the properties router
    yield axios.put(`api/properties`, action.payload)
    yield put({
      type: 'GET_PROPERTY_OF_INTEREST',
      payload: action.payload.propertyId
    })
    yield put({
      type: 'GET_PROPERTIES',
      payload: action.payload.userId
    })
  } catch (error) {
    console.log('Error updating property taxes:', error);
  }
}


function* updateBackToDefault(action) {
  // console.log('Payload for back to default:', action.payload);
  const propertyId = action.payload;
  try {
      const response = yield axios.put(`/api/properties/backToDefault/${propertyId}`)
      console.log('UPDATE DEFAULT DATA:', response.data);
      

      // ========================== IF CALLING API IN ROUTE ==========================
      yield put({
        type: 'GET_PROPERTY_OF_INTEREST',
        payload: propertyId
      })

  } catch (error) {
    console.log('Error in updating back to default:', error);
  }
}


//getPropertyOfInterest sends an axios request to the properties.router.js and
//sends the response data to the PropertyOfInterest reducer.
function* getPropertyOfInterest(action) {
  try {
    //to properties.router.js with the property id as a paramater
    const response = yield axios.get(`/api/properties/propertyOfInterest/${action.payload}`);
    console.log('response from /api/properties/propertyOfInterest/id route: ', response.data);
    yield put({ type: 'SET_PROPERTY_OF_INTEREST', payload: response.data });
  } catch (error) {
    console.log('getPropertyOfInterest get request failed', error);
  }
}


function* updatePropertyTaxes(action) {
  console.log('in update property taxes: ', action.payload)
  try {
    yield axios.put(`/api/properties/taxes`, {propertyId: action.payload})
    yield put({
        type: 'GET_PROPERTY_OF_INTEREST',
        payload: action.payload
    })
  } catch (error) {
    console.log('Error updating property taxes:', error);
  }
}


function* getPropertiesFiltered(action) {
  try {
    const response = yield axios.get(`/api/properties/filtered/${action.payload.orderBy}/${action.payload.arrange}`)
    console.log('response from server in get proeprties filtered: ', response.data)
    yield put({
      type: 'SET_PROPERTIES_FILTERED',
      payload: response.data
    })
  } catch (error) {
    console.log('Error updating property taxes:', error);
  }
}


function* propertiesSaga() {
    yield takeLatest('GET_PROPERTIES', getProperties);
    yield takeLatest('ADD_PROPERTY', addProperty);
    yield takeLatest('DELETE_PROPERTY', deleteProperty);
    yield takeLatest('UPDATE_PROPERTY', updateProperty);
    yield takeLatest('UPDATE_BACK_TO_DEFAULT', updateBackToDefault);
    yield takeLatest('GET_PROPERTY_OF_INTEREST', getPropertyOfInterest);
    yield takeLatest('UPDATE_PROPERTY_TAXES', updatePropertyTaxes);
    yield takeLatest('GET_PROPERTIES_FILTERED', getPropertiesFiltered);
  }
  
  export default propertiesSaga;