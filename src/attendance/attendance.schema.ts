import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: true })
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
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
