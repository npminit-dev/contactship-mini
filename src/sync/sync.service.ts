import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LeadsService } from '../leads/leads.service';
import fetch from 'node-fetch';
import { RandomUserResponse } from '../types';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(private readonly leadsService: LeadsService) {}

  @Cron('*/5 * * * * *') // cada 5 segundos para pruebas
  async handleCron() {
    try {
      await this.syncLeadsFromExternalApi();
    } catch (error) {
      this.logger.error('Error syncing leads', error);
    }
  }

  private async syncLeadsFromExternalApi() {
    const response = await fetch('https://randomuser.me/api?results=10');
    const data: RandomUserResponse = await response.json() as RandomUserResponse;

    if (!data.results || !Array.isArray(data.results)) {
      this.logger.warn('No results from external API');
      return;
    }

    const existingLeads = await this.leadsService.findAll();
    const existingEmails = new Set(existingLeads.map(l => l.email.toLowerCase()));

    let added = 0;
    let skipped = 0;

    for (const user of data.results) {
      const email = user.email.toLowerCase();

      if (existingEmails.has(email)) {
        skipped++;
        continue;
      }

      const dto = {
        firstName: user.name.first,
        lastName: user.name.last,
        email,
        phone: user.phone || undefined,
        source: 'external' as const,
      };

      await this.leadsService.create(dto);
      existingEmails.add(email);
      added++;
    }

    this.logger.log(
      `External sync finished. Added: ${added}, Skipped (duplicates): ${skipped}`,
    );
  }
}
