import React from "react";
import avatar from "../../../assets/img/user.png";
import { NavLink } from "react-router-dom";

export  const Nav = () => {
  return (
    <nav className="navbar__container-lists">
      <ul className="container-lists__menu-list">
        <li className="menu-list__item">
          <NavLink to="/login" href="#" className="menu-list__link">
            <i className="fa-solid fa-user" />
            <span className="menu-list__title">Login</span>
          </NavLink>
        </li>
        <li className="menu-list__item">
          <NavLink to="/registro" href="#" className="menu-list__link">
            <i className="fa-solid fa-users" />
            <span className="menu-list__title">Registro</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};


