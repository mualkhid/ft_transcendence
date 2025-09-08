const os = require('os');

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    
    for (const interfaceName of Object.keys(interfaces)) {
        const addresses = interfaces[interfaceName];
        
        for (const address of addresses) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (address.family === 'IPv4' && !address.internal) {
                return address.address;
            }
        }
    }
    
    return 'localhost';
}

console.log(getLocalIP());