const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  console.log('\n🌐 Your Network IP Addresses:\n');
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`✅ ${name}: ${iface.address}`);
        console.log(`   Use this in .env: BASE_URL=http://${iface.address}:5000`);
        console.log(`   Frontend access: http://${iface.address}:3000\n`);
      }
    }
  }
  
  console.log('📱 Steps to test on mobile:');
  console.log('1. Copy one of the IP addresses above');
  console.log('2. Update BASE_URL in backend/.env');
  console.log('3. Restart backend server');
  console.log('4. Open frontend on mobile: http://YOUR_IP:3000');
  console.log('5. Generate QR code and scan it!\n');
}

getLocalIPAddress();