import "dotenv/config";
import { storage } from "../../server/storage";

export default async function handler(req: any, res: any) {
  try {
    console.log(`📋 Getting all templates`);
    
    const templates = await storage.getAllTemplates();
    
    console.log(`📊 Found ${templates.length} templates`);
    res.json(templates);
  } catch (error) {
    console.error("❌ Failed to get templates:", error);
    res.status(500).json({ error: "Failed to get templates" });
  }
}