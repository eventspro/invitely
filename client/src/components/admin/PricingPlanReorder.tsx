import { useState } from "react";
import { X, Save, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface PricingPlanReorderProps {
  plans: any[];
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingPlanReorder({
  plans,
  isOpen,
  onClose
}: PricingPlanReorderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Phase 3.1: Local staging of plan order
  const [orderedPlans, setOrderedPlans] = useState<any[]>(
    [...plans].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
  );
  const [isSaving, setIsSaving] = useState(false);

  // Move plan up (decrease orderIndex)
  const moveUp = (index: number) => {
    if (index === 0) return;
    
    const newOrder = [...orderedPlans];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrderedPlans(newOrder);
  };

  // Move plan down (increase orderIndex)
  const moveDown = (index: number) => {
    if (index === orderedPlans.length - 1) return;
    
    const newOrder = [...orderedPlans];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrderedPlans(newOrder);
  };

  // Save new order to database
  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Update each plan's orderIndex based on new position
      const updatePromises = orderedPlans.map(async (plan, index) => {
        const response = await fetch(`/api/configurable-pricing-plans/${plan.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderIndex: index
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `Failed to update plan ${plan.planKey || plan.id}`);
        }

        return response.json();
      });

      // Execute all updates
      await Promise.all(updatePromises);

      // Success - refresh data and close
      await queryClient.invalidateQueries({ queryKey: ['/api/configurable-pricing-plans'] });
      
      toast({
        title: "Success",
        description: `Plan order updated successfully`,
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save plan order",
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
          <DialogTitle className="text-2xl font-bold">
            Reorder Pricing Plans
          </DialogTitle>
          <DialogDescription>
            Change the display order of plans. Changes are saved when you click "Save Order".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <p className="text-sm text-gray-600 mb-4">
            Plans will appear on the homepage in this order (top to bottom):
          </p>

          {orderedPlans.map((plan, index) => {
            const planKey = plan.planKey || plan.id;
            const planLabel = planKey.charAt(0).toUpperCase() + planKey.slice(1);
            const isFirst = index === 0;
            const isLast = index === orderedPlans.length - 1;

            return (
              <Card key={plan.id} className="p-4">
                <div className="flex items-center gap-4">
                  {/* Order indicator */}
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>

                  {/* Plan info */}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {planLabel}
                    </div>
                    <div className="text-sm text-gray-500">
                      {plan.price} {plan.currency || 'AMD'}
                      {plan.badge && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reorder controls */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveUp(index)}
                      disabled={isFirst || isSaving}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveDown(index)}
                      disabled={isLast || isSaving}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
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
                Saving Order...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Order
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
