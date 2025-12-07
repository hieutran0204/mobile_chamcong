import { Injectable } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'ws';

@Injectable()
export class EventsService {
  @WebSocketServer()
  server: Server;

  // Store connected clients: 'device' or 'admin'
  // In a real app, you might use a Map<clientId, type> or similar
  // For simplicity using broadcast to filtered clients in gateway or here
  
  private gateway: any;

  setGateway(gateway: any) {
    this.gateway = gateway;
  }

  sendCommandToDevice(cmd: string, payload: any) {
    console.log(`Sending command to device: ${cmd}`, payload);
    if (this.gateway) {
      this.gateway.broadcastToDevice({ event: 'command', cmd, payload });
    }
  }

  emitToAdmin(event: string, data: any) {
    console.log(`Emitting to admin: ${event}`, data);
    if (this.gateway) {
      this.gateway.broadcastToAdmin({ event, data });
    }
  }
}
