import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { Server, WebSocket } from 'ws'; // Use 'ws' types
import { AttendanceService } from './attendance.service';
import { ScanDto } from './dto/scan.dto';
import * as dotenv from 'dotenv';
dotenv.config();

@WebSocketGateway({ path: '/ws' }) // cors is handled by main adapter/ws config usually, but path is key
export class AttendanceGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject(forwardRef(() => AttendanceService))
    private readonly attService: AttendanceService
  ) {}

  // Helper to broadcast to all connected clients
  public broadcast(event: string, data: any) {
    // Construct the standard message format for the clients to parse
    const message = JSON.stringify({ event, data });
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // device sends: { "event": "scan", "data": { "fingerId": 123 } }
  @SubscribeMessage('scan')
  async onScan(@MessageBody() data: ScanDto) {
    console.log('Received scan:', data);
    const res = await this.attService.handleScan(data.fingerId);
    
    // Broadcast to all clients (UI apps)
    this.broadcast('attendance', res);
    
    // Return value is sent back to the sender only (the device)
    // The device will receive: { "event": "scan", "data": response } provided by framework
    // Or we can just return nothing if the device doesn't need confirmation
    return res;
  }

  // device sends: { "event": "enroll_result", "data": { "fingerId": 1, "success": true } }
  @SubscribeMessage('enroll_result')
  async onEnrollResult(@MessageBody() data: { fingerId: number; success: boolean }) {
    console.log('Enroll result:', data);
    // Notify clients (Owner UI)
    this.broadcast('enroll_update', data);
  }

  // Called by Controller
  sendEnrollCmd(fingerId: number) {
    // We need to broadcast this because we don't track specific device connections easily here
    // Optimally we would target the specific ESP32, but broadcast is fine for single device setup
    this.broadcast('cmd_enroll', { fingerId });
  }

  // owner triggers enroll by HTTP -> controller will call this method via injected gateway
  notifyEnrollResult(payload: {
    employeeId: string;
    success: boolean;
    fingerId?: number;
    message?: string;
  }) {
    this.broadcast('enroll_update', payload);
  }
}
