import { supabase } from './supabase';

// Generate a random 6-character session code
export function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like I, O, 0, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new session
export async function createSession() {
  const sessionCode = generateSessionCode();
  
  const { data, error } = await supabase
    .from('sessions')
    .insert([{ session_code: sessionCode }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get session by code
export async function getSessionByCode(code: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('session_code', code.toUpperCase())
    .single();

  if (error) throw error;
  return data;
}

// Record a swipe
export async function recordSwipe(
  sessionId: string,
  personNumber: number,
  optionId: string,
  optionType: 'cuisine' | 'restaurant',
  swipedRight: boolean
) {
  const { error } = await supabase
    .from('swipes')
    .insert([{
      session_id: sessionId,
      person_number: personNumber,
      option_id: optionId,
      option_type: optionType,
      swiped_right: swipedRight
    }]);

  if (error) throw error;
}

// Get person 1's right swipes
export async function getPerson1Swipes(sessionId: string) {
  const { data, error } = await supabase
    .from('swipes')
    .select('*')
    .eq('session_id', sessionId)
    .eq('person_number', 1)
    .eq('swiped_right', true);

  if (error) throw error;
  return data;
}

// Check for a match
export async function checkForMatch(sessionId: string, person2SwipeId: string) {
  const person1Swipes = await getPerson1Swipes(sessionId);
  
  const match = person1Swipes.find(swipe => swipe.option_id === person2SwipeId);
  
  if (match) {
    // Update session with the match
    const { error } = await supabase
      .from('sessions')
      .update({
        matched_option_id: match.option_id,
        matched_option_type: match.option_type,
        person2_completed: true
      })
      .eq('id', sessionId);

    if (error) throw error;
    return match;
  }
  
  return null;
}

// Mark person 1 as completed
export async function markPerson1Completed(sessionId: string) {
  const { error } = await supabase
    .from('sessions')
    .update({ person1_completed: true })
    .eq('id', sessionId);

  if (error) throw error;
}

// Get all cuisines
export async function getCuisines() {
  const { data, error } = await supabase
    .from('cuisines')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

// Get restaurants by mall
export async function getRestaurantsByMall(mallId: string) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('mall_id', mallId)
    .order('name');

  if (error) throw error;
  return data;
}

// Get restaurant or cuisine details
export async function getOptionDetails(optionId: string, optionType: 'cuisine' | 'restaurant') {
  const table = optionType === 'cuisine' ? 'cuisines' : 'restaurants';
  
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', optionId)
    .single();

  if (error) throw error;
  return data;
}
