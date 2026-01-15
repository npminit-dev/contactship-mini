import { Controller, Post, Body, Get, Param, ParseUUIDPipe, UseGuards, Query } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';

@Controller()
@UseGuards(ApiKeyGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) { }

  @Post('create-lead')
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  @Get('leads')
  findAll() {
    return this.leadsService.findAll();
  }

  @Get('leads/:id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.leadsService.findOne(id);
  }

  @Post('leads/:id/summarize')
  summarize(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('force') force?: string,
  ) {
    return this.leadsService.summarizeLead(id, force === 'true');
  }
}
