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
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-charcoal mb-4" data-testid="text-rsvp-title">
            Հաստատել մասնակցությունը
          </h2>
          <div className="ornament w-full h-8 mb-6"></div>
          <p className="text-charcoal/70" data-testid="text-rsvp-description">
            Խնդրում ենք հաստատել ձեր մասնակցությունը մինչև մարտի 1-ը
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
                      <FormLabel>Անուն</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ձեր անունը" 
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
                      <FormLabel>Ազգանուն</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ձեր ազգանունը" 
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
                    <FormLabel>Էլ․ հասցե</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="your@email.com" 
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
                    <FormLabel>Հյուրերի քանակ</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-guest-count">
                          <SelectValue placeholder="Ընտրեք հյուրերի քանակը" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 հյուր</SelectItem>
                        <SelectItem value="2">2 հյուր</SelectItem>
                        <SelectItem value="3">3 հյուր</SelectItem>
                        <SelectItem value="4">4 հյուր</SelectItem>
                        <SelectItem value="5+">5+ հյուր</SelectItem>
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
                    <FormLabel>Հյուրերի անունները և ազգանունները</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Նշեք բոլոր հյուրերի անունները և ազգանունները"
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
                    <FormLabel>Մասնակցություն</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-3"
                        data-testid="radio-attendance"
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="attending" id="attending" />
                          <Label htmlFor="attending">Մասնակցում եմ</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="not-attending" id="not-attending" />
                          <Label htmlFor="not-attending">Չեմ մասնակցում</Label>
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
                {rsvpMutation.isPending ? "Ուղարկվում է..." : "Ուղարկել հաստատումը"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}
