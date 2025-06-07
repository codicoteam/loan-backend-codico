const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Routes
const adminRouter = require("./router/adminRouter.js");
const caregiverRouter = require("./router/caregiverRouter.js");
const patientRouter = require("./router/patientRouter.js");

// const dbUrl = "mongodb://localhost:27017/Home_Care_Service_Management_System";
const dbUrl = process.env.MONGODB_URI;

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
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/caregiver", caregiverRouter);
app.use("/api/v1/patient", patientRouter);

const port = 5050;
app.listen(port, () => {
  console.log(`The server is running at port: ${port}`);
});
