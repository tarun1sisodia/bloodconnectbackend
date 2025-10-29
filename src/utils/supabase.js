import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend/.env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key available:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  throw new Error('Supabase configuration missing. Check your .env file.');
}

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

// Register a new user
const registerUser = async (email, password, metadata = {}) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Supabase registration error:', error);
    throw new Error(error.message || 'Registration failed');
  }
};

// Login user
const loginUser = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Supabase login error:', error);
    throw new Error(error.message || 'Login failed');
  }
};

// Reset password
const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Supabase password reset error:', error);
    throw new Error(error.message || 'Password reset failed');
  }
};

export {
  supabase,
  registerUser,
  loginUser,
  resetPassword
};
