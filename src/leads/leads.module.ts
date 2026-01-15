import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { Lead } from './lead.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai/ai.service';
import { BullModule } from '@nestjs/bull';
import { SummarizeLeadProcessor } from './jobs/summarize-lead.processor';

@Module({
  imports: [TypeOrmModule.forFeature([Lead]),
  BullModule.registerQueue({
    name: 'leads',
  }),
  ],
  controllers: [LeadsController],
  providers: [LeadsService, AiService, SummarizeLeadProcessor],
  exports: [LeadsService],
})
export class LeadsModule { }
