'use client';

import { Amplify } from 'aws-amplify';

// Configure Amplify immediately when this module is loaded on the client
if (typeof window !== 'undefined') {
    import('../../amplify_outputs.json').then((amplifyConfig) => {
        Amplify.configure(amplifyConfig.default);
    }).catch((error) => {
       console.error("Failed to load Amplify configuration:", error);
    });
}
export default Amplify;