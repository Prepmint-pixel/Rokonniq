import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id?: number;
  name: string;
  subject: string;
  body: string;
  variables?: string[];
}

interface EmailTemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Template) => void;
  initialTemplate?: Template;
  isLoading?: boolean;
}

const COMMON_VARIABLES = [
  "contactName",
  "contactEmail",
  "company",
  "eventName",
  "topic",
  "senderName",
  "proposalDate",
  "goal",
  "resource",
];

export function EmailTemplateEditor({
  isOpen,
  onClose,
  onSave,
  initialTemplate,
  isLoading = false,
}: EmailTemplateEditorProps) {
  const [template, setTemplate] = useState<Template>(
    initialTemplate || {
      name: "",
      subject: "",
      body: "",
      variables: [],
    }
  );

  const [selectedVariables, setSelectedVariables] = useState<string[]>(
    initialTemplate?.variables || []
  );

  const handleSave = () => {
    if (!template.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    if (!template.subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    if (!template.body.trim()) {
      toast.error("Body is required");
      return;
    }

    onSave({
      ...template,
      variables: selectedVariables,
    });

    // Reset form
    setTemplate({
      name: "",
      subject: "",
      body: "",
      variables: [],
    });
    setSelectedVariables([]);
  };

  const toggleVariable = (variable: string) => {
    setSelectedVariables((prev) =>
      prev.includes(variable)
        ? prev.filter((v) => v !== variable)
        : [...prev, variable]
    );
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("template-body") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody =
        template.body.substring(0, start) +
        `{{${variable}}}` +
        template.body.substring(end);

      setTemplate({ ...template, body: newBody });
      
      // Move cursor after inserted variable
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length + 4;
        textarea.focus();
      }, 0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialTemplate ? "Edit Email Template" : "Create Email Template"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Template Name
            </label>
            <Input
              placeholder="e.g., First Meeting Follow-up"
              value={template.name}
              onChange={(e) => setTemplate({ ...template, name: e.target.value })}
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Subject
            </label>
            <Input
              placeholder="e.g., Great meeting you today, {{contactName}}!"
              value={template.subject}
              onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
            />
          </div>

          {/* Variables Helper */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Insert Variables
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_VARIABLES.map((variable) => (
                <Button
                  key={variable}
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable(variable)}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {variable}
                </Button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Body
            </label>
            <Textarea
              id="template-body"
              placeholder="Write your email template here. Use {{variableName}} for dynamic content."
              value={template.body}
              onChange={(e) => setTemplate({ ...template, body: e.target.value })}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">
              Use double curly braces like {'{{'} contactName {'}}'} for variables
            </p>
          </div>

          {/* Selected Variables Display */}
          {selectedVariables.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Variables Used
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedVariables.map((variable) => (
                  <div
                    key={variable}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {variable}
                    <button
                      onClick={() => toggleVariable(variable)}
                      className="hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Preview</h4>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-slate-500">Subject:</p>
                <p className="text-sm font-medium text-slate-900">
                  {template.subject || "(No subject)"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Body:</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {template.body || "(No body)"}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
