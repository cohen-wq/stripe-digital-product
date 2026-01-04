import { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">ClientFlow SaaS</h1>
        <p className="text-gray-600 mt-2">Manage your clients efficiently</p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-lg shadow-sm p-1 inline-flex">
          <button
            onClick={() => setIsLogin(true)}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              isLogin 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              !isLogin 
                ? 'bg-green-600 text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign Up
          </button>
        </div>
      </div>

      {isLogin ? <LoginForm /> : <SignupForm />}

      <div className="text-center mt-6 text-gray-500">
        <p>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {isLogin ? 'Sign up here' : 'Login here'}
          </button>
        </p>
      </div>
    </div>
  );
}