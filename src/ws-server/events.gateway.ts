import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { EventsService } from './events.service';
import { AttendanceService } from '../attendance/attendance.service';
import { IncomingMessage } from 'http';

@WebSocketGateway({ cors: true, path: '/ws' })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private devices = new Set<WebSocket>();
  private admins = new Set<WebSocket>();

  constructor(
    private readonly eventsService: EventsService,
    private readonly attendanceService: AttendanceService,
  ) {
    // Pass instance to service so service can use it (circular dependency workaround or just simple injection)
    // Actually better to handle broadcast here or verify if @WebSocketServer is enough in Service
    // NestJS @WebSocketServer in service works if Gateway is not the one holding logic.
    // Let's manually link them for simplicity if needed, or better yet, inject Service here and let Service hold logic? 
    // Actually, traditionally Gateway holds the Server instance. Service can hold logic and emit via Gateway.
    // But Gateway is instantiated by Nest.
    this.eventsService.setGateway(this);
  }

  handleConnection(client: WebSocket, request: IncomingMessage) {
    const url = new URL(request.url || '', 'http://localhost');
    const type = url.searchParams.get('type');

    if (type === 'device') {
      console.log('Device connected');
      this.devices.add(client);
    } else if (type === 'admin') {
      console.log('Admin connected');
      this.admins.add(client);
    } else {
      console.log('Unknown client connected');
    }
  }

  handleDisconnect(client: WebSocket) {
    if (this.devices.has(client)) {
      console.log('Device disconnected');
      this.devices.delete(client);
    }
    if (this.admins.has(client)) {
      console.log('Admin disconnected');
      this.admins.delete(client);
    }
  }

  // device sends: { "event": "scan", "data": { "fingerId": 123 } }
  @SubscribeMessage('scan')
  async onScan(@MessageBody() data: any) {
    // data is the payload inside "data" field from ESP32
    console.log('Received scan:', data);
    const fingerId = data.fingerId; // Access directly as WsAdapter unwraps 'data'
    if (fingerId !== undefined) {
      this.handleScan(fingerId);
    }
  }

  // device sends: { "event": "enroll_result", "data": { "fingerId": 1, "success": true } }
  @SubscribeMessage('enroll_result')
  async onEnrollResult(@MessageBody() data: any) {
    console.log('Received enroll_result:', data);
    // Notify clients (Owner Admin)
    this.broadcastToAdmin({ event: 'enroll-result', data });
  }

  async handleScan(fingerId: number) {
    console.log('Processing scan for fingerId:', fingerId);
    try {
      const result = await this.attendanceService.handleScan(fingerId);
      // Broadcast result to Admin (real-time view)
      this.broadcastToAdmin({
        event: 'scan-result',
        data: result,
      });
    } catch (e) {
      console.error('Error handling scan:', e);
    }
  }

  broadcastToDevice(message: any) {
    const msg = JSON.stringify(message);
    this.devices.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }

  broadcastToAdmin(message: any) {
    const msg = JSON.stringify(message);
    this.admins.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }
}
