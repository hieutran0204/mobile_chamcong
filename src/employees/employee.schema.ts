
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../auth/user.schema';

export type EmployeeDocument = Employee & Document;

@Schema({ timestamps: true })
export class Employee {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  ownerId: User; // The Company/Owner this employee belongs to

  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, sparse: true })
  employeeCode: string; // Manual ID (e.g., EMP001)

  @Prop()
  fingerId: number; // Biometric ID on device

  @Prop()
  email: string;

  @Prop({ default: 0 })
  hourly_rate: number;

  @Prop({ default: true })
  isActive: boolean;
  
  @Prop()
  position: string;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
