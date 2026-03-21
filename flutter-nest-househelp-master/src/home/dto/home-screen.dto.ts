import { SystemReadinessDto } from '../../system-status/dto/system-readiness.dto';

export class HomeScreenResponseDto {
  systemReadiness: SystemReadinessDto;
  serviceRecommendations?: any[];
  systemStateMessage?: string;
  locationInfo?: {
    lat: number;
    lng: number;
    radius: number;
  };
}

export class HomeScreenRequestDto {
  lat: number;
  lng: number;
  radius?: number;
}
