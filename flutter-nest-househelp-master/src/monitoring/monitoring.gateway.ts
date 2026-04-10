import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'monitoring',
})
export class MonitoringGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MonitoringGateway.name);
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private readonly monitoringService: MonitoringService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.startBroadcasting();
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const clients = this.server.sockets;
    if ((clients as any).size === 0) {
      this.stopBroadcasting();
    }
  }

  @SubscribeMessage('getWorkerLocations')
  async handleGetWorkerLocations(client: Socket) {
    try {
      const locations = await this.monitoringService.getWorkerLocations();
      client.emit('workerLocations', locations);
    } catch (error) {
      this.logger.error('Error getting worker locations:', error);
      client.emit('error', { message: 'Failed to get worker locations' });
    }
  }

  @SubscribeMessage('getActiveBookings')
  async handleGetActiveBookings(client: Socket) {
    try {
      const bookings = await this.monitoringService.getActiveBookings();
      client.emit('activeBookings', bookings);
    } catch (error) {
      this.logger.error('Error getting active bookings:', error);
      client.emit('error', { message: 'Failed to get active bookings' });
    }
  }

  private startBroadcasting() {
    if (this.intervalId) return;

    this.intervalId = setInterval(async () => {
      try {
        const locations = await this.monitoringService.getWorkerLocations();
        this.server.emit('workerLocations', locations);

        const bookings = await this.monitoringService.getActiveBookings();
        this.server.emit('activeBookings', bookings);
      } catch (error) {
        this.logger.error('Error broadcasting data:', error);
      }
    }, 30000); // Every 30 seconds
  }

  private stopBroadcasting() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  emitBookingStatusChanged(data: any) {
    this.server.emit('booking_status_changed', data);
  }

  emitBookingAssigned(data: any) {
    this.server.emit('booking_assigned', data);
  }

  emitNewBooking(data: any) {
    this.server.emit('new_booking', data);
  }
}
