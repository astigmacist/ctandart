import { FormEvent, useEffect, useMemo, useState } from "react";

import { apiGet, apiPost } from "@/lib/api";
import type { RoleCode, RoleOption, RoleWorkspace, UserProfile } from "@/lib/types";

type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  user: UserProfile;
};

type NavItem = {
  key: string;
  view: string;
  title: string;
  group: "work" | "management" | "admin";
  badge?: string;
};

type OrderColumn = {
  key: string;
  title: string;
  color: string;
};

type Order = {
  id: string;
  client: string;
  title: string;
  sum: number;
  due: string;
  dueStatus: "ok" | "soon" | "late";
  col: string;
  who: string;
};

type Client = {
  name: string;
  sub: string;
  phone: string;
  orders: number;
  total: number;
  debt: number;
};

const demoAccounts = [
  ["Руководитель", "owner@ctandart.local", "Owner2026!"],
  ["Админ", "admin@ctandart.local", "Admin2026!"],
  ["Завсклад", "warehouse@ctandart.local", "Warehouse2026!"],
  ["Менеджер", "manager@ctandart.local", "Manager2026!"],
  ["Дизайнер", "designer@ctandart.local", "Designer2026!"],
  ["Производство", "production@ctandart.local", "Production2026!"],
  ["Монтажник", "installer@ctandart.local", "Installer2026!"],
  ["Магазин", "store@ctandart.local", "Store2026!"],
  ["Финансы", "finance@ctandart.local", "Finance2026!"],
] as const;

const navCatalog: Record<string, NavItem> = {
  dashboard: { key: "dashboard", view: "dashboard", title: "Главная", group: "work" },
  crm: { key: "crm", view: "crm", title: "CRM · Клиенты", group: "work" },
  orders: { key: "orders", view: "orders", title: "Заказы", group: "work", badge: "24" },
  production: { key: "production", view: "production", title: "Производство", group: "work" },
  my_tasks: { key: "my_tasks", view: "my_tasks", title: "Мои задачи", group: "work" },
  inventory: { key: "inventory", view: "warehouse", title: "Склад", group: "work" },
  store: { key: "store", view: "store", title: "Магазин", group: "work" },
  payments: { key: "payments", view: "finance", title: "Финансы", group: "management" },
  loyalty: { key: "loyalty", view: "loyalty", title: "Бонусы", group: "management" },
  gamification: { key: "gamification", view: "gamification", title: "Рейтинг", group: "management" },
  reports: { key: "reports", view: "reports", title: "Отчеты", group: "management" },
  audit: { key: "audit", view: "audit", title: "Аудит", group: "admin" },
  users: { key: "users", view: "users", title: "Пользователи", group: "admin" },
  settings: { key: "settings", view: "settings", title: "Настройки", group: "admin" },
};

const titles: Record<string, [string, string]> = {
  dashboard: ["Главная", "Сводка на сегодня, 3 июля"],
  crm: ["CRM · Клиенты", "База клиентов и история заказов"],
  orders: ["Заказы", "Канбан-доска по статусам"],
  production: ["Производство", "Очередь задач дизайна и печати"],
  my_tasks: ["Мои задачи", "Персональная очередь работ"],
  warehouse: ["Склад", "Остатки и движение материалов"],
  store: ["Магазин", "Розница, касса и остатки магазина"],
  finance: ["Финансы", "Кассы, оплаты и задолженности"],
  loyalty: ["Бонусы", "Silver, Gold, VIP и бонусные операции"],
  gamification: ["Рейтинг", "Геймификация сотрудников и команд"],
  reports: ["Отчеты", "Операционные и управленческие"],
  audit: ["Аудит", "Контроль изменений и подозрительных операций"],
  users: ["Пользователи", "Учетные записи сотрудников и роли"],
  settings: ["Настройки", "Роли доступа, справочники и будущая матрица прав"],
};

const clients: Client[] = [
  { name: "ИП Ахметов Д.К.", sub: "сеть кофеен «Coffee Time»", phone: "+7 701 220 4411", orders: 14, total: 1620000, debt: 114000 },
  { name: "ТОО «Кызылорда Строй Сервис»", sub: "строительная компания", phone: "+7 705 511 8890", orders: 6, total: 2140000, debt: 0 },
  { name: "Магазин «Балдырган»", sub: "детские товары", phone: "+7 707 340 1256", orders: 9, total: 540000, debt: 38000 },
  { name: "ИП Сатыбалдиева А.", sub: "салон красоты «Ажар»", phone: "+7 700 981 2234", orders: 3, total: 210000, debt: 0 },
  { name: "ТОО «Сыр Дария Восток»", sub: "оптовая торговля", phone: "+7 702 456 7781", orders: 11, total: 1980000, debt: 460000 },
  { name: "Ресторан «Атамекен»", sub: "общественное питание", phone: "+7 708 123 9087", orders: 7, total: 860000, debt: 0 },
];

const orderColumns: OrderColumn[] = [
  { key: "new", title: "Новый заказ", color: "#8B93A3" },
  { key: "calc", title: "Расчет / КП", color: "#5B6474" },
  { key: "design", title: "Дизайн", color: "#7C6CF0" },
  { key: "approve", title: "Согласование", color: "#C98A00" },
  { key: "prod", title: "Производство", color: "#FF4405" },
  { key: "ready", title: "Готов / монтаж", color: "#1F9D6E" },
  { key: "done", title: "Завершен", color: "#2E3242" },
];

