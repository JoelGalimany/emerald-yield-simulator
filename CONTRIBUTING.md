# Contributing Guide for AI

This document provides guidelines for AI assistants contributing to the Emerald Yield Simulator project.

## Project Overview

**Purpose**: Net yield and rental return simulator for property investment analysis

**Tech Stack**: 
- Node.js (v20+)
- Express.js 5.x
- MongoDB (Mongoose)
- EJS templates
- Bootstrap 5
- Docker & Docker Compose

## Architecture

### MVC Pattern

- **Models** (`src/models/`): Mongoose schemas
- **Views** (`src/views/`): EJS templates
- **Controllers** (`src/controllers/`): Request handlers (HTTP only)
- **Services** (`src/services/`): Business logic
- **Routes** (`src/routes/`): Route definitions
- **Middleware** (`src/middleware/`): Express middleware

### Key Principles

1. **Separation of Concerns**: Controllers handle HTTP, services handle business logic
2. **DRY**: Don't repeat yourself - extract shared logic to services/utilities
3. **Error Handling**: Use `asyncHandler` wrapper, errors propagate to `errorHandler` middleware
4. **Logging**: Use centralized logger from `src/utils/logger.js` (not console.log)
5. **Validation**: Server-side with `express-validator`, client-side with HTML5 attributes

## Code Style

### JavaScript

- Use `async/await` for asynchronous operations
- Use `const` by default, `let` when reassignment needed
- Use arrow functions for callbacks
- JSDoc comments for all public functions
- No `console.log/error/warn` - use logger utility

### Error Handling

```javascript
// ✅ CORRECT: Use asyncHandler
const myFunction = asyncHandler(async (req, res) => {
    const data = await someService.getData();
    res.render('view', { data });
});

// ❌ WRONG: Manual try-catch in controllers
async function myFunction(req, res) {
    try {
        const data = await someService.getData();
        res.render('view', { data });
    } catch (error) {
        // Don't do this - asyncHandler handles it
    }
}
```

### Service Layer

```javascript
// ✅ CORRECT: Service throws errors, controller uses asyncHandler
async function getData(id) {
    validateObjectId(id);
    const data = await Model.findById(id);
    if (!data) {
        throw new Error('Not found');
    }
    return data;
}

// Controller
const getData = asyncHandler(async (req, res) => {
    const data = await service.getData(req.params.id);
    res.json(data);
});
```

## File Structure Guidelines

### Controllers (`src/controllers/`)

- **Purpose**: Handle HTTP requests/responses only
- **Should**: Use `asyncHandler`, call services, render views
- **Should NOT**: Contain business logic, database queries directly

### Services (`src/services/`)

- **Purpose**: Business logic, data processing, external API calls
- **Should**: Contain all business rules, calculations, data transformations
- **Should NOT**: Handle HTTP requests/responses

### Middleware (`src/middleware/`)

- **Purpose**: Request processing, validation, error handling
- **Examples**: `asyncHandler`, `errorHandler`, `rateLimiter`, `pagination`, `filters`

### Utils (`src/utils/`)

- **Purpose**: Pure utility functions, helpers
- **Examples**: `helpers.js` (formatting), `validators.js` (validation), `logger.js` (logging)

### Models (`src/models/`)

- **Purpose**: Mongoose schemas only
- **Should**: Define schema, indexes, validations
- **Should NOT**: Contain business logic

## Common Tasks

### Adding a New Route

1. Create controller function in appropriate controller file
2. Use `asyncHandler` wrapper
3. Add route in `src/routes/` file
4. Apply middleware (validation, rate limiting) as needed

### Adding a New Service

