# tableau-fields-dependency

## Testing

The project includes several test commands:

- `npm test` - Run all tests (unit and e2e)
- `npm run test:unit` - Run all unit tests
- `npm run test:e2e` - Run all e2e tests
- `npm run test:unit:single <path>` - Run a single unit test file in watch mode
  ```bash
  # Example: Run only the TWB parser tests
  npm run test:unit:single __tests__/unit/twbParser.test.ts
  ```
