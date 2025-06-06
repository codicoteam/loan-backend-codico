const express = require("express");
const router = express.Router();
const patientService = require("../services/patientService");

// ✅ Create a new patient
router.post("/create", async (req, res) => {
  try {
    const patient = await patientService.createPatient(req.body);
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 📄 Get all patients
router.get("/getall", async (req, res) => {
  try {
    const patients = await patientService.getAllPatients();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔍 Get a patient by ID
router.get("/get/:id", async (req, res) => {
  try {
    const patient = await patientService.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✏️ Update a patient
router.put("/update/:id", async (req, res) => {
  try {
    const updated = await patientService.updatePatient(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 🗑️ Delete a patient
router.delete("/delete/:id", async (req, res) => {
  try {
    const deleted = await patientService.deletePatient(req.params.id);
    res.json(deleted);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// // 🔐 Patient login
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const patient = await patientService.verifyCredentials(email, password);
//     res.json(patient);
//   } catch (error) {
//     res.status(401).json({ error: error.message });
//   }
// });

module.exports = router;
