import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertRsvpSchema, type InsertRsvp } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { weddingConfig } from "@/config/wedding-config";
import { WeddingConfig } from "@/templates/types";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { getHeadingFont, getBodyFont } from "@/utils/font-utils";

interface RsvpSectionProps {
  config?: WeddingConfig;
  templateId?: string;
}

export default function RsvpSection({ config = weddingConfig, templateId }: RsvpSectionProps) {
  const { toast } = useToast();
  const titleRef = useScrollAnimation('animate-fade-in-scale');
  const formRef = useScrollAnimation('animate-slide-up');
  
  const form = useForm<InsertRsvp>({
    resolver: zodResolver(insertRsvpSchema),
    defaultValues: {
      templateId: templateId || "",
      firstName: "",
      lastName: "",
      email: "",
      guestEmail: "",
      guestCount: "",
      guestNames: "",
      attendance: "attending",
      attending: true,
      guests: 1
    }
  });

  const rsvpMutation = useMutation({
    mutationFn: async (data: InsertRsvp) => {
      // Use template-specific endpoint if templateId is available
      const endpoint = templateId ? `/api/templates/${templateId}/rsvp` : "/api/rsvp";
      const response = await apiRequest("POST", endpoint, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Շնորհակալություն!",
        description: data.message,
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Սխալ",
        description: error.message || "Տեղի է ունեցել սխալ",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: InsertRsvp) => {
    // Ensure templateId is included and map fields correctly
    const submitData = {
      ...data,
      templateId: templateId || data.templateId,
      guestEmail: data.email || data.guestEmail, // Map email to guestEmail for schema compatibility
      attending: data.attendance === "attending",
      guests: parseInt(data.guestCount) || 1
    };
    rsvpMutation.mutate(submitData);
  };

  return (
    <section id="rsvp" className="py-12 sm:py-20" style={{
      background: `linear-gradient(to right, ${config.theme?.colors?.accent || '#e8d5b7'}20 0%, ${config.theme?.colors?.background || '#faf5f0'}30 100%)`
    }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={titleRef} className="text-center mb-12 sm:mb-16 animate-on-scroll">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6 sm:mb-8 leading-tight" 
              style={{ 
                fontFamily: getHeadingFont(config.theme?.fonts), 
                fontWeight: '300',
                color: config.theme?.colors?.primary || '#333333'
              }}
              data-testid="text-rsvp-title">
            {config.rsvp?.title}
          </h2>
          <div className="w-16 sm:w-24 h-0.5 mx-auto mb-6 sm:mb-8" style={{
            backgroundColor: config.theme?.colors?.accent || '#e8d5b7'
          }}></div>
          <p className="text-base sm:text-lg px-4" style={{
            color: `${config.theme?.colors?.primary || '#333333'}70`
          }} data-testid="text-rsvp-description">
            {config.rsvp?.description}
          </p>
        </div>
        
        <div ref={formRef} className="bg-white rounded-xl shadow-xl p-4 sm:p-6 lg:p-8 animate-on-scroll" data-testid="rsvp-form-container">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6" data-testid="rsvp-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{config.rsvp?.form?.firstName}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={config.rsvp?.form?.firstNamePlaceholder} 
                          {...field} 
                          data-testid="input-first-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{config.rsvp?.form?.lastName}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={config.rsvp?.form?.lastNamePlaceholder} 
                          {...field} 
                          data-testid="input-last-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{config.rsvp?.form?.email}</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder={config.rsvp?.form?.emailPlaceholder} 
                        {...field} 
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="guestCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{config.rsvp?.form?.guestCount}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-guest-count">
                          <SelectValue placeholder={config.rsvp?.form?.guestCountPlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {config.rsvp?.guestOptions?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="guestNames"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{config.rsvp?.form?.guestNames}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={config.rsvp?.form?.guestNamesPlaceholder}
                        rows={3}
                        {...field} 
                        data-testid="textarea-guest-names"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="attendance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{config.rsvp?.form?.attendance}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-3"
                        data-testid="radio-attendance"
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="attending" id="attending" />
                          <Label htmlFor="attending">{config.rsvp?.form?.attendingYes}</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="not-attending" id="not-attending" />
                          <Label htmlFor="not-attending">{config.rsvp?.form?.attendingNo}</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full text-white py-3 sm:py-4 font-medium transition-colors duration-300 transform hover:scale-105 text-sm sm:text-base hover:opacity-90"
                style={{
                  backgroundColor: config.theme?.colors?.accent || '#e8d5b7'
                }}
                disabled={rsvpMutation.isPending}
                data-testid="button-submit-rsvp"
              >
                {rsvpMutation.isPending ? config.rsvp?.form?.submittingButton : config.rsvp?.form?.submitButton}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}
