import React from 'react';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import { geocodeByPlaceId } from "react-google-places-autocomplete";
import './PropertySearchForm.css';


function PropertySearchForm({userId}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchBarAddress, setSearchBarAddress] = useState("");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [addressId, setAddressId] = useState("");
  const [filterOption, setFilterOption] = useState('add_order')
  const dispatch = useDispatch();

  //forces GooglePlacesAutocomplete dom render to wait till Google script is loaded
  useEffect(() => {
    const loadScript = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyC9pViRyFvm5jpR2ezl9PISh66E3ChmqME&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      document.body.appendChild(script);
    };

    loadScript();
  }, []);
  
  //runs when the user clicks "add"
  //sends the formattedAddress to the properties.saga
  const addAddress = (e) => {
    e.preventDefault();
    
    dispatch ({
        type: 'ADD_PROPERTY',
        payload: {address: formattedAddress , userId: userId, addressId: addressId}
    })
    setSearchBarAddress("");
  } 

    // Runs when search menu is opened, emptying the menu of text
    const menuOpened = () => {
      if (searchBarAddress !== "") {
        setSearchBarAddress("");
      }
    };
    
    //runs when the user clicks on an address from the dropdown menu
    const handleChange = (address) => {
      setSearchBarAddress(address);
      //saves the google address place_id as a unique identifier
      setAddressId(address.value.place_id);
      //geocodeByPlaceId gets the zip code which is needed for the Rentcase API
      geocodeByPlaceId(address.value.place_id)
        .then(results => setFormattedAddress(results[0].formatted_address))
        .catch(error => console.error('error getting geocodeByPlaceId', error));
    }

    //runs when the user changes the sort by option
    const handleFilterChange = (event) => {
      let filter = event.target.value
      setFilterOption(filter);
      switch (filter) {
        case 'add_order':
          return dispatch ({
            type: 'GET_PROPERTIES_FILTERED',
            payload: {orderBy: "inserted_at" , arrange: 'DESC' }
          });
        case 'total_cost_lowtohigh':
          return dispatch ({
            type: 'GET_PROPERTIES_FILTERED',
            payload: {orderBy: "total_cost" , arrange: 'ASC' }
          });
        case 'total_cost_hightolow':
          return dispatch ({
            type: 'GET_PROPERTIES_FILTERED',
            payload: {orderBy: "total_cost" , arrange: 'DESC' }
          });
        case 'monthly_profit_lowtohigh':
          return dispatch ({
            type: 'GET_PROPERTIES_FILTERED',
            payload: {orderBy: "monthly_profit" , arrange: 'ASC'}
          });
        case 'monthly_profit_hightolow':
          return dispatch ({
            type: 'GET_PROPERTIES_FILTERED',
            payload: {orderBy: "monthly_profit" , arrange: 'DESC'}
          });
      }
    }


  return (
    <div className="container">

      <p>Search for a property you might fix & flip:</p>

      <div className = "search-form">
      {isLoaded ? (  
      <GooglePlacesAutocomplete
        apiOptions={{ language: 'en'}}
        autocompletionRequests={{
          componentRestrictions: {
            country: ['us'],
          }
        }}
          selectProps={{
            styles: {
              control: (provided) => ({
            ...provided,
            width: "500px",
            maxWidth: "100%",
            border: "1px solid (rgba(255, 255, 255, 0.41)",
            borderRadius: "10px",
            backdropFilter: "blur(50px)",
              }),
            },
            className: "searchBar", // Provides the component with a class for styling
            isClearable: true, // Allows the textbox to be emptied with X
            onMenuOpen: () => menuOpened(), // Triggers textbox to clear when clicking on it
            value: searchBarAddress,
            onChange: handleChange, //is triggered by the user clicking on an address from the dropdown menu
            placeholder: "Enter an address", // Sets the placeholder for textbox


          }}
        />
      ) : (
        <p>Loading...</p>
      )}
      <button className="modal-btn-2" onClick={addAddress}>Add</button>
      </div>
      <div className = "property-sort">
        <label htmlFor='filter'>Sort By </label>
        <select name='filter' id='filter' onChange={() => handleFilterChange(event)}>
          <option value='add_order'>Order Added</option>
          <option value='total_cost_lowtohigh'>Total Cost: Low to High</option>
          <option value='total_cost_hightolow'>Total Cost: High to Low</option>
          <option value='monthly_profit_lowtohigh'>Monthly Profit: Low to High</option>
          <option value='monthly_profit_hightolow'>Monthly Profit: High to Low</option>
        </select>
      </div>
    </div>
  );
}

export default PropertySearchForm;

// 579 County Road B E, Maplewood, MN 55117
// 2006 Kenwood Dr W, Maplewood, MN 55117
// 2295 Gervais Hills Dr, Little Canada, MN 55117