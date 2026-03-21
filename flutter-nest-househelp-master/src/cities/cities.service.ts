import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private citiesRepository: Repository<City>,
  ) {}

  async findAll(): Promise<City[]> {
    return this.citiesRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<City | null> {
    return this.citiesRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async findBySlug(slug: string): Promise<City | null> {
    return this.citiesRepository.findOne({
      where: { slug, isActive: true },
    });
  }

  async create(cityData: Partial<City>): Promise<City> {
    const city = this.citiesRepository.create(cityData);
    return this.citiesRepository.save(city);
  }

  async update(id: string, cityData: Partial<City>): Promise<City | null> {
    await this.citiesRepository.update(id, cityData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.citiesRepository.update(id, { isActive: false });
  }

  async getCityFromLocation(lat: number, lng: number): Promise<City | null> {
    // For now, return Delhi as default since we don't have PostGIS setup
    // In production, this would use ST_Contains to find which city polygon contains the coordinates
    return this.findBySlug('delhi-ncr');
  }

  async getCityStats(cityId: string): Promise<{
    totalWorkers: number;
    totalBookings: number;
    activeBookings: number;
    averageRating: number;
  }> {
    const [workersCount, bookingsCount, activeBookingsCount] =
      await Promise.all([
        this.citiesRepository
          .createQueryBuilder('city')
          .leftJoin('city.workers', 'worker')
          .where('city.id = :cityId', { cityId })
          .getCount(),
        this.citiesRepository
          .createQueryBuilder('city')
          .leftJoin('city.bookings', 'booking')
          .where('city.id = :cityId', { cityId })
          .getCount(),
        this.citiesRepository
          .createQueryBuilder('city')
          .leftJoin('city.bookings', 'booking')
          .where('city.id = :cityId', { cityId })
          .andWhere('booking.assignmentState IN (:...states)', {
            states: ['PENDING', 'ASSIGNMENT_IN_PROGRESS', 'ASSIGNED'],
          })
          .getCount(),
      ]);

    const averageRating = await this.citiesRepository
      .createQueryBuilder('city')
      .leftJoin('city.workers', 'worker')
      .select('AVG(worker.rating)', 'avgRating')
      .where('city.id = :cityId', { cityId })
      .getRawOne();

    return {
      totalWorkers: workersCount,
      totalBookings: bookingsCount,
      activeBookings: activeBookingsCount,
      averageRating: parseFloat(averageRating.avgRating) || 0,
    };
  }
}
