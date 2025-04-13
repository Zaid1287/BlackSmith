import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ArrowDown, Bell, Check, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Milestone {
  id: number;
  journeyId: number;
  type: string;
  title: string;
  message: string;
  data?: string | Record<string, any>;
  isDismissed: boolean;
  createdAt: string;
}

interface MilestoneNotificationProps {
  milestone: Milestone;
  onDismiss: (id: number) => void;
}

export function MilestoneNotification({ milestone, onDismiss }: MilestoneNotificationProps) {
  const getIconForType = (type: string) => {
    switch (type) {
      case "JOURNEY_START":
      case "JOURNEY_END":
        return <Bell className="h-4 w-4" />;
      case "HALFWAY_POINT":
      case "DISTANCE_MILESTONE":
        return <ArrowDown className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getBgColorForType = (type: string) => {
    switch (type) {
      case "JOURNEY_START":
        return "bg-blue-100 border-blue-200";
      case "JOURNEY_END":
        return "bg-green-100 border-green-200";
      case "EXPENSE_ALERT":
        return "bg-red-100 border-red-200";
      case "FUEL_STATION_NEARBY":
        return "bg-amber-100 border-amber-200";
      case "REST_REMINDER":
        return "bg-purple-100 border-purple-200";
      default:
        return "bg-gray-100 border-gray-200";
    }
  };

  return (
    <Alert className={`my-2 ${getBgColorForType(milestone.type)} shadow-sm p-2 sm:p-4`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-1 sm:gap-2">
          <div className="pt-1 hidden sm:block">{getIconForType(milestone.type)}</div>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <AlertTitle className="text-xs sm:text-sm font-semibold">{milestone.title}</AlertTitle>
              <Badge variant="outline" className="h-4 sm:h-5 text-[10px] sm:text-xs w-fit">
                {milestone.type.replace(/_/g, " ")}
              </Badge>
            </div>
            <AlertDescription className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">
              {milestone.message}
            </AlertDescription>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
              {formatDistanceToNow(new Date(milestone.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 sm:h-6 sm:w-6 -mt-1 sm:mt-0"
          onClick={() => onDismiss(milestone.id)}
        >
          <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </Alert>
  );
}

interface MilestoneNotificationsContainerProps {
  journeyId: number;
}

export function MilestoneNotificationsContainer({ journeyId }: MilestoneNotificationsContainerProps) {
  const { data: milestones, isLoading } = useQuery({
    queryKey: ["/api/journey", journeyId, "milestones/active"],
    queryFn: () => 
      fetch(`/api/journey/${journeyId}/milestones/active`).then(res => {
        if (!res.ok) throw new Error("Failed to fetch milestones");
        return res.json();
      }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const dismissMutation = useMutation({
    mutationFn: async (milestoneId: number) => {
      const res = await apiRequest("POST", `/api/milestone/${milestoneId}/dismiss`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journey", journeyId, "milestones/active"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error dismissing notification",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDismiss = (id: number) => {
    dismissMutation.mutate(id);
  };

  if (isLoading) return null;
  if (!milestones || milestones.length === 0) return null;

  return (
    <div className="max-h-96 overflow-y-auto">
      <ScrollArea className="h-full">
        <div className="space-y-2 p-1">
          {milestones.map((milestone: Milestone) => (
            <MilestoneNotification
              key={milestone.id}
              milestone={milestone}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Helper hook to create milestones
export function useCreateMilestone(journeyId: number) {
  return useMutation({
    mutationFn: async (milestoneData: {
      type: string;
      title: string;
      message: string;
      data?: string | Record<string, any>;
    }) => {
      const res = await apiRequest("POST", `/api/journey/${journeyId}/milestone`, milestoneData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journey", journeyId, "milestones/active"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating milestone",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}