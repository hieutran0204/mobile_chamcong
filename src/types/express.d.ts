declare module 'express' {
  export interface Request {
    user?: {
      _id: string;
      username: string;
      role: 'admin' | 'employee';
    };
  }
}
