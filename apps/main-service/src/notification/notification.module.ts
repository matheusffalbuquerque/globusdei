import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { NotificationGatewayService } from './notification-gateway.service';

/**
 * Isolates service-to-service notification dispatch concerns.
 */
@Module({
  imports: [ConfigModule],
  providers: [NotificationGatewayService],
  exports: [NotificationGatewayService],
})
export class NotificationModule {}
