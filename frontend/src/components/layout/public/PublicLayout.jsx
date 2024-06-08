import { Navigate, Outlet } from "react-router-dom";
import { Header } from "./Header";
import useAuth from "../../../hooks/useAuth";

const PublicLayout = () => {
  const {auth} = useAuth();
  
  return (
    <>
      {/* LAYOUT */}
      <Header />

      {/* Contenido principal */}
      <section className="layout__content">
      <Outlet /> 
        {/*!auth._id ? : <Navigate to="/social"></Navigate>*/}        
        
      </section>
    </>
  )
}

export default PublicLayout;
