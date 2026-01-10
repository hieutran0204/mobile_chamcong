import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PayrollDocument = Payroll & Document;

@Schema({ timestamps: true })
export class Payroll {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  user: Types.ObjectId; // References Employee

  @Prop({ required: true })
  month: number;

  @Prop({ required: true })
  year: number;

  @Prop({ default: 0 })
  total_hours: number;

  @Prop({ default: 0 })
  total_salary: number;

  @Prop({ enum: ['DRAFT', 'CONFIRMED', 'SENT'], default: 'DRAFT' })
  status: string;
}

export const PayrollSchema = SchemaFactory.createForClass(Payroll);
