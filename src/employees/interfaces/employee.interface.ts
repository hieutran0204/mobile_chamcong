export interface Employee {
  _id: string;
  name: string;
  role: 'owner' | 'employee';
  fingerId: number;
}
