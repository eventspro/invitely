import { useState } from "react";
import { X, Save, Loader2, AlertCircle } from "lucide-react";
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
import { useQueryClient } from "@tanstack/react-query";

interface AddPricingPlanProps {
  existingPlans: any[];
  isOpen: boolean;
  onClose: () => void;
}

export default function AddPricingPlan({
  existingPlans,
  isOpen,
  onClose
}: AddPricingPlanProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [planKey, setPlanKey] = useState('');
  const [price, setPrice] = useState('');
  const [badge, setBadge] = useState('');
  const [templateRoute, setTemplateRoute] = useState('/classic');
  const [enabled, setEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Validation state
  const [keyError, setKeyError] = useState('');

  // Validate plan key
  const validatePlanKey = (key: string): boolean => {
    setKeyError('');
    
    if (!key || key.trim() === '') {
      setKeyError('Plan key is required');
      return false;
    }

    // Check format: lowercase alphanumeric with hyphens/underscores
    if (!/^[a-z0-9_-]+$/.test(key)) {
      setKeyError('Plan key must be lowercase alphanumeric with hyphens/underscores only');
      return false;
    }

    // Check uniqueness
    const existingKeys = existingPlans.map(p => p.planKey || p.id).filter(Boolean);
    if (existingKeys.includes(key)) {
      setKeyError('Plan key already exists. Please choose a unique key.');
      return false;
    }

    return true;
  };

  // Handle plan key change with validation
  const handleKeyChange = (value: string) => {
    setPlanKey(value.toLowerCase().trim());
    if (value) {
      validatePlanKey(value.toLowerCase().trim());
    } else {
      setKeyError('');
    }
  };

  // Reset form
  const resetForm = () => {
    setPlanKey('');
    setPrice('');
    setBadge('');
    setTemplateRoute('/classic');
    setEnabled(false);
    setKeyError('');
  };

  // Handle save
  const handleSave = async () => {
    // Validate all required fields
    if (!validatePlanKey(planKey)) {
      return;
    }

    if (!price || price.trim() === '') {
      toast({
        title: "Validation Error",
        description: "Price is required",
        variant: "destructive"
      });
      return;
    }

    if (!templateRoute || templateRoute.trim() === '') {
      toast({
        title: "Validation Error",
        description: "Template route is required",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Calculate orderIndex (last position)
      const maxOrder = existingPlans.length > 0 
        ? Math.max(...existingPlans.map(p => p.orderIndex || 0))
        : -1;
      const newOrderIndex = maxOrder + 1;

      // Create new plan
      const response = await fetch('/api/configurable-pricing-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planKey: planKey.trim(),
          price: price.trim(),
          currency: 'AMD',
          badge: badge.trim() || null,
          badgeKey: null, // No auto-generated translation key
          badgeColor: null,
          enabled: enabled,
          popular: false,
          orderIndex: newOrderIndex,
          templateRoute: templateRoute.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create plan');
      }

      const newPlan = await response.json();

      // Success - refresh data and close
      await queryClient.invalidateQueries({ queryKey: ['/api/configurable-pricing-plans'] });
      
      toast({
        title: "Success",
        description: `Plan "${planKey}" created successfully${!enabled ? ' (disabled by default)' : ''}`,
      });

      resetForm();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create plan",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Add New Pricing Plan
          </DialogTitle>
          <DialogDescription>
            Create a new pricing plan. New plans start disabled by default with no features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning about translations */}
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Translation Note</p>
                <p>
                  This tool creates the plan structure only. You must add translations separately 
                  via the translation system for the plan name and description to appear correctly.
                </p>
              </div>
            </div>
          </Card>

          {/* Plan Key (required, unique, immutable) */}
          <div>
            <Label htmlFor="planKey" className="text-sm font-medium">
              Plan Key * <span className="text-gray-500 font-normal">(immutable after creation)</span>
            </Label>
            <Input
              id="planKey"
              value={planKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder="e.g., enterprise, ultimate-plus"
              className={keyError ? 'border-red-500' : ''}
              disabled={isSaving}
            />
            {keyError && (
              <p className="text-sm text-red-600 mt-1">{keyError}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Lowercase letters, numbers, hyphens, and underscores only. Must be unique.
            </p>
          </div>

          {/* Price (required) */}
          <div>
            <Label htmlFor="price" className="text-sm font-medium">
              Price *
            </Label>
            <Input
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 50,000 AMD"
              disabled={isSaving}
            />
            <p className="text-xs text-gray-500 mt-1">
              Display format: amount with optional currency (e.g., "50,000 AMD")
            </p>
          </div>

          {/* Currency (read-only default) */}
          <div>
            <Label className="text-sm font-medium">
              Currency <span className="text-gray-500 font-normal">(read-only)</span>
            </Label>
            <p className="mt-1 text-gray-600 text-sm">AMD (Armenian Dram)</p>
          </div>

          {/* Template Route (required) */}
          <div>
            <Label htmlFor="templateRoute" className="text-sm font-medium">
              Template Route *
            </Label>
            <Input
              id="templateRoute"
              value={templateRoute}
              onChange={(e) => setTemplateRoute(e.target.value)}
              placeholder="/classic"
              disabled={isSaving}
            />
            <p className="text-xs text-gray-500 mt-1">
              Route to demo template (e.g., /classic, /pro, /elegant). Must start with "/".
            </p>
          </div>

          {/* Badge (optional) */}
          <div>
            <Label htmlFor="badge" className="text-sm font-medium">
              Badge <span className="text-gray-500 font-normal">(optional)</span>
            </Label>
            <Input
              id="badge"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="e.g., Most Popular, Best Value"
              disabled={isSaving}
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to hide badge. This is a display label, not a translation key.
            </p>
          </div>

          {/* Enabled toggle */}
          <div className="flex items-center justify-between py-3 border-t border-b">
            <div>
              <Label htmlFor="enabled" className="text-sm font-medium">
                Enable on Homepage
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Disabled plans won't appear on the homepage. Recommended: leave disabled until configured.
              </p>
            </div>
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={isSaving}
            />
          </div>

          {/* Info about features */}
          <Card className="p-4 bg-gray-50">
            <p className="text-sm text-gray-700">
              <strong>Features:</strong> New plans start with no features. After creating the plan, 
              use the plan editor to add and configure features.
            </p>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => {
              resetForm();
              onClose();
            }} 
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Plan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Plan
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
