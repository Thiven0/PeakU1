// Importar dependencias y modulos
const bcrypt = require("bcrypt");
const mongoosePagination = require("mongoose-pagination");
const fs = require("fs");
const path = require("path");

// Importar modelos
const User = require("../models/user");
// const Follow = require("../models/follow");
// const Publication = require("../models/publication");

// Importar servicios
const jwt = require("../services/jwt");
// const followService = require("../services/followService");
// const validate = require("../helpers/validate");

const pruebaUser = (req, res) => {
  return res.status(200).send({
    message: "mensaje enviado desde: controllers/user.js",
  });
};

//login de usuarios
const login = (req, res) => {
  //parametros
  let params = req.body;

  if (!params.email || !params.password) {
    return res.status(400).send({
      status: "error",
      message: "Faltan datos por enviar",
    });
  }

  //existencia en la db
  User.findOne({ email: params.email })
    //.select({"password": 0})
    //.exec()
    .then((user) => {
      if (!user) {
        return res
          .status(404)
          .send({ status: "error", message: "el usuario no existe " });
      }

      //comprbar pw

      const pwd = bcrypt.compareSync(params.password, user.password);

      if (!pwd) {
        return res
          .status(400)
          .send({ status: "error", message: "error en la contraseña" });
      }

      //devolver token
      const token = jwt.create_tocken(user);

      //datos del usuario

      return res.status(200).send({
        status: "success",
        message: "identificado correctamente",
        user: { id: user.id, name: user.name, nick: user.nick },
        token,
      });
    })
    .catch((err) => {
      return res
        .status(404)
        .send({ status: "error", message: "el usuario no existe" });
    });
};

// Regristro de usuarios
const register = (req, res) => {
  // Recoger datos de la peticion
  let params = req.body;

  // Comprobar que me llegan bien y validacion
  if (!params.name || !params.email || !params.password || !params.nick) {
    return res.status(400).json({
      status: "error",
      message: "Faltan datos por enviar",
    });
  }

  // Control usuarios duplicados
  User.find({
    $or: [
      { email: params.email.toLowerCase() },
      { nick: params.nick.toLowerCase() },
    ],
  })
    .exec()
    .then(async (users) => {
      if (users && users.length >= 1) {
        return res.status(200).send({
          status: "success",
          message: "El usuario ya existe",
        });
      }

      // Cifrar la contraseña
      let pwd = await bcrypt.hash(params.password, 10);
      params.password = pwd;
      console.log(pwd);

      // Crear objeto de usuario
      let user_to_save = new User(params);

      // Guardar usuario en la bd

      user_to_save
        .save()
        .then((userStored) => {
          // Devolver resultado
          if (!userStored) {
            return res.status(500).send({
              status: "error",
              message: "Error al guardar el usuario",
            });
          }
          return res.status(200).json({
            status: "success",
            message: "Usuario registrado correctamente",
            user: userStored,
          });
        })
        .catch((error) => {
          return res.status(500).send({
            status: "error",
            message: "Error al guardar el usuario",
            error: error,
          });
        });

      // user_to_save.save((error,userStored) => {

      //     if (error || !userStored) return res.status(500).send({ status: "error", message: "Error al guardar el ususario" });

      //     return res.status(200).json({
      //         status: "success",
      //         message: "Registro exitoso",
      //         user: userStored
      //     });
      // })
    })
    .catch((error) => {
      return res.status(500).json({
        status: "error",
        message: "Error en la consulta de usuarios",
      });
    });
};

const profile = (req, res) => {
  //recibi el parametro del id
  const id = req.params.id;

  //consulta datos usuario

  //devolver informacion de los follows

  User.findById(id)
    .select({ password: 0, role: 0 })
    .exec()
    .then((userProfile) => {
      if (!userProfile) {
        return res.status(404).send({
          status: "error",
          message: "Usuario no encontrado",
        });
      }
      return res.status(200).send({
        status: "success",
        userProfile,
      });
    })
    .catch((error) => {
      return res.status(500).send({
        status: "error",
        message: error.message,
      });
    });

  //devolver resultados
};

