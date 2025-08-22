import { useState } from "react";
import { useForm } from "react-hook-form";
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

export default function RsvpSection() {
  const { toast } = useToast();
  
  const form = useForm<InsertRsvp>({
    resolver: zodResolver(insertRsvpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      guestCount: "",
      guestNames: "",
      attendance: "attending"
    }
  });

  const rsvpMutation = useMutation({
    mutationFn: async (data: InsertRsvp) => {
      const response = await apiRequest("POST", "/api/rsvp", data);
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
    rsvpMutation.mutate(data);
  };

  return (
    <section id="rsvp" className="py-20 bg-gradient-to-r from-lightGold/20 to-warmBeige/30">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl text-charcoal mb-8" 
              style={{ 
                fontFamily: 'Playfair Display, serif', 
                fontStyle: 'italic',
                fontWeight: '300'
              }}
              data-testid="text-rsvp-title">
            {weddingConfig.rsvp.title}
          </h2>
          <div className="w-24 h-0.5 bg-softGold mx-auto mb-8"></div>
          <p className="text-charcoal/70 text-lg" data-testid="text-rsvp-description">
            {weddingConfig.rsvp.description}
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-xl p-8" data-testid="rsvp-form-container">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="rsvp-form">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{weddingConfig.rsvp.form.firstName}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={weddingConfig.rsvp.form.firstNamePlaceholder} 
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
                      <FormLabel>{weddingConfig.rsvp.form.lastName}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={weddingConfig.rsvp.form.lastNamePlaceholder} 
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
                    <FormLabel>{weddingConfig.rsvp.form.email}</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder={weddingConfig.rsvp.form.emailPlaceholder} 
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
                    <FormLabel>{weddingConfig.rsvp.form.guestCount}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-guest-count">
                          <SelectValue placeholder={weddingConfig.rsvp.form.guestCountPlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {weddingConfig.rsvp.guestOptions.map((option) => (
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
                    <FormLabel>{weddingConfig.rsvp.form.guestNames}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={weddingConfig.rsvp.form.guestNamesPlaceholder}
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
                    <FormLabel>{weddingConfig.rsvp.form.attendance}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-3"
                        data-testid="radio-attendance"
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="attending" id="attending" />
                          <Label htmlFor="attending">{weddingConfig.rsvp.form.attendingYes}</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="not-attending" id="not-attending" />
                          <Label htmlFor="not-attending">{weddingConfig.rsvp.form.attendingNo}</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-softGold hover:bg-softGold/90 text-white py-4 font-medium transition-colors duration-300 transform hover:scale-105"
                disabled={rsvpMutation.isPending}
                data-testid="button-submit-rsvp"
              >
                {rsvpMutation.isPending ? weddingConfig.rsvp.form.submittingButton : weddingConfig.rsvp.form.submitButton}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}
