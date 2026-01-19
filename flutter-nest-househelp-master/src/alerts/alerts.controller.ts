import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { AlertsService, AlertRule, Alert } from './alerts.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @UseGuards(AdminGuard)
  getActiveAlerts(): Alert[] {
    return this.alertsService.getActiveAlerts();
  }

  @Get('rules')
  @UseGuards(AdminGuard)
  getAlertRules(): AlertRule[] {
    return this.alertsService.getAlertRules();
  }

  @Post('acknowledge/:alertId')
  @UseGuards(AdminGuard)
  acknowledgeAlert(@Param('alertId') alertId: string): void {
    this.alertsService.acknowledgeAlert(alertId);
  }

  @Post('resolve/:alertId')
  @UseGuards(AdminGuard)
  resolveAlert(@Param('alertId') alertId: string): void {
    this.alertsService.resolveAlertManually(alertId);
  }

  @Patch('rules/:ruleId')
  @UseGuards(AdminGuard)
  updateAlertRule(
    @Param('ruleId') ruleId: string,
    @Body() updates: Partial<AlertRule>
  ): void {
    this.alertsService.updateAlertRule(ruleId, updates);
  }
}