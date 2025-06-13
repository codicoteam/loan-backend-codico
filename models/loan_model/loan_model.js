const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  province: String,
  phone: String,
  mobile: String,
  work: String,
  owned: Boolean,
  rentAmount: Number,
  historyYears: Number,
});

const employmentSchema = new mongoose.Schema({
  company: String,
  jobTitle: String,
  address: String,
  suburb: String,
  city: String,
  province: String,
  contactEmail: String,
  contactPhone: String,
  salary: Number,
  from: Date,
  to: Date,
});

const businessSchema = new mongoose.Schema({
  name: String,
  description: String,
  multipleLocations: Boolean,
  address: String,
  suburb: String,
  city: String,
  province: String,
  leased: Boolean,
  leaseCost: Number,
  ownPremises: Boolean,
  titleDeedAttached: Boolean,
  tradingLicenseAttached: Boolean,
  netIncome: Number,
  from: Date,
  to: Date,
});

const financialSummarySchema = new mongoose.Schema({
  salary: Number,
  hustleProfit: Number,
  businessExpenses: Number,
  bonuses: Number,
  rent: Number,
  rentalIncome: Number,
  schoolFees: Number,
  investmentIncome: Number,
  ratesAndBills: Number,
  otherIncome: Number,
  loanRepayments: Number,
  otherDebts: Number,
  totalIncome: Number,
  totalExpenses: Number,
  netIncome: Number,
});

const assetLiabilitySchema = new mongoose.Schema({
  assets: {
    property: [String],
    vehicles: [String],
    furniture: Number,
    machinery: Number,
    artwork: Number,
    shares: [String],
    pension: Number,
    mutualFunds: Number,
    total: Number,
  },
  liabilities: {
    mortgages: [Number],
    bankLoans: [Number],
    retailLoans: [String],
    otherDebts: [String],
    total: Number,
  },
  net: Number,
});

const bankReferenceSchema = new mongoose.Schema({
  institution: String,
  currentAccount: String,
  savingsAccount: String,
  loanNumber: String,
  loanBalance: Number,
  branch: String,
});

const paymentScheduleSchema = new mongoose.Schema({
  dueDate: Date,
  amountDue: Number,
  amountPaid: Number,
  paidOn: Date,
  status: {
    type: String,
    enum: ["pending", "paid", "overdue"],
    default: "pending",
  },
});

const loanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productType: {
      type: String,
      enum: [
        " Education Loan (Short Term)",
        "Vehicle Loan (Long Term)",
        "Solar Loan (LT)",
        " Building Finisher Loan (LT)",
      ],
      required: true,
    },

    borrowerInfo: {
      firstName: String,
      middleNames: String,
      surname: String,
      alias: String,
      idNumber: String,
      passport: String,
      email: String,
      phone: String,
      mobile: String,
      ecocash: Boolean,
      oneMoney: Boolean,
      innsBucks: Boolean,
      maritalStatus: String,
      children: Number,
      childrenUnder18: Number,
      dependents: Number,
    },

    spouseInfo: {
      employed: Boolean,
      firstName: String,
      middleNames: String,
      surname: String,
      alias: String,
      idNumber: String,
      passport: String,
      phone: String,
      mobile: String,
      email: String,
      ecocash: Boolean,
      oneMoney: Boolean,
      innsBucks: Boolean,
    },

    residentialHistory: {
      currentAddress: addressSchema,
      previousAddress: addressSchema,
      landlordName: String,
      rentalCompany: String,
    },

    borrowerEmploymentHistory: [employmentSchema],
    borrowerBusinessHistory: [businessSchema],
    spouseEmploymentHistory: [employmentSchema],
    spouseBusinessHistory: [businessSchema],

    financialSummary: financialSummarySchema,
    borrowerAssetsLiabilities: assetLiabilitySchema,
    spouseAssetsLiabilities: assetLiabilitySchema,

    bankReferences: [bankReferenceSchema],

    bankruptcy: {
      hasDeclared: Boolean,
      declaredDate: Date,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "active", "closed"],
      default: "pending",
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    approvalDate: Date,
    startDate: Date,
    endDate: Date,
    amount: Number,
    interestRate: Number,
    term: Number,
    balance: Number,
    paymentSchedule: [paymentScheduleSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Loan", loanSchema);
