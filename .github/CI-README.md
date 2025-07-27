# CI Configuration Files

The `.github` directory contains configuration files used during Continuous Integration (CI) builds, following GitHub's standard conventions.

## Files

### `amplify_outputs.template.json`

This file provides a mock Amplify configuration for CI environments where the actual Amplify backend may not be available. It contains:

- Mock authentication configuration (Cognito User Pool settings)
- Mock API configuration (GraphQL endpoint)
- Default model introspection schema
- Standard security and MFA settings

**Usage in CI:**
The GitHub Actions workflow copies this template to `amplify_outputs.json` in the project root during the build process, allowing the application to build and tests to run successfully without requiring a live Amplify backend.

**Maintenance:**
When updating the actual Amplify configuration structure, ensure this template file is updated accordingly to maintain compatibility with the application's configuration expectations.

## Why This Approach?

1. **Readability**: JSON configuration is properly formatted and easy to read/modify
2. **Maintainability**: Changes to mock configuration can be made in one place
3. **Version Control**: Configuration changes are tracked and reviewable
4. **Consistency**: Same mock configuration is used across all CI jobs
5. **Documentation**: Clear separation of CI-specific files with proper documentation