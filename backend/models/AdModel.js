const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    redirectUrl: { type: String, required: true },
    priority: { type: Number, default: 0 }, // Higher priority ads appear first
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports =  mongoose.model("Ad", AdSchema);
