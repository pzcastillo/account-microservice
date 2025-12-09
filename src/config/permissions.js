// config/permissions.js — FINAL VERSION (must match DB exactly)
module.exports = {
  SUPER_ADMIN: [
    "accounts:create", "accounts:read", "accounts:update", "accounts:disable", "accounts:delete",
    "departments:create", "departments:get", "departments:get:id", "departments:update", "departments:delete", "departments:patch:status"
  ],

  ADMIN: [
    "accounts:create", "accounts:read", "accounts:update", "accounts:disable", "accounts:delete",
    "departments:create", "departments:get", "departments:get:id", "departments:update", "departments:delete"
  ],

  MANAGER: [
    "accounts:create:own-dept",
    "accounts:read:own-dept",
    "accounts:update:own-dept",
    "accounts:disable:own-dept",
    "accounts:delete:own-dept",
    "departments:get",
    "departments:get:id"
  ],

  HR: [
    "accounts:read",
    "accounts:update",
    "departments:get",
    "departments:get:id"
  ],

  EMPLOYEE: [
    "accounts:read_own",
    "departments:get",
    "departments:get:id"
  ],

  CLIENT: [
    "accounts:read_own",
    "departments:get",
    "departments:get:id"
  ]
};