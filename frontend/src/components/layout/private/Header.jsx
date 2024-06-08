import React from "react";
import Nav from "./Nav";

const Header = () => {
  return (
    <header className="layout__navbar">
      <div className="navbar__header">
        <a href="#" className="navbar__title">
          PeakUSocial
        </a>
      </div>
      <Nav/>   
    </header>
  );
};

export default Header;
