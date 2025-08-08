const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbUrl = "mongodb+srv://pockettloan:pockettloan12345@pocket.sbssyen.mongodb.net/?retryWrites=true&w=majority&appName=pocket";

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("Database connected successfully"))
.catch((err) => console.error("Error connecting to the database:", err));

// Import routes
const adminRouter = require("./router/admin_Route");
const userRouter = require("./router/user_Route");
const loanRouter = require("./router/loan_Route");
const paymentRouter = require("./router/payment_Route");
const kycRouter = require("./router/kyc_Route");
const notificationRouter = require("./router/notification_Route");

// Use routes
app.use("/api/v1/admin_route", adminRouter);
app.use("/api/v1/user_route", userRouter);
app.use("/api/v1/loan_route", loanRouter);
app.use("/api/v1/payment_route", paymentRouter);
app.use("/api/v1/kyc_route", kycRouter);
app.use("/api/v1/notification_route", notificationRouter);

// Create uploads directory if it doesn't exist
const fs = require('fs-extra');
fs.ensureDir('uploads/signatures').catch(err => console.error('Error creating uploads directory:', err));

const port = 5050;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});