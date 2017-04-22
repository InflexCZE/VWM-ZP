# VWM - Colaborative filtering

## Configuration
Create /.env file:
```
NODE_ENV=development
DATABASE_URL=postgres://{USER}:{PASS}@127.0.0.1:5432/{DB}
```

## Installation
1. Install node@7.9.0 & npm
2. `npm install`
3. To initialize DB schema: `npm run db:migrate`

## Running
1. `npm run build:watch`
2. `npm run server:watch`
3. Open http://localhost:1337
