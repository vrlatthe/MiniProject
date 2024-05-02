const express = require('express')
const app = express();
const bcrypt = require('bcrypt')
const User = require("./models/User")
const Transaction = require('./models/Transaction')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bodyParser = require("body-parser")
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose')

require('dotenv').config();

const PORT = 5000;

app.use(express.json());

app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }))


app.use(cors({
    origin: ["http://localhost:3000"],
    methods: ["POST", "GET", "DELETE", "PUT"],
    credentials: true
}));


const database = require("./config/database");
database.connect();

// const { signup } = require('./controllers/auth')


app.post('/signup', async (req, res) => {
    // Fetch Data
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
        return res.status(401).json({
            error: "Please fill all Credentials"
        })
    }

    console.log(name, email, password);

    //Check if User is already present or not 
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        console.log("existing user")
        return res.status(400).json({
            success: false,
            message: "User already exists"
        })
    }

    // try {
    //     // Simulate user authentication
    //     const user = { id: 1, username: 'example' };

    //     // Set cookie
    //     res.cookie("token", "token data", {
    //         httpOnly: true,
    //         maxAge: 24 * 60 * 60 * 1000, // 24 hours
    //     });

    //     console.log("Cookie created")

    //     // return res.status(200).json({ Status: "Success", message: 'Login successful' });
    // }
    // catch (error) {
    //     console.error(error);
    //     return res.status(500).json({ error: 'Internal server error' });
    // }

    console.log("hello200");

    // Secure password
    let hashed;
    try {
        hashed = await bcrypt.hash(password.toString(), 10);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error in hashing password"
        })
    }

    console.log(hashed);

    console.log("hello300");

    // Save user in database

    const user = User.create({
        name, email, password: hashed
    })

    console.log("user created!!!");

    return res.status(200).json({
        Status: "Success",
        message: "User Created successfully"
    })
});

app.post('/login', async (req, res) => {

    try {
        // Fetch Data 
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                error: "Please Enter all crediationals"
            })
        }

        // Check for registered user 
        const user = await User.findOne({ email });

        if (user) {
            if (await bcrypt.compare(password, user.password)) {

                const payload = {
                    name: user.name,
                    email: user.email,
                    userId: user._id,
                }

                const token = jwt.sign(payload, 'veduu', { expiresIn: 365 * 24 * 60 * 60 * 1000 });

                res.cookie("token", token, { expires: new Date(Date.now() + 86400 * 1000), httpOnly: true, secure: true, });

                return res.status(200).json({
                    Status: "Success",
                })

            }
            else {
                return res.status(402).json({
                    error: "Incorrect Password"
                })
            }
        }
        else {
            return res.status(404).json({
                error: "User is not registered"
            })
        }
    }
    catch (error) {
        return res.json({
            error: error
        })
    }
})

app.get("/logout", (req, res) => {
    res.clearCookie("token");

    return res.json({ Status: "Success" });
})

app.get('/api/user', async (req, res) => {
    try {
        // Extract userId from JWT token
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, 'secret');
        const userId = decodedToken.userId;

        // Retrieve user from MongoDB
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ name: user.name, email: user.email });
    } catch (error) {
        console.error('Error retrieving user information:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/addTransaction', async (req, res) => {

    const token = req.cookies.token;

    const { amount, type, date, description } = req.body;

    // Verify and decode JWT token

    if (!token) {
        console.log("Missing")
        return res.json({ Error: "You are not Authenticated" });
    }
    else {
        jwt.verify(token, 'veduu', async (err, decoded) => {
            if (err) {
                console.log("Error:", err);
                res.status(401).send('Unauthorized');
            }
            else {
                const userId = decoded.userId;
                const email = decoded.email;
                const user = await User.findOne({ email });
                if (type == 'income') {
                    user.totalBalence = parseFloat(user.totalBalence) + parseFloat(amount);
                    await user.save();
                    // console.log(user.totalBalence);
                }
                else if (type == 'expense') {
                    user.totalBalence = parseFloat(user.totalBalence) - parseFloat(amount);
                    await user.save();
                    // console.log(user.totalBalence);
                }

                // const dateString = date;
                // const dateObj = new Date(date);

                // const day = dateObj.getUTCDate(); // Get day
                // const month = dateObj.getUTCMonth() + 1; // Get month (Note: Month is zero-based, so we add 1)
                // const year = dateObj.getUTCFullYear(); // Get year

                // console.log(day)

                const newTransaction = new Transaction({
                    amount, type, date, description, userId
                });

                await newTransaction.save();
                console.log(newTransaction);

                await User.findByIdAndUpdate(
                    { _id: user._id },
                    {
                        $push: {
                            transaction: newTransaction._id
                        }
                    },
                    { new: true }
                )

                res.status(200).json({ userId });
            }
        });
    }
});

app.post('/showTransaction', async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        console.log("Missing in showTransactions")
        return res.json({
            error: "You are not authenticated"
        })
    }
    else {
        jwt.verify(token, "veduu", async (error, decoded) => {
            if (error) {
                console.log("Error:", err);
                res.status(401).send('Unauthorized');
            }
            else {
                const userId = decoded.userId;
                // const transaction = await Transaction.find({ userId: userId });
                // console.log(transaction);

                User.findById(userId)
                    .populate('transaction')
                    .exec()
                    .then(user => {
                        let tran = user.transaction;
                        res.json(tran);
                    })
                    .catch(err => {
                        console.error('Error occurred while fetching user data:', err);
                        res.status(500).json({ error: 'Internal server error' });
                    });
            }
        })
    }

    // const userId = req.params.userId;

    // // Retrieve user data along with transactions from the database
    // User.findById(userId)
    //     .populate('transactions')
    //     .exec()
    //     .then(user => {
    //         console.log(user);
    //         res.json(user);
    //     })
    //     .catch(err => {
    //         console.error('Error occurred while fetching user data:', err);
    //         res.status(500).json({ error: 'Internal server error' });
    //     });

})

app.delete('/deleteTransaction/:id', async (req, res) => {
    try {
        const t_id = req.params.id;
        console.log("Transaction Id: ", t_id);
        // if (!mongoose.isValidObjectId(t_id)) {
        //     console.log("Error: ")
        //     return res.status(400).json({ error: 'Invalid ID format' });
        // }

        await Transaction.findByIdAndDelete(t_id);

        console.log("Transaction deleted successfully");
    }
    catch (error) {
        console.log("Error while deleting");
        res.status(500).json({
            error: error
        })
    }
})

app.put('/editTransaction/:id', async (req, res) => {
    try {
        const t_id = req.params.id;
        const { amount, type, date, description } = req.body;
        console.log("Transaction id in update: ", t_id);
        const updatedTransaction = await Transaction.findByIdAndUpdate(
            t_id,
            {
                $set: {
                    amount, type, date, description
                }
            },
            { new: true }
        )

        console.log("Transaction Updated")
        console.log(updatedTransaction);

    }
    catch (error) {
        console.log(error)
    }
})

app.listen(PORT, () => {
    console.log(`Backend is listening on ${PORT}`)
})