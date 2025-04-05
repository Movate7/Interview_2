import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User, InsertUser, RolePermission, Permissions } from "@shared/schema";
import { Pencil, Trash2, Plus, X, Check, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

// Type definition for the permissions form
type PermissionFormData = {
  role: string;
  canViewCandidates: boolean;
  canManageCandidates: boolean;
  canViewPanels: boolean; 
  canManagePanels: boolean;
  canViewRooms: boolean;
  canManageRooms: boolean;
  canViewFeedback: boolean;
  canProvideFeedback: boolean;
  canViewAnalytics: boolean;
  canManageUsers: boolean;
  canManagePermissions: boolean;
};

export default function UserManagement() {
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isPermissionFormOpen, setIsPermissionFormOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPermission, setCurrentPermission] = useState<RolePermission | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch role permissions
  const { data: rolePermissions, isLoading: permissionsLoading } = useQuery<RolePermission[]>({
    queryKey: ['/api/role-permissions'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create a new user
  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const res = await apiRequest("POST", "/api/users", userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setIsUserFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create user: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update an existing user
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number, userData: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setIsUserFormOpen(false);
      setCurrentUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete a user
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/users/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Create a new role permission
  const createPermissionMutation = useMutation({
    mutationFn: async (permissionData: PermissionFormData) => {
      const res = await apiRequest("POST", "/api/role-permissions", {
        role: permissionData.role,
        permissions: JSON.stringify({
          viewCandidates: permissionData.canViewCandidates,
          manageCandidates: permissionData.canManageCandidates,
          viewPanels: permissionData.canViewPanels,
          managePanels: permissionData.canManagePanels,
          viewRooms: permissionData.canViewRooms,
          manageRooms: permissionData.canManageRooms,
          viewFeedback: permissionData.canViewFeedback,
          provideFeedback: permissionData.canProvideFeedback,
          viewAnalytics: permissionData.canViewAnalytics,
          manageUsers: permissionData.canManageUsers,
          managePermissions: permissionData.canManagePermissions
        })
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/role-permissions'] });
      toast({
        title: "Success",
        description: "Role permission created successfully",
      });
      setIsPermissionFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create role permission: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update an existing role permission
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ id, permissionData }: { id: number, permissionData: PermissionFormData }) => {
      const res = await apiRequest("PATCH", `/api/role-permissions/${id}`, {
        role: permissionData.role,
        permissions: JSON.stringify({
          viewCandidates: permissionData.canViewCandidates,
          manageCandidates: permissionData.canManageCandidates,
          viewPanels: permissionData.canViewPanels,
          managePanels: permissionData.canManagePanels,
          viewRooms: permissionData.canViewRooms,
          manageRooms: permissionData.canManageRooms,
          viewFeedback: permissionData.canViewFeedback,
          provideFeedback: permissionData.canProvideFeedback,
          viewAnalytics: permissionData.canViewAnalytics,
          manageUsers: permissionData.canManageUsers,
          managePermissions: permissionData.canManagePermissions
        })
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/role-permissions'] });
      toast({
        title: "Success",
        description: "Role permission updated successfully",
      });
      setIsPermissionFormOpen(false);
      setCurrentPermission(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update role permission: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete a role permission
  const deletePermissionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/role-permissions/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/role-permissions'] });
      toast({
        title: "Success",
        description: "Role permission deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete role permission: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle user form submission
  const handleUserSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const userData = {
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
    };
    
    if (currentUser) {
      // If password is empty, don't update it
      const updateData: Partial<User> = {
        username: userData.username,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      };
      
      // Only include password if it's not empty
      if (userData.password) {
        updateData.password = userData.password;
      }
      
      updateUserMutation.mutate({ id: currentUser.id, userData: updateData });
    } else {
      createUserMutation.mutate(userData as InsertUser);
    }
  };

  // Handle permission form submission
  const handlePermissionSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const permissionData: PermissionFormData = {
      role: formData.get('role') as string,
      canViewCandidates: formData.get('canViewCandidates') === 'on',
      canManageCandidates: formData.get('canManageCandidates') === 'on',
      canViewPanels: formData.get('canViewPanels') === 'on',
      canManagePanels: formData.get('canManagePanels') === 'on',
      canViewRooms: formData.get('canViewRooms') === 'on',
      canManageRooms: formData.get('canManageRooms') === 'on',
      canViewFeedback: formData.get('canViewFeedback') === 'on',
      canProvideFeedback: formData.get('canProvideFeedback') === 'on',
      canViewAnalytics: formData.get('canViewAnalytics') === 'on',
      canManageUsers: formData.get('canManageUsers') === 'on',
      canManagePermissions: formData.get('canManagePermissions') === 'on',
    };
    
    if (currentPermission) {
      updatePermissionMutation.mutate({ id: currentPermission.id, permissionData });
    } else {
      createPermissionMutation.mutate(permissionData);
    }
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setIsUserFormOpen(true);
  };

  const handleEditPermission = (permission: RolePermission) => {
    // Convert permissions JSON string to object
    const parsedPermission = {
      ...permission,
      permissions: typeof permission.permissions === 'string' 
        ? JSON.parse(permission.permissions) 
        : permission.permissions
    };
    setCurrentPermission(parsedPermission);
    setIsPermissionFormOpen(true);
  };

  const handleDeleteUser = (id: number) => {
    deleteUserMutation.mutate(id);
  };

  const handleDeletePermission = (id: number) => {
    deletePermissionMutation.mutate(id);
  };

  const handleAddNewUser = () => {
    setCurrentUser(null);
    setIsUserFormOpen(true);
  };

  const handleAddNewPermission = () => {
    setCurrentPermission(null);
    setIsPermissionFormOpen(true);
  };

  // Function to render role badge with appropriate color
  const renderRoleBadge = (role: string) => {
    let color = "";
    switch (role) {
      case "admin":
        color = "bg-red-500";
        break;
      case "panel":
        color = "bg-blue-500";
        break;
      case "hr":
        color = "bg-green-500";
        break;
      case "operations_lead":
        color = "bg-yellow-500";
        break;
      case "operations_manager":
        color = "bg-purple-500";
        break;
      default:
        color = "bg-gray-500";
    }
    
    return (
      <Badge className={`${color} text-white`}>
        {role.replace("_", " ")}
      </Badge>
    );
  };

  // Helper function to parse permissions
  const parsePermissions = (permissions: string | Permissions): Permissions => {
    if (typeof permissions === 'string') {
      try {
        return JSON.parse(permissions);
      } catch (e) {
        console.error("Error parsing permissions:", e);
        return {
          viewCandidates: false,
          manageCandidates: false,
          viewPanels: false,
          managePanels: false,
          viewRooms: false,
          manageRooms: false,
          viewFeedback: false,
          provideFeedback: false,
          viewAnalytics: false,
          manageUsers: false,
          managePermissions: false
        };
      }
    }
    return permissions;
  };

  // Function to check if permissions exist for a role
  const hasRolePermissions = (role: string) => {
    return rolePermissions?.some(perm => perm.role === role) || false;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">User Management</CardTitle>
        <CardDescription>
          Manage users and their role permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="permissions">Role Permissions</TabsTrigger>
          </TabsList>
          
          {/* Users Tab */}
          <TabsContent value="users">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">User List</h3>
              <Button onClick={handleAddNewUser}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
            
            {usersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users && users.length > 0 ? (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {renderRoleBadge(user.role)}
                            {!hasRolePermissions(user.role) && (
                              <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600">
                                No permissions defined
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditUser(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the user
                                    and remove their data from the server.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-500 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No users found. Add a user to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* User Form Dialog */}
            <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{currentUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                  <DialogDescription>
                    {currentUser 
                      ? 'Update the user details below.' 
                      : 'Fill in the form below to create a new user.'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        defaultValue={currentUser?.username || ''}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="password">
                        Password {currentUser && '(leave blank to keep current)'}
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required={!currentUser}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={currentUser?.name || ''}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={currentUser?.email || ''}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select name="role" defaultValue={currentUser?.role || 'panel'}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="panel">Panel</SelectItem>
                          <SelectItem value="hr">HR</SelectItem>
                          <SelectItem value="operations_lead">Operations Lead</SelectItem>
                          <SelectItem value="operations_manager">Operations Manager</SelectItem>
                        </SelectContent>
                      </Select>
                      {currentUser && !hasRolePermissions(currentUser.role) && (
                        <p className="text-sm text-amber-600">
                          Warning: No permissions defined for this role.
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button 
                      type="submit"
                      disabled={createUserMutation.isPending || updateUserMutation.isPending}
                    >
                      {(createUserMutation.isPending || updateUserMutation.isPending) && (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {currentUser ? 'Update User' : 'Create User'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          {/* Role Permissions Tab */}
          <TabsContent value="permissions">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Role Permissions</h3>
              <Button onClick={handleAddNewPermission}>
                <Plus className="h-4 w-4 mr-2" />
                Add Role Permission
              </Button>
            </div>
            
            {permissionsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>View Permissions</TableHead>
                      <TableHead>Management Permissions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rolePermissions && rolePermissions.length > 0 ? (
                      rolePermissions.map((permission) => (
                        <TableRow key={permission.id}>
                          <TableCell className="font-medium">
                            {renderRoleBadge(permission.role)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {parsePermissions(permission.permissions).viewCandidates && <Badge variant="outline">View Candidates</Badge>}
                              {parsePermissions(permission.permissions).viewPanels && <Badge variant="outline">View Panels</Badge>}
                              {parsePermissions(permission.permissions).viewRooms && <Badge variant="outline">View Rooms</Badge>}
                              {parsePermissions(permission.permissions).viewFeedback && <Badge variant="outline">View Feedback</Badge>}
                              {parsePermissions(permission.permissions).viewAnalytics && <Badge variant="outline">View Analytics</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {parsePermissions(permission.permissions).manageCandidates && <Badge variant="outline">Manage Candidates</Badge>}
                              {parsePermissions(permission.permissions).managePanels && <Badge variant="outline">Manage Panels</Badge>}
                              {parsePermissions(permission.permissions).manageRooms && <Badge variant="outline">Manage Rooms</Badge>}
                              {parsePermissions(permission.permissions).provideFeedback && <Badge variant="outline">Provide Feedback</Badge>}
                              {parsePermissions(permission.permissions).manageUsers && <Badge variant="outline">Manage Users</Badge>}
                              {parsePermissions(permission.permissions).managePermissions && <Badge variant="outline">Manage Permissions</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditPermission(permission)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the role permission
                                    settings from the server.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeletePermission(permission.id)}
                                    className="bg-red-500 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          No role permissions found. Add a role permission to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Permission Form Dialog */}
            <Dialog open={isPermissionFormOpen} onOpenChange={setIsPermissionFormOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {currentPermission ? 'Edit Role Permission' : 'Add New Role Permission'}
                  </DialogTitle>
                  <DialogDescription>
                    {currentPermission 
                      ? 'Update the role permissions below.' 
                      : 'Define permissions for a specific role.'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handlePermissionSubmit} className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select 
                        name="role" 
                        defaultValue={currentPermission?.role || 'panel'}
                        disabled={!!currentPermission} // Can't change role once created
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="panel">Panel</SelectItem>
                          <SelectItem value="hr">HR</SelectItem>
                          <SelectItem value="operations_lead">Operations Lead</SelectItem>
                          <SelectItem value="operations_manager">Operations Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="border rounded-md p-4 space-y-4">
                      <h4 className="font-medium">View Permissions</h4>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="canViewCandidates" className="flex-1">
                          View Candidates
                        </Label>
                        <Switch 
                          id="canViewCandidates" 
                          name="canViewCandidates" 
                          defaultChecked={currentPermission ? parsePermissions(currentPermission.permissions).viewCandidates : false}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="canViewPanels" className="flex-1">
                          View Panels
                        </Label>
                        <Switch 
                          id="canViewPanels" 
                          name="canViewPanels" 
                          defaultChecked={currentPermission ? parsePermissions(currentPermission.permissions).viewPanels : false}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="canViewRooms" className="flex-1">
                          View Rooms
                        </Label>
                        <Switch 
                          id="canViewRooms" 
                          name="canViewRooms" 
                          defaultChecked={currentPermission ? parsePermissions(currentPermission.permissions).viewRooms : false}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="canViewFeedback" className="flex-1">
                          View Feedback
                        </Label>
                        <Switch 
                          id="canViewFeedback" 
                          name="canViewFeedback" 
                          defaultChecked={currentPermission ? parsePermissions(currentPermission.permissions).viewFeedback : false}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="canViewAnalytics" className="flex-1">
                          View Analytics
                        </Label>
                        <Switch 
                          id="canViewAnalytics" 
                          name="canViewAnalytics" 
                          defaultChecked={currentPermission ? parsePermissions(currentPermission.permissions).viewAnalytics : false}
                        />
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4 space-y-4">
                      <h4 className="font-medium">Management Permissions</h4>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="canManageCandidates" className="flex-1">
                          Manage Candidates
                        </Label>
                        <Switch 
                          id="canManageCandidates" 
                          name="canManageCandidates" 
                          defaultChecked={currentPermission ? parsePermissions(currentPermission.permissions).manageCandidates : false}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="canManagePanels" className="flex-1">
                          Manage Panels
                        </Label>
                        <Switch 
                          id="canManagePanels" 
                          name="canManagePanels" 
                          defaultChecked={currentPermission ? parsePermissions(currentPermission.permissions).managePanels : false}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="canManageRooms" className="flex-1">
                          Manage Rooms
                        </Label>
                        <Switch 
                          id="canManageRooms" 
                          name="canManageRooms" 
                          defaultChecked={currentPermission ? parsePermissions(currentPermission.permissions).manageRooms : false}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="canProvideFeedback" className="flex-1">
                          Provide Feedback
                        </Label>
                        <Switch 
                          id="canProvideFeedback" 
                          name="canProvideFeedback" 
                          defaultChecked={currentPermission ? parsePermissions(currentPermission.permissions).provideFeedback : false}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="canManageUsers" className="flex-1">
                          Manage Users
                        </Label>
                        <Switch 
                          id="canManageUsers" 
                          name="canManageUsers" 
                          defaultChecked={currentPermission ? parsePermissions(currentPermission.permissions).manageUsers : false}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="canManagePermissions" className="flex-1">
                          Manage Permissions
                        </Label>
                        <Switch 
                          id="canManagePermissions" 
                          name="canManagePermissions" 
                          defaultChecked={currentPermission ? parsePermissions(currentPermission.permissions).managePermissions : false}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button 
                      type="submit"
                      disabled={createPermissionMutation.isPending || updatePermissionMutation.isPending}
                    >
                      {(createPermissionMutation.isPending || updatePermissionMutation.isPending) && (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {currentPermission ? 'Update Permission' : 'Create Permission'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}