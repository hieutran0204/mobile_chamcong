import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { Server, WebSocket } from 'ws'; // Use 'ws' types
import { AttendanceService } from './attendance.service';
import { ScanDto } from './dto/scan.dto';
import * as dotenv from 'dotenv';
dotenv.config();

@WebSocketGateway({ path: '/ws', cors: true })
export class AttendanceGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject(forwardRef(() => AttendanceService))
    private readonly attService: AttendanceService,
  ) {}

  async handleConnection(client: WebSocket) {
    console.log('Client connected');
    // Sync current mode
    const { mode } = this.attService.getMode();
    let cmd = 'cmd_idle';
    if (mode === 'CHECK_IN') cmd = 'cmd_checkin';
    else if (mode === 'CHECK_OUT') cmd = 'cmd_checkout';

    client.send(JSON.stringify({ event: cmd, data: {} }));
  }

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

    return res;
  }

  // device sends: { "event": "enroll_result", "data": { "fingerId": 1, "success": true } }
  @SubscribeMessage('enroll_result')
  async onEnrollResult(
    @MessageBody() data: { fingerId: number; success: boolean },
  ) {
    console.log('Enroll result:', data);

    // Update DB first
    await this.attService.finishEnroll(data.fingerId, data.success);

    // Notify clients (Owner UI)
    this.broadcast('enroll_update', data);
  }

  // Called by Controller
  sendEnrollCmd(fingerId: number) {
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
