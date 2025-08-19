require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require('fs-extra');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

const dbUrl = "mongodb+srv://pockettloan:pockettloan12345@pocket.sbssyen.mongodb.net/?retryWrites=true&w=majority&appName=pocket";

mongoose.connect(dbUrl)
.then(() => console.log("Database connected successfully"))
.catch((err) => console.error("Error connecting to the database:", err));

fs.ensureDirSync(path.join(__dirname, 'documents'));
fs.ensureDirSync(path.join(__dirname, 'uploads/signatures'));

const adminRouter = require("./router/admin_Route");
const userRouter = require("./router/user_Route");
const loanRouter = require("./router/loan_Route");
const paymentRouter = require("./router/payment_Route");
const kycRouter = require("./router/kyc_Route");
const notificationRouter = require("./router/notification_Route");
const documentRoutes = require('./router/documentRoutes');

app.use("/api/v1/admin_route", adminRouter);
app.use("/api/v1/user_route", userRouter);
app.use("/api/v1/loan_route", loanRouter);
app.use("/api/v1/payment_route", paymentRouter);
app.use("/api/v1/kyc_route", kycRouter);
app.use("/api/v1/notification_route", notificationRouter);
app.use('/api/documents', documentRoutes);

const port = 5050;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});