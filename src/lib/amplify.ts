'use client';

import { Amplify } from 'aws-amplify';
import amplifyConfig from '../../amplify_outputs.json';

// Configure Amplify immediately when this module is loaded on the client
if (typeof window !== 'undefined') {
    Amplify.configure(amplifyConfig);
}

export default Amplify;