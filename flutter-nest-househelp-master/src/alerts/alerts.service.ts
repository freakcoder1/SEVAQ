import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemPerformanceMetric } from '../metrics/entities/metric.entity';
import { MetricsService } from '../metrics/metrics.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface AlertRule {
  id: string;
  name: string;
  metricType: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  timeWindow: number; // minutes
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface Alert {
  id: string;
  ruleId: string;
  message: string;
  severity: string;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
  currentLevel: number;
  escalationHistory: { level: number; timestamp: Date; message: string }[];
  lastEscalationTime: Date;
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  private alertRules: AlertRule[] = [];
  private activeAlerts: Map<string, Alert> = new Map();
  private escalationConfig = [
    { level: 1, timeThreshold: 0 }, // immediate
    { level: 2, timeThreshold: 10 }, // 10 minutes
    { level: 3, timeThreshold: 30 }, // 30 minutes
  ];

  constructor(
    @InjectRepository(SystemPerformanceMetric)
    private systemPerformanceMetricsRepository: Repository<SystemPerformanceMetric>,
    private metricsService: MetricsService,
    private notificationsService: NotificationsService
  ) {
    this.initializeAlertRules();
    this.startAlertMonitoring();
  }

  private initializeAlertRules(): void {
    this.alertRules = [
      {
        id: 'assignment-success-rate-low',
        name: 'Assignment Success Rate Low',
        metricType: 'assignment_success_rate',
        threshold: 80,
        operator: 'lt',
        timeWindow: 30,
        severity: 'high',
        enabled: true
      },
      {
        id: 'assignment-time-high',
        name: 'Assignment Time High',
        metricType: 'average_assignment_time',
        threshold: 300, // 5 minutes
        operator: 'gt',
        timeWindow: 30,
        severity: 'medium',
        enabled: true
      },
      {
        id: 'system-health-poor',
        name: 'System Health Poor',
        metricType: 'system_health',
        threshold: 0,
        operator: 'eq',
        timeWindow: 10,
        severity: 'critical',
        enabled: true
      },
      {
        id: 'queue-length-high',
        name: 'Queue Length High',
        metricType: 'queue_length',
        threshold: 50,
        operator: 'gt',
        timeWindow: 15,
        severity: 'medium',
        enabled: true
      }
    ];
  }

  private startAlertMonitoring(): void {
    // Check alerts every 5 minutes
    setInterval(async () => {
      await this.checkAlertRules();
    }, 5 * 60 * 1000);
  }

  async checkAlertRules(): Promise<void> {
    const systemMetrics = await this.metricsService.getSystemMetrics();
    
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      const currentValue = this.getMetricValue(systemMetrics, rule.metricType);
      const shouldTrigger = this.evaluateRule(currentValue, rule);

      if (shouldTrigger) {
        await this.triggerAlert(rule, currentValue);
      } else {
        await this.resolveAlert(rule.id);
      }
    }
  }

  private getMetricValue(metrics: any, metricType: string): number {
    switch (metricType) {
      case 'assignment_success_rate':
        return metrics.assignmentSuccessRate;
      case 'average_assignment_time':
        return metrics.averageAssignmentTime;
      case 'queue_length':
        return metrics.queueLength;
      default:
        return 0;
    }
  }

  private evaluateRule(value: number, rule: AlertRule): boolean {
    switch (rule.operator) {
      case 'gt':
        return value > rule.threshold;
      case 'lt':
        return value < rule.threshold;
      case 'eq':
        return value === rule.threshold;
      default:
        return false;
    }
  }

  private async triggerAlert(rule: AlertRule, currentValue: number): Promise<void> {
    const alertId = `alert_${rule.id}_${Date.now()}`;

    if (this.activeAlerts.has(rule.id)) {
      // Check for escalation
      const existingAlert = this.activeAlerts.get(rule.id)!;
      const timeSinceTrigger = (new Date().getTime() - existingAlert.timestamp.getTime()) / (1000 * 60); // minutes
      const maxAllowedLevel = this.escalationConfig.filter(config => timeSinceTrigger >= config.timeThreshold).pop()?.level || 1;

      if (maxAllowedLevel > existingAlert.currentLevel) {
        // Escalate
        existingAlert.currentLevel = maxAllowedLevel;
        existingAlert.lastEscalationTime = new Date();
        existingAlert.escalationHistory.push({
          level: maxAllowedLevel,
          timestamp: new Date(),
          message: `Escalated to level ${maxAllowedLevel} after ${Math.round(timeSinceTrigger)} minutes`
        });
        this.logger.warn(`ALERT ESCALATED: ${existingAlert.message} to level ${maxAllowedLevel}`);
        await this.sendNotification(existingAlert);
      }
      return;
    }

    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      message: `${rule.name}: Current value ${currentValue} ${rule.operator} threshold ${rule.threshold}`,
      severity: rule.severity,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      currentLevel: 1,
      escalationHistory: [{ level: 1, timestamp: new Date(), message: 'Alert triggered' }],
      lastEscalationTime: new Date()
    };

    this.activeAlerts.set(rule.id, alert);
    this.logger.warn(`ALERT TRIGGERED: ${alert.message}`);

    // Send notification (could integrate with email, SMS, etc.)
    await this.sendNotification(alert);
  }

  private async resolveAlert(ruleId: string): Promise<void> {
    const alert = this.activeAlerts.get(ruleId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.escalationHistory.push({
        level: alert.currentLevel,
        timestamp: new Date(),
        message: 'Alert auto-resolved'
      });
      this.logger.log(`Alert resolved for rule: ${ruleId}`);
      this.activeAlerts.delete(ruleId);
    }
  }

  private async sendNotification(alert: Alert): Promise<void> {
    try {
      const subject = `Alert Level ${alert.currentLevel}: ${alert.severity.toUpperCase()} - ${alert.message}`;
      const message = `${alert.message} (Level ${alert.currentLevel})`;
      await this.notificationsService.notifyAdmins(subject, message);
      this.logger.log(`Notification sent for alert: ${alert.message} at level ${alert.currentLevel}`);
    } catch (error) {
      this.logger.error(`Failed to send notification for alert: ${alert.message}`, error);
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  acknowledgeAlert(alertId: string): void {
    const alert = Array.from(this.activeAlerts.values()).find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.logger.log(`Alert acknowledged: ${alert.message}`);
    }
  }

  resolveAlertManually(alertId: string): void {
    const alert = Array.from(this.activeAlerts.values()).find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.activeAlerts.delete(alert.ruleId);
      this.logger.log(`Alert manually resolved: ${alert.message}`);
    }
  }

  getAlertRules(): AlertRule[] {
    return this.alertRules;
  }

  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): void {
    const ruleIndex = this.alertRules.findIndex(r => r.id === ruleId);
    if (ruleIndex !== -1) {
      this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
      this.logger.log(`Alert rule updated: ${ruleId}`);
    }
  }
}