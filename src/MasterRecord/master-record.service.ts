import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterRecord } from './master-record.entity';

@Injectable()
export class MasterRecordService {
  constructor(
    @InjectRepository(MasterRecord)
    private masterRecordRepository: Repository<MasterRecord>,
  ) {}

  async deleteByAppointmentId(appointmentId: number): Promise<void> {
    await this.masterRecordRepository.delete({ appointmentId });
  }

  async upsert(masterRecord: Partial<MasterRecord>): Promise<MasterRecord> {
    let existingRecord: MasterRecord | null = null;

    if (masterRecord.recordType === 'Spot') {
      masterRecord.appointmentId = undefined;
      if (masterRecord.visitorId) {
        existingRecord = await this.masterRecordRepository.findOne({
          where: { visitorId: masterRecord.visitorId, recordType: 'Spot' },
        });
      }
    } else if (masterRecord.recordType === 'Pre-Approval') {
      masterRecord.visitorId = undefined;
      if (masterRecord.appointmentId) {
        existingRecord = await this.masterRecordRepository.findOne({
          where: { appointmentId: masterRecord.appointmentId, recordType: 'Pre-Approval' },
        });
      }
    }

    if (existingRecord) {
      // Update the existing record using update method to avoid duplicate key issues
      await this.masterRecordRepository.update(
        { id: existingRecord.id },
        { ...masterRecord, id: existingRecord.id }
      );
      return await this.masterRecordRepository.findOneOrFail({ where: { id: existingRecord.id } });
    } else {
      const newRecord = this.masterRecordRepository.create(masterRecord);
      return await this.masterRecordRepository.save(newRecord);
    }
  }

  async findAll(): Promise<MasterRecord[]> {
    return this.masterRecordRepository.find();
  }

  async findByContactNumber(contactnumber: string): Promise<MasterRecord | null> {
    const records = await this.masterRecordRepository.find({
      where: { contactnumber },
    });
    // Return the first Pre-Approval record, or the first record if none are Pre-Approval
    return records.find(record => record.recordType === 'Pre-Approval') || records[0] || null;
  }
}