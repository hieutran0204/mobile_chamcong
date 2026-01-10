import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: false }) // Disable auto timestamps to force VN time
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  date: string; // YYYY-MM-DD for querying today's attendance

  @Prop()
  checkIn: Date;

  @Prop()
  checkOut: Date;

  @Prop({ default: 'present' })
  status: string; // 'present', 'late', etc.

  @Prop({ default: 0 })
  work_hours: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

// Prevent multiple check-in records for the same employee on the same date
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
