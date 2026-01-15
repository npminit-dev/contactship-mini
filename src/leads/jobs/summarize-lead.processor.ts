import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../lead.entity';
import { AiService } from '../ai/ai.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Processor('leads')
export class SummarizeLeadProcessor {
  private readonly logger = new Logger(SummarizeLeadProcessor.name);

  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    private readonly aiService: AiService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  @Process('summarize-lead')
  async handle(job: Job<{ leadId: string }>) {
    const { leadId } = job.data;

    const lead = await this.leadRepo.findOne({ where: { id: leadId } });
    if (!lead) {
      this.logger.warn(`Lead ${leadId} not found`);
      return;
    }

    const result = await this.aiService.summarizeLead(lead);

    lead.summary = result.summary;
    lead.nextAction = result.next_action;

    await this.leadRepo.save(lead);
    await this.cacheManager.del(`lead:${leadId}`);

    this.logger.log(`Lead ${leadId} summarized successfully`);
  }
}
