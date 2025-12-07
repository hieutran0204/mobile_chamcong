import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmployeeDocument = Employee & Document;

@Schema({ timestamps: true })
export class Employee {
  @Prop({ required: true }) name: string;
  @Prop() position?: string;
  @Prop({ unique: true, sparse: true }) fingerId?: number; // assigned after enroll
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
