import React from 'react';
import { bool, func } from 'prop-types';
import { StyledBurger } from './Hamburger.styled';
import { useState } from 'react';

function Hamburger({ setOpen, open }) {
    
    // const [open, setOpen] = useState(false);

    const hamburgerClick = () => {
        setOpen(!open);
        console.log('open is:', open)
        console.log('setOpen is:', setOpen)
    }
console.log('setOpen is:', typeof setOpen);
  return (
    // <button onClick={hamburgerClick}>
    //     helloooo
    // <div>
    <nav>
    <StyledBurger onClick={hamburgerClick}>
      <div />
      <div />
      <div />
    </StyledBurger>
    </nav>
    // </div>
    // </button>
  )
}

// Hamburger.propTypes = {
//   open: bool.isRequired,
//   setOpen: func.isRequired,
// };
export default Hamburger;