const list = (req, res) => {
  //controlar la pagina
  let page = 1;
  if (req.params.page) {
    page = req.params.page;
  }
  page = parseInt(page);

  //consultar  paginate
  let itemsPerPage = 5;

  User.find()
    .select("-password -email -role -__v")
    .sort("_id")
    .paginate(page, itemsPerPage)
    .then((users, total) => {
      if (!users) {
        return res.status(404).send({
          status: "error",
          message: "No hay usuarios disponibles",
          error,
        });
      }
      return res.status(200).send({
        status: "success",
        users,
        page,
        itemsPerPage,
        total,
        pages: Math.ceil(total / itemsPerPage),
      });
    })
    .catch((error) => {
      return res.status(500).send({
        status: "error",
        message: error.message,
      });
    });
};

const update = async (req, res) => {
  try {
    // Recoger info del usuario a actualizar
    let userIdentity = req.user;
    let userToUpdate = req.body;

    // Eliminar campos sobrantes
    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;
    delete userToUpdate.image;

    // Comprobar si el usuario ya existe
    let users = await User.find({
      $or: [
        { email: userToUpdate.email.toLowerCase() },
        { nick: userToUpdate.nick.toLowerCase() },
      ],
    });

    let userIsset = users.some(
      (user) => user && user._id.toString() !== userIdentity.id
    );

    if (userIsset) {
      return res.status(200).send({
        status: "success",
        message: "El usuario ya existe",
      });
    }

    // Cifrar la contraseña
    if (userToUpdate.password) {
      userToUpdate.password = await bcrypt.hash(userToUpdate.password, 10);
    } else {
      delete userToUpdate.password;
    }

    // Buscar y actualizar
    let userUpdated = await User.findByIdAndUpdate(
      { _id: userIdentity.id },
      userToUpdate,
      { new: true }
    );

    if (!userUpdated) {
      return res
        .status(400)
        .json({ status: "error", message: "Error al actualizar" });
    }

    // Devolver respuesta
    return res.status(200).send({
      status: "success",
      message: "Metodo de actualizar usuario",
      user: userUpdated,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al actualizar",
    });
  }
};

const upload = (req, res) => {
  // Recoger el fichero de imagen y comprobar que existe
  if (!req.file) {
    return res.status(404).send({
      status: "error",
      message: "Petición no incluye la imagen",
    });
  }

  // Conseguir el nombre del archivo
  let image = req.file.originalname;

  // Sacar la extensión del archivo
  const imageSplit = image.split(".");
  const extension = imageSplit[1];

  // Comprobar extensión
  if (
    extension != "png" &&
    extension != "jpg" &&
    extension != "jpeg" &&
    extension != "gif"
  ) {
    // Borrar archivo subido
    const filePath = req.file.path;
    return unlink(filePath)
      .then(() => {
        return res.status(400).send({
          status: "error",
          message: "Extensión del fichero invalida",
        });
      })
      .catch((error) => {
        // Manejar error al intentar eliminar el archivo
        return res.status(500).send({
          status: "error",
          message: "Error al eliminar archivo",
        });
      });
  }

  // Si la extensión es correcta, guardar imagen en bbdd
  User.findOneAndUpdate(
    { _id: req.user.id },
    { image: req.file.filename },
    { new: true }
  )
    .then((userUpdated) => {
      if (!userUpdated) {
        return res.status(500).send({
          status: "error",
          message: "Error en la subida del avatar",
        });
      }

      // Devolver respuesta
      return res.status(200).send({
        status: "success",
        user: userUpdated,
        file: req.file,
      });
    })
    .catch((error) => {
      return res.status(500).send({
        status: "error",
        message: "Error en la base de datos",
      });
    });
};

const avatar = (req, res) => {
  // Sacar el parámetro de la URL
  const file = req.params.file;

  // Montar el path real de la imagen
  const filePath = `./src/uploads/avatars/${file}`;

  // Comprobar que existe
  fs.stat(filePath, (error, exists) => {
    if (!exists) {
      return res.status(404).send({
        status: "error",
        message: "No existe la imagen",
      });
    }

    // Devolver un file
    return res.sendFile(path.resolve(filePath));
  });
};

const counters = async (req, res) => {

  let userId = req.user.id;

  if (req.params.id) {
      userId = req.params.id;
  }

  try {
      const following = await Follow.count({ "user": userId });

      const followed = await Follow.count({ "followed": userId });

      const publications = await Publication.count({ "user": userId });

      return res.status(200).send({
          userId,
          following: following,
          followed: followed,
          publications: publications
      });
  } catch (error) {
      return res.status(500).send({
          status: "error",
          message: "Error en los contadores",
          error
      });
  }
}

module.exports = {
  pruebaUser,
  register,
  login,
  profile,
  list,
  update,
  upload,
  avatar,
  counters,
};
