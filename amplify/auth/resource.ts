import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    // Maps to Cognito standard attribute 'given_name' - user's first name
    givenName: {
      mutable: true,
      required: true,
    },
    // Maps to Cognito standard attribute 'family_name' - user's last name  
    familyName: {
      mutable: true,
      required: false, // Making this optional for now
    },
    // Maps to Cognito standard attribute 'name' - user's full name
    fullname: {
      mutable: true,
      required: false, // This will be auto-generated from givenName + familyName
    },
  },
});
