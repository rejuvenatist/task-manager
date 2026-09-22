import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbpkxhuvusyrgoewuwwt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFicGt4aHV2dXN5cmdvZXd1d3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5OTc1OTcsImV4cCI6MjA4NDU3MzU5N30.ztOREkVHd8A881leEdBFCWoGzdH339iITajCz-OKxfU';

export const supabase = createClient(supabaseUrl, supabaseKey);
