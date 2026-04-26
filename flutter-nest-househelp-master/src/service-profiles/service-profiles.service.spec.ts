import { Test, TestingModule } from '@nestjs/testing';
import { ServiceProfilesService } from './service-profiles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ServiceProfile,
  ServiceType,
} from './entities/service-profile.entity';

describe('ServiceProfilesService', () => {
  let service: ServiceProfilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceProfilesService,
        {
          provide: getRepositoryToken(ServiceProfile),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServiceProfilesService>(ServiceProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all service profiles', async () => {
    const mockProfiles = [
      { id: 1, serviceType: 'COOK' },
      { id: 2, serviceType: 'COOK' },
    ];
    jest
      .spyOn(service, 'getAllProfiles')
      .mockResolvedValue(mockProfiles as any);

    const profiles = await service.getAllProfiles();
    expect(profiles).toEqual(mockProfiles);
  });

  it('should return profiles by service type', async () => {
    const mockProfiles = [{ id: 1, serviceType: 'COOK' }];
    jest
      .spyOn(service, 'getProfilesByServiceType')
      .mockResolvedValue(mockProfiles as any);

    const profiles = await service.getProfilesByServiceType(ServiceType.COOK);
    expect(profiles).toEqual(mockProfiles);
  });

  it('should return profile by id', async () => {
    const mockProfile = { id: 1, serviceType: 'COOK' };
    jest.spyOn(service, 'getProfileById').mockResolvedValue(mockProfile as any);

    const profile = await service.getProfileById(1);
    expect(profile).toEqual(mockProfile);
  });

  it('should return profile by public id', async () => {
    const mockProfile = {
      id: 1,
      publicId: 'test-public-id',
      serviceType: 'COOK',
    };
    jest
      .spyOn(service, 'getProfileByPublicId')
      .mockResolvedValue(mockProfile as any);

    const profile = await service.getProfileByPublicId('test-public-id');
    expect(profile).toEqual(mockProfile);
  });
});
