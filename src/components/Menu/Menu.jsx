
// import React from "react";
// import { StyledMenu } from "./Menu.styled";
// import { Link } from "react-router-dom/cjs/react-router-dom.min";
// import { useDispatch } from 'react-redux'; // Import useDispatch
// import { StyledLogOutButton } from "../App/LogOutButton/LogOutButton.styled"; // Import styled button

// function Menu({ open, setOpen }) {
//   const dispatch = useDispatch(); // Get dispatch function

//   const handleLinkClick = () => {
//     setOpen(false); // Close the menu
//   };

//   const handleLogout = () => {
//     dispatch({ type: 'LOGOUT' }); // Dispatch logout action
//     handleLinkClick(); // Close the menu after logging out
//   };

//   return (
//     <StyledMenu open={open}>
//       <Link to="/property-page" onClick={handleLinkClick}>
//         Properties
//       </Link>
//       <Link to="/default-settings" onClick={handleLinkClick}>
//         Default Settings
//       </Link>
//       <StyledLogOutButton
//         onClick={handleLogout} // Call handleLogout on click
//       >
//         Logout
//       </StyledLogOutButton>
//     </StyledMenu>
//   );
// }

// export default Menu;


import React from "react";
import { StyledMenu } from "./Menu.styled";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { useStore } from "react-redux";
import { StyledLogOutButton } from "../App/LogOutButton/LogOutButton.styled";

function Menu({ open, setOpen }) {
  const dispatch = useDispatch();
  const user = useSelector((store) => store.user); // Get login state from Redux

  const handleLinkClick = () => {
    setOpen(false); // Close the menu
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' }); // Dispatch logout action
    handleLinkClick(); // Close the menu after logging out
  };

  return (
    // <StyledMenu open={open}>
    //   {!user.id ? (
    //     <>
    //       <Link to="/property-page" onClick={handleLinkClick}>
    //         Properties
    //       </Link>
    //       <Link to="/default-settings" onClick={handleLinkClick}>
    //         Default Settings
    //       </Link>
    //       <StyledLogOutButton onClick={handleLogout}>
    //         Logout
    //       </StyledLogOutButton>
    //     </>
    //   ) : (
    //     <Link to="/login" onClick={handleLinkClick}>
    //       <StyledLogOutButton>
    //         Login
    //       </StyledLogOutButton>
    //     </Link>
    //   )}
    // </StyledMenu>

    <StyledMenu open={open}>
      {!user.id ? (
        <Link to="/login" onClick={handleLinkClick}>
          Login
      </Link>
      ) : (
        <>
        {/* {user.id && ( */}
          <Link to="/property-page" onClick={handleLinkClick}>
            Properties
          </Link>
          <Link to="/default-settings" onClick={handleLinkClick}>
            Default Settings
          </Link>
          <StyledLogOutButton onClick={handleLogout}>
            Logout
          </StyledLogOutButton>
        </>
        
      )}
    </StyledMenu>
  );
}

export default Menu;
