const express = require("express");
const router = express.Router();
const careGiverService = require("../services/caregiverService");

// ✅ Create a new caregiver
router.post("/create", async (req, res) => {
  try {
    const caregiver = await careGiverService.createCareGiver(req.body);
    res.status(201).json(caregiver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 📄 Get all caregivers
router.get("/getall", async (req, res) => {
  try {
    const caregivers = await careGiverService.getAllCareGivers();
    res.json(caregivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔍 Get caregiver by ID
router.get("/get/:id", async (req, res) => {
  try {
    const caregiver = await careGiverService.getCareGiverById(req.params.id);
    if (!caregiver) {
      return res.status(404).json({ error: "Caregiver not found" });
    }
    res.json(caregiver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✏️ Update caregiver by ID
router.put("/update/:id", async (req, res) => {
  try {
    const updatedCaregiver = await careGiverService.updateCareGiver(
      req.params.id,
      req.body
    );
    res.json(updatedCaregiver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 🗑️ Delete caregiver by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    await careGiverService.deleteCareGiver(req.params.id);
    res.json({ message: "Caregiver deleted successfully" });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// // 🔐 Login caregiver (optional)
// router.post("/login", async (req, res) => {
//   try {
//     const caregiver = await careGiverService.verifyCredentials(req.body.email, req.body.password);
//     res.json({ message: "Login successful", caregiver });
//   } catch (error) {
//     res.status(401).json({ error: error.message });
//   }
// });

module.exports = router;
