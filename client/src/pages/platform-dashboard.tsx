// Platform Dashboard - Main admin interface for managing templates
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Settings, 
  Copy, 
  Trash2, 
  ExternalLink, 
  Users, 
  CheckCircle, 
  XCircle,
  Eye,
  Calendar,
  Mail
} from "lucide-react";
import { getTemplateList } from "@/templates";

interface Template {
  id: string;
  name: string;
  slug: string;
  templateKey: string;
  ownerEmail?: string;
  maintenance: boolean;
  sourceTemplateId?: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalRsvps: number;
    attending: number;
    notAttending: number;
  };
}

interface CreateTemplateForm {
  name: string;
  slug: string;
  templateKey: string;
  ownerEmail: string;
  sourceTemplateId?: string;
}

interface CloneTemplateForm {
  name: string;
  slug: string;
  ownerEmail: string;
  sourceTemplate?: Template;
}

export default function PlatformDashboard() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTemplateForm>({
    name: "",
    slug: "",
    templateKey: "pro",
    ownerEmail: "",
  });
  const [cloneForm, setCloneForm] = useState<CloneTemplateForm>({
    name: "",
    slug: "",
    ownerEmail: "",
    sourceTemplate: undefined,
  });
  const { toast } = useToast();

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadTemplates();
    }
  }, [authenticated]);

  const checkAuthentication = () => {
    const token = localStorage.getItem("admin-token");
    if (!token) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }
    
    // Verify token with server
    fetch("/api/admin/templates", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(response => {
      if (response.ok) {
        setAuthenticated(true);
      } else {
        localStorage.removeItem("admin-token");
        setAuthenticated(false);
      }
      setLoading(false);
    }).catch(() => {
      localStorage.removeItem("admin-token");
      setAuthenticated(false);
      setLoading(false);
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("admin-token", data.token);
        setAuthenticated(true);
        toast({ title: "Login successful", description: "Welcome to the platform dashboard" });
      } else {
        toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Login error", description: "Failed to connect to server", variant: "destructive" });
    }
  };

  const loadTemplates = async () => {
    try {
      const token = localStorage.getItem("admin-token");
      const response = await fetch("/api/admin/templates", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📊 Templates received from API:", data);
        console.log("📊 First template structure:", data[0]);
        setTemplates(data);
      } else if (response.status === 401) {
        localStorage.removeItem("admin-token");
        setAuthenticated(false);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
      toast({ title: "Error", description: "Failed to load templates", variant: "destructive" });
    }
  };

  const createTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin-token");
      const response = await fetch("/api/admin/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        const newTemplate = await response.json();
        setTemplates([newTemplate, ...templates]);
        setCreateDialogOpen(false);
        setCreateForm({ name: "", slug: "", templateKey: "pro", ownerEmail: "" });
        toast({ title: "Template created", description: `${newTemplate.name} has been created successfully` });
      } else {
        const error = await response.json();
        toast({ title: "Creation failed", description: error.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create template", variant: "destructive" });
    }
  };

  const openCloneDialog = (sourceTemplate: Template) => {
    const clonedName = `${sourceTemplate.name} (Clone)`;
    // Generate a shorter, more user-friendly slug
    const clonedSlug = `${sourceTemplate.slug}-copy`.toLowerCase();
    
    setCloneForm({
      name: clonedName,
      slug: clonedSlug,
      ownerEmail: "",
      sourceTemplate: sourceTemplate,
    });
    setCloneDialogOpen(true);
  };

  const handleCloneTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneForm.sourceTemplate) return;
    
    try {
      const token = localStorage.getItem("admin-token");
      const response = await fetch("/api/admin/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceTemplateId: cloneForm.sourceTemplate.id,
          name: cloneForm.name,
          slug: cloneForm.slug,
          templateKey: cloneForm.sourceTemplate.templateKey,
          ownerEmail: cloneForm.ownerEmail,
        }),
      });

      if (response.ok) {
        const clonedTemplate = await response.json();
        setTemplates([clonedTemplate, ...templates]);
        setCloneDialogOpen(false);
        setCloneForm({ name: "", slug: "", ownerEmail: "", sourceTemplate: undefined });
        toast({ 
          title: "Template cloned successfully", 
          description: `${cloneForm.name} has been created${cloneForm.ownerEmail ? ` with RSVP emails routed to ${cloneForm.ownerEmail}` : ''}` 
        });
      } else {
        const error = await response.json();
        const errorMessage = response.status === 409 || error.message?.includes('already taken') || error.message?.includes('slug') ? 
          `The URL "${cloneForm.slug}" is already taken. Please choose a different URL path.` : 
          error.message || "Failed to clone template";
        toast({ title: "Clone failed", description: errorMessage, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to clone template", variant: "destructive" });
    }
  };

  const deleteTemplate = async (template: Template) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("admin-token");
      const response = await fetch(`/api/admin/templates/${template.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== template.id));
        toast({ title: "Template deleted", description: `${template.name} has been deleted` });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading platform...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Platform Admin Login</CardTitle>
            <CardDescription>Sign in to manage wedding templates</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Sign In</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableTemplates = getTemplateList();
  
  // Separate main templates from cloned ones
  const mainTemplates = templates.filter(template => template.isMain);
  const clonedTemplates = templates.filter(template => !template.isMain);

  const renderTemplateCard = (template: Template) => (
    <Card key={template.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription>/{template.slug}</CardDescription>
          </div>
          <div className="flex gap-1 flex-wrap">
            {template.maintenance ? (
              <Badge variant="destructive">Maintenance</Badge>
            ) : (
              <Badge variant="secondary">Active</Badge>
            )}
            <Badge variant="outline">{template.templateKey}</Badge>
            {template.sourceTemplateId && (
              <Badge variant="outline" className="text-blue-600">Clone</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="font-semibold text-blue-600">{template.stats?.totalRsvps || 0}</div>
            <div className="text-xs text-gray-500">Total RSVPs</div>
          </div>
          <div>
            <div className="font-semibold text-green-600">{template.stats?.attending || 0}</div>
            <div className="text-xs text-gray-500">Attending</div>
          </div>
          <div>
            <div className="font-semibold text-red-600">{template.stats?.notAttending || 0}</div>
            <div className="text-xs text-gray-500">Not Attending</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link href={`/${template.slug}`}>
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
          </Link>
          <Link href={`/platform/templates/${template.id}`}>
            <Button variant="outline" size="sm" className="flex-1">
              <Settings className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </Link>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => openCloneDialog(template)}
          >
            <Copy className="w-4 h-4 mr-1" />
            Clone
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => deleteTemplate(template)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500">
          <div>Created: {new Date(template.createdAt).toLocaleDateString()}</div>
          {template.ownerEmail && <div>Owner: {template.ownerEmail}</div>}
          {template.sourceTemplateId && (
            <div className="text-blue-600">Cloned from: {templates.find(t => t.id === template.sourceTemplateId)?.name || 'Unknown'}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Wedding Platform</h1>
              <p className="text-gray-600">Manage wedding invitation templates</p>
            </div>
            <div className="flex gap-4">
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Template</DialogTitle>
                    <DialogDescription>
                      Create a new wedding invitation template from scratch or clone an existing one.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createTemplate} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Template Name</Label>
                      <Input
                        id="name"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                        placeholder="e.g., John & Jane Wedding"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">URL Slug</Label>
                      <Input
                        id="slug"
                        value={createForm.slug}
                        onChange={(e) => setCreateForm({...createForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                        placeholder="e.g., john-jane-2025"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="templateKey">Template Type</Label>
                      <Select value={createForm.templateKey} onValueChange={(value) => setCreateForm({...createForm, templateKey: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTemplates.map((template) => (
                            <SelectItem key={template.key} value={template.key}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ownerEmail">Customer Email (Optional)</Label>
                      <Input
                        id="ownerEmail"
                        type="email"
                        value={createForm.ownerEmail}
                        onChange={(e) => setCreateForm({...createForm, ownerEmail: e.target.value})}
                        placeholder="customer@email.com"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create Template</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Clone Template Dialog */}
              <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Clone Template</DialogTitle>
                    <DialogDescription>
                      Create a customized copy of "{cloneForm.sourceTemplate?.name}" for a specific customer.
                      RSVP responses will be sent to the customer's email address.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCloneTemplate} className="space-y-4">
                    <div>
                      <Label htmlFor="cloneName">Template Name</Label>
                      <Input
                        id="cloneName"
                        value={cloneForm.name}
                        onChange={(e) => setCloneForm({...cloneForm, name: e.target.value})}
                        placeholder="e.g., John & Jane Wedding"
                        required
                        data-testid="input-clone-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cloneSlug">Custom URL Path</Label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">4ever.am/</span>
                        <Input
                          id="cloneSlug"
                          value={cloneForm.slug}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');
                            setCloneForm({...cloneForm, slug: value});
                          }}
                          placeholder="john-jane or alex-maria-2025"
                          required
                          data-testid="input-clone-slug"
                          className={cloneForm.slug && !/^[a-z0-9-]+$/.test(cloneForm.slug) ? "border-red-300" : ""}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Choose a custom URL for the wedding website. Use names like "john-jane" or "alex-maria-2025".
                        {cloneForm.slug && !/^[a-z0-9-]+$/.test(cloneForm.slug) && (
                          <span className="text-red-500 block">Only lowercase letters, numbers, and hyphens allowed.</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="cloneOwnerEmail">Customer Email Address *</Label>
                      <Input
                        id="cloneOwnerEmail"
                        type="email"
                        value={cloneForm.ownerEmail}
                        onChange={(e) => setCloneForm({...cloneForm, ownerEmail: e.target.value})}
                        placeholder="customer@email.com"
                        required
                        data-testid="input-clone-email"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        All RSVP notifications will be sent to this email address.
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setCloneDialogOpen(false)} data-testid="button-clone-cancel">
                        Cancel
                      </Button>
                      <Button type="submit" data-testid="button-clone-submit">
                        Clone Template
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Templates with Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="main" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="main" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Main Templates ({mainTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="cloned" className="flex items-center gap-2">
                <Copy className="w-4 h-4" />
                Cloned Templates ({clonedTemplates.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="main" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Main Templates</h2>
                <p className="text-gray-600">Base templates and original configurations</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mainTemplates.map(renderTemplateCard)}
            </div>

            {mainTemplates.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No main templates yet</h3>
                <p className="text-gray-600 mb-4">Create your first wedding invitation template to get started.</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Template
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cloned" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Cloned Templates</h2>
                <p className="text-gray-600">Customized versions created from main templates</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clonedTemplates.map(renderTemplateCard)}
            </div>

            {clonedTemplates.length === 0 && (
              <div className="text-center py-12">
                <Copy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No cloned templates yet</h3>
                <p className="text-gray-600 mb-4">Clone existing templates to create customized versions for different clients.</p>
                {mainTemplates.length > 0 && (
                  <p className="text-gray-500 text-sm">Use the "Clone" button on any main template to get started.</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
