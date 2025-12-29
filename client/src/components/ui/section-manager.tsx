import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  GripVertical,
  Home,
  Clock,
  Calendar,
  MapPin,
  Clock4,
  Users,
  Camera,
  Music
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WeddingConfig } from '@/templates/types';

interface SectionConfig {
  id: string;
  name: string;
  title: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
  order: number;
  required?: boolean; // Some sections might be required
}

interface SectionManagerProps {
  config: WeddingConfig;
  onConfigChange: (newConfig: WeddingConfig) => void;
  className?: string;
}

const DEFAULT_SECTIONS: Omit<SectionConfig, 'enabled' | 'order'>[] = [
  { id: 'hero', name: 'Hero Section', title: 'Welcome & Hero', icon: Home, required: true },
  { id: 'countdown', name: 'Countdown Timer', title: 'Wedding Countdown', icon: Clock },
  { id: 'calendar', name: 'Calendar', title: 'Wedding Date', icon: Calendar },
  { id: 'locations', name: 'Locations', title: 'Venue Information', icon: MapPin },
  { id: 'timeline', name: 'Timeline', title: 'Wedding Timeline', icon: Clock4 },
  { id: 'rsvp', name: 'RSVP Form', title: 'Guest Registration', icon: Users },
  { id: 'photos', name: 'Photo Gallery', title: 'Wedding Photos', icon: Camera },
  { id: 'music', name: 'Background Music', title: 'Wedding Music', icon: Music },
];

export function SectionManager({ config, onConfigChange, className }: SectionManagerProps) {
  const [sections, setSections] = useState<SectionConfig[]>(() => {
    // Initialize sections from config
    const currentSections = config.sections || {};
    
    return DEFAULT_SECTIONS.map((section, index) => ({
      ...section,
      enabled: currentSections[section.id as keyof typeof currentSections]?.enabled !== false,
      order: currentSections[section.id as keyof typeof currentSections]?.order ?? index,
    })).sort((a, b) => a.order - b.order);
  });

  const updateConfig = (newSections: SectionConfig[]) => {
    const sectionsConfig: WeddingConfig['sections'] = {};
    
    newSections.forEach(section => {
      (sectionsConfig as any)[section.id] = { 
        enabled: section.enabled,
        order: section.order 
      };
    });

    const newConfig: WeddingConfig = {
      ...config,
      sections: sectionsConfig,
    };

    onConfigChange(newConfig);
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newSections = [...sections];
    const [movedSection] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, movedSection);

    // Update order values
    const reorderedSections = newSections.map((section, index) => ({
      ...section,
      order: index,
    }));

    setSections(reorderedSections);
    updateConfig(reorderedSections);
  };

  const toggleSection = (sectionId: string) => {
    const newSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, enabled: !section.enabled }
        : section
    );

    setSections(newSections);
    updateConfig(newSections);
  };

  const addSection = (sectionId: string) => {
    const sectionTemplate = DEFAULT_SECTIONS.find(s => s.id === sectionId);
    if (!sectionTemplate || sections.find(s => s.id === sectionId)) return;

    const newSection: SectionConfig = {
      ...sectionTemplate,
      enabled: true,
      order: sections.length,
    };

    const newSections = [...sections, newSection];
    setSections(newSections);
    updateConfig(newSections);
  };

  const removeSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section || section.required) return;

    const newSections = sections
      .filter(s => s.id !== sectionId)
      .map((section, index) => ({ ...section, order: index }));

    setSections(newSections);
    updateConfig(newSections);
  };

  const availableSections = DEFAULT_SECTIONS.filter(
    defaultSection => !sections.find(section => section.id === defaultSection.id)
  );

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GripVertical className="w-5 h-5" />
          Section Manager
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage the sections that appear on your wedding website. Drag to reorder, toggle visibility, or add/remove sections.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Sections */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Current Sections</h4>
          
          {sections.map((section, index) => {
            const IconComponent = section.icon;
            
            return (
              <div
                key={section.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                  section.enabled ? 'bg-background' : 'bg-muted/50'
                )}
              >
                {/* Drag Handle */}
                <div className="cursor-move text-muted-foreground">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Section Icon */}
                <div className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center',
                  section.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  <IconComponent className="w-4 h-4" />
                </div>

                {/* Section Info */}
                <div className="flex-1 min-w-0">
                  <h5 className={cn(
                    'font-medium text-sm truncate',
                    !section.enabled && 'text-muted-foreground'
                  )}>
                    {section.title}
                  </h5>
                  <p className="text-xs text-muted-foreground truncate">
                    {section.name}
                  </p>
                </div>

                {/* Status Badge */}
                <Badge 
                  variant={section.enabled ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {section.enabled ? 'Visible' : 'Hidden'}
                </Badge>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Move Up */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-8 h-8 p-0"
                    onClick={() => moveSection(index, index - 1)}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>

                  {/* Move Down */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-8 h-8 p-0"
                    onClick={() => moveSection(index, index + 1)}
                    disabled={index === sections.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>

                  {/* Toggle Visibility */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-8 h-8 p-0"
                    onClick={() => toggleSection(section.id)}
                  >
                    {section.enabled ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </Button>

                  {/* Remove Section */}
                  {!section.required && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => removeSection(section.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {sections.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No sections configured</p>
            </div>
          )}
        </div>

        {/* Add Section */}
        {availableSections.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium text-sm">Add Sections</h4>
            
            <div className="grid grid-cols-1 gap-2">
              {availableSections.map((section) => {
                const IconComponent = section.icon;
                
                return (
                  <Button
                    key={section.id}
                    variant="outline"
                    className="justify-start gap-3 h-auto py-3"
                    onClick={() => addSection(section.id)}
                  >
                    <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    
                    <div className="text-left">
                      <p className="font-medium text-sm">{section.title}</p>
                      <p className="text-xs text-muted-foreground">{section.name}</p>
                    </div>
                    
                    <Plus className="w-4 h-4 ml-auto" />
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {sections.filter(s => s.enabled).length} of {sections.length} sections visible
            </span>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Reset to default configuration
                const defaultSections = DEFAULT_SECTIONS.map((section, index) => ({
                  ...section,
                  enabled: true,
                  order: index,
                }));
                setSections(defaultSections);
                updateConfig(defaultSections);
              }}
            >
              Reset to Default
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
