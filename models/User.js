const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    totalBalence: {
        type: Number,
        default: 0
    },
    transaction: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction"
        }
    ]
})

module.exports = mongoose.model("User", userSchema);