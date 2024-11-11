export type UpdateUserPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export interface User {
  firstName: string;
  lastName: string;
  email: string;
}
