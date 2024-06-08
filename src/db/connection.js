const mongoose = require("mongoose");



const connection = async()=>{
    try{
        await mongoose.connect("mongodb+srv://admin:admin@cluster0.xxyp4j3.mongodb.net/PeakU?retryWrites=true&w=majority");
        console.log("base de datos conectada");
    }catch(error){
        console.log(error);
        throw new Error ("no se pudo conectar a la base de datos")

    }
}
module.exports = connection;