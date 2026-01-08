import { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="max-w-4xl mx-auto pt-6">
      {/* TaskPerch logo */}
      <div className="text-center mb-4">
        <img
          src="/taskperch-logo.png"
          alt="TaskPerch"
          className="h-44 w-auto mx-auto bg-transparent shadow-none border-none"
        />
      </div>

      {/* Login / Sign Up toggle */}
      <div className="flex justify-center mb-4">
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

      {/* Auth form */}
      {isLogin ? <LoginForm /> : <SignupForm />}

      {/* Switch link */}
      <div className="text-center mt-3 text-gray-500">
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
