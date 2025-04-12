try {
    const clientModule = require('rpc-websockets/dist/lib/client');
    console.log('SUCCESS: The client module is imported correctly:', clientModule);
  } catch (error) {
    console.error('ERROR: Unable to import the client module:', error);
  }
