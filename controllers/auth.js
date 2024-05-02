const express = require("express")
const bcrypt = require('bcrypt')
const User = require("../models/User")
const cors = require('cors')
const jwt = require('jsonwebtoken')

const app = express();

app.use(cors({
    origin: ["http://localhost:3000"],
    methods: ["POST", "GET"],
    credentials: true
}))


exports.signup = async (req, res) => {
    try {

        // Fetch Data
        const { name, email, password } = req.body;

        console.log(name, email, password);

        // Validation
        if (!name || !email || !password) {
            return res.status(401).json({
                error: "Please fill all Credentials"
            })
        }

        //Check if User is already present or not 
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            })
        }

        // Secure password
        let hashed;
        try {
            hashed = await bcrypt.hash(password, 10);
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: "Error in hashing password"
            })
        }

        // Save user in database

        const user = await User.create({
            name, email, password
        })

        return res.status(200).json({
            Status: "Success",
            message: "User Created successfully"
        })
    }
    catch (error) {
        return res.status(500).json({
            error: "User Can not be Registered"
        })
    }
}