1. Create service file in `src/services/`
2. Export functions that can be used by controllers
3. Throw errors (don't catch unless transforming)
4. Use logger for logging

### Adding Validation

1. Use `express-validator` in route definition
2. Check `validationResult` in controller
3. Return formatted errors to view

### Adding a New View

1. Create EJS file in `src/views/`
2. Use layout from `layout.ejs`
3. Use helpers from `app.locals` (formatCurrency, formatNumber, formatDate)
4. Follow Bootstrap 5 structure

## Constants and Configuration

### Where to Put Constants

- **Application constants**: `src/config/constants.js`
- **Environment variables**: `.env` file (not committed)
- **Magic numbers**: Extract to constants, don't hardcode

### Current Constants

- `SIMULATION_DEFAULTS`: Years, locale, currency
- `COMMISSION_RATES`: Year 1, 2, default rates
- `VALIDATION_LIMITS`: Email, price limits
- `PAGINATION`: Default page, limit, max limit
- `DATASET_CONFIG`: Google Drive file ID, cache duration
- `PREDICTION_CONFIG`: Days per month, price margin

## Database

### Mongoose Models

- Use Mongoose schemas in `src/models/`
- Add indexes for frequently queried fields
- Use `.lean()` for read-only queries (performance)
- Validate ObjectId format before queries

### Queries

```javascript
// ✅ CORRECT: Use lean() for read-only
const simulation = await Simulation.findById(id).lean();

// ✅ CORRECT: Validate ObjectId first
validateObjectId(id);
const simulation = await Simulation.findById(id);
```

## Testing Considerations

While tests are not yet implemented, when adding features:

- Services should be easily testable (pure functions when possible)
- Controllers should be thin (easy to mock)
- Avoid side effects in business logic

## Error Handling Flow

1. **Service throws error** → 
2. **asyncHandler catches** → 
3. **Calls next(error)** → 
4. **errorHandler middleware processes** → 
5. **Renders appropriate error view**

## Logging Guidelines

```javascript
// ✅ CORRECT: Use logger
const logger = require('../utils/logger');

logger.info('Operation successful', { data });
logger.warn('Warning message', { context });
logger.error('Error occurred', error, { context });
logger.debug('Debug info', { details }); // Only in development
```

## View Helpers

Available in all views via `app.locals`:

- `formatCurrency(value, locale, currency)`: Format as currency
- `formatNumber(value, locale)`: Format number
- `formatDate(date, locale, options)`: Format date
- `locale`: Default locale
- `currency`: Default currency

## Dataset Handling

- Dataset is auto-downloaded from Google Drive
- Cached for 24 hours
- Located in `data/dataset.csv`
- Loaded at startup via `initializeDataset()`
- Use `getDatasetStats()` to get cached statistics
- Use `loadDataset()` to load full dataset

## Security Considerations

- Always validate user input
- Use `express-validator` for validation
- Use rate limiting on public endpoints
- Never expose sensitive data in logs
- Use parameterized queries (Mongoose handles this)

## Performance

- Cache dataset in memory (already implemented)
- Use `.lean()` for read-only queries
- Use indexes on frequently queried fields
- Use `Promise.all()` for parallel operations
- Avoid N+1 queries

## Git Workflow

- Create feature branches from `main`
- Use descriptive commit messages
- Follow conventional commits when possible
- Create pull requests for review

## Common Patterns

### Controller Pattern

```javascript
const asyncHandler = require('../middleware/asyncHandler');
const { myService } = require('../services/myService');

const myController = asyncHandler(async (req, res) => {
    const data = await myService.getData(req.params.id);
    res.render('view', { data });
});
```

### Service Pattern

```javascript
const Model = require('../models/Model');
const { validateObjectId } = require('../utils/validators');
const logger = require('../utils/logger');

async function getData(id) {
    validateObjectId(id);
    const data = await Model.findById(id).lean();
    if (!data) {
        const error = new Error('Data not found');
        error.statusCode = 404;
        throw error;
    }
    return data;
}
```

### Middleware Pattern

```javascript
function myMiddleware(req, res, next) {
    // Process request
    req.processedData = process(req);
    next();
}
```

## Questions to Ask Before Making Changes

1. **Is this business logic?** → Put in service
2. **Is this HTTP handling?** → Put in controller
3. **Is this reusable?** → Extract to utility/middleware
4. **Does this need validation?** → Use express-validator
5. **Will this throw an error?** → Use asyncHandler, let errorHandler catch it
6. **Does this need logging?** → Use logger utility
7. **Is this a constant?** → Put in constants.js

## Resources

- **Express.js**: https://expressjs.com/
- **Mongoose**: https://mongoosejs.com/
- **EJS**: https://ejs.co/
- **Bootstrap 5**: https://getbootstrap.com/
- **express-validator**: https://express-validator.github.io/docs/

## Notes

- The project uses ES6+ features
- No TypeScript (plain JavaScript)
- EJS templates for views
- Bootstrap 5 for styling
- Docker for containerization
- MongoDB for data persistence

