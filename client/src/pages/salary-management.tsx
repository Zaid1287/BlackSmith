import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useLocation } from "wouter";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Icons
import { 
  MoreHorizontal, 
  Pencil, 
  DollarSign, 
  UserCheck, 
  CalendarClock,
  BadgeIndianRupee,
  Download
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
interface User {
  id: number;
  name: string;
  username: string;
  isAdmin: boolean;
  salaryAmount: number;
  paidAmount: number;
  balance: number;
  lastUpdated: string | null;
}

// Schemas
const updateSalarySchema = z.object({
  salaryAmount: z.coerce.number().min(0, "Salary cannot be negative"),
  paidAmount: z.coerce.number().min(0, "Paid amount cannot be negative"),
});

type UpdateSalaryValues = z.infer<typeof updateSalarySchema>;

export default function SalaryManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  
  // Redirect non-admin users away from this page
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/");
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page.",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast]);
  
  // Fetch salary data for all users
  const { 
    data: users,
    isLoading,
    error 
  } = useQuery({
    queryKey: ["/api/salaries"],
    enabled: !!user?.isAdmin,
  });
  
  // Form for updating salary info
  const form = useForm<UpdateSalaryValues>({
    resolver: zodResolver(updateSalarySchema),
    defaultValues: {
      salaryAmount: selectedUser?.salaryAmount || 0,
      paidAmount: selectedUser?.paidAmount || 0,
    },
  });
  
  // Update form values when selected user changes
  useEffect(() => {
    if (selectedUser) {
      form.reset({
        salaryAmount: selectedUser.salaryAmount,
        paidAmount: selectedUser.paidAmount,
      });
    }
  }, [selectedUser, form]);
  
  // Update salary mutation
  const updateSalaryMutation = useMutation({
    mutationFn: async (data: UpdateSalaryValues) => {
      if (!selectedUser) return null;
      
      const response = await fetch(`/api/user/${selectedUser.id}/salary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update salary");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salaries"] });
      setIsUpdateDialogOpen(false);
      toast({
        title: "Salary Updated",
        description: `Salary information for ${selectedUser?.name} has been updated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: UpdateSalaryValues) => {
    updateSalaryMutation.mutate(data);
  };
  
  // Handle opening the edit dialog
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsUpdateDialogOpen(true);
  };
  
  // Calculate total statistics
  const totalSalaryAmount = users && Array.isArray(users) 
    ? users.reduce((acc: number, user: User) => acc + user.salaryAmount, 0) 
    : 0;
  const totalPaidAmount = users && Array.isArray(users) 
    ? users.reduce((acc: number, user: User) => acc + user.paidAmount, 0) 
    : 0;
  const totalBalance = totalSalaryAmount - totalPaidAmount;
  
  // Date formatter
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never updated";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  if (!user) {
    return null; // Handle unauthenticated state
  }
  
  if (!user.isAdmin) {
    return null; // Already redirecting in useEffect
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Salary Management</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Salary Amount</p>
                <h3 className="text-2xl font-bold text-blue-700 mt-1">
                  {formatCurrency(totalSalaryAmount)}
                </h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Paid Amount</p>
                <h3 className="text-2xl font-bold text-green-700 mt-1">
                  {formatCurrency(totalPaidAmount)}
                </h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <BadgeIndianRupee className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Total Remaining Balance</p>
                <h3 className="text-2xl font-bold text-amber-700 mt-1">
                  {formatCurrency(totalBalance)}
                </h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <UserCheck className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <UserCheck className="mr-2 h-5 w-5" />
              Employees Salary Records
            </span>
            <Button variant="outline" size="sm" className="ml-auto">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-4 text-destructive">
              Failed to load salary data. Please try again.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead className="text-right">Salary Amount</TableHead>
                    <TableHead className="text-right">Paid Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users && Array.isArray(users) && users.length > 0 ? (
                    users.map((user: User) => {
                      // Calculate balance for this user
                      const balance = user.salaryAmount - user.paidAmount;
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(user.salaryAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(user.paidAmount)}
                          </TableCell>
                          <TableCell 
                            className={`text-right font-medium ${
                              balance > 0 
                                ? 'text-amber-600' 
                                : balance < 0 
                                ? 'text-destructive' 
                                : 'text-green-600'
                            }`}
                          >
                            {formatCurrency(balance)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <CalendarClock className="h-3 w-3 mr-1 opacity-70" />
                              {formatDate(user.lastUpdated)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleEditUser({ ...user, balance })}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Update Salary
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        No salary records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Update Salary Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Salary Information</DialogTitle>
            <DialogDescription>
              Adjust salary and payment amounts for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Tabs for Salary, Amount, and Total Paid */}
              <div className="mb-4">
                <div className="flex border-b">
                  <div className="flex-1 text-center font-medium px-4 py-2 border-b-2 border-primary">
                    Salary
                  </div>
                  <div className="flex-1 text-center text-muted-foreground px-4 py-2">
                    Amount
                  </div>
                  <div className="flex-1 text-center text-muted-foreground px-4 py-2">
                    Total Paid
                  </div>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="salaryAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          className="pl-10"
                          placeholder="Enter salary amount"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid Amount</FormLabel>
                    <FormControl>
                      <div className="relative flex">
                        <BadgeIndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          className="pl-10 flex-1"
                          placeholder="Enter amount paid"
                          {...field}
                        />
                        <Button type="button" className="ml-2" variant="outline">
                          Add
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Calculated Balance */}
              <div className="py-4">
                <Separator className="mb-4" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Remaining Balance:</span>
                  <span className={`font-bold ${
                    (Number(form.watch('salaryAmount')) - Number(form.watch('paidAmount'))) > 0 
                      ? 'text-amber-600' 
                      : (Number(form.watch('salaryAmount')) - Number(form.watch('paidAmount'))) < 0
                      ? 'text-destructive'
                      : 'text-green-600'
                  }`}>
                    {formatCurrency(Number(form.watch('salaryAmount')) - Number(form.watch('paidAmount')))}
                  </span>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUpdateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateSalaryMutation.isPending}
                >
                  {updateSalaryMutation.isPending ? "Updating..." : "Update Salary"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}