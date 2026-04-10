import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private addressesRepository: Repository<Address>,
  ) {}

  async create(userId: string, createAddressDto: CreateAddressDto): Promise<Address> {
    // If this is set as default, unset other defaults for this user
    if (createAddressDto.isDefault) {
      await this.unsetUserDefault(userId);
    }

    const address = this.addressesRepository.create({
      ...createAddressDto,
      userId,
    });

    return this.addressesRepository.save(address);
  }

  async findAllByUser(userId: string): Promise<Address[]> {
    return this.addressesRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Address> {
    const address = await this.addressesRepository.findOne({
      where: { id, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async findDefault(userId: string): Promise<Address | null> {
    return this.addressesRepository.findOne({
      where: { userId, isDefault: true },
    });
  }

  async update(id: string, userId: string, updateAddressDto: UpdateAddressDto): Promise<Address> {
    const address = await this.findOne(id, userId);

    // If setting this as default, unset others
    if (updateAddressDto.isDefault) {
      await this.unsetUserDefault(userId);
    }

    Object.assign(address, updateAddressDto);
    return this.addressesRepository.save(address);
  }

  async remove(id: string, userId: string): Promise<void> {
    const address = await this.findOne(id, userId);
    await this.addressesRepository.remove(address);
  }

  async setAsDefault(id: string, userId: string): Promise<Address> {
    const address = await this.findOne(id, userId);
    await this.unsetUserDefault(userId);
    address.isDefault = true;
    return this.addressesRepository.save(address);
  }

  private async unsetUserDefault(userId: string): Promise<void> {
    await this.addressesRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );
  }
}
