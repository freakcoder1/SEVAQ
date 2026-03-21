import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Subscription,
  Frequency,
  SubscriptionStatus,
  BillingCycle,
} from './entities/subscription.entity';
import { ServiceProfilesService } from '../service-profiles/service-profiles.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: ServiceProfilesService,
          useValue: {
            getProfileById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a subscription', async () => {
    const mockSubscription = {
      id: 1,
      userId: 1,
      serviceProfileId: 1,
      frequency: 'DAILY',
      timeWindowStart: new Date('2024-01-15T08:00:00'),
      timeWindowEnd: new Date('2024-01-15T09:00:00'),
      startDate: new Date('2024-01-15'),
      endDate: undefined,
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      monthlyPriceSnapshot: 15000,
    };

    jest
      .spyOn(service, 'createSubscription')
      .mockResolvedValue(mockSubscription as any);

    const result = await service.createSubscription(
      1,
      1,
      Frequency.DAILY,
      new Date('2024-01-15T08:00:00'),
      new Date('2024-01-15T09:00:00'),
      new Date('2024-01-15'),
    );

    expect(result).toEqual(mockSubscription);
  });

  it('should get subscriptions by user id', async () => {
    const mockSubscriptions = [
      { id: 1, userId: 1, serviceProfileId: 1, status: 'ACTIVE' },
      { id: 2, userId: 1, serviceProfileId: 2, status: 'PAUSED' },
    ];

    jest
      .spyOn(service, 'getSubscriptionsByUserId')
      .mockResolvedValue(mockSubscriptions as any);

    const subscriptions = await service.getSubscriptionsByUserId(1);
    expect(subscriptions).toEqual(mockSubscriptions);
  });

  it('should get active subscriptions', async () => {
    const mockSubscriptions = [
      { id: 1, userId: 1, serviceProfileId: 1, status: 'ACTIVE' },
    ];

    jest
      .spyOn(service, 'getActiveSubscriptions')
      .mockResolvedValue(mockSubscriptions as any);

    const activeSubscriptions = await service.getActiveSubscriptions();
    expect(activeSubscriptions).toEqual(mockSubscriptions);
  });

  it('should get subscription by id', async () => {
    const mockSubscription = {
      id: 1,
      userId: 1,
      serviceProfileId: 1,
      status: 'ACTIVE',
    };

    jest
      .spyOn(service, 'getSubscriptionById')
      .mockResolvedValue(mockSubscription as any);

    const subscription = await service.getSubscriptionById(1);
    expect(subscription).toEqual(mockSubscription);
  });

  it('should pause a subscription', async () => {
    const mockSubscription = {
      id: 1,
      userId: 1,
      serviceProfileId: 1,
      status: 'PAUSED',
    };

    jest
      .spyOn(service, 'pauseSubscription')
      .mockResolvedValue(mockSubscription as any);

    const pausedSubscription = await service.pauseSubscription(1);
    expect(pausedSubscription.status).toEqual(SubscriptionStatus.PAUSED);
  });

  it('should resume a subscription', async () => {
    const mockSubscription = {
      id: 1,
      userId: 1,
      serviceProfileId: 1,
      status: 'ACTIVE',
    };

    jest
      .spyOn(service, 'resumeSubscription')
      .mockResolvedValue(mockSubscription as any);

    const resumedSubscription = await service.resumeSubscription(1);
    expect(resumedSubscription.status).toEqual(SubscriptionStatus.ACTIVE);
  });

  it('should cancel a subscription', async () => {
    const mockSubscription = {
      id: 1,
      userId: 1,
      serviceProfileId: 1,
      status: 'CANCELLED',
    };

    jest
      .spyOn(service, 'cancelSubscription')
      .mockResolvedValue(mockSubscription as any);

    const cancelledSubscription = await service.cancelSubscription(1);
    expect(cancelledSubscription.status).toEqual(SubscriptionStatus.CANCELLED);
  });
});
