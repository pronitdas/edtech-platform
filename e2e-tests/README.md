# E2E Test Suite for EdTech Platform

Comprehensive end-to-end test suite that validates the complete user workflows including signup, login, knowledge upload, and learning experiences.

## Features

- **No Mocks**: Tests against real running services
- **Complete Workflows**: Tests full user journeys from registration to learning
- **Real Browser**: Uses Puppeteer for actual browser interactions
- **Visual Verification**: Screenshots for debugging and verification
- **Comprehensive Coverage**: Authentication, file upload, content processing, learning interface

## Prerequisites

- Frontend running on http://localhost:5173 (Vite dev server)
- Backend running on http://localhost:8000 (Docker compose environment)
- All infrastructure services (PostgreSQL, Redis, etc.) running

## Installation

```bash
cd e2e-tests
npm install
```

## Running Tests

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage
```

## Test Structure

### 1. Health Check Tests (`01-health-check.test.ts`)
- Verifies frontend and backend are running
- Tests basic connectivity
- Validates API endpoints are accessible

### 2. Authentication Tests (`02-authentication.test.ts`)
- User registration workflow
- Login functionality
- Authentication persistence
- Session management

### 3. Knowledge Upload Tests (`03-knowledge-upload.test.ts`)
- File upload interface
- PDF and text file processing
- Upload status tracking
- Knowledge list display

### 4. Learning Workflow Tests (`04-learning-workflow.test.ts`)
- Learning interface navigation
- Chapter/content display
- Interactive features testing
- Progress tracking
- Navigation between content

### 5. Integration Tests (`05-integration-workflow.test.ts`)
- Complete end-to-end user journey
- Data persistence verification
- Error handling scenarios
- Full workflow validation

## Test Data

The tests create realistic test files:
- `test-document.txt`: Simple text content
- `test-document.pdf`: Basic PDF with test content
- `comprehensive-test.txt`: Full mathematics learning content

## Screenshots

Tests automatically capture screenshots at key points:
- Stored in `./screenshots/` directory
- Named with test step and timestamp
- Useful for debugging failures

## Configuration

### Timeouts
- Test timeout: 60 seconds
- Element wait timeout: 10 seconds
- Navigation timeout: 10 seconds

### Browser Settings
- Headless mode enabled
- 1280x720 viewport
- No sandbox mode for CI compatibility

## Debugging

1. **View Screenshots**: Check `./screenshots/` for visual state
2. **Enable Headed Mode**: Modify `setup.ts` to set `headless: false`
3. **Add Breakpoints**: Use `await page.pause()` in tests
4. **Console Logs**: Tests include detailed console output

## Integration with CI/CD

The test suite is designed for CI/CD environments:
- Uses headless browser
- Includes proper cleanup
- Generates coverage reports
- Produces structured output

## Expected Behavior

### Successful Test Run Should Show:
1. ✅ All services are healthy and accessible
2. ✅ User can register and login successfully
3. ✅ File upload works for various formats
4. ✅ Knowledge processing completes
5. ✅ Learning interface displays content
6. ✅ Interactive features are functional
7. ✅ Complete workflow from signup to learning works
8. ✅ Data persists across sessions

### Common Issues:
- **Services not running**: Ensure docker-compose is up
- **Timeout errors**: Check if services are overloaded
- **Element not found**: UI might have changed, update selectors
- **Upload failures**: Check file permissions and backend processing

## Extending Tests

To add new test scenarios:

1. Create new test file following naming convention
2. Use existing helper functions in `utils/test-helpers.ts`
3. Follow established patterns for element selection
4. Add appropriate screenshots for debugging
5. Update this README with new test descriptions

This test suite provides comprehensive validation of the EdTech platform's core functionality and user workflows.