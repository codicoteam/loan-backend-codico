const express = require("express");
const router = express.Router();
const kycService = require("../services/kyc_Service");

// Create a new KYC document
router.post("/create", async (req, res) => {
  try {
    const kyc = await kycService.createKycDocument(req.body);
    res.status(201).json(kyc);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all KYC documents
router.get("/getall", async (req, res) => {
  try {
    const allKyc = await kycService.getAllKycDocuments();
    res.status(200).json(allKyc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get KYC by user ID
router.get("/get/:userId", async (req, res) => {
  try {
    const kyc = await kycService.getKycByUserId(req.params.userId);
    if (!kyc) return res.status(404).json({ error: "KYC not found" });
    res.status(200).json(kyc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get KYC by KYC document ID
router.get("/get/:id", async (req, res) => {
  try {
    const kyc = await kycService.getKycById(req.params.id);
    if (!kyc) return res.status(404).json({ error: "KYC not found" });
    res.status(200).json(kyc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update KYC document
router.put("/update/:id", async (req, res) => {
  try {
    const updatedKyc = await kycService.updateKycDocument(
      req.params.id,
      req.body
    );
    res.status(200).json(updatedKyc);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete KYC document
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedKyc = await kycService.deleteKycDocument(req.params.id);
    res.status(200).json(deletedKyc);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Review KYC document
router.put("/:id/review", async (req, res) => {
  try {
    const reviewedKyc = await kycService.reviewKycDocument(
      req.params.id,
      req.body.adminId
    );
    res.status(200).json(reviewedKyc);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
