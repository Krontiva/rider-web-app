'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from 'next/navigation';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

interface Route {
  id: number;
  pickup: {
    name: string;
    coordinates: string;
  };
  dropoff: {
    name: string;
    coordinates: string;
  };
  userPrice: string;
  averagePrice: number | null;
}

interface PriceSubmission {
  id: string;
  created_at: number;
  delika_user_table_id: string;
  prices: {
    name: string;
    price: number;
    currency: string;
    amountInWords: string;
  }[];
}

const initialRoutes: Route[] = [
  {
    id: 1,
    pickup: {
      name: "Madina Zongo Junction",
      coordinates: "5.6764° N, -0.1775° W",
    },
    dropoff: {
      name: "Boundary Road, East Legon",
      coordinates: "5.6390° N, -0.1675° W",
    },
    userPrice: "",
    averagePrice: null,
  },
  {
    id: 2,
    pickup: {
      name: "Oxford Street, Osu",
      coordinates: "5.5520° N, -0.1950° W",
    },
    dropoff: {
      name: "Ministries (Accra)",
      coordinates: "5.5523° N, -0.2021° W",
    },
    userPrice: "",
    averagePrice: null,
  },
  {
    id: 3,
    pickup: {
      name: "Oxford Street, Osu",
      coordinates: "5.5520° N, -0.1950° W",
    },
    dropoff: {
      name: "Airport Residential Area",
      coordinates: "5.6095° N, -0.1680° W",
    },
    userPrice: "",
    averagePrice: null,
  },
  {
    id: 4,
    pickup: {
      name: "Oxford Street, Osu",
      coordinates: "5.5520° N, -0.1950° W",
    },
    dropoff: {
      name: "Tudu, Accra Central",
      coordinates: "5.5524° N, -0.2020° W",
    },
    userPrice: "",
    averagePrice: null,
  },
  {
    id: 5,
    pickup: {
      name: "Lapaz Total",
      coordinates: "5.6050° N, -0.2160° W",
    },
    dropoff: {
      name: "Kwashieman",
      coordinates: "5.6020° N, -0.2040° W",
    },
    userPrice: "",
    averagePrice: null,
  },
  {
    id: 6,
    pickup: {
      name: "Tudu, Accra Central",
      coordinates: "5.5524° N, -0.2020° W",
    },
    dropoff: {
      name: "Legon University",
      coordinates: "5.6500° N, -0.1860° W",
    },
    userPrice: "",
    averagePrice: null,
  },
  {
    id: 7,
    pickup: {
      name: "Abeka",
      coordinates: "5.5800° N, -0.2100° W",
    },
    dropoff: {
      name: "Awoshie",
      coordinates: "5.5800° N, -0.2300° W",
    },
    userPrice: "",
    averagePrice: null,
  },
  {
    id: 8,
    pickup: {
      name: "Flower Pot, Spintex",
      coordinates: "5.6010° N, -0.1420° W",
    },
    dropoff: {
      name: "Kpone Barrier",
      coordinates: "5.5830° N, -0.1000° W",
    },
    userPrice: "",
    averagePrice: null,
  },
];

interface PricingPreferencesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function numberToWords(num: number): string {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

  if (num === 0) return 'zero';

  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';

    let result = '';

    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' hundred ';
      n %= 100;
      if (n > 0) result += 'and ';
    }

    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      return result;
    }

    if (n > 0) {
      result += ones[n] + ' ';
    }

    return result;
  }

  const wholePart = Math.floor(num);
  const decimalPart = Math.round((num - wholePart) * 100);

  let result = convertLessThanThousand(wholePart);
  
  if (decimalPart > 0) {
    result += 'point ' + convertLessThanThousand(decimalPart);
  }

  return result.trim();
}

