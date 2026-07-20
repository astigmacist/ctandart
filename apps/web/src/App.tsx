import { FormEvent, useEffect, useMemo, useState } from "react";

import { apiGet, apiPost } from "@/lib/api";
import { Language, translations } from "@/lib/i18n";
import type { RoleCode, RoleOption, RoleWorkspace, UserProfile } from "@/lib/types";

type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  user: UserProfile;
};

type NavItem = {
  key: string;
  view: string;
  titleKey: string;
  group: "work" | "management" | "admin";
  badge?: string;
};

type OrderColumn = {
  key: string;
  titleKey: string;
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

type Material = {
  name: string;
  unit: string;
  stock: number;
  min: number;
  cost: number;
  status: "good" | "warn" | "bad";
};

type FinanceRecord = {
  date: string;
  who: string;
  sum: number;
  way: string;
  type: string;
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
  dashboard: { key: "dashboard", view: "dashboard", titleKey: "nav_dashboard", group: "work" },
  crm: { key: "crm", view: "crm", titleKey: "nav_crm", group: "work" },
  orders: { key: "orders", view: "orders", titleKey: "nav_orders", group: "work", badge: "24" },
  production: { key: "production", view: "production", titleKey: "nav_production", group: "work" },
  my_tasks: { key: "my_tasks", view: "my_tasks", titleKey: "nav_my_tasks", group: "work" },
  inventory: { key: "inventory", view: "warehouse", titleKey: "nav_inventory", group: "work" },
  store: { key: "store", view: "store", titleKey: "nav_store", group: "work" },
  payments: { key: "payments", view: "finance", titleKey: "nav_payments", group: "management" },
  loyalty: { key: "loyalty", view: "loyalty", titleKey: "nav_loyalty", group: "management" },
  gamification: { key: "gamification", view: "gamification", titleKey: "nav_gamification", group: "management" },
  reports: { key: "reports", view: "reports", titleKey: "nav_reports", group: "management" },
  audit: { key: "audit", view: "audit", titleKey: "nav_audit", group: "admin" },
  users: { key: "users", view: "users", titleKey: "nav_users", group: "admin" },
  settings: { key: "settings", view: "settings", titleKey: "nav_settings", group: "admin" },
};

const initialClients: Client[] = [
  { name: "ИП Ахметов Д.К.", sub: "сеть кофеен «Coffee Time»", phone: "+7 701 220 4411", orders: 14, total: 1620000, debt: 114000 },
  { name: "ТОО «Кызылорда Строй Сервис»", sub: "строительная компания", phone: "+7 705 511 8890", orders: 6, total: 2140000, debt: 0 },
  { name: "Магазин «Балдырган»", sub: "детские товары", phone: "+7 707 340 1256", orders: 9, total: 540000, debt: 38000 },
  { name: "ИП Сатыбалдиева А.", sub: "салон красоты «Ажар»", phone: "+7 700 981 2234", orders: 3, total: 210000, debt: 0 },
  { name: "ТОО «Сыр Дария Восток»", sub: "оптовая торговля", phone: "+7 702 456 7781", orders: 11, total: 1980000, debt: 460000 },
  { name: "Ресторан «Атамекен»", sub: "общественное питание", phone: "+7 708 123 9087", orders: 7, total: 860000, debt: 0 },
];

const orderColumns: OrderColumn[] = [
  { key: "new", titleKey: "stage_new", color: "#8B93A3" },
  { key: "calc", titleKey: "stage_calc", color: "#5B6474" },
  { key: "design", titleKey: "stage_design", color: "#7C6CF0" },
  { key: "approve", titleKey: "stage_approve", color: "#C98A00" },
  { key: "prod", titleKey: "stage_prod", color: "#FF4405" },
  { key: "ready", titleKey: "stage_ready", color: "#1F9D6E" },
  { key: "done", titleKey: "stage_done", color: "#2E3242" },
];

const initialOrders: Order[] = [
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

const initialMaterials: Material[] = [
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

const initialFinance: FinanceRecord[] = [
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

const money = (n: number) => `${n.toLocaleString("ru-RU")} ₸`;
const initials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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

type ModalType = null | "new_client" | "write_client" | "inventory_audit" | "add_material" | "store_sale" | "add_payment" | "loyalty_advance";

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
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [ordersViewMode, setOrdersViewMode] = useState<"board" | "list">("board");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // i18n Language state
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem("ctandart_lang") as Language) ?? "ru");

  const t = (key: string): string => translations[lang]?.[key] ?? translations.ru[key] ?? key;

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("ctandart_lang", newLang);
  };

  function statusBadge(status: string) {
    const map: Record<string, [string, string]> = {
      good: ["good", t("badge_good")],
      warn: ["warn", t("badge_warn")],
      bad: ["bad", t("badge_bad")],
      progress: ["warn", t("badge_progress")],
      late: ["bad", t("badge_late")],
      queue: ["neutral", t("badge_queue")],
      info: ["neutral", t("badge_info")],
    };
    const [cls, label] = map[status] ?? ["neutral", status];
    return <span className={`badge ${cls}`}>{label}</span>;
  }

  // Dynamic state arrays
  const [clientsList, setClientsList] = useState<Client[]>(initialClients);
  const [ordersList, setOrdersList] = useState<Order[]>(initialOrders);
  const [materialsList, setMaterialsList] = useState<Material[]>(initialMaterials);
  const [financeList, setFinanceList] = useState<FinanceRecord[]>(initialFinance);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canManageUsers = user?.role === "owner" || user?.role === "admin";
  const canCreateOrder = user?.role === "owner" || user?.role === "admin" || user?.role === "manager";
  const navItems = useMemo(() => workspace?.modules.map((module) => navCatalog[module.key]).filter(Boolean) ?? [], [workspace]);
  const visibleViews = useMemo(() => new Set(navItems.map((item) => item.view)), [navItems]);
  const currentTitle: [string, string] = [t(`title_${activeView}`), t(`sub_${activeView}`)];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
      showToast("Учетная запись сотрудника успешно создана");
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
            <h1 className="login-title">{t("loginTitle")}</h1>
            <p className="login-copy">{t("loginCopy")}</p>
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
              {isLoading ? "..." : t("login")}
            </button>
          </form>
          <div className="demo-logins">
            <div className="section-title">{t("demoLogins")}</div>
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
          label={t("workGroup")}
          onNavigate={setActiveView}
          t={t}
        />
        <NavGroup
          activeView={activeView}
          group="management"
          items={navItems}
          label={t("managementGroup")}
          onNavigate={setActiveView}
          t={t}
        />
        <NavGroup
          activeView={activeView}
          group="admin"
          items={navItems}
          label={t("adminGroup")}
          onNavigate={setActiveView}
          t={t}
        />

        <div className="sidebar-foot">
          <div className="role-switch">{t("roleSwitch")}</div>
          <div className="user-chip">
            <div className="avatar">{initials(user.full_name)}</div>
            <div>
              <div className="user-name">{user.full_name}</div>
              <div className="user-role">{workspace.role_label}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout} type="button">{t("logout")}</button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div>
            <div className="topbar-title">{currentTitle[0]}</div>
            <div className="topbar-sub">{currentTitle[1]}</div>
          </div>
          <div className="search">{t("searchPlaceholder")}</div>
          <div className="topbar-actions">
            {/* Language Switcher RU / KK / EN */}
            <div className="lang-switcher">
              <button className={`lang-btn ${lang === "ru" ? "active" : ""}`} onClick={() => changeLanguage("ru")} type="button">RU</button>
              <button className={`lang-btn ${lang === "kk" ? "active" : ""}`} onClick={() => changeLanguage("kk")} type="button">KK</button>
              <button className={`lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => changeLanguage("en")} type="button">EN</button>
            </div>

            <button
              className="icon-btn"
              onClick={() => showToast("4 новых уведомления по заказам и остаткам")}
              title="Уведомления"
              type="button"
            >
              <span className="dot" />!
            </button>
            {canCreateOrder ? <button className="btn primary" onClick={() => setModalOrder("new")} type="button">{t("btn_new_order")}</button> : null}
          </div>
        </div>
        <div className="perf" />

        <div className="content">
          {error ? <div className="form-error page-error">{error}</div> : null}
          {visibleViews.has("dashboard") ? <DashboardView onOpenOrder={setModalOrder} statusBadge={statusBadge} t={t} /> : null}
          {visibleViews.has("crm") ? <CrmView selectedClient={selectedClient} setSelectedClient={setSelectedClient} t={t} /> : null}
          {visibleViews.has("orders") ? <OrdersView onOpenOrder={setModalOrder} t={t} /> : null}
          {visibleViews.has("production") ? <ProductionView statusBadge={statusBadge} t={t} /> : null}
          {visibleViews.has("my_tasks") ? <MyTasksView roleLabel={workspace.role_label} statusBadge={statusBadge} t={t} workflow={workspace.workflow} /> : null}
          {visibleViews.has("warehouse") ? <WarehouseView statusBadge={statusBadge} t={t} /> : null}
          {visibleViews.has("store") ? <StoreView t={t} /> : null}
          {visibleViews.has("finance") ? <FinanceView t={t} /> : null}
          {visibleViews.has("loyalty") ? <LoyaltyView t={t} /> : null}
          {visibleViews.has("gamification") ? <GamificationView t={t} /> : null}
          {visibleViews.has("reports") ? <ReportsView t={t} /> : null}
          {visibleViews.has("audit") ? <AuditView statusBadge={statusBadge} t={t} /> : null}
          {visibleViews.has("users") ? (
            <UsersView canManageUsers={canManageUsers} createUser={createUser} roles={roles} t={t} users={users} />
          ) : null}
          {visibleViews.has("settings") ? <SettingsView roles={roles} t={t} /> : null}
        </div>
      </div>

      {modalOrder ? <OrderModal onClose={() => setModalOrder(null)} orderId={modalOrder} onSave={() => showToast("Статус заказа обновлен")} t={t} /> : null}
      {activeModal ? <ActionModal modalType={activeModal} onClose={() => setActiveModal(null)} onSuccess={showToast} setClientsList={setClientsList} setFinanceList={setFinanceList} setMaterialsList={setMaterialsList} setOrdersList={setOrdersList} t={t} /> : null}
      {toastMessage ? <div className="toast-notification">{toastMessage}</div> : null}
    </div>
  );

  function View({ children, id }: { children: React.ReactNode; id: string }) {
    return <section className={`view ${activeView === id ? "active" : ""}`}>{children}</section>;
  }

  function DashboardView({ onOpenOrder, statusBadge, t }: { onOpenOrder: (id: string) => void; statusBadge: (s: string) => React.ReactNode; t: (k: string) => string }) {
    const attention = ordersList.filter((order) => order.dueStatus !== "ok").slice(0, 5);
    return (
      <View id="dashboard">
        <div className="view-head">
          <div><span className="eyebrow">Учредитель / директор</span><h1>{t("title_dashboard")}</h1></div>
          <div className="tag">{t("updated_today")}</div>
        </div>
        <div className="grid kpi-grid">
          {[
            [t("kpi_sales_today"), "418 000 ₸", t("delta_vs_yesterday"), "up"],
            [t("kpi_paid_today"), "356 500 ₸", t("delta_paid_sub"), "flat"],
            [t("kpi_orders_in_work"), `${ordersList.length}`, t("delta_in_prod"), "flat"],
            [t("kpi_overdue"), "3", t("delta_attn_required"), "down"],
            [t("kpi_client_debt"), "612 000 ₸", `${clientsList.length} ${t("delta_clients_cnt")}`, "flat"],
            [t("kpi_critical_stock"), `${materialsList.filter(m => m.status === 'bad').length} positions`, t("delta_below_min"), "down"],
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
            <div className="panel-head"><h3>{t("hdr_orders_attention")}</h3><span className="tag">{t("priority_tag")}</span></div>
            <table>
              <thead><tr><th>№ заказа</th><th>{t("col_client")}</th><th>{t("col_stage")}</th><th>{t("col_due")}</th><th>{t("col_amount")}</th></tr></thead>
              <tbody>
                {attention.map((order) => (
                  <tr key={order.id} onClick={() => onOpenOrder(order.id)}>
                    <td className="mono">№{order.id}</td>
                    <td>{order.client}</td>
                    <td><span className="tag">{t(orderColumns.find((column) => column.key === order.col)?.titleKey ?? "")}</span></td>
                    <td><span className={`due ${order.dueStatus}`}>{order.due}</span></td>
                    <td className="mono">{money(order.sum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <NotificationPanel statusBadge={statusBadge} t={t} />
        </div>
      </View>
    );
  }

  function CrmView({ selectedClient, setSelectedClient, t }: { selectedClient: number; setSelectedClient: (index: number) => void; t: (k: string) => string }) {
    const client = clientsList[selectedClient] ?? clientsList[0];
    return (
      <View id="crm">
        <div className="view-head">
          <div><span className="eyebrow">CRM</span><h1>{t("title_crm")}</h1></div>
          <button className="btn primary" onClick={() => setActiveModal("new_client")} type="button">{t("btn_new_client")}</button>
        </div>
        <div className="two-col">
          <div className="panel">
            <div className="panel-head"><h3>{t("hdr_client_database")}</h3><span className="tag">{clientsList.length}</span></div>
            <table>
              <thead><tr><th>{t("col_client")}</th><th>{t("col_phone")}</th><th>{t("col_orders")}</th><th>{t("col_total")}</th><th>{t("col_debt")}</th></tr></thead>
              <tbody>
                {clientsList.map((item, index) => (
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
            <div className="panel-head"><h3>{t("hdr_client_card")}</h3></div>
            {client ? (
              <div className="panel-body">
                <div className="client-card-head">
                  <div className="client-avatar">{initials(client.name)}</div>
                  <div><div className="client-row-name">{client.name}</div><div className="client-row-sub">{client.sub}</div></div>
                </div>
                <Kv label={t("col_phone")} value={client.phone} />
                <Kv label={t("col_orders")} value={String(client.orders)} />
                <Kv label={t("col_total")} value={money(client.total)} />
                <Kv danger={client.debt > 0} label={t("col_debt")} value={money(client.debt)} />
                <Kv label="Бонусный уровень" value="Gold · 18 400 бонусов" />
                <div className="card-actions">
                  <button className="btn primary" onClick={() => setModalOrder("new")} type="button">{t("btn_add_order")}</button>
                  <button className="btn ghost" onClick={() => setActiveModal("write_client")} type="button">{t("btn_write_client")}</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </View>
    );
  }

  function OrdersView({ onOpenOrder, t }: { onOpenOrder: (id: string) => void; t: (k: string) => string }) {
    return (
      <View id="orders">
        <div className="view-head">
          <div><span className="eyebrow">Управление заказами</span><h1>{t("title_orders")}</h1></div>
          <div className="head-actions">
            <button
              className={`btn ${ordersViewMode === "list" ? "primary" : "ghost"}`}
              onClick={() => setOrdersViewMode(ordersViewMode === "board" ? "list" : "board")}
              type="button"
            >
              {ordersViewMode === "board" ? t("btn_list") : t("btn_board")}
            </button>
            <button className="btn primary" onClick={() => onOpenOrder("new")} type="button">{t("btn_new_order")}</button>
          </div>
        </div>

        {ordersViewMode === "board" ? (
          <div className="board">
            {orderColumns.map((column) => {
              const items = ordersList.filter((order) => order.col === column.key);
              return (
                <div className="col" key={column.key}>
                  <div className="col-bar" style={{ background: column.color }} />
                  <div className="col-head"><h4>{t(column.titleKey)}</h4><span className="col-count">{items.length}</span></div>
                  {items.map((order) => (
                    <div className={`card-order ticket ${order.dueStatus === "late" ? "priority" : ""}`} key={order.id} onClick={() => onOpenOrder(order.id)}>
                      <TicketCorners />
                      <div className="id">№{order.id}</div>
                      <div className="title">{order.title}</div>
                      <div className="client-row-sub">{order.client}</div>
                      <div className="meta">
                        <span className={`due ${order.dueStatus}`}>{order.due}</span>
                        <span className="avatar-sm">{order.who}</span>
                      </div>
                      <div className="meta"><span /><span className="sum">{money(order.sum)}</span></div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="panel">
            <div className="panel-head"><h3>{t("hdr_all_orders")}</h3><span className="tag">{ordersList.length} всего</span></div>
            <table>
              <thead><tr><th>№</th><th>{t("col_client")}</th><th>{t("col_item_name")}</th><th>{t("col_stage")}</th><th>{t("col_due")}</th><th>{t("col_assignee")}</th><th>{t("col_amount")}</th></tr></thead>
              <tbody>
                {ordersList.map((order) => (
                  <tr key={order.id} onClick={() => onOpenOrder(order.id)}>
                    <td className="mono">№{order.id}</td>
                    <td>{order.client}</td>
                    <td>{order.title}</td>
                    <td><span className="tag">{t(orderColumns.find((c) => c.key === order.col)?.titleKey ?? "")}</span></td>
                    <td><span className={`due ${order.dueStatus}`}>{order.due}</span></td>
                    <td><span className="avatar-sm">{order.who}</span></td>
                    <td className="mono">{money(order.sum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </View>
    );
  }

  function ProductionView({ statusBadge, t }: { statusBadge: (s: string) => React.ReactNode; t: (k: string) => string }) {
    return (
      <View id="production">
        <div className="view-head"><div><span className="eyebrow">Производственный модуль</span><h1>{t("title_production")}</h1></div><div className="tag">{t("shift_today")}</div></div>
        <div className="two-col">
          <TasksPanel statusBadge={statusBadge} t={t} />
          <LoadPanel t={t} />
        </div>
      </View>
    );
  }

  function MyTasksView({ roleLabel, statusBadge, t, workflow }: { roleLabel: string; statusBadge: (s: string) => React.ReactNode; t: (k: string) => string; workflow: string[] }) {
    return (
      <View id="my_tasks">
        <div className="view-head"><div><span className="eyebrow">Ролевое рабочее место</span><h1>{roleLabel}</h1></div><div className="tag">видны только свои задачи</div></div>
        <div className="two-col">
          <TasksPanel statusBadge={statusBadge} t={t} />
          <div className="panel">
            <div className="panel-head"><h3>{t("hdr_workflow")}</h3></div>
            <div className="panel-body"><ol className="workflow-list">{workflow.map((item) => <li key={item}>{item}</li>)}</ol></div>
          </div>
        </div>
      </View>
    );
  }

  function WarehouseView({ statusBadge, t }: { statusBadge: (s: string) => React.ReactNode; t: (k: string) => string }) {
    return (
      <View id="warehouse">
        <div className="view-head">
          <div><span className="eyebrow">Складской учет</span><h1>{t("title_warehouse")}</h1></div>
          <div className="head-actions">
            <button className="btn ghost" onClick={() => setActiveModal("inventory_audit")} type="button">{t("btn_conduct_audit")}</button>
            <button className="btn primary" onClick={() => setActiveModal("add_material")} type="button">{t("btn_add_material")}</button>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><h3>{t("hdr_materials")}</h3><span className="tag">{t("tag_below_min")}</span></div>
          <MaterialsTable materialsList={materialsList} statusBadge={statusBadge} t={t} />
        </div>
      </View>
    );
  }

  function StoreView({ t }: { t: (k: string) => string }) {
    return (
      <View id="store">
        <div className="view-head">
          <div><span className="eyebrow">Магазин</span><h1>{t("title_store")}</h1></div>
          <button className="btn primary" onClick={() => setActiveModal("store_sale")} type="button">{t("btn_sale")}</button>
        </div>
        <div className="cash-cards">
          <div className="cash-card orange"><h4>{t("cash_store")}</h4><div className="amt">218 900 ₸</div><div className="sub">{t("sub_shift_open")}</div></div>
          <div className="cash-card dark"><h4>{t("sales_today")}</h4><div className="amt">106 000 ₸</div><div className="sub">{t("sub_store_sales")}</div></div>
          <div className="cash-card green"><h4>{t("stock_store")}</h4><div className="amt">312 поз.</div><div className="sub">{t("sub_store_zone")}</div></div>
        </div>
        <div className="panel"><div className="panel-head"><h3>{t("hdr_recent_store_sales")}</h3></div><FinanceTable financeList={financeList} storeOnly t={t} /></div>
      </View>
    );
  }

  function FinanceView({ t }: { t: (k: string) => string }) {
    return (
      <View id="finance">
        <div className="view-head">
          <div><span className="eyebrow">Управленческие финансы</span><h1>{t("title_finance")}</h1></div>
          <button className="btn primary" onClick={() => setActiveModal("add_payment")} type="button">{t("btn_add_payment")}</button>
        </div>
        <div className="cash-cards">
          <div className="cash-card dark"><h4>{t("cash_org")}</h4><div className="amt">1 240 300 ₸</div><div className="sub">{t("sub_start_day")}</div></div>
          <div className="cash-card orange"><h4>{t("cash_store")}</h4><div className="amt">218 900 ₸</div><div className="sub">{t("sub_shift_open")}</div></div>
          <div className="cash-card green"><h4>{t("cash_bank")}</h4><div className="amt">742 000 ₸</div><div className="sub">{t("sub_transactions_today")}</div></div>
        </div>
        <div className="two-col">
          <div className="panel"><div className="panel-head"><h3>{t("hdr_recent_operations")}</h3></div><FinanceTable financeList={financeList} t={t} /></div>
          <DebtPanel t={t} />
        </div>

        {/* Payroll Table */}
        <div className="panel" style={{ marginTop: "16px" }}>
          <div className="panel-head">
            <h3>{t("hdr_payroll")}</h3>
            <span className="tag">{t("current_month")}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>{t("col_employee")}</th>
                <th>{t("col_role")}</th>
                <th>{t("col_salary")}</th>
                <th>{t("col_bonus")}</th>
                <th>{t("col_payout")}</th>
              </tr>
            </thead>
            <tbody>
              {payroll.map((item) => (
                <tr key={item.name}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar-sm">{initials(item.name)}</div>
                      <span className="user-cell-name">{item.name}</span>
                    </div>
                  </td>
                  <td><span className="tag">{item.role}</span></td>
                  <td className="mono">{money(item.fix)}</td>
                  <td className="mono">{money(item.pct)}</td>
                  <td className="mono" style={{ fontWeight: 600 }}>{money(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </View>
    );
  }

  function LoyaltyView({ t }: { t: (k: string) => string }) {
    return (
      <View id="loyalty">
        <div className="view-head">
          <div><span className="eyebrow">Клиентская лояльность</span><h1>{t("title_loyalty")}</h1></div>
          <button className="btn primary" onClick={() => setActiveModal("loyalty_advance")} type="button">{t("btn_loyalty_advance")}</button>
        </div>
        <div className="grid kpi-grid">
          {[t("tier_silver"), t("tier_gold"), t("tier_vip")].map((value) => (
            <div className="kpi ticket" key={value}>
              <TicketCorners />
              <div className="label">{t("col_tier")}</div><div className="value">{value}</div><div className="delta flat">{t("sub_tier_limit")}</div>
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-head"><h3>{t("hdr_loyalty_balances")}</h3><span className="tag">{t("sub_bonus_rate")}</span></div>
          <table>
            <thead><tr><th>{t("col_client")}</th><th>{t("col_tier")}</th><th>{t("col_balance")}</th><th>{t("col_last_op")}</th></tr></thead>
            <tbody>
              {clientsList.slice(0, 5).map((client, index) => (
                <tr key={client.name}>
                  <td>{client.name}</td>
                  <td><span className={`badge ${index === 0 ? "good" : "neutral"}`}>{index === 0 ? "Gold" : "Silver"}</span></td>
                  <td className="mono">{money(18400 - index * 2300)}</td>
                  <td>{t("accrual_paid_order")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </View>
    );
  }

  function GamificationView({ t }: { t: (k: string) => string }) {
    return (
      <View id="gamification">
        <div className="view-head"><div><span className="eyebrow">Геймификация</span><h1>{t("hdr_leaderboard")}</h1></div><div className="tag">{t("sub_leaderboard")}</div></div>
        <div className="panel">
          <div className="panel-head"><h3>Leaderboard</h3></div>
          <div className="panel-body top-list">
            {[
              ["Гульнара С.", "Менеджер", "Продажи: 1 260 000 ₸", "148"],
              ["Бауыржан Е.", "Печатник", "0 брака · 42 задачи", "132"],
              ["Молдир К.", "Дизайнер", "Ср. согласование: 1.2 дня", "119"],
            ].map((row, index) => (
              <div className="top-row" key={row[0]}>
                <div className="client-avatar">{index + 1}</div>
                <div>
                  <b>{row[0]}</b>
                  <div className="client-row-sub">{row[1]} · {row[2]}</div>
                </div>
                <span className="mono">{row[3]} {t("points_unit")}</span>
              </div>
            ))}
          </div>
        </div>
      </View>
    );
  }

  function ReportsView({ t }: { t: (k: string) => string }) {
    return (
      <View id="reports">
        <div className="view-head">
          <div><span className="eyebrow">Отчетность</span><h1>{t("title_reports")}</h1></div>
          <div className="head-actions">
            <button className="btn ghost" onClick={() => showToast("Отчет по продажам экспортирован в Excel (.xlsx)")} type="button">{t("btn_excel")}</button>
            <button className="btn ghost" onClick={() => showToast("Печатная форма отчета сгенерирована в PDF")} type="button">{t("btn_pdf")}</button>
          </div>
        </div>
        <div className="two-col">
          <div className="panel">
            <div className="panel-head"><h3>{t("hdr_weekly_sales")}</h3></div>
            <div className="panel-body">
              <div className="chart">
                {[1180, 1420, 980, 760].map((value, index) => (
                  <div className="bar-wrap" key={value}>
                    <div className="bar-val">{value}k</div>
                    <div className="bar" style={{ height: `${(value / 1420) * 100}px` }} />
                    <div className="bar-label">Нед {index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><h3>{t("hdr_best_employees")}</h3></div>
            <div className="panel-body top-list">
              {[
                ["Гульнара С.", "Менеджер по продажам"],
                ["Бауыржан Е.", "Начальник производства"],
                ["Молдир К.", "Старший дизайнер"],
              ].map(([name, role]) => (
                <div className="top-list-item" key={name}>
                  <div className="avatar-sm">{initials(name)}</div>
                  <div>
                    <div className="user-cell-name">{name}</div>
                    <div className="client-row-sub">{role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </View>
    );
  }

  function AuditView({ statusBadge, t }: { statusBadge: (s: string) => React.ReactNode; t: (k: string) => string }) {
    const auditData = [
      ["10:42", "user.create", t("actor_sys_admin"), t("audit_desc_1"), "info"],
      ["10:18", "stock.transfer", t("actor_warehouse_head"), t("audit_desc_2"), "info"],
      ["09:55", "payment.void", t("actor_finance"), t("audit_desc_3"), "bad"],
      ["09:30", "loyalty.advance", t("actor_manager"), t("audit_desc_4"), "warn"],
      ["09:12", "order.discount", t("actor_sales_manager"), t("audit_desc_5"), "warn"],
    ];

    return (
      <View id="audit">
        <div className="view-head"><div><span className="eyebrow">Безопасность</span><h1>{t("title_audit")}</h1></div><div className="tag">удаление запрещено</div></div>
        <div className="panel">
          <div className="panel-head"><h3>{t("hdr_suspicious")}</h3></div>
          <table>
            <thead><tr><th>{t("col_time")}</th><th>{t("col_action")}</th><th>{t("col_user")}</th><th>{t("col_desc")}</th><th>{t("col_risk")}</th></tr></thead>
            <tbody>
              {auditData.map((row) => (
                <tr key={row.join("-")}>
                  <td className="mono">{row[0]}</td>
                  <td className="mono">{row[1]}</td>
                  <td>{row[2]}</td>
                  <td>{row[3]}</td>
                  <td>{statusBadge(row[4])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </View>
    );
  }

  function UsersView({ canManageUsers, createUser, roles, t, users }: { canManageUsers: boolean; createUser: (event: FormEvent<HTMLFormElement>) => void; roles: RoleOption[]; t: (k: string) => string; users: UserProfile[] }) {
    const handleScrollToCreate = () => {
      const formEl = document.getElementById("user-create-form");
      if (formEl) {
        formEl.scrollIntoView({ behavior: "smooth" });
        const input = formEl.querySelector("input");
        if (input) input.focus();
      }
    };

    return (
      <View id="users">
        <div className="view-head">
          <div><span className="eyebrow">Администрирование</span><h1>{t("title_users")}</h1></div>
          {canManageUsers ? <button className="btn primary" onClick={handleScrollToCreate} type="button">{t("btn_add_user")}</button> : null}
        </div>
        {canManageUsers ? (
          <div className="panel create-user-panel" id="user-create-form">
            <div className="panel-head"><h3>{t("hdr_create_account")}</h3><span className="tag">регистрация закрыта</span></div>
            <form className="user-form panel-body" onSubmit={createUser}>
              <input name="full_name" placeholder="ФИО / имя сотрудника" required />
              <input name="email" placeholder="Email для входа" required />
              <input name="phone" placeholder="Телефон, необязательно" />
              <input name="password" placeholder="Временный пароль" required type="password" />
              <select defaultValue="manager" name="role">
                {roles.filter((role) => role.code !== "client").map((role) => <option key={role.code} value={role.code}>{role.label}</option>)}
              </select>
              <button className="btn primary" type="submit">Создать</button>
            </form>
          </div>
        ) : null}
        <div className="panel settings-users">
          <div className="panel-head"><h3>{t("hdr_system_employees")}</h3></div>
          <table>
            <thead><tr><th>{t("col_name")}</th><th>{t("col_role")}</th><th>{t("col_login")}</th><th>{t("col_status")}</th></tr></thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar-sm">{initials(item.full_name)}</div>
                      <span className="user-cell-name">{item.full_name}</span>
                    </div>
                  </td>
                  <td><span className="tag">{roles.find((role) => role.code === item.role)?.label ?? item.role}</span></td>
                  <td className="mono">{item.email}</td>
                  <td><span className="badge good">{t("badge_active")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </View>
    );
  }

  function SettingsView({ roles, t }: { roles: RoleOption[]; t: (k: string) => string }) {
    return (
      <View id="settings">
        <div className="view-head"><div><span className="eyebrow">Системные настройки</span><h1>{t("title_settings")}</h1></div><span className="tag">этап 1</span></div>
        <div className="panel">
          <div className="panel-head"><h3>{t("access_roles")}</h3></div>
          <div className="panel-body role-grid">
            {roles.map((role) => (
              <div className="role-card" key={role.code}>
                <h5>{role.label}</h5>
                <p>{t("access_roles_desc")}</p>
              </div>
            ))}
          </div>
        </div>
      </View>
    );
  }
}

function NavGroup({ activeView, group, items, label, onNavigate, t }: { activeView: string; group: NavItem["group"]; items: NavItem[]; label: string; onNavigate: (view: string) => void; t: (k: string) => string }) {
  const groupItems = items.filter((item) => item.group === group);
  if (!groupItems.length) return null;
  return (
    <>
      <div className="nav-group-label">{label}</div>
      {groupItems.map((item) => (
        <button className={`nav-item ${activeView === item.view ? "active" : ""}`} key={`${item.key}-${item.view}`} onClick={() => onNavigate(item.view)} type="button">
          <Icon /> <span>{t(item.titleKey)}</span>{item.badge ? <span className="nav-badge">{item.badge}</span> : null}
        </button>
      ))}
    </>
  );
}

function NotificationPanel({ statusBadge, t }: { statusBadge: (s: string) => React.ReactNode; t: (k: string) => string }) {
  const notices = [
    ["warn", t("notice_1_title"), t("notice_1_sub")],
    ["bad", t("notice_2_title"), t("notice_2_sub")],
    ["good", t("notice_3_title"), t("notice_3_sub")],
    ["neutral", t("notice_4_title"), t("notice_4_sub")],
  ];

  return (
    <div className="panel">
      <div className="panel-head"><h3>{t("hdr_notifications")}</h3></div>
      <div className="panel-body notice-list">
        {notices.map(([mood, title, sub]) => (
          <div className="notice" key={title}>
            <div className="notice-badge-cell">
              {statusBadge(mood)}
            </div>
            <div className="notice-content">
              <b>{title}</b>
              <div className="client-row-sub">{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TasksPanel({ statusBadge, t }: { statusBadge: (s: string) => React.ReactNode; t: (k: string) => string }) {
  return (
    <div className="panel">
      <div className="panel-head"><h3>{t("hdr_prod_tasks")}</h3></div>
      <table>
        <thead><tr><th>Заказ</th><th>Задача</th><th>Исполнитель</th><th>Срок</th><th>Статус</th></tr></thead>
        <tbody>
          {prodTasks.map((task) => (
            <tr key={`${task.order}-${task.task}`}>
              <td className="mono">{task.order}</td>
              <td>{task.task}</td>
              <td>
                <div className="user-cell">
                  <div className="avatar-sm">{initials(task.who)}</div>
                  <span>{task.who}</span>
                </div>
              </td>
              <td>{task.due}</td>
              <td>{statusBadge(task.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoadPanel({ t }: { t: (k: string) => string }) {
  return <div className="panel"><div className="panel-head"><h3>{t("hdr_load_today")}</h3></div><div className="panel-body load-list">{[["Дизайн — Молдир К.", 70, "var(--accent)"], ["Печать — Бауыржан Е.", 92, "var(--bad)"], ["Сборка/резка — Асхат М.", 45, "var(--good)"], ["Монтаж — Ерлан Т.", 60, "var(--warn)"]].map(([label, width, color]) => <div key={String(label)}><div className="client-row-sub">{label}</div><div className="stock-bar wide"><span style={{ background: String(color), width: `${width}%` }} /></div></div>)}</div></div>;
}

function MaterialsTable({ materialsList, statusBadge, t }: { materialsList: Material[]; statusBadge: (s: string) => React.ReactNode; t: (k: string) => string }) {
  const colorMap: Record<string, string> = { good: "#1F9D6E", warn: "#C98A00", bad: "#E23B3B" };
  return (
    <table>
      <thead><tr><th>{t("col_material")}</th><th>{t("col_unit")}</th><th>{t("col_stock")}</th><th>{t("col_min_stock")}</th><th>{t("col_cost")}</th><th>{t("col_status")}</th></tr></thead>
      <tbody>
        {materialsList.map((material) => {
          const pct = Math.min(100, Math.round((material.stock / (material.min * 2)) * 100));
          return (
            <tr key={material.name}>
              <td>{material.name}</td>
              <td>{material.unit}</td>
              <td><span className="stock-bar"><span style={{ background: colorMap[material.status], width: `${pct}%` }} /></span><span className="mono">{material.stock}</span></td>
              <td className="mono">{material.min}</td>
              <td className="mono">{money(material.cost)}</td>
              <td>{statusBadge(material.status)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function FinanceTable({ financeList, storeOnly = false, t }: { financeList: FinanceRecord[]; storeOnly?: boolean; t: (k: string) => string }) {
  const rows = storeOnly ? financeList.filter((row) => row.who.includes("Магазин")) : financeList;
  return (
    <table>
      <thead><tr><th>{t("col_date")}</th><th>{t("col_order_client")}</th><th>{t("col_amount")}</th><th>{t("col_payment_method")}</th><th>{t("col_type")}</th></tr></thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.date}-${row.who}`}>
            <td>{row.date}</td>
            <td>{row.who}</td>
            <td className="mono" style={{ color: row.sum < 0 ? "var(--bad)" : "var(--good)" }}>{row.sum < 0 ? "−" : "+"}{money(Math.abs(row.sum))}</td>
            <td>{row.way}</td>
            <td><span className="tag">{row.type}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DebtPanel({ t }: { t: (k: string) => string }) {
  return <div className="panel"><div className="panel-head"><h3>{t("hdr_debtors")}</h3></div><div className="panel-body debt-list">{debts.map((debt) => <div className="debt-row" key={debt.name}><div><div className="client-row-name">{debt.name}</div><div className="client-row-sub">{debt.days} дн. просрочки</div></div><div className="mono debt-sum">{money(debt.amount)}</div></div>)}</div></div>;
}

