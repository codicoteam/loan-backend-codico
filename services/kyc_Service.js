const KycDocument = require("../models/KycDocument");

// Create a new KYC document
const createKycDocument = async (data) => {
  try {
    const existingKyc = await KycDocument.findOne({ userId: data.userId });
    if (existingKyc) {
      throw new Error("KYC document already exists for this user");
    }
    const newKyc = new KycDocument(data);
    await newKyc.save();
    return newKyc;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get all KYC documents
const getAllKycDocuments = async () => {
  try {
    return await KycDocument.find().populate("userId reviewedBy");
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get KYC document by user ID
const getKycByUserId = async (userId) => {
  try {
    return await KycDocument.findOne({ userId }).populate("userId reviewedBy");
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get KYC document by KYC ID
const getKycById = async (id) => {
  try {
    return await KycDocument.findById(id).populate("userId reviewedBy");
  } catch (error) {
    throw new Error(error.message);
  }
};

// Update KYC document
const updateKycDocument = async (id, updateData) => {
  try {
    const updatedKyc = await KycDocument.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedKyc) throw new Error("KYC document not found");
    return updatedKyc;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Delete KYC document
const deleteKycDocument = async (id) => {
  try {
    const deletedKyc = await KycDocument.findByIdAndDelete(id);
    if (!deletedKyc) throw new Error("KYC document not found");
    return deletedKyc;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Review KYC document (set reviewedBy and reviewedAt)
const reviewKycDocument = async (id, adminId) => {
  try {
    const reviewedKyc = await KycDocument.findByIdAndUpdate(
      id,
      {
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      { new: true }
    );
    if (!reviewedKyc) throw new Error("KYC document not found");
    return reviewedKyc;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createKycDocument,
  getAllKycDocuments,
  getKycByUserId,
  getKycById,
  updateKycDocument,
  deleteKycDocument,
  reviewKycDocument,
};
