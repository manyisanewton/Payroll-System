# Wallet & Payments API

A small NestJS API where customers own wallets, can deposit funds, and can transfer money to other wallets. Money is stored as integer minor units, so `1250` means `$12.50` for a USD wallet.

## Setup

```bash
npm install
npm run start:dev
```

The API listens on `http://localhost:3000` by default and creates `wallet.sqlite` in the project root.

```bash
npm test
npm run build
```

Optional environment variables:

```bash
PORT=3000
DATABASE_PATH=wallet.sqlite
```

## Architecture

- `CustomersModule` creates customers and their wallet in one transaction, and fetches a customer with wallet balance.
- `WalletsModule` handles deposits and wallet ledger listing.
- `TransfersModule` owns wallet-to-wallet transfers and transfer lookup.
- `common/errors` contains the shared API error shape, custom business exceptions, and a global exception filter.

The API uses Nest controllers for REST endpoints, services for business rules, TypeORM repositories for normal reads, and `DataSource.transaction()` for money movement.

## Endpoints

- `POST /customers` creates a customer and wallet.
- `GET /customers/:id` fetches a customer with wallet.
- `POST /wallets/:id/deposits` deposits funds into a wallet.
- `POST /transfers` transfers funds between wallets.
- `GET /transfers/:id` fetches one transfer.
- `GET /wallets/:id/transactions?page=1&limit=20` lists wallet ledger rows.

## Schema

`customers`

- `id` UUID primary key.
- `name` and unique `email`.
- timestamps for auditability.

`wallets`

- `id` UUID primary key.
- `customerId` unique foreign key because each customer has exactly one wallet.
- `balanceMinorUnits` integer with a database check preventing negative balances.
- `currency` ISO-like 3-letter code, default `USD`.
- timestamps.

`wallet_transactions`

- `id` UUID primary key.
- `type` as `DEPOSIT` or `TRANSFER`.
- `amountMinorUnits` integer.
- `currency`.
- nullable `sourceWalletId` for deposits.
- nullable `destinationWalletId`.
- `description`.
- `createdAt`.
- indexes on `(sourceWalletId, createdAt)` and `(destinationWalletId, createdAt)` for wallet transaction history.

## Database Choice

SQLite with TypeORM keeps local setup very small: no external database process is needed, and reviewers can run the service after `npm install`. TypeORM was chosen for its Nest integration, repository APIs, schema decorators, and explicit transaction API.

`synchronize: true` is enabled because this is a small assessment project meant to run locally. In a production service, this would be replaced with migrations.

## Money Representation

Balances and transaction amounts are stored as integer minor units. This avoids floating-point rounding errors and keeps comparisons like insufficient-funds checks exact.

## Transactions

Transfers run inside `dataSource.transaction()`. The service:

1. Loads both wallets.
2. Rejects missing wallets, self-transfers, and currency mismatches.
3. Debits the source wallet with a conditional update requiring `balanceMinorUnits >= amount`.
4. Credits the destination wallet.
5. Inserts the transfer ledger row.

If any step throws, TypeORM rolls the transaction back. Jest covers successful transfer, insufficient funds, currency mismatch, and a forced throw inside a transaction callback to verify no balances or ledger rows are persisted.

## Error Handling

Every error response uses the same shape:

```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Source wallet has insufficient funds.",
    "statusCode": 422
  }
}
```

Validation errors return `400` and include the offending field:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "statusCode": 400,
    "fields": {
      "amountMinorUnits": ["amountMinorUnits must not be less than 1"]
    }
  }
}
```

Not found errors return `404`. Business rule failures return specific codes such as `INSUFFICIENT_FUNDS`, `SELF_TRANSFER_NOT_ALLOWED`, and `CURRENCY_MISMATCH`. Unexpected errors return a safe `500` without stack traces, SQL, or internal paths.

## Sample Requests

Create a customer:

```bash
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","currency":"USD"}'
```

Deposit funds:

```bash
curl -X POST http://localhost:3000/wallets/<wallet-id>/deposits \
  -H "Content-Type: application/json" \
  -d '{"amountMinorUnits":5000,"description":"Initial funding"}'
```

Successful transfer:

```bash
curl -X POST http://localhost:3000/transfers \
  -H "Content-Type: application/json" \
  -d '{"sourceWalletId":"<source-wallet-id>","destinationWalletId":"<destination-wallet-id>","amountMinorUnits":1250,"description":"Lunch"}'
```

Failed transfer due to insufficient funds:

```bash
curl -X POST http://localhost:3000/transfers \
  -H "Content-Type: application/json" \
  -d '{"sourceWalletId":"<source-wallet-id>","destinationWalletId":"<destination-wallet-id>","amountMinorUnits":999999}'
```

List wallet transactions:

```bash
curl "http://localhost:3000/wallets/<wallet-id>/transactions?page=1&limit=20"
```

The transaction list includes full ledger `items` plus table-ready `rows`:

```json
{
  "rows": [
    {
      "type": "TRANSFER",
      "amount": 1250,
      "currency": "USD",
      "description": "Lunch",
      "createdAt": "2026-05-28T18:21:22.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

## Trade-offs And Assumptions

- No auth is included because the brief explicitly excludes it.
- Each customer gets exactly one wallet at creation time.
- Wallets default to `USD`, but another 3-letter currency may be chosen at customer creation.
- Cross-currency transfers are rejected rather than converted.
- SQLite is suitable for this local exercise. A production wallet service would likely use PostgreSQL with row-level locks, idempotency keys, request tracing, and a migration workflow.

## Given Another Day

- Add idempotency keys for deposits and transfers.
- Add database migrations instead of `synchronize`.
- Add OpenAPI documentation.
- Add end-to-end controller tests for the error response contract.
- Add structured logging and request correlation IDs.
# wallet-payments-api
