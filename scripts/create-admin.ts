// Create admin user for platform access
import "dotenv/config";
import { db } from "../server/db.js";
import { users } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function createAdminUser() {
  try {
    console.log("🔐 Creating admin user...");
    
    const username = "admin";
    const password = "wedding2025";
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if admin user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    if (existingUser.length > 0) {
      console.log("✅ Admin user already exists!");
      console.log("Username: admin");
      console.log("Password: wedding2025");
    } else {
      // Create new admin user
      const newUser = await db
        .insert(users)
        .values({
          username: username,
          password: hashedPassword
        })
        .returning();
      
      console.log("🎉 Admin user created successfully!");
      console.log("Username: admin");
      console.log("Password: wedding2025");
      console.log("User ID:", newUser[0].id);
    }
    
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  }
}

createAdminUser();
