import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card } from './ui/card';
import { Clock, Mail, GitBranch, CheckSquare, Tag } from 'lucide-react';

interface WorkflowNodeProps {
  data: {
    label: string;
    type: string;
    config?: any;
  };
  isConnecting?: boolean;
  selected?: boolean;
}

export default function WorkflowNode({ data, isConnecting, selected }: WorkflowNodeProps) {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'trigger':
        return '▶';
      case 'delay':
        return <Clock className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'condition':
        return <GitBranch className="w-4 h-4" />;
      case 'status':
        return <CheckSquare className="w-4 h-4" />;
      case 'tag':
        return <Tag className="w-4 h-4" />;
      default:
        return '○';
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'trigger':
        return 'bg-blue-100 border-blue-300';
      case 'delay':
        return 'bg-yellow-100 border-yellow-300';
      case 'email':
        return 'bg-green-100 border-green-300';
      case 'condition':
        return 'bg-purple-100 border-purple-300';
      case 'status':
        return 'bg-orange-100 border-orange-300';
      case 'tag':
        return 'bg-pink-100 border-pink-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <div>
      <Handle type="target" position={Position.Top} />
      <Card
        className={`px-4 py-3 rounded-lg border-2 min-w-[150px] flex items-center gap-2 cursor-pointer transition-all ${getNodeColor(
          data.type
        )} ${selected ? 'ring-2 ring-blue-500' : ''}`}
      >
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0">{getNodeIcon(data.type)}</div>
          <div className="text-sm font-medium">{data.label}</div>
        </div>
      </Card>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
