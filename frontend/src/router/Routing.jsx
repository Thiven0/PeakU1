import React from "react";
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import PrivateLayout from "../components/layout/private/PrivateLayout";
import PublicLayout from "../components/layout/public/PublicLayout";
import Register from "../components/user/Register";
import Login from "../components/user/Login";
import Feed from "../components/publication/Feed";
import Logout from "../components/user/Logout";
import People from "../components/user/People";
import { Following } from "../components/follow/Following";
import Config from "../components/user/Config";
import { Followers } from "../components/follow/Followers";
import Profile from "../components/user/Profile";
import { AuthProvider } from "../context/AuthProvider";

const Router = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Login />} />
            <Route path="login" element={<Login />} />
            <Route path="registro" element={<Register />} />
          </Route>

          <Route path="/social" element={<PrivateLayout />}>
            <Route index element={<Feed />} />
            <Route path="feed" element={<Feed />} />
            <Route path="logout" element={<Logout />} />
            <Route path="gente" element={<People />} />
            <Route path="ajustes" element={<Config />} />
            <Route path="siguiendo/:userId" element={<Following />} />
            <Route path="seguidores/:userId" element={<Followers />} />
            <Route path="perfil/:userId" element={<Profile />} />
          </Route>
          <Route path="*" element={<h1>Error 404</h1>} />
        </Routes>
        </AuthProvider>
    </BrowserRouter>
  );
};

export default Router;
