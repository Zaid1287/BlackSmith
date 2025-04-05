import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DriverList } from "@/components/driver-list";
import { VehicleMap } from "@/components/vehicle-map";
import { JourneyCard } from "@/components/journey-card";
import { FinancialStatus } from "@/components/financial-status";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: journeys = [] } = useQuery({ queryKey: ["journeys"] });
  const { data: activeJourneys = [] } = useQuery({ queryKey: ["journeys", "active"] });
  const { data: newJourneys = [] } = useQuery({ queryKey: ["journeys", "new"] });
  const { data: users = [] } = useQuery({ queryKey: ["users"] });

  return (
    <div className="space-y-4 p-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <h3 className="font-semibold">Total Drivers</h3>
              <p className="text-2xl">{users.length}</p>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold">Active Journeys</h3>
              <p className="text-2xl">{activeJourneys.length}</p>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold">New Requests</h3>
              <p className="text-2xl">{newJourneys.length}</p>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold">Total Journeys</h3>
              <p className="text-2xl">{journeys.length}</p>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FinancialStatus />
            <Card className="col-span-1">
              <div className="p-4">
                <h3 className="font-semibold mb-4">Recent Journeys</h3>
                <div className="space-y-4">
                  {journeys.slice(0, 5).map((journey) => (
                    <JourneyCard key={journey.id} journey={journey} />
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="drivers">
          <Card>
            <DriverList users={users} />
          </Card>
        </TabsContent>

        <TabsContent value="map">
          <Card className="p-4">
            <VehicleMap journeys={activeJourneys} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}