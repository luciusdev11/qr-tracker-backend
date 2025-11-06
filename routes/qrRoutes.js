const express = require('express');
const router = express.Router();
const QRCode = require('../models/QRCode');
const qrcode = require('qrcode');
const crypto = require('crypto');

// Generate unique short ID
const generateShortId = () => {
  return crypto.randomBytes(6).toString('hex');
};

// @route   POST /api/qr/generate
// @desc    Generate a new QR code
// @access  Public
router.post('/generate', async (req, res) => {
  try {
    const { originalUrl, createdBy } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: 'Original URL is required' });
    }

    // Validate URL format
    try {
      new URL(originalUrl);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const shortId = generateShortId();
    const trackingUrl = `${process.env.BASE_URL}/track/${shortId}`;

    // Generate QR code image as base64
    const qrCodeImage = await qrcode.toDataURL(trackingUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const newQR = new QRCode({
      shortId,
      originalUrl,
      trackingUrl,
      qrCodeImage,
      createdBy: createdBy || 'anonymous'
    });

    await newQR.save();

    res.status(201).json({
      success: true,
      data: newQR
    });

  } catch (error) {
    console.error('Generate QR Error:', error);
    res.status(500).json({ error: 'Server error generating QR code' });
  }
});

// @route   GET /api/qr/list
// @desc    Get all QR codes
// @access  Public
router.get('/list', async (req, res) => {
  try {
    const { limit = 50, page = 1, sortBy = 'createdAt', order = 'desc' } = req.query;

    const qrCodes = await QRCode.find({ isActive: true })
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-scanHistory'); // Don't send full scan history in list

    const total = await QRCode.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: qrCodes,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('List QR Error:', error);
    res.status(500).json({ error: 'Server error fetching QR codes' });
  }
});

// @route   GET /api/qr/:id
// @desc    Get single QR code with full details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const qrCode = await QRCode.findOne({ 
      shortId: req.params.id,
      isActive: true 
    });

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    res.json({
      success: true,
      data: qrCode
    });

  } catch (error) {
    console.error('Get QR Error:', error);
    res.status(500).json({ error: 'Server error fetching QR code' });
  }
});

// @route   DELETE /api/qr/:id
// @desc    Delete (deactivate) a QR code
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const qrCode = await QRCode.findOne({ shortId: req.params.id });

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    qrCode.isActive = false;
    await qrCode.save();

    res.json({
      success: true,
      message: 'QR code deleted successfully'
    });

  } catch (error) {
    console.error('Delete QR Error:', error);
    res.status(500).json({ error: 'Server error deleting QR code' });
  }
});

// @route   GET /api/qr/stats/:id
// @desc    Get QR code statistics
// @access  Public
router.get('/stats/:id', async (req, res) => {
  try {
    const qrCode = await QRCode.findOne({ 
      shortId: req.params.id,
      isActive: true 
    });

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    // Calculate statistics
    const stats = {
      totalScans: qrCode.scans,
      recentScans: qrCode.scanHistory.slice(-10).reverse(),
      scansByDay: {},
      createdAt: qrCode.createdAt
    };

    // Group scans by day
    qrCode.scanHistory.forEach(scan => {
      const day = scan.timestamp.toISOString().split('T')[0];
      stats.scansByDay[day] = (stats.scansByDay[day] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ error: 'Server error fetching statistics' });
  }
});

module.exports = router;