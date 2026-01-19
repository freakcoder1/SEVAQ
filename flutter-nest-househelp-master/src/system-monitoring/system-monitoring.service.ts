import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { register, Gauge } from 'prom-client';
import * as si from 'systeminformation';

@Injectable()
export class SystemMonitoringService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SystemMonitoringService.name);
  private intervalId: NodeJS.Timeout;

  // Prometheus Gauges
  private cpuUsageGauge: Gauge<string>;
  private memoryUsageGauge: Gauge<string>;
  private diskUsageGauge: Gauge<string>;

  constructor() {
    // Initialize Prometheus Gauges
    this.cpuUsageGauge = new Gauge({
      name: 'system_cpu_usage_percent',
      help: 'Current CPU usage percentage',
      labelNames: ['core'],
    });

    this.memoryUsageGauge = new Gauge({
      name: 'system_memory_usage_percent',
      help: 'Current memory usage percentage',
    });

    this.diskUsageGauge = new Gauge({
      name: 'system_disk_usage_percent',
      help: 'Current disk usage percentage',
      labelNames: ['filesystem', 'mount'],
    });
  }

  async onModuleInit() {
    this.logger.log('SystemMonitoringService initialized');
    // Start periodic collection
    this.startPeriodicCollection();
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private startPeriodicCollection() {
    // Collect metrics every 30 seconds
    this.intervalId = setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        this.logger.error(`Failed to collect system metrics: ${error.message}`);
      }
    }, 30000);

    // Collect immediately on start
    this.collectMetrics();
  }

  private async collectMetrics() {
    try {
      this.logger.log('Starting system metrics collection...');
      // Collect CPU usage
      const cpuData = await si.currentLoad();
      this.cpuUsageGauge.set({ core: 'total' }, cpuData.currentLoad);

      // Collect per-core CPU usage
      cpuData.cpus.forEach((cpu, index) => {
        this.cpuUsageGauge.set({ core: `cpu${index}` }, cpu.load);
      });

      // Collect memory usage
      const memData = await si.mem();
      const memoryUsagePercent = (memData.used / memData.total) * 100;
      this.memoryUsageGauge.set(memoryUsagePercent);

      // Collect disk usage
      const diskData = await si.fsSize();
      diskData.forEach((disk) => {
        const usagePercent = (disk.used / disk.size) * 100;
        this.diskUsageGauge.set(
          { filesystem: disk.fs, mount: disk.mount },
          usagePercent
        );
      });

      this.logger.debug('System metrics collected successfully');
    } catch (error) {
      this.logger.error(`Error collecting system metrics: ${error.message}`);
    }
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  async getCpuUsage(): Promise<any> {
    try {
      const cpuData = await si.currentLoad();
      return {
        total: cpuData.currentLoad,
        cores: cpuData.cpus.map((cpu, index) => ({
          core: `cpu${index}`,
          usage: cpu.load,
        })),
      };
    } catch (error) {
      this.logger.error(`Error getting CPU usage: ${error.message}`);
      throw error;
    }
  }

  async getMemoryUsage(): Promise<any> {
    try {
      const memData = await si.mem();
      return {
        total: memData.total,
        used: memData.used,
        free: memData.free,
        usagePercent: (memData.used / memData.total) * 100,
      };
    } catch (error) {
      this.logger.error(`Error getting memory usage: ${error.message}`);
      throw error;
    }
  }

  async getDiskUsage(): Promise<any> {
    try {
      const diskData = await si.fsSize();
      return diskData.map((disk) => ({
        filesystem: disk.fs,
        mount: disk.mount,
        size: disk.size,
        used: disk.used,
        available: disk.available,
        usagePercent: (disk.used / disk.size) * 100,
      }));
    } catch (error) {
      this.logger.error(`Error getting disk usage: ${error.message}`);
      throw error;
    }
  }
}