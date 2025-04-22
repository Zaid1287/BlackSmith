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
  TrendingUp, Calendar, Search
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

// Added VehicleStats component to display fleet statistics
function VehicleStats({ vehicles }: { vehicles?: Vehicle[] }) {
  if (!vehicles) return null;
  
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === 'available').length;
  const inUseVehicles = totalVehicles - availableVehicles;
  const availabilityRate = totalVehicles ? Math.round((availableVehicles / totalVehicles) * 100) : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Car className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-blue-600 font-medium">Total Vehicles</p>
            <p className="text-2xl font-bold text-blue-700">{totalVehicles}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-full">
            <CheckSquare className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-green-600 font-medium">Available</p>
            <p className="text-2xl font-bold text-green-700">{availableVehicles}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-amber-100 p-2 rounded-full">
            <Activity className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-amber-600 font-medium">In Use</p>
            <p className="text-2xl font-bold text-amber-700">{inUseVehicles}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-full">
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-purple-600 font-medium">Availability Rate</p>
            <p className="text-2xl font-bold text-purple-700">{availabilityRate}%</p>
          </div>
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
          vehicle.model.toLowerCase().includes(query)
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
        <div>
          <h1 className="text-2xl font-bold">{t('fleet', 'fleetManagement')}</h1>
          <p className="text-gray-500 mt-1">
            Manage your fleet, track vehicle status, and maintain your logistics operations
          </p>
        </div>
        
        <VehicleStats vehicles={vehicles} />
        
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <TabsList className="mb-2 md:mb-0">
              <TabsTrigger value="all">All Vehicles</TabsTrigger>
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="in-use">In Use</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-col md:flex-row w-full md:w-auto gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search vehicles..."
                  className="pl-8 max-w-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Button onClick={() => setShowAddVehicleModal(true)} className="bg-primary text-white">
                <Plus className="mr-2 h-4 w-4" />
                {t('vehicles', 'addVehicle')}
              </Button>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <TabsContent value="all" className="mt-0">
            <VehicleTable 
              vehicles={filteredVehicles} 
              isLoading={isLoading}
              onDelete={handleDeleteVehicle}
            />
          </TabsContent>
          
          <TabsContent value="available" className="mt-0">
            <VehicleTable 
              vehicles={vehicles?.filter(v => v.status === 'available') || []} 
              isLoading={isLoading}
              onDelete={handleDeleteVehicle}
            />
          </TabsContent>
          
          <TabsContent value="in-use" className="mt-0">
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

// Extracted VehicleTable component for better organization
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
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">{t('vehicles', 'loadingVehicles')}</span>
      </div>
    );
  }
  
  if (!vehicles || vehicles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64 text-center p-8">
          <Car className="h-12 w-12 text-gray-300 mb-2" />
          <p className="text-gray-500">{t('vehicles', 'noVehicles')}</p>
          <p className="text-gray-400 text-sm mt-1">Add vehicles to manage your fleet</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-medium">{t('vehicles', 'licensePlate')}</TableHead>
                <TableHead className="font-medium">{t('vehicles', 'model')}</TableHead>
                <TableHead className="font-medium">{t('vehicles', 'status')}</TableHead>
                <TableHead className="font-medium">{t('vehicles', 'addedOn')}</TableHead>
                <TableHead className="font-medium text-right">{t('common', 'actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle: Vehicle) => (
                <TableRow key={vehicle.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{vehicle.licensePlate}</span>
                      <span className="text-xs text-gray-500">ID: {vehicle.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>{vehicle.model}</TableCell>
                  <TableCell>
                    <StatusBadge status={vehicle.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{formatDateTime(vehicle.createdAt)}</span>
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
  );
}

export default ManageVehicles;