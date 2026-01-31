import { Router } from "express";
import { db } from "../db.js";
import { 
  configurablePricingPlans,
  configurablePlanFeatures,
  insertConfigurablePricingPlanSchema,
  updateConfigurablePricingPlanSchema,
  insertConfigurablePlanFeatureSchema,
} from "../../shared/schema.js";
import { eq, asc, sql } from "drizzle-orm";

const router = Router();

// GET /api/configurable-pricing-plans - List all plans with features (sorted by orderIndex)
router.get("/configurable-pricing-plans", async (req, res) => {
  try {
    const plans = await db
      .select()
      .from(configurablePricingPlans)
      .orderBy(asc(configurablePricingPlans.orderIndex));

    // Fetch features for all plans
    const features = await db
      .select()
      .from(configurablePlanFeatures)
      .orderBy(asc(configurablePlanFeatures.orderIndex));

    // Group features by plan
    const plansWithFeatures = plans.map(plan => ({
      ...plan,
      features: features.filter(f => f.planId === plan.id)
    }));

    res.json(plansWithFeatures);
  } catch (error: any) {
    console.error("Error fetching configurable pricing plans:", error);
    res.status(500).json({ 
      error: "Failed to fetch pricing plans",
      details: error.message 
    });
  }
});

// GET /api/configurable-pricing-plans/:id - Get single plan with features
router.get("/configurable-pricing-plans/:id", async (req, res) => {
  try {
    const [plan] = await db
      .select()
      .from(configurablePricingPlans)
      .where(eq(configurablePricingPlans.id, req.params.id))
      .limit(1);

    if (!plan) {
      return res.status(404).json({ error: "Pricing plan not found" });
    }

    const features = await db
      .select()
      .from(configurablePlanFeatures)
      .where(eq(configurablePlanFeatures.planId, plan.id))
      .orderBy(asc(configurablePlanFeatures.orderIndex));

    res.json({ ...plan, features });
  } catch (error: any) {
    console.error("Error fetching pricing plan:", error);
    res.status(500).json({ 
      error: "Failed to fetch pricing plan",
      details: error.message 
    });
  }
});

// POST /api/configurable-pricing-plans - Create new plan
router.post("/configurable-pricing-plans", async (req, res) => {
  try {
    const validatedData = insertConfigurablePricingPlanSchema.parse(req.body);

    const [newPlan] = await db
      .insert(configurablePricingPlans)
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

// PATCH /api/configurable-pricing-plans/:id - Update plan
router.patch("/configurable-pricing-plans/:id", async (req, res) => {
  try {
    const validatedData = updateConfigurablePricingPlanSchema.parse(req.body);

    const [updatedPlan] = await db
      .update(configurablePricingPlans)
      .set({
        ...validatedData,
        updatedAt: sql`now()`
      })
      .where(eq(configurablePricingPlans.id, req.params.id))
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

// DELETE /api/configurable-pricing-plans/:id - Delete plan
router.delete("/configurable-pricing-plans/:id", async (req, res) => {
  try {
    const [deletedPlan] = await db
      .delete(configurablePricingPlans)
      .where(eq(configurablePricingPlans.id, req.params.id))
      .returning();

    if (!deletedPlan) {
      return res.status(404).json({ error: "Pricing plan not found" });
    }

    res.json({ message: "Pricing plan deleted successfully", plan: deletedPlan });
  } catch (error: any) {
    console.error("Error deleting pricing plan:", error);
    res.status(500).json({ 
      error: "Failed to delete pricing plan",
      details: error.message 
    });
  }
});

// POST /api/configurable-pricing-plans/:id/reorder - Swap order with another plan
router.post("/configurable-pricing-plans/:id/reorder", async (req, res) => {
  try {
    const { direction } = req.body; // "up" or "down"
    const planId = req.params.id;

    const plans = await db
      .select()
      .from(configurablePricingPlans)
      .orderBy(asc(configurablePricingPlans.orderIndex));

    const currentIndex = plans.findIndex(p => p.id === planId);
    if (currentIndex === -1) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= plans.length) {
      return res.status(400).json({ error: "Cannot reorder beyond bounds" });
    }

    const currentPlan = plans[currentIndex];
    const targetPlan = plans[targetIndex];

    // Swap orderIndex values
    await db
      .update(configurablePricingPlans)
      .set({ orderIndex: targetPlan.orderIndex, updatedAt: sql`now()` })
      .where(eq(configurablePricingPlans.id, currentPlan.id));

    await db
      .update(configurablePricingPlans)
      .set({ orderIndex: currentPlan.orderIndex, updatedAt: sql`now()` })
      .where(eq(configurablePricingPlans.id, targetPlan.id));

    res.json({ message: "Plans reordered successfully" });
  } catch (error: any) {
    console.error("Error reordering plans:", error);
    res.status(500).json({ 
      error: "Failed to reorder plans",
      details: error.message 
    });
  }
});

// PUT /api/configurable-pricing-plans/:id/features - Replace all features for a plan
router.put("/configurable-pricing-plans/:id/features", async (req, res) => {
  try {
    const planId = req.params.id;
    const { features } = req.body;

    if (!Array.isArray(features)) {
      return res.status(400).json({ error: "Features must be an array" });
    }

    // Delete existing features
    await db
      .delete(configurablePlanFeatures)
      .where(eq(configurablePlanFeatures.planId, planId));

    // Insert new features
    if (features.length > 0) {
      const validatedFeatures = features.map((f, index) => 
        insertConfigurablePlanFeatureSchema.parse({
          ...f,
          planId,
          orderIndex: f.orderIndex ?? index
        })
      );

      await db
        .insert(configurablePlanFeatures)
        .values(validatedFeatures);
    }

    res.json({ message: "Features updated successfully" });
  } catch (error: any) {
    console.error("Error updating plan features:", error);
    res.status(400).json({ 
      error: "Failed to update plan features",
      details: error.message 
    });
  }
});

export function registerConfigurablePricingRoutes(app: Router) {
  app.use("/api", router);
}
