import "express";
import type { JwtPayload } from "jsonwebtoken";
import type { UserRole } from "../models/auth/user.model";

export interface UserPayload extends JwtPayload {
  _id?: string;
  userId?: string;
  id?: string;
  email?: string;
  name?: string;
  role?: UserRole[] | string[] | UserRole | string;
  phone?: string;
  [key: string]: any;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload | string;
    }
    interface User extends UserPayload {}
  }
}

declare module "express-serve-static-core" {
  interface Request {
    user?: UserPayload | string;
  }
}

declare module "express" {
  interface Request {
    user?: UserPayload | string;
  }
}