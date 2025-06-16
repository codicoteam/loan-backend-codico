const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Routes

const adminRoute = require("./router/admin_Route.js");
const userRoute = require("./router/user_Route.js");
const loanRoute = require("./router/loan_Route.js");
const paymentRoute = require("./router/payment_Route.js");

const dbUrl =
  "mongodb+srv://pockettloan:pockettloan12345@pocket.sbssyen.mongodb.net/?retryWrites=true&w=majority&appName=pocket";

// const dbUrl = process.env.MONGODB_URI;
//"mongodb://localhost:27017/Pocket_loan_Management"
// "mongodb+srv://toto_academy:toto_academy@totoacademy.sprvhvq.mongodb.net/?retryWrites=true&w=majority&appName=totoAcademy/Pocket_loan_Management";

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error("Error connecting to the database:", err));

// Register routes
app.use("/api/v1/admin_route", adminRoute);
app.use("/api/v1/user_route", userRoute);
app.use("/api/v1/loan_route", loanRoute);
app.use("/api/v1/payment_route", paymentRoute);

const port = 5050;
app.listen(port, () => {
  console.log(`The server is running at port: ${port}`);
});
