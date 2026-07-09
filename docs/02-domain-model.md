# CtandART ERP - доменная модель

## Главная идея

Заказ клиента - центральная сущность. Все вокруг заказа:

- клиент;
- позиции заказа;
- дизайн/макеты;
- производственные задачи;
- материалы;
- списания;
- оплаты;
- бонусы;
- документы;
- аудит;
- итоговая маржа;
- вклад сотрудников.

## Сущности

```mermaid
erDiagram
  CLIENT ||--o{ ORDER : places
  CLIENT ||--o{ LOYALTY_LEDGER : has
  ORDER ||--o{ ORDER_ITEM : contains
  ORDER ||--o{ PRODUCTION_TASK : creates
  ORDER ||--o{ PAYMENT : paid_by
  ORDER ||--o{ STOCK_MOVEMENT : consumes
  ORDER ||--o{ ORDER_FILE : stores
  WAREHOUSE_ZONE ||--o{ STOCK_BALANCE : has
  MATERIAL ||--o{ STOCK_BALANCE : counted_as
  MATERIAL ||--o{ STOCK_MOVEMENT : moved_as
  USER ||--o{ PRODUCTION_TASK : assigned
  USER ||--o{ AUDIT_LOG : performs
  USER ||--o{ GAMIFICATION_EVENT : earns
```

## Роли

- OWNER: руководитель/учредитель.
- ADMIN: администратор системы.
- WAREHOUSE_MANAGER: завсклад.
- MANAGER: менеджер.
- DESIGNER: дизайнер.
- PRODUCTION: печатник/производство.
- INSTALLER: монтажник.
- STORE_CASHIER: магазин/кассир.
- FINANCE: финансист/управленческий учет.
- CLIENT: клиентский кабинет.

## Складские зоны

- MAIN: главный склад.
- PRODUCTION: производство/офис.
- STORE: магазин.

## Типы складских движений

- RECEIPT: приход на главный склад.
- TRANSFER: перемещение между зонами.
- RESERVE: резерв под заказ.
- RELEASE_RESERVE: снятие резерва.
- ISSUE_TO_ORDER: списание на заказ.
- RETURN: возврат.
- WASTE: списание брака/порчи.
- INVENTORY_ADJUSTMENT: корректировка по ревизии.

## Типы подозрительных операций

- Ручная скидка.
- Изменение цены после создания.
- Отмена оплаты.
- Списание без заказа.
- Сверхнормативное списание.
- Бонусный аванс.
- Ручная корректировка бонусов.
- Корректировка склада.
- Возврат денег.