export default function PricingPreferences({ open, onOpenChange }: PricingPreferencesProps) {
  const [routes, setRoutes] = useState<Route[]>(initialRoutes);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userPricing, setUserPricing] = useState<PriceSubmission | null>(null);
  const [showStepper, setShowStepper] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserDetailsAndPrices = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          router.push('/');
          return;
        }

        // Fetch user details
        const userResponse = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/auth/me', {
          headers: {
            'X-Xano-Authorization': `Bearer ${authToken}`,
            'X-Xano-Authorization-Only': 'true',
          }
        });

        if (!userResponse.ok) {
          throw new Error('Failed to get user details');
        }

        const userData = await userResponse.json();
        setUserId(userData.id);

        // Fetch pricing data
        const pricingResponse = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/delikeriderpricing', {
          headers: {
            'X-Xano-Authorization': `Bearer ${authToken}`,
          }
        });

        if (!pricingResponse.ok) {
          throw new Error('Failed to fetch pricing data');
        }

        const pricingData: PriceSubmission[] = await pricingResponse.json();

        // Find this user's pricing submission
        const userPricingSubmission = pricingData.find(p => p.delika_user_table_id === userData.id) || null;
        setUserPricing(userPricingSubmission);

        // Calculate averages for each route
        const averages = new Map<string, { total: number; count: number }>();
        
        pricingData.forEach(submission => {
          submission.prices.forEach(price => {
            if (!averages.has(price.name)) {
              averages.set(price.name, { total: 0, count: 0 });
            }
            const current = averages.get(price.name)!;
            current.total += price.price;
            current.count += 1;
          });
        });

        // Update routes with average prices and prefill user prices if available
        const updatedRoutes = initialRoutes.map(route => {
          const routeName = `${route.pickup.name} to ${route.dropoff.name}`;
          const average = averages.get(routeName);
          let userPrice = '';
          if (userPricingSubmission) {
            const userRoute = userPricingSubmission.prices.find(p => p.name === routeName);
            if (userRoute) userPrice = userRoute.price.toString();
          }
          return {
            ...route,
            userPrice,
            averagePrice: average ? average.total / average.count : null
          };
        });

        setRoutes(updatedRoutes);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchUserDetailsAndPrices();
      setShowStepper(false); // Reset stepper state when modal opens
    }
  }, [open, router]);

  const handlePriceChange = (id: number, value: string) => {
    setRoutes(prevRoutes =>
      prevRoutes.map(route =>
        route.id === id ? { ...route, userPrice: value } : route
      )
    );
  };

  const handleNext = () => {
    if (currentStep < routes.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!userId) {
      console.error('No user ID available');
      return;
    }

    setIsSubmitting(true);
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        router.push('/');
        return;
      }

      const prices = routes.map(route => ({
        name: `${route.pickup.name} to ${route.dropoff.name}`,
        price: parseFloat(route.userPrice) || 0,
        currency: "GHS",
        amountInWords: `${numberToWords(parseFloat(route.userPrice) || 0)} Ghana cedis`
      }));

      let response;
      if (userPricing) {
        // PATCH to update existing pricing
        response = await fetch(`https://api-server.krontiva.africa/api:uEBBwbSs/delikeriderpricing/${userPricing.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              delika_user_table_id: userId,
              prices: prices
            })
          }
        );
      } else {
        // POST to create new pricing
        response = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/delikeriderpricing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            delika_user_table_id: userId,
            prices: prices
          })
        });
      }

      if (!response.ok) {
        throw new Error('Failed to submit prices');
      }

      // After success, close stepper and refresh modal state
      setShowStepper(false);
      // Optionally, you can refetch user pricing here for instant update
      onOpenChange(false);
      router.push('/orders');
    } catch (error) {
      console.error('Error submitting prices:', error);
      alert('Failed to submit prices. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRoute = routes[currentStep];
  const isLastStep = currentStep === routes.length - 1;
  const progress = ((currentStep + 1) / routes.length) * 100;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <VisuallyHidden>
            <DialogTitle>Set Your Preferred Route Prices</DialogTitle>
          </VisuallyHidden>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FE5B18]"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If user has no pricing and hasn't started the stepper, show add option
  if (!userPricing && !showStepper) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] flex flex-col items-center justify-center">
          <DialogTitle>Zone Pricing</DialogTitle>
          <p className="text-center text-gray-600 mb-4">You have not set any zone pricing yet.</p>
          <button
            className="px-4 py-2 text-white bg-[#FE5B18] rounded-md hover:bg-[#e54d0e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FE5B18]"
            onClick={() => setShowStepper(true)}
          >
            Add Zone Pricing
          </button>
        </DialogContent>
      </Dialog>
    );
  }

  // If user has pricing and isn't editing, show a list of their set prices
  if (userPricing && !showStepper) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Your Zone Pricing</DialogTitle>
          <div className="divide-y divide-gray-200 my-4">
            {userPricing.prices.map((price, idx) => (
              <div key={idx} className="py-3 flex flex-col">
                <span className="font-medium text-gray-900">{price.name}</span>
                <span className="text-sm text-gray-600">GHS {price.price.toFixed(2)}</span>
                <span className="text-xs text-gray-400">{price.amountInWords}</span>
              </div>
            ))}
          </div>
          <button
            className="mt-2 px-4 py-2 text-white bg-[#FE5B18] rounded-md hover:bg-[#e54d0e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FE5B18]"
            onClick={() => setShowStepper(true)}
          >
            Edit Zone Pricing
          </button>
        </DialogContent>
      </Dialog>
    );
  }

  // Otherwise, show the stepper as before
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Your Preferred Route Prices</DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {routes.length}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 h-2 rounded-full mb-4">
          <div
            className="bg-[#FE5B18] h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <div className="space-y-1">
                <Label className="font-semibold">Pickup</Label>
                <p className="text-sm text-gray-600">{currentRoute.pickup.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Dropoff</Label>
                <p className="text-sm text-gray-600">{currentRoute.dropoff.name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Your Price (GHS)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={currentRoute.userPrice}
                onChange={(e) => handlePriceChange(currentRoute.id, e.target.value)}
                placeholder="Enter your preferred price"
                className="w-full"
              />
              {currentRoute.averagePrice !== null && (
                <p className="text-sm text-gray-600 mt-1">
                  Average Price: GHS {currentRoute.averagePrice.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between mt-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FE5B18] disabled:opacity-50"
            >
              Previous
            </button>
            {!isLastStep ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-[#FE5B18] rounded-md hover:bg-[#e54d0e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FE5B18]"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-[#FE5B18] rounded-md hover:bg-[#e54d0e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FE5B18] disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit All'}
              </button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 