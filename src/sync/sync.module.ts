import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [LeadsModule],
  providers: [SyncService],
})
export class SyncModule {}
