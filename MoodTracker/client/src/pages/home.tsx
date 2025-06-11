import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMoodEntrySchema, type InsertMoodEntry } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Loader2, CheckCircle } from "lucide-react";

const moodOptions = [
  { value: "amazing", emoji: "😄", label: "Amazing" },
  { value: "happy", emoji: "😊", label: "Happy" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "sad", emoji: "😔", label: "Sad" },
  { value: "excited", emoji: "🤩", label: "Excited" },
  { value: "tired", emoji: "😴", label: "Tired" },
  { value: "stressed", emoji: "😰", label: "Stressed" },
  { value: "angry", emoji: "😠", label: "Angry" },
];

const ageRanges = [
  { value: "under-18", label: "Under 18" },
  { value: "18-24", label: "18-24" },
  { value: "25-34", label: "25-34" },
  { value: "35-44", label: "35-44" },
  { value: "45-54", label: "45-54" },
  { value: "55-64", label: "55-64" },
  { value: "65-plus", label: "65+" },
];

export default function Home() {
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<InsertMoodEntry>({
    resolver: zodResolver(insertMoodEntrySchema.extend({
      mood: insertMoodEntrySchema.shape.mood.refine(val => val.length > 0, "Please select how you're feeling"),
      location: insertMoodEntrySchema.shape.location.refine(val => val.length > 0, "Please enter your location"),
    })),
    defaultValues: {
      mood: "",
      location: "",
      thoughts: "",
      ageRange: "",
      latitude: "",
      longitude: "",
    },
  });

  const createMoodEntryMutation = useMutation({
    mutationFn: async (data: InsertMoodEntry) => {
      const response = await apiRequest("POST", "/api/mood-entries", data);
      return response.json();
    },
    onSuccess: () => {
      setShowSuccess(true);
      form.reset();
      setSelectedMood("");
      
      // Hide success message and reset after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit your entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Please enter your location manually.",
        variant: "destructive",
      });
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get readable location
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          
          const location = data.city && data.countryName 
            ? `${data.city}, ${data.countryName}`
            : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          
          form.setValue("location", location);
          form.setValue("latitude", latitude.toString());
          form.setValue("longitude", longitude.toString());
        } catch (error) {
          // Fallback to coordinates if geocoding fails
          form.setValue("location", `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          form.setValue("latitude", latitude.toString());
          form.setValue("longitude", longitude.toString());
        }
        
        setIsDetectingLocation(false);
      },
      (error) => {
        setIsDetectingLocation(false);
        let message = "Unable to detect location. Please enter manually.";
        
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location access denied. Please enter your location manually.";
        } else if (error.code === error.TIMEOUT) {
          message = "Location detection timed out. Please try again or enter manually.";
        }
        
        toast({
          title: "Location Detection Failed",
          description: message,
          variant: "destructive",
        });
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 300000,
      }
    );
  };

  // Auto-detect location on page load
  useEffect(() => {
    detectLocation();
  }, []);

  const onSubmit = (data: InsertMoodEntry) => {
    createMoodEntryMutation.mutate(data);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-green-200/30 to-emerald-200/20 blur-xl"></div>
          <div className="absolute top-40 right-16 w-24 h-24 rounded-full bg-gradient-to-br from-green-300/40 to-emerald-200/20 blur-lg"></div>
          <div className="absolute bottom-32 left-20 w-28 h-28 rounded-full bg-gradient-to-br from-emerald-200/30 to-green-200/20 blur-xl"></div>
          <div className="absolute bottom-20 right-8 w-20 h-20 rounded-full bg-gradient-to-br from-green-300/25 to-emerald-200/15 blur-lg"></div>
        </div>

        <div className="max-w-md mx-auto relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-6 shadow-lg animate-pulse">
              <span className="text-3xl">✨</span>
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Thank You!</h2>
            <p className="text-green-700">Your feelings have been shared with the world</p>
          </div>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="text-green-600 w-8 h-8 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Successfully Shared!</h3>
                  <p className="text-sm text-green-600 mt-1">Your mood is now part of the global conversation</p>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-green-700">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Connected to 🌍 worldwide</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-orange-200/30 to-peach-200/20 blur-xl"></div>
        <div className="absolute top-40 right-16 w-24 h-24 rounded-full bg-gradient-to-br from-yellow-200/40 to-orange-200/20 blur-lg"></div>
        <div className="absolute bottom-32 left-20 w-28 h-28 rounded-full bg-gradient-to-br from-peach-200/30 to-cream-200/20 blur-xl"></div>
        <div className="absolute bottom-20 right-8 w-20 h-20 rounded-full bg-gradient-to-br from-orange-300/25 to-yellow-200/15 blur-lg"></div>
        
        {/* Global connection visualization */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-orange-400/40 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-peach-400/40 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-yellow-400/40 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-orange-400/40 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>

      <div className="max-w-md mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-peach-400 mb-4 shadow-lg floating-animation pulse-glow">
              <span className="text-2xl">🌍</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-secondary mb-2 bg-gradient-to-r from-orange-600 to-peach-600 bg-clip-text text-transparent">
            How Are You Today?
          </h1>
          <p className="text-gray-600 text-sm">Share your feelings with the world</p>
          <div className="flex items-center justify-center mt-3 space-x-2 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Connected globally</span>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border border-orange-100/50">
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Mood Selection */}
                <FormField
                  control={form.control}
                  name="mood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-secondary">
                        How are you feeling? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-4 gap-3">
                          {moodOptions.map((mood) => (
                            <button
                              key={mood.value}
                              type="button"
                              onClick={() => {
                                setSelectedMood(mood.value);
                                field.onChange(mood.value);
                              }}
                              className={`aspect-square border-2 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transform hover:scale-105 ${
                                selectedMood === mood.value
                                  ? "border-orange-400 bg-gradient-to-br from-orange-50 to-peach-50 shadow-lg scale-105"
                                  : "border-orange-200/50 bg-gradient-to-br from-white to-orange-50/30 hover:bg-gradient-to-br hover:from-orange-50 hover:to-peach-50 hover:border-orange-300 hover:shadow-md"
                              }`}
                            >
                              {mood.emoji}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location Input */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-secondary">
                        Where are you? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            placeholder={isDetectingLocation ? "Detecting location..." : "Enter your location"}
                            className="pr-12 border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white/50 backdrop-blur-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={detectLocation}
                            disabled={isDetectingLocation}
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary p-2"
                          >
                            {isDetectingLocation ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MapPin className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      {isDetectingLocation && (
                        <div className="text-xs text-gray-500 flex items-center">
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Detecting your location...
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Optional Text Area */}
                <FormField
                  control={form.control}
                  name="thoughts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-secondary">
                        Want to share anything? <span className="text-gray-400 text-xs">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          rows={4}
                          placeholder="Share what's on your mind..."
                          className="resize-none border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white/50 backdrop-blur-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Age Range Dropdown */}
                <FormField
                  control={form.control}
                  name="ageRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-secondary">
                        Age range? <span className="text-gray-400 text-xs">(optional)</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white/50 backdrop-blur-sm">
                            <SelectValue placeholder="Select age range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ageRanges.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={createMoodEntryMutation.isPending}
                    className="w-full bg-gradient-to-r from-orange-500 to-peach-500 hover:from-orange-600 hover:to-peach-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    {createMoodEntryMutation.isPending ? (
                      <>
                        Sharing with the world...
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        <span className="mr-2">🌍</span>
                        Share Your Feelings
                      </>
                    )}
                  </Button>
                </div>

              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
