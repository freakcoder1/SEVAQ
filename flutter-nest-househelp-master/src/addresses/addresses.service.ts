import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(
    @InjectRepository(Address)
    private addressesRepository: Repository<Address>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Resolve user ID from various formats (publicId/UUID or internal id)
   * @param userId - Could be publicId (UUID) or internal user id
   * @returns Internal user id string for database queries
   */
  private async resolveUserId(userId: string): Promise<string | null> {
    // If it's a UUID (publicId), look up the user to get internal id
    try {
      const user = await this.usersRepository.findOneBy({ publicId: userId } as any);
      if (user) {
        // Return the actual database userId field value converted to string
        return String(user.id);
      }
      // If not found as publicId, check if it's already the internal userId
      const existingUser = await this.usersRepository.findOneBy({ id: userId } as any);
      return existingUser ? String(existingUser.id) : null;
    } catch (error: any) {
      this.logger.error(`Error resolving userId: ${error.message}`);
      return userId; // fallback to original value on error
    }
  }

  async create(userId: string, createAddressDto: CreateAddressDto): Promise<Address> {
    const resolvedUserId = await this.resolveUserId(userId);
    if (!resolvedUserId) {
      throw new BadRequestException('User not found');
    }

    // If this is set as default, unset other defaults for this user
    if (createAddressDto.isDefault) {
      await this.unsetUserDefault(resolvedUserId);
    }

    const address = this.addressesRepository.create({
      ...createAddressDto,
      userId: resolvedUserId,
    });

    return this.addressesRepository.save(address);
  }

  async findAllByUser(userId: string): Promise<Address[]> {
    const resolvedUserId = await this.resolveUserId(userId);
    if (!resolvedUserId) {
      return [];
    }

    return this.addressesRepository.find({
      where: { userId: parseInt(resolvedUserId, 10) as any },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Address> {
    const resolvedUserId = await this.resolveUserId(userId);
    if (!resolvedUserId) {
      throw new NotFoundException('Address not found');
    }

    const address = await this.addressesRepository.findOne({
      where: { id, userId: parseInt(resolvedUserId, 10) as any },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async findDefault(userId: string): Promise<Address | null> {
    const resolvedUserId = await this.resolveUserId(userId);
    if (!resolvedUserId) {
      return null;
    }

    return this.addressesRepository.findOne({
      where: { userId: parseInt(resolvedUserId, 10) as any, isDefault: true },
    });
  }

  async update(id: string, userId: string, updateAddressDto: UpdateAddressDto): Promise<Address> {
    const resolvedUserId = await this.resolveUserId(userId);
    if (!resolvedUserId) {
      throw new BadRequestException('User not found');
    }

    const address = await this.findOne(id, userId);

    // If setting this as default, unset others
    if (updateAddressDto.isDefault) {
      await this.unsetUserDefault(resolvedUserId);
    }

    Object.assign(address, updateAddressDto);
    return this.addressesRepository.save(address);
  }

  async remove(id: string, userId: string): Promise<void> {
    const address = await this.findOne(id, userId);
    await this.addressesRepository.remove(address);
  }

  async setAsDefault(id: string, userId: string): Promise<Address> {
    const resolvedUserId = await this.resolveUserId(userId);
    if (!resolvedUserId) {
      throw new BadRequestException('User not found');
    }

    const address = await this.findOne(id, userId);
    await this.unsetUserDefault(resolvedUserId);
    address.isDefault = true;
    return this.addressesRepository.save(address);
  }

  private async unsetUserDefault(userId: string): Promise<void> {
    // Always cast to number for integer id column
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      this.logger.warn(`Invalid userId format in unsetUserDefault: ${userId}`);
      return;
    }
    
    await this.addressesRepository.update(
      { userId: userIdNum as any, isDefault: true },
      { isDefault: false },
    );
  }
}
