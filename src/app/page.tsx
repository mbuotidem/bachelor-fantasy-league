export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-rose-600 mb-4">
          🌹 Bachelor Fantasy League
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          Fantasy league for The Bachelor/Bachelorette
        </p>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🎉 Setup Complete!
          </h2>
          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span>Next.js 15 with TypeScript</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span>Tailwind CSS configured</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span>AWS Amplify Gen 2 backend</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span>Organized project structure</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span>Environment configuration</span>
            </div>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Ready for deployment!</strong> Your AWS Amplify Gen 2 project is set up and ready to be deployed to hosting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}