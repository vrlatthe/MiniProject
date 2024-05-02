const mongoose = require('mongoose')
require('dotenv').config();

exports.connect = () => {
    mongoose.connect("mongodb://127.0.0.1/wallet", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
        .then(() => {
            console.log("Database connected")
        })
        .catch((error) => {
            console.log("Database connection error")
        })
}