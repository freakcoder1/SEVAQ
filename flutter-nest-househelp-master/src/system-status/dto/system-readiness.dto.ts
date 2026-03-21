export class SystemReadinessDto {
  isReady: boolean;
  reasons: string[];
  workerCount: number;
  serviceCount: number;
  workersWithLocation: number;
}