const orders: Order[] = [
  { id: "2051", client: "Магазин «Балдырган»", title: "Наклейки на витрину, оракал", sum: 32000, due: "5 июл", dueStatus: "ok", col: "new", who: "ГС" },
  { id: "2050", client: "ИП Сатыбалдиева А.", title: "Вывеска световая 2×0.6 м", sum: 186000, due: "8 июл", dueStatus: "ok", col: "new", who: "ГС" },
  { id: "2048", client: "ТОО «Сыр Дария Восток»", title: "Баннеры для склада, 5 шт", sum: 145000, due: "6 июл", dueStatus: "ok", col: "calc", who: "НБ" },
  { id: "2047", client: "Ресторан «Атамекен»", title: "Меню-стенды, 4 шт", sum: 98000, due: "7 июл", dueStatus: "ok", col: "calc", who: "ГС" },
  { id: "2046", client: "ИП Ахметов Д.К.", title: "Ребрендинг: вывеска + баннер", sum: 410000, due: "10 июл", dueStatus: "ok", col: "design", who: "МК" },
  { id: "2044", client: "Магазин «Балдырган»", title: "Объемные буквы, подсветка", sum: 265000, due: "9 июл", dueStatus: "ok", col: "design", who: "МК" },
  { id: "2043", client: "ТОО «Кызылорда Строй Сервис»", title: "Стенды информационные, 6 шт", sum: 312000, due: "6 июл", dueStatus: "soon", col: "approve", who: "ГС" },
  { id: "2041", client: "ИП Ахметов Д.К.", title: "Пленка на витрины, 3 точки", sum: 88000, due: "4 июл", dueStatus: "soon", col: "approve", who: "НБ" },
  { id: "2039", client: "ТОО «Сыр Дария Восток»", title: "Баннер фасадный 6×3 м", sum: 264000, due: "5 июл", dueStatus: "soon", col: "prod", who: "БЕ" },
  { id: "2038", client: "Ресторан «Атамекен»", title: "Меню А2, ламинация, 20 шт", sum: 54000, due: "4 июл", dueStatus: "soon", col: "prod", who: "БЕ" },
  { id: "2035", client: "ИП Сатыбалдиева А.", title: "Наружная вывеска, объемные буквы", sum: 198000, due: "3 июл", dueStatus: "late", col: "prod", who: "АМ" },
  { id: "2031", client: "ИП Ахметов Д.К.", title: "Баннер 3×2 м + монтаж", sum: 114000, due: "3 июл", dueStatus: "late", col: "ready", who: "ЕТ" },
  { id: "2029", client: "ТОО «Кызылорда Строй Сервис»", title: "Указатели на объект, 8 шт", sum: 176000, due: "2 июл", dueStatus: "ok", col: "ready", who: "ЕТ" },
  { id: "2020", client: "Магазин «Балдырган»", title: "Пленка на окна, витрина", sum: 41000, due: "28 июн", dueStatus: "ok", col: "done", who: "ГС" },
];

const materials = [
  { name: "Баннерная ткань 440г", unit: "м²", stock: 210, min: 100, cost: 1450, status: "good" },
  { name: "Пленка Oracal 641", unit: "м²", stock: 18, min: 40, cost: 2100, status: "bad" },
  { name: "ПВХ 3 мм", unit: "лист", stock: 24, min: 15, cost: 9800, status: "good" },
  { name: "Акрил прозрачный 3 мм", unit: "лист", stock: 9, min: 10, cost: 14200, status: "warn" },
  { name: "Профиль алюминиевый для букв", unit: "пог.м", stock: 64, min: 50, cost: 3200, status: "good" },
  { name: "Блок питания 12V 5A", unit: "шт", stock: 6, min: 12, cost: 6800, status: "bad" },
];

const prodTasks = [
  { order: "№2039", task: "Печать баннера 6×3 м", who: "Бауыржан Е.", due: "сегодня 15:00", status: "progress" },
  { order: "№2035", task: "Резка объемных букв", who: "Асхат М.", due: "сегодня 12:00", status: "late" },
  { order: "№2046", task: "Разработка макета v2", who: "Молдир К.", due: "завтра 10:00", status: "progress" },
  { order: "№2031", task: "Монтаж баннера на фасад", who: "Ерлан Т.", due: "сегодня 18:00", status: "late" },
  { order: "№2038", task: "Ламинация меню, 20 шт", who: "Бауыржан Е.", due: "сегодня 17:00", status: "queue" },
];

const finance = [
  { date: "03.07", who: "ИП Ахметов Д.К. · №2031", sum: 96000, way: "Банк/QR", type: "приход" },
  { date: "03.07", who: "Магазин «Балдырган» · розница", sum: 24500, way: "Наличные", type: "приход" },
  { date: "03.07", who: "Закупка: пленка Oracal", sum: -118000, way: "Банк", type: "расход" },
  { date: "02.07", who: "ТОО «Сыр Дария Восток» · №2039", sum: 150000, way: "Банк", type: "аванс" },
  { date: "02.07", who: "Ресторан «Атамекен» · №2038", sum: 54000, way: "QR", type: "приход" },
];

