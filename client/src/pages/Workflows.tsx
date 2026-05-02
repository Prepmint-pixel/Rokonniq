import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit2, Trash2, Play, Eye } from 'lucide-react';
import WorkflowBuilder from '@/components/WorkflowBuilder';
import { useLocation } from 'wouter';

interface WorkflowFormData {
  name: string;
  description: string;
  trigger: string;
}

export default function Workflows() {
  const { user, isAuthenticated } = useAuth();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    description: '',
    trigger: 'contact_added',
  });

  // tRPC queries and mutations
  const { data: workflowsData, isLoading: isLoadingWorkflows } = trpc.workflows.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const createWorkflowMutation = trpc.workflows.create.useMutation({
    onSuccess: (data) => {
      setShowCreateDialog(false);
      setFormData({ name: '', description: '', trigger: 'contact_added' });
      // Refetch workflows
      if (workflowsData) {
        setWorkflows([...workflowsData, data]);
      }
    },
  });

  const deleteWorkflowMutation = trpc.workflows.delete.useMutation({
    onSuccess: () => {
      setWorkflows(workflows.filter((w) => w.id !== selectedWorkflow?.id));
      setSelectedWorkflow(null);
    },
  });

  const executeWorkflowMutation = trpc.workflows.executeForContact.useMutation();

  useEffect(() => {
    if (workflowsData) {
      setWorkflows(workflowsData);
    }
  }, [workflowsData]);

  const handleCreateWorkflow = async () => {
    if (!formData.name.trim()) {
      alert('Workflow name is required');
      return;
    }

    await createWorkflowMutation.mutateAsync({
      name: formData.name,
      description: formData.description,
      trigger: formData.trigger as any,
    });
  };

  const handleDeleteWorkflow = async (workflowId: number) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      await deleteWorkflowMutation.mutateAsync({ id: workflowId });
    }
  };

  const updateWorkflowMutation = trpc.workflows.update.useMutation({
    onSuccess: () => {
      alert('Workflow saved successfully!');
      setShowBuilder(false);
    },
  });

  const handleSaveWorkflow = async (nodes: any[], edges: any[]) => {
    if (!selectedWorkflow) return;

    await updateWorkflowMutation.mutateAsync({
      id: selectedWorkflow.id,
      nodeData: JSON.stringify(nodes),
      edgeData: JSON.stringify(edges),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to view workflows</p>
      </div>
    );
  }

  if (showBuilder && selectedWorkflow) {
    return (
      <div>
        <div className="p-4 border-b border-border bg-card flex justify-between items-center">
          <h1 className="text-2xl font-bold">{selectedWorkflow.name}</h1>
          <Button variant="outline" onClick={() => setShowBuilder(false)}>
            Back to Workflows
          </Button>
        </div>
        <WorkflowBuilder
          workflowId={selectedWorkflow.id}
          onSave={handleSaveWorkflow}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Automated Workflows</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., First Follow-up Sequence"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this workflow does..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="trigger">Trigger Event</Label>
                <Select value={formData.trigger} onValueChange={(value) => setFormData({ ...formData, trigger: value })}>
                  <SelectTrigger id="trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact_added">Contact Added</SelectItem>
                    <SelectItem value="contact_status_changed">Status Changed</SelectItem>
                    <SelectItem value="email_opened">Email Opened</SelectItem>
                    <SelectItem value="email_clicked">Email Clicked</SelectItem>
                    <SelectItem value="qr_scanned">QR Scanned</SelectItem>
                    <SelectItem value="manual">Manual Trigger</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCreateWorkflow}
                disabled={createWorkflowMutation.isPending}
                className="w-full"
              >
                {createWorkflowMutation.isPending ? 'Creating...' : 'Create Workflow'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingWorkflows ? (
        <div className="text-center py-12">
          <p>Loading workflows...</p>
        </div>
      ) : workflows.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No workflows created yet</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Workflow
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{workflow.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{workflow.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {workflow.trigger.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${workflow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {workflow.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedWorkflow(workflow);
                    setShowBuilder(true);
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteWorkflow(workflow.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
