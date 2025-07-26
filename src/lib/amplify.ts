import { Amplify } from 'aws-amplify';

// Try to import outputs, fall back to basic config if not available
let amplifyConfig;
try {
    // This will be generated during the build process
    const outputs = require('../../amplify_outputs.json');
    amplifyConfig = outputs;
} catch (error) {
    // Fallback configuration for development or when outputs don't exist yet
    console.warn('amplify_outputs.json not found, using fallback configuration');
    amplifyConfig = {
        aws_project_region: 'us-east-1',
        aws_cognito_region: 'us-east-1',
    };
}

Amplify.configure(amplifyConfig);

export default Amplify;