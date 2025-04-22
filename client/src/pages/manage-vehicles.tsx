import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AdminLayout } from '@/layouts/admin-layout';
import { VehicleForm } from '@/components/vehicle-form';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, Plus, Trash2, Car, Filter, 
  Activity, AlertTriangle, CheckSquare, 
  TrendingUp, Calendar, Search, X
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/hooks/use-locale';
import { Vehicle } from '@shared/schema';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';

// Added StatusBadge component for consistent styling
function StatusBadge({ status }: { status: string }) {
  const isAvailable = status === 'available';
  
  return (
    <Badge variant={isAvailable ? "success" : "destructive"} className="px-2 py-1 rounded-full text-xs">
      <div className="flex items-center gap-1">
        {isAvailable ? <CheckSquare className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
        <span className="capitalize">
          {status}
        </span>
      </div>
    </Badge>
  );
}

// Enhanced VehicleStats component to display fleet statistics with more visual polish
function VehicleStats({ vehicles }: { vehicles?: Vehicle[] }) {
  const { t } = useLocale();
  
  if (!vehicles) return null;
  
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === 'available').length;
  const inUseVehicles = totalVehicles - availableVehicles;
  const availabilityRate = totalVehicles ? Math.round((availableVehicles / totalVehicles) * 100) : 0;
  
  // Progress indicator for availability rate
  const AvailabilityIndicator = () => (
    <div className="w-full mt-2">
      <div className="w-full bg-purple-100 rounded-full h-2.5">
        <div 
          className="bg-purple-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
          style={{ width: `${availabilityRate}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-purple-600">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Vehicles Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-600 mb-1">Total Fleet</h3>
              <p className="text-3xl font-bold text-blue-700">{totalVehicles}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Car className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-blue-500 mt-3">Registered vehicles in system</p>
        </CardContent>
      </Card>
      
      {/* Available Vehicles Card */}
      <Card className="bg-gradient-to-br from-green-50 to-white border-green-200 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-600 mb-1">{t('vehicles', 'available')}</h3>
              <p className="text-3xl font-bold text-green-700">{availableVehicles}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckSquare className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-500 mt-3">Ready for new journeys</p>
        </CardContent>
      </Card>
      
      {/* In Use Vehicles Card */}
      <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-amber-600 mb-1">In Transit</h3>
              <p className="text-3xl font-bold text-amber-700">{inUseVehicles}</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-full">
              <Activity className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-amber-500 mt-3">Currently on active journeys</p>
        </CardContent>
      </Card>
      
      {/* Availability Rate Card with Visual Indicator */}
      <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-sm font-medium text-purple-600 mb-1">Fleet Availability</h3>
              <p className="text-3xl font-bold text-purple-700">{availabilityRate}%</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <AvailabilityIndicator />
        </CardContent>
      </Card>
    </div>
  );
}

export function ManageVehicles() {
  const { toast } = useToast();
  const { t } = useLocale();
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all vehicles
  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
  });
  
  // Filtered vehicles based on search and status filter
  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    
    return vehicles.filter(vehicle => {
      // First apply status filter
      if (statusFilter && vehicle.status !== statusFilter) {
        return false;
      }
      
      // Then apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          vehicle.licensePlate.toLowerCase().includes(query) ||
          (vehicle.model ? vehicle.model.toLowerCase().includes(query) : false)
        );
      }
      
      return true;
    });
  }, [vehicles, statusFilter, searchQuery]);
  
  // Delete vehicle mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: number) => {
      const res = await apiRequest('DELETE', `/api/vehicles/${vehicleId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t('vehicles', 'vehicleDeleted'),
        description: t('vehicles', 'vehicleDeleteConfirm'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      setVehicleToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete vehicle',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleDeleteVehicle = (vehicleId: number) => {
    setVehicleToDelete(vehicleId);
  };
  
  const confirmDeleteVehicle = () => {
    if (vehicleToDelete) {
      deleteVehicleMutation.mutate(vehicleToDelete);
    }
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Enhanced Header Section */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg p-5 border border-blue-200 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-800">{t('fleet', 'fleetManagement')}</h1>
              <p className="text-blue-600/80 mt-1 max-w-2xl">
                Manage your fleet, track vehicle status, and maintain your logistics operations efficiently
              </p>
            </div>
            <Button 
              onClick={() => setShowAddVehicleModal(true)} 
              className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              {t('vehicles', 'addVehicle')}
            </Button>
          </div>
        </div>
        
        {/* Statistics Dashboard */}
        <VehicleStats vehicles={vehicles} />
        
        {/* Enhanced Tabs with Better Mobile Layout */}
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white rounded-lg border p-4 shadow-sm">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800 mb-3 md:mb-0">{t('fleet', 'vehicleList')}</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <TabsList className="bg-gray-100/80 p-1 rounded-md">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow"
                >
                  All Vehicles
                </TabsTrigger>
                <TabsTrigger 
                  value="available"
                  className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow"
                >
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Available
                </TabsTrigger>
                <TabsTrigger 
                  value="in-use"
                  className="data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow"
                >
                  <Activity className="h-4 w-4 mr-1" />
                  In Use
                </TabsTrigger>
              </TabsList>
              
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search license plates..."
                  className="pl-9 h-10 bg-gray-50 border-gray-200 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0" 
                    onClick={() => setSearchQuery("")}
                  >
                    <span className="sr-only">Clear search</span>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <TabsContent value="all" className="mt-4">
            <VehicleTable 
              vehicles={filteredVehicles} 
              isLoading={isLoading}
              onDelete={handleDeleteVehicle}
            />
          </TabsContent>
          
          <TabsContent value="available" className="mt-4">
            <VehicleTable 
              vehicles={vehicles?.filter(v => v.status === 'available') || []} 
              isLoading={isLoading}
              onDelete={handleDeleteVehicle}
            />
          </TabsContent>
          
          <TabsContent value="in-use" className="mt-4">
            <VehicleTable 
              vehicles={vehicles?.filter(v => v.status !== 'available') || []} 
              isLoading={isLoading}
              onDelete={handleDeleteVehicle}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Vehicle Modal */}
      <VehicleForm
        open={showAddVehicleModal}
        onOpenChange={setShowAddVehicleModal}
      />
      
      {/* Delete Vehicle Confirmation Dialog */}
      <AlertDialog open={vehicleToDelete !== null} onOpenChange={(open) => !open && setVehicleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common', 'areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common', 'thisActionCannot')} {t('vehicles', 'vehicleDeleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common', 'cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVehicle}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteVehicleMutation.isPending}
            >
              {deleteVehicleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                t('common', 'delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

// Enhanced VehicleTable component with better mobile responsiveness and visual design
function VehicleTable({ 
  vehicles, 
  isLoading,
  onDelete 
}: { 
  vehicles: Vehicle[],
  isLoading: boolean,
  onDelete: (id: number) => void
}) {
  const { t } = useLocale();
  
  // Loading state with subtle animation
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50/50 rounded-lg border border-gray-100">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <span className="text-gray-600 font-medium">{t('vehicles', 'loadingVehicles')}</span>
        <p className="text-gray-400 text-sm mt-1">Please wait while we fetch your fleet data</p>
      </div>
    );
  }
  
  // Empty state with call-to-action
  if (!vehicles || vehicles.length === 0) {
    return (
      <Card className="border-dashed border-gray-300 bg-gray-50/50">
        <CardContent className="flex flex-col items-center justify-center h-64 text-center p-8">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Car className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-1">{t('vehicles', 'noVehicles')}</h3>
          <p className="text-gray-500 text-sm max-w-md mb-4">
            Add vehicles to your fleet to start tracking and managing your logistics operations
          </p>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
            <Plus className="h-4 w-4 mr-2" />
            {t('vehicles', 'addVehicle')}
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Table view for desktop and list view for mobile
  return (
    <div className="space-y-4">
      {/* Desktop view (hidden on small screens) */}
      <div className="hidden md:block">
        <Card className="shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="font-medium text-gray-700">{t('vehicles', 'licensePlate')}</TableHead>
                    <TableHead className="font-medium text-gray-700">{t('vehicles', 'model')}</TableHead>
                    <TableHead className="font-medium text-gray-700">{t('vehicles', 'status')}</TableHead>
                    <TableHead className="font-medium text-gray-700">{t('vehicles', 'addedOn')}</TableHead>
                    <TableHead className="font-medium text-gray-700 text-right">{t('common', 'actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle: Vehicle) => (
                    <TableRow key={vehicle.id} className="hover:bg-gray-50 border-b border-gray-100">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-primary">{vehicle.licensePlate}</span>
                          <span className="text-xs text-gray-500">ID: {vehicle.id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">{vehicle.model || 'N/A'}</TableCell>
                      <TableCell>
                        <StatusBadge status={vehicle.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{formatDateTime(vehicle.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(vehicle.id)}
                          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                          // Only allow deleting vehicles that are available
                          disabled={vehicle.status !== 'available'}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span>{t('common', 'delete')}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile view (visible only on small screens) */}
      <div className="md:hidden space-y-3">
        {vehicles.map((vehicle: Vehicle) => (
          <Card key={vehicle.id} className="shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-primary">{vehicle.licensePlate}</h3>
                    <StatusBadge status={vehicle.status} />
                  </div>
                  <p className="text-gray-600 text-sm">{vehicle.model || 'No model specified'}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(vehicle.id)}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600 p-2 h-9 w-9"
                  disabled={vehicle.status !== 'available'}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center mt-3 text-xs text-gray-500">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span>Added: {formatDateTime(vehicle.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Summary footer */}
      <div className="flex justify-between items-center text-sm text-gray-500 px-2">
        <span>Showing {vehicles.length} vehicles</span>
        <span>{t('fleet', 'filterByStatus')} to narrow results</span>
      </div>
    </div>
  );
}

export default ManageVehicles;