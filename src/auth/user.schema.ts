import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum Role {
  OWNER = 'owner',
  EMPLOYEE = 'employee',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  // password có thể undefined khi dùng Google/Facebook login sau này
  @Prop({ required: true })
  password?: string;

  @Prop({ enum: Role, default: Role.EMPLOYEE })
  role: Role;

  @Prop({ type: Types.ObjectId, ref: 'Employee' })
  employeeId?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.methods.toJSON = function (this: UserDocument) {
  const obj = this.toObject() as Record<string, any>;
  delete obj.password;
  return obj;
};
