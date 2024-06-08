// Importaciones con CommonJS
const connection  = require("./db/connection");
const express = require("express");
const cors = require("cors");

console.log("API node iniciada");

// Conexión a la base de datos
console.log("conectando...");
connection();
// Crear servidor Express
const app = express();
const puerto = 4000;

// Conf de CORS
app.use(cors());

// Middleware para parsear el cuerpo de las peticiones HTTP
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
const UserRoutes = require("./routes/user");
const PublicationRoutes = require("./routes/publication");
const FollowRoutes = require("./routes/follow");

// Usar rutas
app.use("/api/user", UserRoutes);
app.use("/api/publication", PublicationRoutes);
app.use("/api/follow", FollowRoutes);

// Ruta de prueba
app.get("/ruta-prueba", (req, res) => {
  return res.status(200).json({
    id: 1,
    nombre: "Harold",
    web: "web1",
  });
});

// Iniciar servidor para escuchar peticiones HTTP
app.listen(puerto, () => {
    console.log("Servidor de Node corriendo en el puerto:", puerto);
});
