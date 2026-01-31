import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PricingPlanEditorProps {
  plan: any; // Plan data from database or config
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedPlan: any) => void;
}

export default function PricingPlanEditor({
  plan,
  isOpen,
  onClose,
  onSave
}: PricingPlanEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Phase 2.2: Editable metadata state
  const planId = plan?.planKey || plan?.id || 'unknown';
  const planName = plan?.nameKey || planId;
  const planCurrency = plan?.currency || 'AMD';
  const planFeatures = plan?.features || [];
  
  // Editable fields with state
  const [price, setPrice] = useState(plan?.price || '');
  const [badge, setBadge] = useState(plan?.badge || '');
  const [enabled, setEnabled] = useState(plan?.enabled ?? true);
  const [isSaving, setIsSaving] = useState(false);

  // Save handler - PATCH to API
  const handleSave = async () => {
    // Basic validation
    if (!price || price.trim() === '') {
      toast({
        title: "Validation Error",
        description: "Price is required",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/configurable-pricing-plans/${plan.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price: price.trim(),
          badge: badge.trim() || null,
          enabled: enabled,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update plan');
      }

      // Success - refresh data and close
      await queryClient.invalidateQueries({ queryKey: ['/api/configurable-pricing-plans'] });
      
      toast({
        title: "Success",
        description: `Plan "${planId}" updated successfully`,
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save changes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            Edit Plan: {planId}
          </DialogTitle>
          <DialogDescription>
            Phase 2.2 - Edit pricing metadata (features remain read-only)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Plan Metadata - EDITABLE */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Plan Metadata</h3>
            <div className="space-y-4">
              {/* Read-only fields */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Plan Key (read-only)</Label>
                <p className="mt-1 text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded">{planId}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Translation Key (read-only)</Label>
                <p className="mt-1 text-gray-500 text-sm">{planName}</p>
              </div>

              {/* Editable: Price */}
              <div>
                <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                  Price *
                </Label>
                <Input
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g., 10,000 AMD"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: amount with optional currency (e.g., "10,000 AMD")
                </p>
              </div>

              {/* Read-only: Currency */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Currency (read-only)</Label>
                <p className="mt-1 text-gray-500 text-sm">{planCurrency}</p>
              </div>

              {/* Editable: Badge */}
              <div>
                <Label htmlFor="badge" className="text-sm font-medium text-gray-700">
                  Badge Key (optional)
                </Label>
                <Input
                  id="badge"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g., Most Popular"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to hide badge
                </p>
              </div>

              {/* Editable: Enabled toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                    Plan Enabled
                  </Label>
                  <p className="text-xs text-gray-500">
                    Disabled plans won't appear on the homepage
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
              </div>

              {/* Read-only: Popular status */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Popular Badge</Label>
                <p className="mt-1 text-gray-500 text-sm">{plan?.popular ? 'Yes (read-only)' : 'No (read-only)'}</p>
              </div>
            </div>
          </Card>

          {/* Plan Features - READ-ONLY (Phase 2.3 will add toggles) */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Plan Features (read-only)</h3>
            <p className="text-xs text-gray-500 mb-3">Feature toggles will be available in Phase 2.3</p>
            <div className="space-y-2">
              {planFeatures.length === 0 ? (
                <p className="text-gray-500 text-sm">No features configured</p>
              ) : (
                planFeatures.map((feature: any, index: number) => {
                  const featureKey = feature.featureKey || feature.translationKey || 'Unknown';
                  const isEnabled = feature.isEnabled ?? feature.included ?? false;
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm">{featureKey}</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        isEnabled 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isEnabled ? 'Included' : 'Not Included'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
