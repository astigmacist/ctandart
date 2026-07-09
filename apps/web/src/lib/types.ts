export type RoleCode =
  | "owner"
  | "admin"
  | "warehouse_manager"
  | "manager"
  | "designer"
  | "production"
  | "installer"
  | "store_cashier"
  | "finance"
  | "client";

export type UserProfile = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: RoleCode;
  is_active: boolean;
};

export type NavigationModule = {
  key: string;
  title: string;
};

export type RoleWorkspace = {
  role: RoleCode;
  role_label: string;
  modules: NavigationModule[];
  workflow: string[];
};

export type RoleOption = {
  code: RoleCode;
  label: string;
};
