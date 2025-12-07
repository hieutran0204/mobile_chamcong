const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('open', function open() {
  console.log('Connected to WS');
  
  // Simulate Scan
  const scanData = {
    event: 'scan',
    data: { fingerId: 1 }
  };
  console.log('Sending:', JSON.stringify(scanData));
  ws.send(JSON.stringify(scanData));
});

ws.on('message', function message(data) {
  console.log('Received:', data.toString());
  // After receiving a response, we can close
  // ws.close();
});

ws.on('error', console.error);
