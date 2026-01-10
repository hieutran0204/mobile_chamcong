import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum Role {
  ADMIN = 'admin',
  OWNER = 'owner',
  EMPLOYEE = 'employee', // Kept for legacy compatibility if needed, but not used for new logic
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ default: null })
  email?: string;

  @Prop({ required: true })
  password?: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatar?: string;

  @Prop({ enum: Role, default: Role.EMPLOYEE })
  role: Role;

  @Prop()
  companyName?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.methods.toJSON = function (this: UserDocument) {
  const obj = this.toObject() as Record<string, any>;
  delete obj.password;
  return obj;
};
