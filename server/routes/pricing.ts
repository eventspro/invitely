import { Router } from "express";
import { db } from "../db.js";
import { 
  pricingPlans, 
  planFeatures, 
  planFeatureAssociations,
  insertPricingPlanSchema,
  insertPlanFeatureSchema,
  insertPlanFeatureAssociationSchema
} from "@shared/schema.js";
import { eq, desc } from "drizzle-orm";
import { authenticateUser } from "../middleware/auth.js";

const router = Router();

// Get all pricing plans with features
router.get("/pricing-plans", async (req, res) => {
  try {
    const plans = await db
      .select()
      .from(pricingPlans)
      .orderBy(pricingPlans.displayOrder);

    const features = await db
      .select()
      .from(planFeatures)
      .orderBy(planFeatures.category);

    const associations = await db
      .select()
      .from(planFeatureAssociations);

    // Build plan objects with associated features
    const plansWithFeatures = plans.map(plan => {
      const planAssociations = associations.filter(a => a.planId === plan.id);
      const planFeatureList = planAssociations.map(assoc => {
        const feature = features.find(f => f.id === assoc.featureId);
        return {
          ...feature,
          isIncluded: assoc.isIncluded,
          value: assoc.value
        };
      });

      return {
        ...plan,
        features: planFeatureList
      };
    });

    res.json(plansWithFeatures);
  } catch (error: any) {
    console.error("Error fetching pricing plans:", error);
    res.status(500).json({ 
      error: "Failed to fetch pricing plans",
      details: error.message 
    });
  }
});

// Get single pricing plan
router.get("/pricing-plans/:id", async (req, res) => {
  try {
    const [plan] = await db
      .select()
      .from(pricingPlans)
      .where(eq(pricingPlans.id, req.params.id))
      .limit(1);

    if (!plan) {
      return res.status(404).json({ error: "Pricing plan not found" });
    }

    const associations = await db
      .select()
      .from(planFeatureAssociations)
      .where(eq(planFeatureAssociations.planId, plan.id));

    const features = await db
      .select()
      .from(planFeatures);

    const planFeatureList = associations.map(assoc => {
      const feature = features.find(f => f.id === assoc.featureId);
      return {
        ...feature,
        isIncluded: assoc.isIncluded,
        value: assoc.value
      };
    });

    res.json({
      ...plan,
      features: planFeatureList
    });
  } catch (error: any) {
    console.error("Error fetching pricing plan:", error);
    res.status(500).json({ 
      error: "Failed to fetch pricing plan",
      details: error.message 
    });
  }
});

// Create pricing plan (authenticated)
router.post("/pricing-plans", authenticateUser, async (req, res) => {
  try {
    const validatedData = insertPricingPlanSchema.parse(req.body);

    const [newPlan] = await db
      .insert(pricingPlans)
      .values(validatedData)
      .returning();

    res.status(201).json(newPlan);
  } catch (error: any) {
    console.error("Error creating pricing plan:", error);
    res.status(400).json({ 
      error: "Failed to create pricing plan",
      details: error.message 
    });
  }
});

// Update pricing plan (authenticated)
router.patch("/pricing-plans/:id", authenticateUser, async (req, res) => {
  try {
    const [updatedPlan] = await db
      .update(pricingPlans)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(pricingPlans.id, req.params.id))
      .returning();

    if (!updatedPlan) {
      return res.status(404).json({ error: "Pricing plan not found" });
    }

    res.json(updatedPlan);
  } catch (error: any) {
    console.error("Error updating pricing plan:", error);
    res.status(400).json({ 
      error: "Failed to update pricing plan",
      details: error.message 
    });
  }
});

// Delete pricing plan (authenticated)
router.delete("/pricing-plans/:id", authenticateUser, async (req, res) => {
  try {
    const [deletedPlan] = await db
      .delete(pricingPlans)
      .where(eq(pricingPlans.id, req.params.id))
      .returning();

    if (!deletedPlan) {
      return res.status(404).json({ error: "Pricing plan not found" });
    }

    res.json({ message: "Pricing plan deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting pricing plan:", error);
    res.status(500).json({ 
      error: "Failed to delete pricing plan",
      details: error.message 
    });
  }
});

// Get all features
router.get("/plan-features", async (req, res) => {
  try {
    const features = await db
      .select()
      .from(planFeatures)
      .orderBy(planFeatures.category);

    res.json(features);
  } catch (error: any) {
    console.error("Error fetching plan features:", error);
    res.status(500).json({ 
      error: "Failed to fetch plan features",
      details: error.message 
    });
  }
});

// Create feature (authenticated)
router.post("/plan-features", authenticateUser, async (req, res) => {
  try {
    const validatedData = insertPlanFeatureSchema.parse(req.body);

    const [newFeature] = await db
      .insert(planFeatures)
      .values(validatedData)
      .returning();

    res.status(201).json(newFeature);
  } catch (error: any) {
    console.error("Error creating plan feature:", error);
    res.status(400).json({ 
      error: "Failed to create plan feature",
      details: error.message 
    });
  }
});

// Associate feature with plan (authenticated)
router.post("/plan-feature-associations", authenticateUser, async (req, res) => {
  try {
    const validatedData = insertPlanFeatureAssociationSchema.parse(req.body);

    const [newAssociation] = await db
      .insert(planFeatureAssociations)
      .values(validatedData)
      .returning();

    res.status(201).json(newAssociation);
  } catch (error: any) {
    console.error("Error creating feature association:", error);
    res.status(400).json({ 
      error: "Failed to create feature association",
      details: error.message 
    });
  }
});

export function registerPricingRoutes(app: Router) {
  app.use("/api", router);
}
