import { Amplify } from 'aws-amplify';

// Try to import amplify_outputs.json, fall back to empty config if not available
let amplifyConfig = {};

try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const outputs = require('../../amplify_outputs.json');
    amplifyConfig = outputs;
} catch {
    console.warn('amplify_outputs.json not found, Amplify will use default configuration');
    // In development/testing, we can use a minimal config or let Amplify handle defaults
    
}

Amplify.configure(amplifyConfig);

export default Amplify;