import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2, Edit2, Play } from 'lucide-react';
import WorkflowNode from './WorkflowNode';

const nodeTypes = {
  trigger: WorkflowNode,
  delay: WorkflowNode,
  email: WorkflowNode,
  condition: WorkflowNode,
  status: WorkflowNode,
  tag: WorkflowNode,
};

interface WorkflowBuilderProps {
  workflowId?: number;
  onSave?: (nodeData: Node[], edgeData: Edge[]) => void;
}

export default function WorkflowBuilder({ workflowId, onSave }: WorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: '1',
      data: { label: 'Trigger', type: 'contact_added' },
      position: { x: 250, y: 25 },
      type: 'trigger',
      selected: false,
    },
  ]);

  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [nodeConfig, setNodeConfig] = useState<any>({})

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setNodeConfig(node.data.config || {});
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      handleNodeClick(event, node);
    },
    []
  );

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      data: { label: getNodeLabel(type), type },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      type: type === 'contact_added' ? 'trigger' : type,
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  };

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, config } } : node
      )
    );
  };

  const getNodeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      trigger: 'Trigger',
      delay: 'Delay',
      email: 'Send Email',
      condition: 'Condition',
      status: 'Update Status',
      tag: 'Add Tag',
    };
    return labels[type] || type;
  };

  const handleSave = () => {
    if (onSave) {
      onSave(nodes, edges);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b border-border p-4 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Workflow Builder</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSave}>
              Save Workflow
            </Button>
            <Button variant="outline" onClick={() => addNode('delay')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>
        </div>

        {/* Node Type Selector */}
        <div className="flex gap-2 flex-wrap">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                + Delay
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Delay Step</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Duration</Label>
                  <Input type="number" placeholder="5" />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => { addNode('delay'); setShowNodeDialog(false); }}>
                  Add Delay
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="secondary" size="sm" onClick={() => addNode('email')}>
            + Email
          </Button>
          <Button variant="secondary" size="sm" onClick={() => addNode('condition')}>
            + Condition
          </Button>
          <Button variant="secondary" size="sm" onClick={() => addNode('status')}>
            + Status
          </Button>
          <Button variant="secondary" size="sm" onClick={() => addNode('tag')}>
            + Tag
          </Button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="border-t border-border p-4 bg-card max-h-48 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">{selectedNode.data.label}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteNode(selectedNode.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Node-specific configuration */}
          {selectedNode.type === 'delay' && (
            <div className="space-y-2">
              <Label>Duration</Label>
              <Input
                type="number"
                placeholder="5"
                onChange={(e) =>
                  updateNodeConfig(selectedNode.id, {
                    delay: { value: parseInt(e.target.value), unit: 'minutes' },
                  })
                }
              />
            </div>
          )}

          {selectedNode.type === 'email' && (
            <div className="space-y-2">
              <Label>Email Template</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="template1">Template 1</SelectItem>
                  <SelectItem value="template2">Template 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedNode.type === 'condition' && (
            <div className="space-y-2">
              <Label>Condition Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email_opened">Email Opened</SelectItem>
                  <SelectItem value="email_clicked">Email Clicked</SelectItem>
                  <SelectItem value="engagement_score">Engagement Score</SelectItem>
                  <SelectItem value="contact_status">Contact Status</SelectItem>
                  <SelectItem value="time_elapsed">Time Elapsed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedNode.type === 'status' && (
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
