from app.models.enums import RoleCode


ROLE_LABELS: dict[RoleCode, str] = {
    RoleCode.OWNER: "Начальник / учредитель",
    RoleCode.ADMIN: "Администратор",
    RoleCode.WAREHOUSE_MANAGER: "Заведующий складом",
    RoleCode.MANAGER: "Менеджер",
    RoleCode.DESIGNER: "Дизайнер",
    RoleCode.PRODUCTION: "Печатник / производство",
    RoleCode.INSTALLER: "Монтажник",
    RoleCode.STORE_CASHIER: "Магазин / кассир",
    RoleCode.FINANCE: "Финансы",
    RoleCode.CLIENT: "Клиент",
}

MODULES = {
    "dashboard": "Отчет дня",
    "crm": "CRM",
    "orders": "Заказы",
    "production": "Производство",
    "my_tasks": "Мои задачи",
    "inventory": "Склад",
    "store": "Магазин",
    "payments": "Оплаты",
    "loyalty": "Бонусы клиентов",
    "gamification": "Рейтинг",
    "reports": "Отчеты",
    "audit": "Аудит",
    "users": "Пользователи",
    "settings": "Настройки",
}

ROLE_MODULES: dict[RoleCode, list[str]] = {
    RoleCode.OWNER: [
        "dashboard",
        "crm",
        "orders",
        "production",
        "inventory",
        "store",
        "payments",
        "loyalty",
        "gamification",
        "reports",
        "audit",
        "users",
        "settings",
    ],
    RoleCode.ADMIN: ["dashboard", "crm", "orders", "inventory", "audit", "users", "settings"],
    RoleCode.WAREHOUSE_MANAGER: ["dashboard", "inventory", "orders", "audit", "reports"],
    RoleCode.MANAGER: ["dashboard", "crm", "orders", "payments", "loyalty"],
    RoleCode.DESIGNER: ["my_tasks", "orders", "gamification"],
    RoleCode.PRODUCTION: ["my_tasks", "production", "inventory", "gamification"],
    RoleCode.INSTALLER: ["my_tasks", "orders", "gamification"],
    RoleCode.STORE_CASHIER: ["store", "payments", "inventory"],
    RoleCode.FINANCE: ["dashboard", "payments", "reports", "audit"],
    RoleCode.CLIENT: ["orders", "loyalty"],
}

ROLE_WORKFLOWS: dict[RoleCode, list[str]] = {
    RoleCode.OWNER: [
        "Контролирует день: заказы, оплаты, долги, складские движения, бонусы и подозрительные операции.",
        "Подтверждает сверхнормативные списания, ручные скидки и бонусные авансы.",
        "Смотрит рейтинг сотрудников и управленческие отчеты.",
    ],
    RoleCode.ADMIN: [
        "Создает учетные записи и назначает роли.",
        "Настраивает справочники, статусы, права и системные параметры.",
        "Следит за аудитом доступа и активностью пользователей.",
    ],
    RoleCode.WAREHOUSE_MANAGER: [
        "Принимает товар на главный склад.",
        "Перемещает товар в производство/офис или магазин.",
        "Фиксирует кто запросил, кто выдал и кто принял товар.",
        "Проводит ревизии и подтверждает складские расхождения.",
    ],
    RoleCode.MANAGER: [
        "Ведет клиентов и создает заказы.",
        "Передает задачи дизайнеру и производству.",
        "Контролирует согласование, оплату, долг и выдачу заказа.",
    ],
    RoleCode.DESIGNER: [
        "Видит только свои задачи и дедлайны.",
        "Скачивает файлы клиента, загружает версии макетов.",
        "Отправляет макет на согласование и получает правки.",
    ],
    RoleCode.PRODUCTION: [
        "Видит очередь работ и техническое задание.",
        "Фиксирует старт, готовность, брак и фактическое время.",
        "Видит только материалы, нужные для работы, без финансов заказа.",
    ],
    RoleCode.INSTALLER: [
        "Видит адрес, контакт клиента и чек-лист монтажа.",
        "Отмечает выезд, завершение и загружает фотоотчет.",
    ],
    RoleCode.STORE_CASHIER: [
        "Продает товары магазина и ведет кассу магазина.",
        "Видит только остатки магазина.",
        "Оформляет возвраты по правилам.",
    ],
    RoleCode.FINANCE: [
        "Контролирует оплаты, долги, возвраты и кассы.",
        "Готовит управленческие отчеты и расчетные данные.",
    ],
    RoleCode.CLIENT: [
        "Создает заявки, смотрит статусы и бонусы.",
        "Загружает файлы и согласует макеты.",
    ],
}


def role_workspace(role: RoleCode) -> dict:
    module_keys = ROLE_MODULES[role]
    return {
        "role": role.value,
        "role_label": ROLE_LABELS[role],
        "modules": [{"key": key, "title": MODULES[key]} for key in module_keys],
        "workflow": ROLE_WORKFLOWS[role],
    }
