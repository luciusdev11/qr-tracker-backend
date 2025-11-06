const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  userAgent: String,
  ip: String,
  location: {
    country: String,
    city: String
  }
});

const qrCodeSchema = new mongoose.Schema({
  shortId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  originalUrl: {
    type: String,
    required: true
  },
  trackingUrl: {
    type: String,
    required: true
  },
  qrCodeImage: {
    type: String // Base64 encoded QR code image
  },
  scans: {
    type: Number,
    default: 0
  },
  scanHistory: [scanSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    default: 'anonymous'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for faster queries
qrCodeSchema.index({ createdAt: -1 });
qrCodeSchema.index({ scans: -1 });

// Method to increment scan count
qrCodeSchema.methods.recordScan = async function(scanData) {
  this.scans += 1;
  this.scanHistory.push(scanData);
  await this.save();
  return this;
};

module.exports = mongoose.model('QRCode', qrCodeSchema);