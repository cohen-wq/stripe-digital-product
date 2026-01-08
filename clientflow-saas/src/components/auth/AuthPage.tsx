import { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen w-full px-4 py-6 sm:py-8">
      {/* TaskPerch logo */}
      <div className="text-center mb-4 sm:mb-6">
        <img
          src="/taskperch-logo.png"
          alt="TaskPerch"
          className="h-28 sm:h-36 md:h-44 w-auto mx-auto bg-transparent shadow-none border-none"
        />
      </div>

      {/* Login / Sign Up toggle */}
      <div className="flex justify-center mb-4 sm:mb-6">
        <div className="bg-white rounded-lg shadow-sm p-1 inline-flex w-full max-w-sm">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              isLogin
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
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
      <div className="text-center mt-4 text-gray-500">
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
