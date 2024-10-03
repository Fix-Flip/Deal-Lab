import LogOutButton from "../App/LogOutButton/LogOutButton";
import { Link } from "react-router-dom/cjs/react-router-dom.min";
import { useSelector } from "react-redux";
import { useState, useRef } from "react";
import { useOnClickOutside } from '../../hooks/hooks';

import React from "react";
import "./Header.css";
import Hamburger from "../Hamburger/Hamburger";
import Menu from "../Menu/Menu";

function Header() {
    const user = useSelector((store) => store.user);
    const [open, setOpen] = useState(false);
    const node = useRef(); 
    useOnClickOutside(node, () => setOpen(false));
  
    return (
      <div>
        <div>
          <header className="header">
          <container className="container">
          {/* <Link to="/home"> */}
        <img 
        className="logo"
        src="./deal-lab-logo.png" />
        {/* </Link> */}
        <h2 className="fix-flip">Fix & Flipper</h2>
        </container>
        
            
        <div ref={node}>
          <Hamburger open={open} setOpen={setOpen} />
          <Menu open={open} setOpen={setOpen} />
        </div>

        <div>
        {/* If no user is logged in, show these links */}
        {/* {!user.id && (
          // If there's no user, show login/registration links
          <Link className="navLink" to="/login">
            Login / Register
          </Link>
        )} */}
        <nav>
        {/* If a user is logged in, show these links */}
        {user.id && (
          <>
            {/* <Link className="navLink" to="/property-page">
              Properties
            </Link> */}

            {/* <Link className="navLink" to="/default-settings">
              Default Settings
            </Link> */}

            {/* <LogOutButton className="navLink" /> */}

            {/* <div className="hamburger"> */}
            {/* <Hamburger /> */}
            {/* </div> */}
          </>
        )}
        </nav>

      </div>
          </header>
        </div>
      </div>
    );
  }
  
  export default Header;