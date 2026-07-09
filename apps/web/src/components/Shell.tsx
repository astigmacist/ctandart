import type { ReactNode } from "react";

import type { NavigationModule, UserProfile } from "@/lib/types";

export function Shell({
  children,
  modules,
  user,
  roleLabel,
  onLogout,
}: {
  children: ReactNode;
  modules: NavigationModule[];
  user: UserProfile;
  roleLabel: string;
  onLogout: () => void;
}) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title">CtandART ERP</div>
          <div className="brand-subtitle">{roleLabel}</div>
        </div>
        <nav className="nav">
          {modules.map((module) => (
            <a
              className={`nav-item ${module.key === modules[0]?.key ? "active" : ""}`}
              href={`#${module.key}`}
              key={module.key}
            >
              <span>{module.title}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-name">{user.full_name}</div>
          <div className="sidebar-user-email">{user.email}</div>
          <button className="sidebar-logout" onClick={onLogout} type="button">
            Выйти
          </button>
        </div>
      </aside>
      <section className="content">{children}</section>
    </main>
  );
}
