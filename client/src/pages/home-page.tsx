import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTodoSchema, type Todo } from "@shared/schema";
import { z } from "zod";
import { 
  ListTodo, 
  Plus, 
  Calendar, 
  Clock, 
  Mail, 
  Edit2, 
  Trash2, 
  LogOut,
  CheckCircle2,
  Circle
} from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

type TodoFormData = z.infer<typeof insertTodoSchema>;

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const { data: todos = [], isLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const addTodoMutation = useMutation({
    mutationFn: async (data: TodoFormData) => {
      const res = await apiRequest("POST", "/api/todos", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      form.reset();
      toast({
        title: "Success",
        description: "Task added successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Todo> }) => {
      const res = await apiRequest("PATCH", `/api/todos/${id}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/todos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      toast({
        title: "Success",
        description: "Task deleted successfully!",
      });
    },
  });

  const form = useForm<TodoFormData>({
    resolver: zodResolver(insertTodoSchema),
    defaultValues: {
      name: "",
      email: "",
      date: new Date().toISOString().split('T')[0],
      time: "",
    },
  });

  const onSubmit = (data: TodoFormData) => {
    addTodoMutation.mutate(data);
  };

  const toggleTodo = (todo: Todo) => {
    updateTodoMutation.mutate({
      id: todo.id,
      updates: { completed: !todo.completed },
    });
  };

  const deleteTodo = (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTodoMutation.mutate(id);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === "pending") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const totalTodos = todos.length;
  const completedTodos = todos.filter(t => t.completed).length;
  const pendingTodos = totalTodos - completedTodos;

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ListTodo className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                <ListTodo className="text-white h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">My Tasks</h1>
                <p className="text-sm text-gray-500" data-testid="text-welcome">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span data-testid="text-current-date">{currentDate}</span>
              </div>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="flex items-center space-x-2"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add Todo Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="text-primary mr-2 h-5 w-5" />
                  Add New Task
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Task Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="What needs to be done?"
                              data-testid="input-todo-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Related Email</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email" 
                              placeholder="Contact email (optional)"
                              data-testid="input-todo-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="date"
                                data-testid="input-todo-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="time"
                                data-testid="input-todo-time"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={addTodoMutation.isPending}
                      data-testid="button-add-todo"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {addTodoMutation.isPending ? "Adding..." : "Add Task"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Task Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Tasks</span>
                  <span className="font-semibold text-gray-900" data-testid="stat-total">
                    {totalTodos}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-semibold text-green-600" data-testid="stat-completed">
                    {completedTodos}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="font-semibold text-primary" data-testid="stat-pending">
                    {pendingTodos}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Todo List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <ListTodo className="text-primary mr-2 h-5 w-5" />
                    Your Tasks
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={filter === "all" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setFilter("all")}
                      data-testid="filter-all"
                    >
                      All
                    </Button>
                    <Button
                      variant={filter === "pending" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setFilter("pending")}
                      data-testid="filter-pending"
                    >
                      Pending
                    </Button>
                    <Button
                      variant={filter === "completed" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setFilter("completed")}
                      data-testid="filter-completed"
                    >
                      Completed
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredTodos.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <ListTodo className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                    <p className="text-gray-500 mb-4">Get started by adding your first task</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredTodos.map((todo) => (
                      <div 
                        key={todo.id} 
                        className="p-4 hover:bg-gray-50 transition-colors"
                        data-testid={`todo-item-${todo.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={todo.completed}
                              onCheckedChange={() => toggleTodo(todo)}
                              className="mt-1"
                              data-testid={`checkbox-todo-${todo.id}`}
                            />
                            <div className="flex-1">
                              <h3 
                                className={`text-sm font-medium ${
                                  todo.completed 
                                    ? "text-gray-500 line-through" 
                                    : "text-gray-900"
                                }`}
                                data-testid={`text-todo-name-${todo.id}`}
                              >
                                {todo.name}
                              </h3>
                              <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  {new Date(todo.date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="mr-1 h-3 w-3" />
                                  {todo.time}
                                </span>
                                {todo.email && (
                                  <span className="flex items-center">
                                    <Mail className="mr-1 h-3 w-3" />
                                    {todo.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {todo.completed && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Completed
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTodo(todo.id)}
                              className="text-gray-400 hover:text-red-600"
                              data-testid={`button-delete-${todo.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
