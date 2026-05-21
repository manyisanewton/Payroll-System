import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://ehdsqhfrlmfpnkmrkgjf.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImU5NTE1YTY0LTFhNGQtNGQzNS1hZmM1LThlOGZjN2Y3YmExOSJ9.eyJwcm9qZWN0SWQiOiJlaGRzcWhmcmxtZnBua21ya2dqZiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc5MzgyNDgzLCJleHAiOjIwOTQ3NDI0ODMsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.z84z2l3kwAXQgW16MaWt0tfCvFm3eC0XHtOOOjCI38M';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };