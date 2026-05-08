import { supabase } from "./src/lib/supabase";
import { GENERATED_FACULTY } from "./src/utils/generatedData";
import { AppUser } from "./src/utils/userStore";

const SEED_USERS: AppUser[] = [
  {
    id: "admin-root",
    username: "D-TERM-IARE",
    password: "defter",
    role: "Admin",
    displayName: "D-Term Admin",
  },
  ...GENERATED_FACULTY,
];

async function seed() {
  console.log("Starting data seeding...");
  
  // Map AppUser to Supabase schema
  const usersToInsert = SEED_USERS.map((user) => ({
    id: user.id,
    username: user.username,
    password: user.password, // Storing in plain text as per current implementation
    role: user.role,
    display_name: user.displayName,
    department: user.department || null,
    sem: user.sem || null,
    section: user.section || null,
    subject: user.subject || null,
    first_login: user.firstLogin !== undefined ? user.firstLogin : true,
  }));

  console.log(`Inserting ${usersToInsert.length} users...`);

  // Insert users
  const { data, error } = await supabase
    .from("users")
    .upsert(usersToInsert, { onConflict: 'username' });

  if (error) {
    console.error("Error inserting users:", error);
  } else {
    console.log("Successfully seeded users.");
  }
}

seed();
