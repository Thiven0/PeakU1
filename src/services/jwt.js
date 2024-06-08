const jwt = require("jwt-simple");
const moment = require("moment");


//clave secreta

const secret = "CLAVE_SECRETA_del_proyecto_peackU_369369";

//crar token

const create_tocken = (user) =>{
    const payload = {
        id: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        imagen: user.image,
        iat: moment().unix(),
        exp: moment().add(30,"days").unix()
    };

    //devolver jwt
    return jwt.encode(payload,secret);
}


module.exports = {
    create_tocken,
    secret
}