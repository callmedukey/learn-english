import { Role } from "@/prisma/generated/prisma";

// AR/Novel Permissions
export const canCreateARLevel = (role: Role | undefined): boolean => {
  return role === Role.ADMIN;
};

export const canDeleteARLevel = (role: Role | undefined): boolean => {
  return role === Role.ADMIN;
};

export const canEditARLevel = (role: Role | undefined): boolean => {
  return role === Role.ADMIN || role === Role.SUB_ADMIN;
};

export const canCreateNovel = (role: Role | undefined): boolean => {
  return role === Role.ADMIN || role === Role.SUB_ADMIN;
};

export const canDeleteNovel = (role: Role | undefined): boolean => {
  return role === Role.ADMIN;
};

export const canEditNovel = (role: Role | undefined): boolean => {
  return role === Role.ADMIN || role === Role.SUB_ADMIN;
};

export const canDeleteChapter = (role: Role | undefined): boolean => {
  return role === Role.ADMIN;
};

// RC Permissions
export const canCreateRCLevel = (role: Role | undefined): boolean => {
  return role === Role.ADMIN;
};

export const canDeleteRCLevel = (role: Role | undefined): boolean => {
  return role === Role.ADMIN;
};

export const canEditRCLevel = (role: Role | undefined): boolean => {
  return role === Role.ADMIN || role === Role.SUB_ADMIN;
};

export const canCreateKeyword = (role: Role | undefined): boolean => {
  return role === Role.ADMIN || role === Role.SUB_ADMIN;
};

export const canDeleteKeyword = (role: Role | undefined): boolean => {
  return role === Role.ADMIN;
};

export const canEditKeyword = (role: Role | undefined): boolean => {
  return role === Role.ADMIN || role === Role.SUB_ADMIN;
};

// General Admin Permissions
export const canAccessUserManagement = (role: Role | undefined): boolean => {
  return role === Role.ADMIN;
};

export const canAccessPaymentManagement = (role: Role | undefined): boolean => {
  return role === Role.ADMIN;
};

export const canAccessSystemSettings = (role: Role | undefined): boolean => {
  return role === Role.ADMIN;
};

export const canAccessChallenges = (role: Role | undefined): boolean => {
  return role === Role.ADMIN;
};

export const canAccessNotifications = (role: Role | undefined): boolean => {
  return role === Role.ADMIN;
};