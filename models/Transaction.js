const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true,
    }
})

module.exports = mongoose.model("Transaction", transactionSchema)