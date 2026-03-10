import { User } from "../models/user.model.js";
import type { IUser } from "../models/user.model.js";
import type { CreateUserInput } from "../types/index.js";

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export async function createUser(input: CreateUserInput): Promise<IUser> {
  const user = new User(input);
  return user.save();
}

export async function getUserById(id: string): Promise<IUser> {
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError(`User not found: ${id}`);
  }
  return user;
}

export async function getAllUsers(): Promise<IUser[]> {
  return User.find();
}
