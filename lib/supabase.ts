import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Cuisine = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
};

export type Mall = {
  id: string;
  name: string;
  location: string | null;
};

export type Restaurant = {
  id: string;
  name: string;
  cuisine_type: string | null;
  mall_id: string | null;
  description: string | null;
  price_range: string | null;
  image_url: string | null;
};

export type Session = {
  id: string;
  session_code: string;
  created_at: string;
  person1_completed: boolean;
  person2_completed: boolean;
  matched_option_id: string | null;
  matched_option_type: string | null;
};

export type Swipe = {
  id: string;
  session_id: string;
  person_number: number;
  option_id: string;
  option_type: 'cuisine' | 'restaurant';
  swiped_right: boolean;
  created_at: string;
};
