# Bachelor Fantasy League

A fantasy league application for The Bachelor/Bachelorette built with Next.js 15 and AWS Amplify Gen 2.

## 🚀 Setup Complete

This project has been successfully set up with:

- ✅ Next.js 15 with TypeScript
- ✅ Tailwind CSS for styling
- ✅ AWS Amplify Gen 2 backend with authentication and GraphQL API
- ✅ Organized project structure (components, services, types, hooks, lib)
- ✅ Environment configuration
- ✅ Build configuration for deployment

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
├── services/           # API and business logic services
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
└── lib/                # Utility functions and configurations
```

## 🛠 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start Amplify sandbox (for backend development)
npx ampx sandbox
```

## 🚀 Deployment to AWS Amplify Hosting

### Option 1: Deploy via AWS Console (Recommended)

1. Go to the [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Connect your Git repository (GitHub, GitLab, etc.)
4. Select the `main` branch
5. Amplify will automatically detect the `amplify.yml` build configuration
6. Click "Save and deploy"

### Option 2: Deploy via CLI

```bash
# Make sure you're authenticated with AWS
aws configure

# Deploy the backend and frontend
npx ampx pipeline-deploy --branch main
```

## 🔧 Environment Variables

The following environment variables are configured:

- `NEXT_PUBLIC_AWS_PROJECT_REGION`: AWS region (default: us-east-1)
- `NEXT_PUBLIC_AWS_COGNITO_REGION`: Cognito region (default: us-east-1)

## 📋 Next Steps

1. **Deploy to Amplify Hosting** - Follow the deployment instructions above
2. **Implement Authentication** - Use the pre-configured Cognito setup
3. **Build Fantasy League Features** - Start implementing the core functionality
4. **Configure Custom Domain** - Set up a custom domain in Amplify Console

## 🎯 Expected Result

After deployment, you'll have:
- **🌐 Live Website URL** - A publicly accessible website hosted on AWS Amplify
- **🔐 Authentication Ready** - Cognito user pools configured
- **📊 GraphQL API** - Ready for data operations
- **⚡ Fast Performance** - Optimized Next.js build with CDN distribution

Visit your deployed URL to see the Bachelor Fantasy League welcome page!