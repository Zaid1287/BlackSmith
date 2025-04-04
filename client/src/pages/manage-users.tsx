import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AdminLayout } from '@/layouts/admin-layout';
import { UserForm } from '@/components/user-form';
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
import { Loader2, PlusCircle, UserPlus, Trash2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
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

export function ManageUsers() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  
  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('DELETE', `/api/users/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'User deleted',
        description: 'The user has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete user',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleDeleteUser = (userId: number) => {
    setUserToDelete(userId);
  };
  
  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete);
    }
  };
  
  return (
    <AdminLayout>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Users</CardTitle>
            <CardDescription>
              Add, view, or remove users from the system
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddUserModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : !users || users.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <p>No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.isAdmin ? 'Admin' : 'Driver'}</TableCell>
                    <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                    <TableCell>
                      {/* Don't allow deleting current user or other admins */}
                      {user.id !== currentUser?.id && !user.isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Add User Modal */}
      <UserForm
        open={showAddUserModal}
        onOpenChange={setShowAddUserModal}
      />
      
      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={userToDelete !== null} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
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

export default ManageUsers;
