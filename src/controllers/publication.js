// Importar modulos
const fs = require("fs");
const path = require("path");

// Importar modelos
const Publication = require("../models/publication");

// Importar servicios
const followService = require("../services/followService");

// Acciones de prueba
const pruebaPublication = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/publication.js"
    });
}

// Guardar publicacion
const save = async (req, res) => {
    // Recoger datos del body
    const params = req.body;

    // Si no me llegan dar respuesta negativa
    if (!params.text) return res.status(400).send({ status: "error", message: "Debes enviar el texto de la publicación." });

    try {
        // Crear y rellenar el objeto del modelo
        let newPublication = new Publication({
            user: req.user.id,
            text: params.text,
            file: params.file || '' // Asumiendo que puede haber un archivo opcional
        });

        // Guardar objeto en bbdd
        const publicationStored = await newPublication.save();

        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Publicación guardada",
            publication: publicationStored
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "No se ha guardado la publicación",
            error: error.message
        });
    }
}


// Sacar una publicacion
const detail = async (req, res) => {
    // Sacar id de publicación de la URL
    const publicationId = req.params.id;

    try {
        // Find con la condición del id
        const publication = await Publication.findById(publicationId);

        if (!publication) {
            return res.status(404).send({
                status: "error",
                message: "No existe la publicacion"
            });
        }

        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Mostrar publicacion",
            publication: publication
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al recuperar la publicación",
            error: error.message
        });
    }
}


// Eliminar publicaciones
const remove = async (req, res) => {
    // Sacar el id de la publicación a eliminar
    const publicationId = req.params.id;

    try {
        const result = await Publication.deleteOne({ user: req.user.id, _id: publicationId });

        if (result.deletedCount === 0) {
            return res.status(404).send({
                status: "error",
                message: "No se ha encontrado la publicación a eliminar o no tienes permiso"
            });
        }

        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Eliminar publicacion",
            publication: publicationId
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "No se ha eliminado la publicacion",
            error: error.message
        });
    }
}


// listar publicaciones de un usuario
const user = async (req, res) => {
    // Sacar el id de usuario
    const userId = req.params.id;

    // Controlar la página
    let page = 1;
    if (req.params.page) page = parseInt(req.params.page);

    const itemsPerPage = 5;

    try {
        const options = {
            page,
            limit: itemsPerPage,
            sort: { created_at: -1 },
            populate: 'user',
            select: '-password -__v -role -email'
        };

        const publicationsResult = await Publication.paginate({ user: userId }, options);

        if (!publicationsResult || publicationsResult.docs.length === 0) {
            return res.status(404).send({
                status: "error",
                message: "No hay publicaciones para mostrar"
            });
        }

        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Publicaciones del perfil de un usuario",
            publications: publicationsResult.docs,
            total: publicationsResult.totalDocs,
            pages: publicationsResult.totalPages,
            currentPage: publicationsResult.page
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al recuperar las publicaciones",
            error: error.message
        });
    }
}


// Subir ficheros
const upload = (req, res) => {
    // Sacar publication id
    const publicationId = req.params.id;

    // Recoger el fichero de imagen y comprobar que existe
    if (!req.file) {
        return res.status(404).send({
            status: "error",
            message: "Petición no incluye la imagen"
        });
    }

    // Conseguir el nombre del archivo
    let image = req.file.originalname;

    // Sacar la extension del archivo
    const imageSplit = image.split("\.");
    const extension = imageSplit[1];

    // Comprobar extension
    if (extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif") {

        // Borrar archivo subido
        const filePath = req.file.path;
        const fileDeleted = fs.unlinkSync(filePath);

        // Devolver respuesta negativa
        return res.status(400).send({
            status: "error",
            message: "Extensión del fichero invalida"
        });
    }

    // Si si es correcta, guardar imagen en bbdd
    Publication.findOneAndUpdate({ "user": req.user.id, "_id": publicationId }, { file: req.file.filename }, { new: true }, (error, publicationUpdated) => {
        if (error || !publicationUpdated) {
            return res.status(500).send({
                status: "error",
                message: "Error en la subida del avatar"
            })
        }

        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            publication: publicationUpdated,
            file: req.file,
        });
    });

}

// Devolver archivos multimedia imagenes
const media = async (req, res) => {
    // Sacar el parámetro de la URL
    const file = req.params.file;

    // Montar el path real de la imagen
    const filePath = path.join(__dirname, "../uploads/publications", file);

    try {
        await fs.promises.stat(filePath);
        
        // Devolver un file
        return res.sendFile(path.resolve(filePath));

    } catch (error) {
        return res.status(404).send({
            status: "error",
            message: "No existe la imagen",
            error: error.message
        });
    }
}


// Listar todas las publicaciones (FEED)
const feed = async (req, res) => {
    // Sacar la pagina actual
    let page = 1;

    if (req.params.page) {
        page = req.params.page;
    }

    // Establecer numero de elementos por pagina
    let itemsPerPage = 5;

    // Sacar un array de identificadores de usuarios que yo sigo como usuario logueado
    try {
        const myFollows = await followService.followUserIds(req.user.id);

        // Find a publicaciones in, ordenar, popular, paginar
        const publications = Publication.find({ user: myFollows.following })
            .populate("user", "-password -role -__v -email")
            .sort("-created_at")
            .paginate(page, itemsPerPage, (error, publications, total) => {

                if(error || !publications){
                    return res.status(500).send({
                        status: "error",
                        message: "No hay publicaciones para mostrar",
                    });
                }

                return res.status(200).send({
                    status: "success",
                    message: "Feed de publicaciones",
                    following: myFollows.following,
                    total,
                    page,
                    pages: Math.ceil(total / itemsPerPage),
                    publications
                });
            });

    } catch (error) {

        return res.status(500).send({
            status: "error",
            message: "Error al obtener usuarios que sigues",
        });
    }

}

// Exportar acciones
module.exports = {
    pruebaPublication,
    save,
    detail,
    remove,
    user,
    upload,
    media,
    feed
}