function Kv({ danger, label, value }: { danger?: boolean; label: string; value: string }) {
  return <div className="kv"><span className="k">{label}</span><span className={`mono ${danger ? "danger-text" : ""}`}>{value}</span></div>;
}

function OrderModal({ onClose, onSave, orderId, t }: { onClose: () => void; onSave?: () => void; orderId: string; t: (k: string) => string }) {
  const stages = [
    t("step_0"), t("step_1"), t("step_2"), t("step_3"),
    t("step_4"), t("step_5"), t("step_6"), t("step_7"),
    t("step_8"), t("step_9"), t("step_10"), t("step_11")
  ];
  const [currentIdx, setCurrentIdx] = useState(orderId === "new" ? 0 : 9);

  return (
    <div className="overlay active">
      <div className="modal">
        <div className="modal-head">
          <div>
            <div className="topbar-sub mono">{orderId === "new" ? "Новый заказ" : `Заказ №${orderId}`}</div>
            <h3>Баннер 3×2 м + монтаж — ИП Ахметов Д.К.</h3>
          </div>
          <button className="modal-close" onClick={onClose} type="button">×</button>
        </div>
        <div className="modal-body">
          <div className="stepper">
            {stages.map((stage, index) => (
              <span
                className={`step ${index < currentIdx ? "done" : index === currentIdx ? "current" : ""}`}
                key={stage}
                onClick={() => setCurrentIdx(index)}
                style={{ cursor: "pointer" }}
              >
                {index + 1}. {stage}
              </span>
            ))}
          </div>
          <div className="modal-grid">
            <div>
              <div className="client-row-sub">{t("hdr_responsibles")}</div>
              <div className="tag-wrap">
                <span className="tag">Менеджер: Гульнара С.</span>
                <span className="tag">Монтажник: Ерлан Т.</span>
              </div>
            </div>
            <div>
              <div className="client-row-sub">{t("hdr_deadline")}</div>
              <div className="deadline">3 июля, 18:00 · просрочен на 1 день</div>
            </div>
          </div>
          <div className="panel modal-panel">
            <div className="panel-head"><h3>{t("hdr_order_items")}</h3></div>
            <div className="panel-body compact">
              <div className="line-item"><span>Баннер, баннерная ткань 440г, 3×2 м, люверсы</span><span className="mono">96 000 ₸</span></div>
              <div className="line-item"><span>Монтаж на фасад, выезд бригады</span><span className="mono">18 000 ₸</span></div>
              <div className="line-item total"><span>Итого</span><span className="mono">114 000 ₸</span></div>
            </div>
          </div>
          <div className="files">
            <div className="client-row-sub">{t("hdr_files")}</div>
            <span className="file-chip">tz_client.pdf</span>
            <span className="file-chip">maket_v2.png</span>
            <span className="file-chip">maket_v3_final.png</span>
          </div>
          <div className="card-actions" style={{ justifyContent: "flex-end", marginTop: "14px" }}>
            <button className="btn ghost" onClick={onClose} type="button">{t("btn_cancel")}</button>
            <button
              className="btn primary"
              onClick={() => {
                if (onSave) onSave();
                onClose();
              }}
              type="button"
            >
              {t("btn_save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionModal({
  modalType,
  onClose,
  onSuccess,
  setClientsList,
  setFinanceList,
  setMaterialsList,
  setOrdersList,
  t,
}: {
  modalType: ModalType;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  setClientsList: React.Dispatch<React.SetStateAction<Client[]>>;
  setFinanceList: React.Dispatch<React.SetStateAction<FinanceRecord[]>>;
  setMaterialsList: React.Dispatch<React.SetStateAction<Material[]>>;
  setOrdersList: React.Dispatch<React.SetStateAction<Order[]>>;
  t: (k: string) => string;
}) {
  const [name, setName] = useState("");
  const [sub, setSub] = useState("");
  const [phone, setPhone] = useState("+7 70");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (modalType === "new_client") {
      setClientsList((prev) => [
        { name: name || "Новый Клиент", sub: sub || "Новая компания", phone: phone || "+7 700 000 0000", orders: 0, total: 0, debt: 0 },
        ...prev,
      ]);
      onSuccess(`Клиент «${name || "Новый Клиент"}» успешно добавлен`);
    } else if (modalType === "write_client") {
      onSuccess("Сообщение успешно отправлено клиенту");
    } else if (modalType === "inventory_audit") {
      onSuccess("Ревизия склада успешно зафиксирована");
    } else if (modalType === "add_material") {
      setMaterialsList((prev) => [
        ...prev,
        { name: name || "Новый материал", unit: "шт", stock: Number(amount) || 50, min: 10, cost: 5000, status: "good" },
      ]);
      onSuccess(`Приход материала «${name || "Материал"}» оформлен`);
    } else if (modalType === "store_sale") {
      const sumVal = Number(amount) || 15000;
      setFinanceList((prev) => [{ date: "03.07", who: `Магазин · розница (${name || "Товары"})`, sum: sumVal, way: "Наличные/QR", type: "приход" }, ...prev]);
      onSuccess(`Продажа магазина на сумму ${money(sumVal)} зафиксирована`);
    } else if (modalType === "add_payment") {
      const sumVal = Number(amount) || 50000;
      setFinanceList((prev) => [{ date: "03.07", who: name || "Оплата клиента", sum: sumVal, way: "Банк/QR", type: "приход" }, ...prev]);
      onSuccess(`Оплата на сумму ${money(sumVal)} зарегистрирована`);
    } else if (modalType === "loyalty_advance") {
      onSuccess(`Бонусный аванс для клиента ${name || "клиента"} успешно начислен`);
    }
    onClose();
  };

  const getTitle = () => {
    switch (modalType) {
      case "new_client": return t("btn_new_client");
      case "write_client": return t("btn_write_client");
      case "inventory_audit": return t("btn_conduct_audit");
      case "add_material": return t("btn_add_material");
      case "store_sale": return t("btn_sale");
      case "add_payment": return t("btn_add_payment");
      case "loyalty_advance": return t("btn_loyalty_advance");
      default: return "";
    }
  };

  return (
    <div className="overlay active">
      <div className="modal">
        <div className="modal-head">
          <h3>{getTitle()}</h3>
          <button className="modal-close" onClick={onClose} type="button">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {modalType === "new_client" && (
              <div className="form-row-3">
                <label className="modal-label">
                  <span>Название / ФИО клиента</span>
                  <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="ИП Иванов А.Б." />
                </label>
                <label className="modal-label">
                  <span>Деятельность / описание</span>
                  <input value={sub} onChange={(e) => setSub(e.target.value)} placeholder="торговая сеть" />
                </label>
                <label className="modal-label">
                  <span>Телефон</span>
                  <input required value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
              </div>
            )}

            {modalType === "write_client" && (
              <>
                <label className="modal-label">
                  <span>Способ связи</span>
                  <select>
                    <option>WhatsApp (+7 701 220 4411)</option>
                    <option>Telegram</option>
                    <option>SMS</option>
                  </select>
                </label>
                <label className="modal-label">
                  <span>Текст сообщения</span>
                  <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Здравствуйте! Ваш заказ готов к выдаче..." required />
                </label>
              </>
            )}

            {modalType === "inventory_audit" && (
              <>
                <label className="modal-label">
                  <span>Сектор склада</span>
                  <select><option>Главный склад</option><option>Цех производства</option><option>Магазин</option></select>
                </label>
                <label className="modal-label">
                  <span>Примечания к ревизии</span>
                  <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Все остатки пересчитаны..." />
                </label>
              </>
            )}

            {modalType === "add_material" && (
              <div className="form-row-3" style={{ gridTemplateColumns: "2fr 1fr" }}>
                <label className="modal-label">
                  <span>Наименование материала</span>
                  <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Пленка Oracal 641" />
                </label>
                <label className="modal-label">
                  <span>Количество прихода</span>
                  <input required type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50" />
                </label>
              </div>
            )}

            {(modalType === "store_sale" || modalType === "add_payment") && (
              <div className="form-row-3" style={{ gridTemplateColumns: "2fr 1fr" }}>
                <label className="modal-label">
                  <span>Наименование / Клиент</span>
                  <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="ООО Компания / Чек №104" />
                </label>
                <label className="modal-label">
                  <span>Сумма (₸)</span>
                  <input required type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="25000" />
                </label>
              </div>
            )}

            {modalType === "loyalty_advance" && (
              <div className="form-row-3" style={{ gridTemplateColumns: "2fr 1fr" }}>
                <label className="modal-label">
                  <span>Клиент</span>
                  <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="ИП Ахметов Д.К." />
                </label>
                <label className="modal-label">
                  <span>Количество бонусов</span>
                  <input required type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000" />
                </label>
              </div>
            )}

            <div className="card-actions" style={{ justifyContent: "flex-end", marginTop: "10px" }}>
              <button className="btn ghost" onClick={onClose} type="button">{t("btn_cancel")}</button>
              <button className="btn primary" type="submit">{t("btn_confirm")}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
