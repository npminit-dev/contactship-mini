import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AiService } from './ai/ai.service';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';


@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    private readonly aiService: AiService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @InjectQueue('leads')
    private readonly leadsQueue: Queue,
  ) { }

  async create(dto: CreateLeadDto) {
    const lead = this.leadRepo.create({
      ...dto,
      source: 'manual',
    });

    try {
      return await this.leadRepo.save(lead);
    } catch (error) {
      throw new ConflictException('Lead with this email already exists');
    }
  }

  async findAll() {
    return this.leadRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const cacheKey = `lead:${id}`;

    const cached = await this.cacheManager.get<Lead>(cacheKey);
    if (cached) return cached;

    const lead = await this.leadRepo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    await this.cacheManager.set(cacheKey, { ...lead });

    return lead;
  }

  async summarizeLead(id: string, force = false) {
    const lead = await this.leadRepo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    if (lead.summary && lead.nextAction && !force) {
      return {
        summary: lead.summary,
        next_action: lead.nextAction,
        status: 'already_generated',
      };
    }

    await this.leadsQueue.add(
      'summarize-lead',
      { leadId: id },
      { attempts: 3, backoff: 5000 },
    );

    return { status: 'queued' };
  }




}
