export enum UserState {
  AWAITING_NAME_PERMISSION = "AWAITING_NAME_PERMISSION",
  AWAITING_MANUAL_NAME = "AWAITING_MANUAL_NAME",
  AWAITING_BIRTH_DATE = "AWAITING_BIRTH_DATE",
  AWAITING_PHONE_DECISION = "AWAITING_PHONE_DECISION",
  AWAITING_PHONE_CONTACT = "AWAITING_PHONE_CONTACT",
  READY_FOR_TEST = "READY_FOR_TEST",
  AWAITING_RESTART_DECISION = "AWAITING_RESTART_DECISION",
  IN_TEST = "IN_TEST"
}

export interface UserProfile {
  telegramId: number;
  fullName: string;
  birthDate: string;
  username: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  telegramId: number;
  state: UserState;
  currentQuestion: number;
  answers: number[];
  tempFullName: string | null;
  updatedAt: string;
}

export interface TestResult {
  id?: number;
  telegramId: number;
  score: number;
  answers: number[];
  completedAt: string;
}
