import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  // Phase 2.1: Read-only display of plan data
  // No editing logic yet - just showing what we have
  
  const planId = plan?.planKey || plan?.id || 'unknown';
  const planName = plan?.nameKey || planId;
  const planPrice = plan?.price || 'N/A';
  const planCurrency = plan?.currency || 'AMD';
  const planBadge = plan?.badge || '';
  const planEnabled = plan?.enabled ?? true;
  const planFeatures = plan?.features || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            Edit Plan: {planId}
          </DialogTitle>
          <DialogDescription>
            Phase 2.1 - Editor Shell (Read-only display)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Plan Metadata Display */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Plan Metadata</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Plan Key</label>
                <p className="mt-1 text-gray-900">{planId}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Translation Key</label>
                <p className="mt-1 text-gray-900">{planName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Price</label>
                  <p className="mt-1 text-gray-900">{planPrice}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Currency</label>
                  <p className="mt-1 text-gray-900">{planCurrency}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Badge</label>
                <p className="mt-1 text-gray-900">{planBadge || '(none)'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 text-gray-900">{planEnabled ? 'Enabled' : 'Disabled'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Popular Badge</label>
                <p className="mt-1 text-gray-900">{plan?.popular ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </Card>

          {/* Plan Features Display */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Plan Features</h3>
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
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
          
          <div className="text-sm text-gray-500">
            Phase 2.2 will add editing functionality
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
