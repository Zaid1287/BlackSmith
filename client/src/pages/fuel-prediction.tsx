import { useEffect, useState } from "react";
import { FuelCalculator } from "@/components/fuel-calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import {
  VEHICLE_EFFICIENCY,
  ROAD_CONDITION,
  calculateFuelConsumption,
  formatCurrency
} from "@/lib/utils";
import { Fuel, TrendingUp, BarChart3, History } from "lucide-react";

// Sample historical data
const fuelHistory = [
  { month: 'Jan', consumption: 450, cost: 45000, efficiency: 4.2 },
  { month: 'Feb', consumption: 420, cost: 42000, efficiency: 4.3 },
  { month: 'Mar', consumption: 480, cost: 48000, efficiency: 4.0 },
  { month: 'Apr', consumption: 460, cost: 46000, efficiency: 4.1 },
  { month: 'May', consumption: 500, cost: 50000, efficiency: 3.9 },
  { month: 'Jun', consumption: 520, cost: 52000, efficiency: 3.8 },
];

// Define types for the chart data
type DistanceData = { 
  distance: number; 
  smallTruck: number; 
  mediumTruck: number; 
  largeTruck: number; 
};
  
type EfficiencyData = {
  condition: string;
  efficiency: number;
  factor: number;
};

// Generate distance vs fuel consumption data
function generateDistanceVsFuelData(): DistanceData[] {
  const data: DistanceData[] = [];
  for (let distance = 100; distance <= 1000; distance += 100) {
    const smallTruckConsumption = calculateFuelConsumption(distance, 'SMALL_TRUCK', 'HIGHWAY', 'NORMAL');
    const mediumTruckConsumption = calculateFuelConsumption(distance, 'MEDIUM_TRUCK', 'HIGHWAY', 'NORMAL');
    const largeTruckConsumption = calculateFuelConsumption(distance, 'LARGE_TRUCK', 'HIGHWAY', 'NORMAL');
    
    data.push({
      distance,
      smallTruck: parseFloat(smallTruckConsumption.toFixed(2)),
      mediumTruck: parseFloat(mediumTruckConsumption.toFixed(2)),
      largeTruck: parseFloat(largeTruckConsumption.toFixed(2)),
    });
  }
  return data;
}

// Generate road condition vs efficiency data
function generateRoadVsEfficiencyData(): EfficiencyData[] {
  const data: EfficiencyData[] = [];
  
  // Get base efficiency for a medium truck
  const baseEfficiency = VEHICLE_EFFICIENCY.MEDIUM_TRUCK;
  
  // For each road condition, calculate the adjusted efficiency
  Object.entries(ROAD_CONDITION).forEach(([condition, factor]) => {
    if (condition !== 'DEFAULT') {
      const adjustedEfficiency = baseEfficiency / factor;
      
      data.push({
        condition: condition.charAt(0) + condition.slice(1).toLowerCase(),
        efficiency: parseFloat(adjustedEfficiency.toFixed(2)),
        factor: parseFloat(factor.toFixed(2)),
      });
    }
  });
  
  return data;
}

export default function FuelPredictionPage() {
  const { user } = useAuth();
  const [distanceVsFuelData, setDistanceVsFuelData] = useState<DistanceData[]>([]);
  const [roadVsEfficiencyData, setRoadVsEfficiencyData] = useState<EfficiencyData[]>([]);
  
  useEffect(() => {
    setDistanceVsFuelData(generateDistanceVsFuelData());
    setRoadVsEfficiencyData(generateRoadVsEfficiencyData());
  }, []);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Fuel Consumption Prediction</h1>
      
      <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="calculator" className="flex items-center">
            <Fuel className="mr-2 h-4 w-4" />
            Calculator
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center">
            <History className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>
        
        {/* Calculator Tab */}
        <TabsContent value="calculator">
          <FuelCalculator />
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distance vs Fuel Consumption Graph */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Distance vs Fuel Consumption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={distanceVsFuelData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="distance" 
                        label={{ 
                          value: 'Distance (km)', 
                          position: 'insideBottomRight', 
                          offset: -10 
                        }} 
                      />
                      <YAxis 
                        label={{ 
                          value: 'Fuel Consumption (L)', 
                          angle: -90, 
                          position: 'insideLeft'
                        }} 
                      />
                      <Tooltip formatter={(value: number | string) => [`${value} liters`, 'Consumption']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="smallTruck" 
                        name="Small Truck" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="mediumTruck" 
                        name="Medium Truck" 
                        stroke="#82ca9d" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="largeTruck" 
                        name="Large Truck" 
                        stroke="#ff7300" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  This graph shows the relationship between distance traveled and fuel consumption for different truck types.
                  Larger trucks consume more fuel per kilometer.
                </p>
              </CardContent>
            </Card>
            
            {/* Road Condition vs Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Road Condition Effect on Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={roadVsEfficiencyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="condition" />
                      <YAxis 
                        label={{ 
                          value: 'Efficiency (km/L)', 
                          angle: -90, 
                          position: 'insideLeft'
                        }} 
                      />
                      <Tooltip formatter={(value: number | string) => [`${value} km/L`, 'Efficiency']} />
                      <Legend />
                      <Bar dataKey="efficiency" fill="#8884d8" name="Fuel Efficiency" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  This chart shows how different road conditions affect fuel efficiency.
                  Highway driving offers the best efficiency, while mountainous terrain has the highest fuel consumption.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="mr-2 h-5 w-5" />
                Fuel Consumption History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={fuelHistory}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value: number | string, name: string) => {
                        if (name === 'consumption') return [`${value} L`, 'Consumption'];
                        if (name === 'cost') return [formatCurrency(Number(value)), 'Cost'];
                        if (name === 'efficiency') return [`${value} km/L`, 'Efficiency'];
                        return [value, name];
                      }} 
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="consumption" 
                      name="Total Consumption (L)" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="cost" 
                      name="Total Cost (₹)" 
                      stroke="#82ca9d" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <Card className="bg-gradient-to-br from-blue-100 to-blue-50">
                  <CardContent className="p-4">
                    <div className="text-sm text-blue-600 mb-1">Average Monthly Consumption</div>
                    <div className="text-2xl font-semibold">
                      {(fuelHistory.reduce((acc, item) => acc + item.consumption, 0) / fuelHistory.length).toFixed(2)} L
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-100 to-green-50">
                  <CardContent className="p-4">
                    <div className="text-sm text-green-600 mb-1">Average Monthly Cost</div>
                    <div className="text-2xl font-semibold">
                      {formatCurrency(fuelHistory.reduce((acc, item) => acc + item.cost, 0) / fuelHistory.length)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-amber-100 to-amber-50">
                  <CardContent className="p-4">
                    <div className="text-sm text-amber-600 mb-1">Average Efficiency</div>
                    <div className="text-2xl font-semibold">
                      {(fuelHistory.reduce((acc, item) => acc + item.efficiency, 0) / fuelHistory.length).toFixed(2)} km/L
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}