# CtandART ERP - контур API

## Auth

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## Users & roles

- `GET /api/v1/users`
- `POST /api/v1/users`
- `PATCH /api/v1/users/{id}`
- `GET /api/v1/roles`
- `PATCH /api/v1/users/{id}/roles`

## CRM

- `GET /api/v1/clients`
- `POST /api/v1/clients`
- `GET /api/v1/clients/{id}`
- `PATCH /api/v1/clients/{id}`
- `GET /api/v1/clients/{id}/orders`
- `GET /api/v1/clients/{id}/loyalty`

## Orders

- `GET /api/v1/orders`
- `POST /api/v1/orders`
- `GET /api/v1/orders/{id}`
- `PATCH /api/v1/orders/{id}`
- `POST /api/v1/orders/{id}/items`
- `POST /api/v1/orders/{id}/status`
- `POST /api/v1/orders/{id}/files`
- `POST /api/v1/orders/{id}/discount`

## Production

- `GET /api/v1/production/tasks`
- `POST /api/v1/production/tasks`
- `PATCH /api/v1/production/tasks/{id}`
- `POST /api/v1/production/tasks/{id}/start`
- `POST /api/v1/production/tasks/{id}/complete`
- `POST /api/v1/production/tasks/{id}/defect`

## Inventory

- `GET /api/v1/inventory/materials`
- `POST /api/v1/inventory/materials`
- `GET /api/v1/inventory/zones`
- `GET /api/v1/inventory/balances`
- `POST /api/v1/inventory/receipts`
- `POST /api/v1/inventory/transfers`
- `POST /api/v1/inventory/issues`
- `POST /api/v1/inventory/adjustments`
- `GET /api/v1/inventory/movements`

## Payments

- `POST /api/v1/payments`
- `POST /api/v1/payments/{id}/void`
- `GET /api/v1/cashboxes`
- `POST /api/v1/day-close`

## Loyalty

- `GET /api/v1/loyalty/clients/{client_id}`
- `POST /api/v1/loyalty/accruals`
- `POST /api/v1/loyalty/redemptions`
- `POST /api/v1/loyalty/advances`
- `GET /api/v1/loyalty/tiers`

## Gamification

- `GET /api/v1/gamification/leaderboard`
- `GET /api/v1/gamification/events`
- `POST /api/v1/gamification/rules`

## Reports

- `GET /api/v1/reports/daily`
- `GET /api/v1/reports/orders`
- `GET /api/v1/reports/inventory`
- `GET /api/v1/reports/employees`
- `GET /api/v1/reports/suspicious-actions`

## Audit

- `GET /api/v1/audit`
- `GET /api/v1/audit/{entity_type}/{entity_id}`
