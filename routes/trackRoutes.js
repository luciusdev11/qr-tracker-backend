const express = require('express');
const router = express.Router();
const QRCode = require('../models/QRCode');

// @route   GET /track/:shortId
// @desc    Track QR code scan and redirect to original URL
// @access  Public
router.get('/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;

    const qrCode = await QRCode.findOne({ 
      shortId,
      isActive: true 
    });

    if (!qrCode) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code Not Found</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>QR Code Not Found</h1>
          <p>This QR code does not exist or has been deleted.</p>
        </body>
        </html>
      `);
    }

    // Record the scan
    const scanData = {
      timestamp: new Date(),
      userAgent: req.get('user-agent') || 'Unknown',
      ip: req.ip || req.connection.remoteAddress,
      location: {
        // You can integrate IP geolocation service here
        country: 'Unknown',
        city: 'Unknown'
      }
    };

    // Use the model method to record scan
    await qrCode.recordScan(scanData);

    // Log for debugging
    console.log(`✅ Scan recorded for ${shortId} - Total: ${qrCode.scans}`);

    // Redirect to original URL
    res.redirect(qrCode.originalUrl);

  } catch (error) {
    console.error('Track Error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: Arial; text-align: center; padding: 50px; }
          h1 { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1>Oops! Something went wrong</h1>
        <p>Please try again later.</p>
      </body>
      </html>
    `);
  }
});

module.exports = router;