import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  Save,
  X,
  Check,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface PlanFeature {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category?: string;
  isIncluded: boolean;
  value?: string;
}

interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  price: string;
  currency: string;
  badge?: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  features: PlanFeature[];
}

interface PricingPlansManagerProps {
  onClose: () => void;
}

export default function PricingPlansManager({ onClose }: PricingPlansManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Fetch all pricing plans
  const { data: plans = [], isLoading } = useQuery<PricingPlan[]>({
    queryKey: ["/api/pricing-plans"],
  });

  // Fetch all available features
  const { data: allFeatures = [] } = useQuery<PlanFeature[]>({
    queryKey: ["/api/plan-features"],
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async (plan: Partial<PricingPlan> & { id: string }) => {
      const res = await fetch(`/api/pricing-plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update plan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-plans"] });
      toast({ title: "Success", description: "Plan updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (plan: Omit<PricingPlan, "id" | "features">) => {
      const res = await fetch("/api/pricing-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create plan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-plans"] });
      setIsCreating(false);
      toast({ title: "Success", description: "Plan created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await fetch(`/api/pricing-plans/${planId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete plan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-plans"] });
      toast({ title: "Success", description: "Plan deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reorder plans
  const reorderPlans = (planId: string, direction: "up" | "down") => {
    const sortedPlans = [...plans].sort((a, b) => a.displayOrder - b.displayOrder);
    const currentIndex = sortedPlans.findIndex((p) => p.id === planId);
    
    if (direction === "up" && currentIndex === 0) return;
    if (direction === "down" && currentIndex === sortedPlans.length - 1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const currentPlan = sortedPlans[currentIndex];
    const swapPlan = sortedPlans[newIndex];

    // Swap display orders
    updatePlanMutation.mutate({
      id: currentPlan.id,
      displayOrder: swapPlan.displayOrder,
    });
    updatePlanMutation.mutate({
      id: swapPlan.id,
      displayOrder: currentPlan.displayOrder,
    });
  };

  const handleSavePlan = () => {
    if (!editingPlan) return;

    updatePlanMutation.mutate(editingPlan, {
      onSuccess: () => setEditingPlan(null),
    });
  };

  const handleCreatePlan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newPlan = {
      name: formData.get("name") as string,
      displayName: formData.get("displayName") as string,
      price: formData.get("price") as string,
      currency: (formData.get("currency") as string) || "AMD",
      badge: formData.get("badge") as string,
      description: formData.get("description") as string,
      isActive: true,
      displayOrder: plans.length,
    };

    createPlanMutation.mutate(newPlan);
  };

  const sortedPlans = [...plans].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Manage Pricing Plans</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(true)}
              disabled={isCreating}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Plan
            </Button>
          </DialogTitle>
          <DialogDescription>
            Manage your pricing plans structure. Display text comes from translations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Create New Plan Form */}
          {isCreating && (
            <Card className="p-6 border-2 border-blue-500">
              <form onSubmit={handleCreatePlan} className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Create New Plan</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Plan ID (key)</label>
                    <Input
                      name="name"
                      placeholder="e.g., premium"
                      required
                      pattern="^[a-z0-9_-]+$"
                      title="Lowercase letters, numbers, hyphens and underscores only"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Stable key for referencing (lowercase only)
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Display Name</label>
                    <Input
                      name="displayName"
                      placeholder="e.g., Premium Plan"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Fallback display name (translations override this)
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Price</label>
                    <Input
                      name="price"
                      placeholder="e.g., 23000"
                      required
                      type="number"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Currency</label>
                    <Select name="currency" defaultValue="AMD">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AMD">AMD</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Badge (optional)</label>
                    <Input
                      name="badge"
                      placeholder="e.g., Most Popular"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      name="description"
                      placeholder="Plan description"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="w-4 h-4 mr-2" />
                    Create Plan
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Plans List */}
          {isLoading ? (
            <div className="text-center py-8">Loading plans...</div>
          ) : (
            <div className="space-y-3">
              {sortedPlans.map((plan, index) => (
                <Card
                  key={plan.id}
                  className={`p-4 ${!plan.isActive ? "opacity-60 bg-gray-50" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Reorder controls */}
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => reorderPlans(plan.id, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => reorderPlans(plan.id, "down")}
                        disabled={index === sortedPlans.length - 1}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Plan info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          {plan.displayName}
                          {plan.badge && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {plan.badge}
                            </span>
                          )}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({plan.name})
                        </span>
                        <span className="text-lg font-bold">
                          {plan.price} {plan.currency}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                          {plan.features?.length || 0} features
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Active:</span>
                        <Switch
                          checked={plan.isActive}
                          onCheckedChange={(checked) =>
                            updatePlanMutation.mutate({
                              id: plan.id,
                              isActive: checked,
                            })
                          }
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPlan(plan)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              `Delete plan "${plan.displayName}"? This cannot be undone.`
                            )
                          ) {
                            deletePlanMutation.mutate(plan.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Edit Plan Dialog */}
          {editingPlan && (
            <Dialog open onOpenChange={() => setEditingPlan(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Plan: {editingPlan.displayName}</DialogTitle>
                  <DialogDescription>
                    Update plan details. Display text should be managed via translations.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Plan ID</label>
                      <Input
                        value={editingPlan.name}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, name: e.target.value })
                        }
                        disabled
                        className="bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Display Name</label>
                      <Input
                        value={editingPlan.displayName}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            displayName: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Price</label>
                      <Input
                        value={editingPlan.price}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, price: e.target.value })
                        }
                        type="number"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Currency</label>
                      <Select
                        value={editingPlan.currency}
                        onValueChange={(value) =>
                          setEditingPlan({ ...editingPlan, currency: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AMD">AMD</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-sm font-medium">Badge</label>
                      <Input
                        value={editingPlan.badge || ""}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, badge: e.target.value })
                        }
                        placeholder="e.g., Most Popular"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={editingPlan.description || ""}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Features Management */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Plan Features</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Toggle which features are included in this plan.
                      Feature names are managed via translations.
                    </p>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                      {allFeatures.map((feature) => {
                        const planFeature = editingPlan.features?.find(
                          (f) => f.id === feature.id
                        );
                        const isIncluded = planFeature?.isIncluded || false;

                        return (
                          <div
                            key={feature.id}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {feature.displayName}
                              </p>
                              {feature.description && (
                                <p className="text-xs text-gray-500">
                                  {feature.description}
                                </p>
                              )}
                            </div>
                            <Switch
                              checked={isIncluded}
                              onCheckedChange={(checked) => {
                                // Update features array
                                const updatedFeatures = editingPlan.features || [];
                                const existingIndex = updatedFeatures.findIndex(
                                  (f) => f.id === feature.id
                                );

                                if (existingIndex >= 0) {
                                  updatedFeatures[existingIndex].isIncluded = checked;
                                } else {
                                  updatedFeatures.push({
                                    ...feature,
                                    isIncluded: checked,
                                  });
                                }

                                setEditingPlan({
                                  ...editingPlan,
                                  features: updatedFeatures,
                                });
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditingPlan(null)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSavePlan}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
