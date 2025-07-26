import { Amplify } from 'aws-amplify';

// Basic configuration for frontend-only deployment
const amplifyConfig = {
  aws_project_region: 'us-east-1',
  aws_cognito_region: 'us-east-1',
};

Amplify.configure(amplifyConfig);

export default Amplify;