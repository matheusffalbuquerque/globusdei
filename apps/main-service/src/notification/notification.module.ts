import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { NotificationGatewayService } from './notification-gateway.service';

/**
 * Isolates service-to-service notification dispatch concerns.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [NotificationGatewayService],
  exports: [NotificationGatewayService],
})
export class NotificationModule {}
