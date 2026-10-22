import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary(@Query('period') period?: string, @Query('date') date?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.dashboardService.summary(period, date, from, to);
  }
}