const debts = [
  { name: "ТОО «Сыр Дария Восток»", amount: 460000, days: 12 },
  { name: "ИП Ахметов Д.К.", amount: 114000, days: 1 },
  { name: "Магазин «Балдырган»", amount: 38000, days: 4 },
];

const payroll = [
  { name: "Гульнара С.", role: "Менеджер", fix: 90000, pct: 126400, ded: 0, total: 216400 },
  { name: "Молдир К.", role: "Дизайнер", fix: 110000, pct: 64000, ded: 0, total: 174000 },
  { name: "Бауыржан Е.", role: "Печатник", fix: 120000, pct: 71500, ded: 0, total: 191500 },
  { name: "Асель Р.", role: "Заведующий складом", fix: 115000, pct: 0, ded: 0, total: 115000 },
  { name: "Данияр С.", role: "Магазин/кассир", fix: 95000, pct: 41300, ded: 0, total: 136300 },
];

const auditRows = [
  ["10:42", "user.create", "Администратор системы", "Создана учетная запись дизайнера", "info"],
  ["10:18", "stock.transfer", "Завсклад", "Оракал белый: главный склад → производство", "info"],
  ["09:55", "payment.void", "Финансы", "Отмена оплаты №2031, требуется причина", "bad"],
  ["09:30", "loyalty.advance", "Руководитель", "Бонусный аванс VIP клиенту", "warn"],
  ["09:12", "order.discount", "Менеджер", "Ручная скидка по заказу №2046", "warn"],
];

const money = (n: number) => `${n.toLocaleString("ru-RU")} ₸`;
const initials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function statusBadge(status: string) {
  const map: Record<string, [string, string]> = {
    good: ["good", "В норме"],
    warn: ["warn", "Внимание"],
    bad: ["bad", "Дефицит"],
    progress: ["warn", "В работе"],
    late: ["bad", "Просрочено"],
    queue: ["neutral", "В очереди"],
    info: ["neutral", "Инфо"],
  };
  const [cls, label] = map[status] ?? ["neutral", status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

function Icon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 9h8M8 13h6M8 17h4" />
    </svg>
  );
}

