import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runSeed() {
  console.log("Starting Clean Enterprise Seed...");

  // 1. Create Companies
  const { data: companies, error: compErr } = await supabase.from('companies').insert([
    { name: 'TechNova Solutions' },
    { name: 'DataCorp India' }
  ]).select();
  
  if (compErr || !companies) {
    console.error("🚨 Error creating companies:", compErr?.message || compErr);
    return; // Stop the script if companies fail
  }
  
  const [techNova, dataCorp] = companies;
  console.log("Created Companies:", techNova.name, "and", dataCorp.name);

  // 2. Add Projects for testing our Genetic Algorithm!
  const { error: projErr } = await supabase.from('projects').insert([
    { title: 'TechNova CRM Upgrade', company_id: techNova.id, required_skills: ['React', 'Node.js'], max_daily_budget_inr: 20000, is_active: true },
    { title: 'DataCorp Mobile App', company_id: dataCorp.id, required_skills: ['React'], max_daily_budget_inr: 15000, is_active: true }
  ]);
  
  if (projErr) console.error("🚨 Error creating projects:", projErr.message);

  const usersToCreate = [
    { email: 'manager@technova.com', name: 'TechNova Admin', role: 'manager', companyId: techNova.id },
    { email: 'dev1@technova.com', name: 'Arjun (TechNova)', role: 'consultant', companyId: techNova.id, level: 'Senior', cost: 12000, bench: true, availDate: '2026-03-11' },
    { email: 'manager@datacorp.com', name: 'DataCorp Admin', role: 'manager', companyId: dataCorp.id },
    { email: 'dev1@datacorp.com', name: 'Rahul (DataCorp)', role: 'consultant', companyId: dataCorp.id, level: 'Senior', cost: 11000, bench: true, availDate: '2026-03-11' }
  ];

  for (const u of usersToCreate) {
    // 3. Create Auth Account
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: u.email, 
      password: 'Password123!', 
      email_confirm: true,
      user_metadata: { full_name: u.name } 
    });

    if (authErr) {
      // THIS WILL REVEAL THE TRUE ERROR
      console.error(`🚨 Failed to create auth user ${u.email}. Error:`, authErr.message);
      continue;
    }

    const userId = authData.user.id;

    // Wait a brief moment for our Supabase trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    // 4. Update the auto-created profile with company info
    const { data: profile, error: profErr } = await supabase.from('profiles')
      .update({ company_id: u.companyId, role: u.role, status: 'active' })
      .eq('auth_id', userId)
      .select().single();

    if (profErr) {
      console.error(`🚨 Failed to update profile for ${u.email}. Error:`, profErr.message);
    }

    // 5. Insert Consultant Details
    if (u.role === 'consultant' && profile) {
      const { error: consErr } = await supabase.from('consultants').insert([{
        id: profile.id, // Links to the profile's ID
        company_id: u.companyId,
        experience_level: u.level,
        daily_cost_inr: u.cost,
        skills: ['React', 'Node.js'],
        available_from: u.availDate
      }]);
      
      if (consErr) {
        console.error(`🚨 Failed to create consultant row for ${u.email}. Error:`, consErr.message);
      }
    }
    
    if (!authErr && !profErr) {
      console.log(`Successfully seeded: ${u.name}`);
    }
  }

  console.log("Enterprise Seed Complete! Check above for any red errors.");
}

runSeed();