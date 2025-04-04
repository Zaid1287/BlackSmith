import { useState } from 'react';
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
import { Loader2, Plus, Trash2, Car } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
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

export function ManageVehicles() {
  const { toast } = useToast();
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<number | null>(null);
  
  // Fetch all vehicles
  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
  });
  
  // Delete vehicle mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: number) => {
      const res = await apiRequest('DELETE', `/api/vehicles/${vehicleId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Vehicle deleted',
        description: 'The vehicle has been deleted successfully.',
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Vehicles</CardTitle>
            <CardDescription>
              Add, view, or remove vehicles from the system
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddVehicleModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : !vehicles || vehicles.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <p>No vehicles found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles?.map((vehicle: Vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>{vehicle.id}</TableCell>
                    <TableCell className="font-medium">{vehicle.licensePlate}</TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        vehicle.status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {vehicle.status}
                      </span>
                    </TableCell>
                    <TableCell>{formatDateTime(vehicle.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        // Only allow deleting vehicles that are available
                        disabled={vehicle.status !== 'available'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Add Vehicle Modal */}
      <VehicleForm
        open={showAddVehicleModal}
        onOpenChange={setShowAddVehicleModal}
      />
      
      {/* Delete Vehicle Confirmation Dialog */}
      <AlertDialog open={vehicleToDelete !== null} onOpenChange={(open) => !open && setVehicleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle
              from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

export default ManageVehicles;