function TicketCorners() {
  return (
    <>
      <span className="corner tl" />
      <span className="corner br" />
    </>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("ctandart_token") ?? "");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<RoleWorkspace | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loginEmail, setLoginEmail] = useState("owner@ctandart.local");
  const [loginPassword, setLoginPassword] = useState("Owner2026!");
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedClient, setSelectedClient] = useState(0);
  const [modalOrder, setModalOrder] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canManageUsers = user?.role === "owner" || user?.role === "admin";
  const canCreateOrder = user?.role === "owner" || user?.role === "admin" || user?.role === "manager";
  const navItems = useMemo(() => workspace?.modules.map((module) => navCatalog[module.key]).filter(Boolean) ?? [], [workspace]);
  const visibleViews = useMemo(() => new Set(navItems.map((item) => item.view)), [navItems]);
  const currentTitle = titles[activeView] ?? titles.dashboard;

  useEffect(() => {
    apiGet<RoleOption[]>("/platform/roles")
      .then(setRoles)
      .catch(() => setRoles([]));
  }, []);

  useEffect(() => {
    if (!token) return;
    void loadSession(token);
  }, [token]);

  useEffect(() => {
    if (navItems.length && !navItems.some((item) => item.view === activeView)) {
      setActiveView(navItems[0].view);
    }
  }, [activeView, navItems]);

  async function loadSession(currentToken: string) {
    try {
      const [profile, nav] = await Promise.all([
        apiGet<UserProfile>("/auth/me", { token: currentToken }),
        apiGet<RoleWorkspace>("/platform/navigation", { token: currentToken }),
      ]);
      setUser(profile);
      setWorkspace(nav);
      const items = nav.modules.map((module) => navCatalog[module.key]).filter(Boolean);
      setActiveView(items[0]?.view ?? "dashboard");
      if (profile.role === "owner" || profile.role === "admin") {
        setUsers(await apiGet<UserProfile[]>("/users", { token: currentToken }));
      }
    } catch {
      logout();
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await apiPost<LoginResponse>("/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });
      localStorage.setItem("ctandart_token", response.access_token);
      setToken(response.access_token);
      setUser(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти");
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("ctandart_token");
    setToken("");
    setUser(null);
    setWorkspace(null);
    setUsers([]);
    setActiveView("dashboard");
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      full_name: String(form.get("full_name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? "") || null,
      password: String(form.get("password") ?? ""),
      role: String(form.get("role") ?? "manager"),
    };
    try {
      await apiPost<UserProfile>("/users", payload, { token });
      event.currentTarget.reset();
      setUsers(await apiGet<UserProfile[]>("/users", { token }));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать пользователя");
    }
  }

  if (!user || !workspace) {
    return (
      <main className="login-page">
        <section className="login-panel ticket priority">
          <TicketCorners />
          <div>
            <div className="login-kicker">CtandART ERP · web service</div>
            <h1 className="login-title">Вход только по выданной учетной записи</h1>
            <p className="login-copy">Публичной регистрации нет. Учетки создает руководитель или администратор, назначая роль и доступы.</p>
          </div>
          <form className="login-form" onSubmit={login}>
            <label>
              Email
              <input value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
            </label>
            <label>
              Пароль
              <input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} />
            </label>
            {error ? <div className="form-error">{error}</div> : null}
            <button className="btn primary" disabled={isLoading} type="submit">
              {isLoading ? "Вход..." : "Войти"}
            </button>
          </form>
          <div className="demo-logins">
            <div className="section-title">Тестовые учетки первого этапа</div>
            {demoAccounts.map(([label, email, password]) => (
              <button
                className="demo-login"
                key={email}
                onClick={() => {
                  setLoginEmail(email);
                  setLoginPassword(password);
                }}
                type="button"
              >
                <span>{label}</span>
                <small>{email}</small>
              </button>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <div className="brand-name">CtandArt</div>
            <div className="brand-sub">ERP · Кызылорда</div>
          </div>
        </div>

        <NavGroup
          activeView={activeView}
          group="work"
          items={navItems}
          label="Работа"
          onNavigate={setActiveView}
        />
        <NavGroup
          activeView={activeView}
          group="management"
          items={navItems}
          label="Управление"
          onNavigate={setActiveView}
        />
        <NavGroup
          activeView={activeView}
          group="admin"
          items={navItems}
          label="Администрирование"
          onNavigate={setActiveView}
        />

        <div className="sidebar-foot">
          <div className="role-switch">Вид от роли</div>
          <div className="user-chip">
            <div className="avatar">{initials(user.full_name)}</div>
            <div>
              <div className="user-name">{user.full_name}</div>
              <div className="user-role">{workspace.role_label}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout} type="button">Выйти</button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div>
            <div className="topbar-title">{currentTitle[0]}</div>
            <div className="topbar-sub">{currentTitle[1]}</div>
          </div>
          <div className="search">Поиск клиента, заказа, материала…</div>
          <div className="topbar-actions">
            <div className="icon-btn"><span className="dot" />!</div>
            {canCreateOrder ? <button className="btn primary" onClick={() => setModalOrder("new")} type="button">+ Новый заказ</button> : null}
          </div>
        </div>
        <div className="perf" />

        <div className="content">
          {error ? <div className="form-error page-error">{error}</div> : null}
          {visibleViews.has("dashboard") ? <DashboardView onOpenOrder={setModalOrder} /> : null}
          {visibleViews.has("crm") ? <CrmView selectedClient={selectedClient} setSelectedClient={setSelectedClient} /> : null}
          {visibleViews.has("orders") ? <OrdersView onOpenOrder={setModalOrder} /> : null}
          {visibleViews.has("production") ? <ProductionView /> : null}
          {visibleViews.has("my_tasks") ? <MyTasksView roleLabel={workspace.role_label} workflow={workspace.workflow} /> : null}
          {visibleViews.has("warehouse") ? <WarehouseView /> : null}
          {visibleViews.has("store") ? <StoreView /> : null}
          {visibleViews.has("finance") ? <FinanceView /> : null}
          {visibleViews.has("loyalty") ? <LoyaltyView /> : null}
          {visibleViews.has("gamification") ? <GamificationView /> : null}
          {visibleViews.has("reports") ? <ReportsView /> : null}
          {visibleViews.has("audit") ? <AuditView /> : null}
          {visibleViews.has("users") ? (
            <UsersView canManageUsers={canManageUsers} createUser={createUser} roles={roles} users={users} />
          ) : null}
          {visibleViews.has("settings") ? <SettingsView roles={roles} /> : null}
        </div>
      </div>
      {modalOrder ? <OrderModal orderId={modalOrder} onClose={() => setModalOrder(null)} /> : null}
    </div>
  );

  function View({ id, children }: { id: string; children: React.ReactNode }) {
    return <section className={`view ${activeView === id ? "active" : ""}`}>{children}</section>;
  }

  function DashboardView({ onOpenOrder }: { onOpenOrder: (id: string) => void }) {
    const attention = orders.filter((order) => order.dueStatus !== "ok").slice(0, 5);
    return (
      <View id="dashboard">
        <div className="view-head">
          <div><span className="eyebrow">Учредитель / директор</span><h1>Сводка компании</h1></div>
          <div className="tag">Обновлено: сегодня, 09:14</div>
        </div>
        <div className="grid kpi-grid">
          {[
            ["Продажи сегодня", "418 000 ₸", "▲ 12% к вчера", "up"],
            ["Оплачено сегодня", "356 500 ₸", "3 оплаты · 1 частичная", "flat"],
            ["Заказов в работе", "24", "7 на производстве", "flat"],
            ["Просрочено", "3", "требуют внимания", "down"],
            ["Долг клиентов", "612 000 ₸", "9 клиентов", "flat"],
            ["Критичные остатки", "4 позиции", "ниже минимума", "down"],
          ].map(([label, value, delta, mood]) => (
            <div className={`kpi ticket ${mood === "down" ? "priority" : ""}`} key={label}>
              <TicketCorners />
              <div className="label">{label}</div><div className="value mono">{value}</div>
              <div className={`delta ${mood}`}>{delta}</div>
            </div>
          ))}
        </div>
        <div className="two-col">
          <div className="panel">
            <div className="panel-head"><h3>Заказы, требующие внимания</h3><span className="tag">приоритет</span></div>
            <table>
              <thead><tr><th>№ заказа</th><th>Клиент</th><th>Этап</th><th>Срок</th><th>Сумма</th></tr></thead>
              <tbody>
                {attention.map((order) => (
                  <tr key={order.id} onClick={() => onOpenOrder(order.id)}>
                    <td className="mono">№{order.id}</td>
                    <td>{order.client}</td>
                    <td><span className="tag">{orderColumns.find((column) => column.key === order.col)?.title}</span></td>
                    <td><span className={`due ${order.dueStatus}`}>{order.due}</span></td>
                    <td className="mono">{money(order.sum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <NotificationPanel />
        </div>
      </View>
    );
  }

  function CrmView({ selectedClient, setSelectedClient }: { selectedClient: number; setSelectedClient: (index: number) => void }) {
    const client = clients[selectedClient];
    return (
      <View id="crm">
        <div className="view-head">
          <div><span className="eyebrow">CRM</span><h1>Клиенты</h1></div>
          <button className="btn primary" type="button">+ Новый клиент</button>
        </div>
        <div className="two-col">
          <div className="panel">
            <div className="panel-head"><h3>База клиентов</h3><span className="tag">38 клиентов</span></div>
            <table>
              <thead><tr><th>Клиент</th><th>Телефон</th><th>Заказов</th><th>Сумма покупок</th><th>Долг</th></tr></thead>
              <tbody>
                {clients.map((item, index) => (
                  <tr key={item.name} onClick={() => setSelectedClient(index)}>
                    <td><div className="client-row-name">{item.name}</div><div className="client-row-sub">{item.sub}</div></td>
                    <td className="mono">{item.phone}</td>
                    <td>{item.orders}</td>
                    <td className="mono">{money(item.total)}</td>
                    <td>{item.debt > 0 ? <span className="badge bad">{money(item.debt)}</span> : <span className="badge good">нет долга</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel client-detail">
            <div className="panel-head"><h3>Карточка клиента</h3></div>
            <div className="panel-body">
              <div className="client-card-head">
                <div className="client-avatar">{initials(client.name)}</div>
                <div><div className="client-row-name">{client.name}</div><div className="client-row-sub">{client.sub}</div></div>
              </div>
              <Kv label="Телефон" value={client.phone} />
              <Kv label="Заказов всего" value={String(client.orders)} />
              <Kv label="Сумма покупок" value={money(client.total)} />
              <Kv label="Задолженность" value={money(client.debt)} danger={client.debt > 0} />
              <Kv label="Бонусный уровень" value="Gold · 18 400 бонусов" />
              <div className="card-actions"><button className="btn primary" type="button">+ Заказ</button><button className="btn ghost" type="button">Написать</button></div>
            </div>
          </div>
        </div>
      </View>
    );
  }

  function OrdersView({ onOpenOrder }: { onOpenOrder: (id: string) => void }) {
    return (
      <View id="orders">
        <div className="view-head">
          <div><span className="eyebrow">Управление заказами</span><h1>Доска заказов</h1></div>
          <div className="head-actions"><button className="btn ghost" type="button">Список</button><button className="btn primary" onClick={() => onOpenOrder("new")} type="button">+ Новый заказ</button></div>
        </div>
        <div className="board">
          {orderColumns.map((column) => {
            const items = orders.filter((order) => order.col === column.key);
            return (
              <div className="col" key={column.key}>
                <div className="col-bar" style={{ background: column.color }} />
                <div className="col-head"><h4>{column.title}</h4><span className="col-count">{items.length}</span></div>
                {items.map((order) => (
                  <div className={`card-order ticket ${order.dueStatus === "late" ? "priority" : ""}`} key={order.id} onClick={() => onOpenOrder(order.id)}>
                    <TicketCorners />
                    <div className="id">№{order.id}</div>
                    <div className="title">{order.title}</div>
                    <div className="client-row-sub">{order.client}</div>
                    <div className="meta"><span className={`due ${order.dueStatus}`}>{order.due}</span><span className="avatar-sm">{order.who}</span></div>
                    <div className="meta"><span /><span className="sum">{money(order.sum)}</span></div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </View>
    );
  }

  function ProductionView() {
    return (
      <View id="production">
        <div className="view-head"><div><span className="eyebrow">Производственный модуль</span><h1>Очередь задач</h1></div><div className="tag">Смена: сегодня</div></div>
        <div className="two-col">
          <TasksPanel />
          <LoadPanel />
        </div>
      </View>
    );
  }

  function MyTasksView({ roleLabel, workflow }: { roleLabel: string; workflow: string[] }) {
    return (
      <View id="my_tasks">
        <div className="view-head"><div><span className="eyebrow">Ролевое рабочее место</span><h1>{roleLabel}</h1></div><div className="tag">видны только свои задачи</div></div>
        <div className="two-col">
          <TasksPanel />
          <div className="panel">
            <div className="panel-head"><h3>Рабочий процесс</h3></div>
            <div className="panel-body"><ol className="workflow-list">{workflow.map((item) => <li key={item}>{item}</li>)}</ol></div>
          </div>
        </div>
      </View>
    );
  }

  function WarehouseView() {
    return (
      <View id="warehouse">
        <div className="view-head"><div><span className="eyebrow">Складской учет</span><h1>Материалы и остатки</h1></div><div className="head-actions"><button className="btn ghost" type="button">Провести ревизию</button><button className="btn primary" type="button">+ Приход товара</button></div></div>
        <div className="panel">
          <div className="panel-head"><h3>Главный склад · производство · магазин</h3><span className="tag">4 позиции ниже минимума</span></div>
          <MaterialsTable />
        </div>
      </View>
    );
  }

  function StoreView() {
    return (
      <View id="store">
        <div className="view-head"><div><span className="eyebrow">Магазин</span><h1>Розница и касса магазина</h1></div><button className="btn primary" type="button">+ Продажа</button></div>
        <div className="cash-cards">
          <div className="cash-card orange"><h4>Касса магазина</h4><div className="amt">218 900 ₸</div><div className="sub">смена открыта · 09:00</div></div>
          <div className="cash-card dark"><h4>Продажи сегодня</h4><div className="amt">106 000 ₸</div><div className="sub">8 чеков · 1 возврат</div></div>
          <div className="cash-card green"><h4>Остатки магазина</h4><div className="amt">312 поз.</div><div className="sub">видна только зона магазина</div></div>
        </div>
        <div className="panel"><div className="panel-head"><h3>Последние продажи магазина</h3></div><FinanceTable storeOnly /></div>
      </View>
    );
  }

  function FinanceView() {
    return (
      <View id="finance">
        <div className="view-head"><div><span className="eyebrow">Управленческие финансы</span><h1>Кассы и платежи</h1></div><button className="btn primary" type="button">+ Зафиксировать оплату</button></div>
        <div className="cash-cards">
          <div className="cash-card dark"><h4>Касса организации</h4><div className="amt">1 240 300 ₸</div><div className="sub">на начало дня 980 100 ₸</div></div>
          <div className="cash-card orange"><h4>Касса магазина</h4><div className="amt">218 900 ₸</div><div className="sub">смена открыта · 09:00</div></div>
          <div className="cash-card green"><h4>Банк / QR</h4><div className="amt">742 000 ₸</div><div className="sub">14 транзакций сегодня</div></div>
        </div>
        <div className="two-col"><div className="panel"><div className="panel-head"><h3>Последние операции</h3></div><FinanceTable /></div><DebtPanel /></div>
      </View>
    );
  }

  function LoyaltyView() {
    return (
      <View id="loyalty">
        <div className="view-head"><div><span className="eyebrow">Клиентская лояльность</span><h1>Silver · Gold · VIP</h1></div><button className="btn primary" type="button">+ Бонусный аванс</button></div>
        <div className="grid kpi-grid">
          {["Silver · 3% начисление", "Gold · 5% начисление", "VIP · 7% начисление"].map((value) => <div className="kpi ticket" key={value}><TicketCorners /><div className="label">Уровень</div><div className="value">{value}</div><div className="delta flat">лимит списания настраивается</div></div>)}
        </div>
        <div className="panel"><div className="panel-head"><h3>Бонусные балансы клиентов</h3><span className="tag">1 бонус = 1 ₸ · уточнить</span></div><table><thead><tr><th>Клиент</th><th>Уровень</th><th>Баланс</th><th>Последняя операция</th></tr></thead><tbody>{clients.slice(0, 4).map((client, index) => <tr key={client.name}><td>{client.name}</td><td><span className={`badge ${index === 0 ? "good" : "neutral"}`}>{index === 0 ? "Gold" : "Silver"}</span></td><td className="mono">{money(18400 - index * 2300)}</td><td>начисление за оплаченный заказ</td></tr>)}</tbody></table></div>
      </View>
    );
  }

  function GamificationView() {
    return (
      <View id="gamification">
        <div className="view-head"><div><span className="eyebrow">Геймификация</span><h1>Лучшие сотрудники месяца</h1></div><div className="tag">по ролям и командам</div></div>
        <div className="panel"><div className="panel-head"><h3>Leaderboard</h3></div><div className="panel-body top-list">{[
          ["Гульнара С.", "Менеджер", "Продажи: 1 260 000 ₸", "148"],
          ["Бауыржан Е.", "Печатник", "0 брака · 42 задачи", "132"],
          ["Молдир К.", "Дизайнер", "Ср. согласование: 1.2 дня", "119"],
        ].map((row, index) => <div className="top-row" key={row[0]}><div className="client-avatar">{index + 1}</div><div><b>{row[0]}</b><div className="client-row-sub">{row[1]} · {row[2]}</div></div><span className="mono">{row[3]} баллов</span></div>)}</div></div>
      </View>
    );
  }

  function ReportsView() {
    return (
      <View id="reports">
        <div className="view-head"><div><span className="eyebrow">Отчетность</span><h1>Ежемесячный отчет</h1></div><div className="head-actions"><button className="btn ghost" type="button">Excel</button><button className="btn ghost" type="button">PDF</button></div></div>
        <div className="two-col"><div className="panel"><div className="panel-head"><h3>Продажи по неделям, ₸</h3></div><div className="panel-body"><div className="chart">{[1180, 1420, 980, 760].map((value, index) => <div className="bar-wrap" key={value}><div className="bar-val">{value}k</div><div className="bar" style={{ height: `${(value / 1420) * 100}px` }} /><div className="bar-label">Нед {index + 1}</div></div>)}</div></div></div><div className="panel"><div className="panel-head"><h3>Лучшие сотрудники</h3></div><div className="panel-body top-list"><div>Гульнара С. · продажи</div><div>Бауыржан Е. · производство</div><div>Молдир К. · дизайн</div></div></div></div>
      </View>
    );
  }

  function AuditView() {
    return (
      <View id="audit">
        <div className="view-head"><div><span className="eyebrow">Безопасность</span><h1>Аудит действий</h1></div><div className="tag">удаление запрещено</div></div>
        <div className="panel"><div className="panel-head"><h3>Подозрительные и критичные операции</h3></div><table><thead><tr><th>Время</th><th>Действие</th><th>Кто</th><th>Описание</th><th>Риск</th></tr></thead><tbody>{auditRows.map((row) => <tr key={row.join("-")}><td className="mono">{row[0]}</td><td className="mono">{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td>{statusBadge(row[4])}</td></tr>)}</tbody></table></div>
      </View>
    );
  }

  function UsersView({ canManageUsers, createUser, roles, users }: { canManageUsers: boolean; createUser: (event: FormEvent<HTMLFormElement>) => void; roles: RoleOption[]; users: UserProfile[] }) {
    return (
      <View id="users">
        <div className="view-head"><div><span className="eyebrow">Администрирование</span><h1>Пользователи и роли</h1></div><button className="btn primary" type="button">+ Пользователь</button></div>
        {canManageUsers ? <div className="panel create-user-panel"><div className="panel-head"><h3>Создать учетную запись</h3><span className="tag">регистрация закрыта</span></div><form className="user-form panel-body" onSubmit={createUser}><input name="full_name" placeholder="ФИО / имя сотрудника" required /><input name="email" placeholder="Email для входа" required /><input name="phone" placeholder="Телефон, необязательно" /><input name="password" placeholder="Временный пароль" required type="password" /><select defaultValue="manager" name="role">{roles.filter((role) => role.code !== "client").map((role) => <option key={role.code} value={role.code}>{role.label}</option>)}</select><button className="btn primary" type="submit">Создать</button></form></div> : null}
        <div className="panel settings-users"><div className="panel-head"><h3>Сотрудники системы</h3></div><table><thead><tr><th>Имя</th><th>Роль</th><th>Логин</th><th>Статус</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td>{item.full_name}</td><td><span className="tag">{roles.find((role) => role.code === item.role)?.label ?? item.role}</span></td><td className="mono">{item.email}</td><td><span className="badge good">Активен</span></td></tr>)}</tbody></table></div>
      </View>
    );
  }

  function SettingsView({ roles }: { roles: RoleOption[] }) {
    return (
      <View id="settings">
        <div className="view-head"><div><span className="eyebrow">Системные настройки</span><h1>Роли и будущие права</h1></div><span className="tag">этап 1</span></div>
        <div className="panel"><div className="panel-head"><h3>Роли доступа</h3></div><div className="panel-body role-grid">{roles.map((role) => <div className="role-card" key={role.code}><h5>{role.label}</h5><p>Меню и права выдаются через backend. Следующий этап - детальная матрица операций.</p></div>)}</div></div>
      </View>
    );
  }
}

function NavGroup({ activeView, group, items, label, onNavigate }: { activeView: string; group: NavItem["group"]; items: NavItem[]; label: string; onNavigate: (view: string) => void }) {
  const groupItems = items.filter((item) => item.group === group);
  if (!groupItems.length) return null;
  return (
    <>
      <div className="nav-group-label">{label}</div>
      {groupItems.map((item) => (
        <button className={`nav-item ${activeView === item.view ? "active" : ""}`} key={`${item.key}-${item.view}`} onClick={() => onNavigate(item.view)} type="button">
          <Icon /> <span>{item.title}</span>{item.badge ? <span className="nav-badge">{item.badge}</span> : null}
        </button>
      ))}
    </>
  );
}

function NotificationPanel() {
  return (
    <div className="panel">
      <div className="panel-head"><h3>Уведомления</h3></div>
      <div className="panel-body notice-list">
        {[
          ["warn", "Пленка Oracal 641 — остаток ниже минимума", "Склад · осталось 18 м² из 40 м²"],
          ["bad", "Заказ №2031 просрочен на 1 день", "Этап «Монтаж» · монтажник Ерлан Т."],
          ["good", "Макет по заказу №2044 согласован", "Клиент подтвердил версию 2"],
          ["neutral", "Кассовая смена магазина не закрыта", "Кассир: Данияр С. · с 09:00"],
        ].map(([mood, title, sub]) => <div className="notice" key={title}>{statusBadge(mood)}<div><b>{title}</b><div className="client-row-sub">{sub}</div></div></div>)}
      </div>
    </div>
  );
}

function TasksPanel() {
  return (
    <div className="panel">
      <div className="panel-head"><h3>Задачи по исполнителям</h3></div>
      <table><thead><tr><th>Заказ</th><th>Задача</th><th>Исполнитель</th><th>Срок</th><th>Статус</th></tr></thead><tbody>{prodTasks.map((task) => <tr key={`${task.order}-${task.task}`}><td className="mono">{task.order}</td><td>{task.task}</td><td>{task.who}</td><td>{task.due}</td><td>{statusBadge(task.status)}</td></tr>)}</tbody></table>
    </div>
  );
}

function LoadPanel() {
  return <div className="panel"><div className="panel-head"><h3>Загрузка сегодня</h3></div><div className="panel-body load-list">{[["Дизайн — Молдир К.", 70, "var(--accent)"], ["Печать — Бауыржан Е.", 92, "var(--bad)"], ["Сборка/резка — Асхат М.", 45, "var(--good)"], ["Монтаж — Ерлан Т.", 60, "var(--warn)"]].map(([label, width, color]) => <div key={String(label)}><div className="client-row-sub">{label}</div><div className="stock-bar wide"><span style={{ width: `${width}%`, background: String(color) }} /></div></div>)}</div></div>;
}

function MaterialsTable() {
  const colorMap: Record<string, string> = { good: "#1F9D6E", warn: "#C98A00", bad: "#E23B3B" };
  return <table><thead><tr><th>Материал</th><th>Ед.</th><th>Остаток</th><th>Мин. остаток</th><th>Себестоимость</th><th>Статус</th></tr></thead><tbody>{materials.map((material) => { const pct = Math.min(100, Math.round((material.stock / (material.min * 2)) * 100)); return <tr key={material.name}><td>{material.name}</td><td>{material.unit}</td><td><span className="stock-bar"><span style={{ width: `${pct}%`, background: colorMap[material.status] }} /></span><span className="mono">{material.stock}</span></td><td className="mono">{material.min}</td><td className="mono">{money(material.cost)}</td><td>{statusBadge(material.status)}</td></tr>; })}</tbody></table>;
}

function FinanceTable({ storeOnly = false }: { storeOnly?: boolean }) {
  const rows = storeOnly ? finance.filter((row) => row.who.includes("Магазин")) : finance;
  return <table><thead><tr><th>Дата</th><th>Заказ / клиент</th><th>Сумма</th><th>Способ</th><th>Тип</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.date}-${row.who}`}><td>{row.date}</td><td>{row.who}</td><td className="mono" style={{ color: row.sum < 0 ? "var(--bad)" : "var(--good)" }}>{row.sum < 0 ? "−" : "+"}{money(Math.abs(row.sum))}</td><td>{row.way}</td><td><span className="tag">{row.type}</span></td></tr>)}</tbody></table>;
}

function DebtPanel() {
  return <div className="panel"><div className="panel-head"><h3>Дебиторская задолженность</h3></div><div className="panel-body debt-list">{debts.map((debt) => <div className="debt-row" key={debt.name}><div><div className="client-row-name">{debt.name}</div><div className="client-row-sub">{debt.days} дн. просрочки</div></div><div className="mono debt-sum">{money(debt.amount)}</div></div>)}</div></div>;
}

function Kv({ danger, label, value }: { danger?: boolean; label: string; value: string }) {
  return <div className="kv"><span className="k">{label}</span><span className={`mono ${danger ? "danger-text" : ""}`}>{value}</span></div>;
}

function OrderModal({ onClose, orderId }: { onClose: () => void; orderId: string }) {
  const stages = ["Новый", "Принят", "Расчет", "Дизайн", "Согласование", "Утвержден", "Производство", "Печать", "Сборка", "Готов", "Монтаж", "Завершен"];
  const currentIdx = orderId === "new" ? 0 : 9;
  return (
    <div className="overlay active">
      <div className="modal">
        <div className="modal-head"><div><div className="topbar-sub mono">{orderId === "new" ? "Новый заказ" : `Заказ №${orderId}`}</div><h3>Баннер 3×2 м + монтаж — ИП Ахметов Д.К.</h3></div><button className="modal-close" onClick={onClose} type="button">×</button></div>
        <div className="modal-body">
          <div className="stepper">{stages.map((stage, index) => <span className={`step ${index < currentIdx ? "done" : index === currentIdx ? "current" : ""}`} key={stage}>{index + 1}. {stage}</span>)}</div>
          <div className="modal-grid"><div><div className="client-row-sub">Ответственные</div><div className="tag-wrap"><span className="tag">Менеджер: Гульнара С.</span><span className="tag">Монтажник: Ерлан Т.</span></div></div><div><div className="client-row-sub">Срок выполнения</div><div className="deadline">3 июля, 18:00 · просрочен на 1 день</div></div></div>
          <div className="panel modal-panel"><div className="panel-head"><h3>Позиции заказа</h3></div><div className="panel-body compact"><div className="line-item"><span>Баннер, баннерная ткань 440г, 3×2 м, люверсы</span><span className="mono">96 000 ₸</span></div><div className="line-item"><span>Монтаж на фасад, выезд бригады</span><span className="mono">18 000 ₸</span></div><div className="line-item total"><span>Итого</span><span className="mono">114 000 ₸</span></div></div></div>
          <div className="files"><div className="client-row-sub">Файлы</div><span className="file-chip">tz_client.pdf</span><span className="file-chip">maket_v2.png</span><span className="file-chip">maket_v3_final.png</span></div>
        </div>
      </div>
    </div>
  );
}
