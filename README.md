
# Money Manager API

[![License](https://img.shields.io/github/license/saluki/nestjs-template.svg)](https://github.com/saluki/nestjs-template/blob/master/LICENSE)

A comprehensive budget management REST API built with NestJS 10, inspired by Google Sheets' Monthly and Annual Budget templates.

## Features

- **User Management**: JWT-based authentication for secure access
- **Budget Management**: Create and manage monthly and annual budgets with automatic synchronization
  - Monthly budgets automatically update annual summaries
  - Annual budget adjustments can be propagated to monthly budgets
- **Category Management**: Organize expenses with categories and subcategories
  - Support for hierarchical category structure
  - Parent-child relationships for flexible grouping
- **Transaction Tracking**: Record actual spending and compare against budgets
  - Aggregate spending by category
  - Budget vs. actual comparison reports
- **REST API**: Fast API with [Fastify](https://fastify.dev/)
- **Database ORM**: [Prisma](https://www.prisma.io/) for type-safe database access
- **API Documentation**: Auto-generated Swagger documentation
- **Docker Support**: Ready for containerized environments

## 1. Getting started

### 1.1 Requirements

Before starting, make sure you have at least those components on your workstation:

- An up-to-date release of [NodeJS](https://nodejs.org/) such as 20.x and NPM
- A PostgreSQL database. You may use the provided `docker-compose.yml` file.

[Docker](https://www.docker.com/) may also be useful for advanced testing and image building, although it is not required for development.

### 1.2 Project configuration

Install all the dependencies of the project:

```sh
npm install
```

Once the dependencies are installed, configure your project by creating a new `.env` file containing the environment variables:

```sh
cp .env.example .env
```

For a standard development configuration, you can leave the default values for `API_PORT`, `API_PREFIX` and `API_CORS` under the `Api configuration` section. The `SWAGGER_ENABLE` rule allows you to control the Swagger documentation module for NestJS. Leave it to `1` when starting this example.

Configure the `DATABASE_URL` according to your own database setup.

Define a `JWT_SECRET` to sign the JWT tokens or leave the default value in a development environment. Update the `JWT_ISSUER` to the correct value.

### 1.3 Database Setup

If you have Docker installed, you can start a PostgreSQL database using:

```sh
docker-compose up -d
```

Then run the Prisma migrations:

```sh
npx prisma migrate dev
```

### 1.4 Launch and discover

You are now ready to launch the NestJS application:

```sh
# Launch the development server with TSNode
npm run dev
```

You can now head to `http://localhost:3000/docs` and see your API Swagger docs.

## 2. API Endpoints

### Authentication

- `POST /api/v1/users/register` - Register a new user
- `POST /api/v1/users/login` - Login and receive JWT token

### Users

- `GET /api/v1/users` - Get all users (requires authentication)

### Categories

- `GET /api/v1/categories` - Get all categories for authenticated user
- `GET /api/v1/categories/:id` - Get a specific category
- `POST /api/v1/categories` - Create a new category (can specify parentId for subcategories)
- `PUT /api/v1/categories/:id` - Update a category
- `DELETE /api/v1/categories/:id` - Delete a category

### Budgets

- `GET /api/v1/budgets` - Get all budgets (supports filtering by year and type)
- `GET /api/v1/budgets/:id` - Get a specific budget
- `GET /api/v1/budgets/comparison` - Compare budgeted vs actual spending
- `POST /api/v1/budgets` - Create a new budget (MONTHLY or ANNUAL)
- `PUT /api/v1/budgets/:id` - Update a budget (triggers auto-sync)
- `DELETE /api/v1/budgets/:id` - Delete a budget

### Transactions

- `GET /api/v1/transactions` - Get all transactions (supports filtering)
- `GET /api/v1/transactions/:id` - Get a specific transaction
- `GET /api/v1/transactions/aggregated` - Get aggregated spending by category
- `POST /api/v1/transactions` - Create a new transaction
- `PUT /api/v1/transactions/:id` - Update a transaction
- `DELETE /api/v1/transactions/:id` - Delete a transaction

### Budget Synchronization

The API automatically synchronizes monthly and annual budgets:
- When monthly budgets are created or updated, the corresponding annual budget is automatically updated to reflect the sum of all monthly budgets for that year and category
- This ensures consistency between monthly planning and annual summaries
- Both monthly and annual budgets can be independently managed while maintaining synchronization

## 3. Project structure

This project follows a well-defined modular directory structure:

```sh
src/
├── modules
│   ├── app.module.ts
│   ├── common/          # Shared pipes, guards, services and providers
│   ├── user/            # User management and JWT authentication
│   │   ├── controller/
│   │   ├── service/
│   │   ├── model/
│   │   └── spec/
│   ├── category/        # Category and subcategory management
│   │   ├── controller/
│   │   ├── service/
│   │   ├── model/
│   │   └── spec/
│   ├── budget/          # Budget management with monthly/annual sync
│   │   ├── controller/
│   │   ├── service/
│   │   ├── model/
│   │   └── spec/
│   ├── transaction/     # Transaction tracking and aggregation
│   │   ├── controller/
│   │   ├── service/
│   │   ├── model/
│   │   └── spec/
│   └── tokens.ts
└── server.ts
```

## 4. Default NPM commands

The NPM commands below are already included with this template and can be used to quickly run, build and test your project.

```sh
# Start the application using the transpiled NodeJS
npm run start

# Run the application using "ts-node"
npm run dev

# Transpile the TypeScript files
npm run build

# Run the project' functional tests
npm run test

# Lint the project files using TSLint
npm run lint
```

## 5. Healthcheck support

A healthcheck API is a REST endpoint that can be used to validate the status of the service along with its dependencies. The healthcheck API endpoint internally triggers an overall health check of the service. This can include database connection checks, system properties, disk availability and memory availability.

The example healthcheck endpoint can be request with the token located in the `HEALTH_TOKEN` environment variable.

```sh
curl -H 'Authorization: Bearer ThisMustBeChanged' http://localhost:3000/api/v1/health
```

## 6. Project goals

The goal of this project is to provide a comprehensive budget management API that enables users to:
- Track monthly and annual budgets with automatic synchronization
- Organize expenses using categories and subcategories
- Record transactions and compare actual spending against budgets
- Manage financial data securely with JWT authentication

This implementation is inspired by Google Sheets' Monthly and Annual Budget templates, bringing spreadsheet-like budget management capabilities to a REST API.

## 7. Contributing

Feel free to suggest an improvement, report a bug, or ask something through the project's issue tracker.
