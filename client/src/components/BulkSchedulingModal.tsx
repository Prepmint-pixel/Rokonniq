import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, X, Clock } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: number;
  name: string;
  email: string;
}

interface Template {
  id: number;
  name: string;
  subject: string;
  body: string;
}

interface BulkSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (contactIds: number[], templateId: number, delays: number[]) => void;
  contacts: Contact[];
  templates: Template[];
  isLoading?: boolean;
}

const PRESET_DELAYS = [
  { label: "Immediate", hours: 0 },
  { label: "1 Hour", hours: 1 },
  { label: "1 Day", hours: 24 },
  { label: "3 Days", hours: 72 },
  { label: "1 Week", hours: 168 },
  { label: "2 Weeks", hours: 336 },
];

export function BulkSchedulingModal({
  isOpen,
  onClose,
  onSchedule,
  contacts,
  templates,
  isLoading = false,
}: BulkSchedulingModalProps) {
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedDelays, setSelectedDelays] = useState<number[]>([]);
  const [customDelay, setCustomDelay] = useState("");

  const handleContactToggle = (contactId: number) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleDelayToggle = (hours: number) => {
    setSelectedDelays((prev) =>
      prev.includes(hours)
        ? prev.filter((h) => h !== hours)
        : [...prev, hours]
    );
  };

  const handleAddCustomDelay = () => {
    const hours = parseInt(customDelay);
    if (isNaN(hours) || hours < 0) {
      toast.error("Please enter a valid number of hours");
      return;
    }

    if (!selectedDelays.includes(hours)) {
      setSelectedDelays([...selectedDelays, hours]);
    }
    setCustomDelay("");
  };

  const handleSchedule = () => {
    if (selectedContacts.length === 0) {
      toast.error("Please select at least one contact");
      return;
    }

    if (!selectedTemplate) {
      toast.error("Please select an email template");
      return;
    }

    if (selectedDelays.length === 0) {
      toast.error("Please select at least one follow-up delay");
      return;
    }

    onSchedule(
      selectedContacts,
      selectedTemplate,
      selectedDelays.sort((a, b) => a - b)
    );

    // Reset form
    setSelectedContacts([]);
    setSelectedTemplate(null);
    setSelectedDelays([]);
    setCustomDelay("");
  };

  const totalFollowUps = selectedContacts.length * selectedDelays.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Bulk Follow-ups</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Select Contacts */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm">
                1
              </span>
              Select Contacts
            </h3>
            <div className="border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {contacts.length === 0 ? (
                <p className="text-sm text-slate-500">No contacts available</p>
              ) : (
                contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`contact-${contact.id}`}
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={() => handleContactToggle(contact.id)}
                    />
                    <label
                      htmlFor={`contact-${contact.id}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      <div className="font-medium text-slate-900">{contact.name}</div>
                      <div className="text-xs text-slate-500">{contact.email}</div>
                    </label>
                  </div>
                ))
              )}
            </div>
            {selectedContacts.length > 0 && (
              <p className="text-sm text-blue-600 mt-2">
                {selectedContacts.length} contact{selectedContacts.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Step 2: Select Template */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm">
                2
              </span>
              Select Email Template
            </h3>
            <div className="space-y-2">
              {templates.length === 0 ? (
                <p className="text-sm text-slate-500">No templates available</p>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-medium text-slate-900">{template.name}</div>
                    <div className="text-sm text-slate-600">{template.subject}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Step 3: Select Follow-up Delays */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm">
                3
              </span>
              Follow-up Schedule
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {PRESET_DELAYS.map((delay) => (
                <Button
                  key={delay.hours}
                  variant={selectedDelays.includes(delay.hours) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDelayToggle(delay.hours)}
                  className="text-xs"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {delay.label}
                </Button>
              ))}
            </div>

            {/* Custom Delay */}
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Custom hours"
                value={customDelay}
                onChange={(e) => setCustomDelay(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleAddCustomDelay();
                }}
                min="0"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCustomDelay}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Selected Delays Display */}
            {selectedDelays.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedDelays.sort((a, b) => a - b).map((hours) => (
                  <div
                    key={hours}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {hours === 0 ? "Immediate" : `${hours}h`}
                    <button
                      onClick={() => handleDelayToggle(hours)}
                      className="hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {selectedContacts.length > 0 && selectedDelays.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Summary:</strong> {totalFollowUps} follow-up email{totalFollowUps !== 1 ? "s" : ""} will be scheduled
                for {selectedContacts.length} contact{selectedContacts.length !== 1 ? "s" : ""} at{" "}
                {selectedDelays.length} different time{selectedDelays.length !== 1 ? "s" : ""}.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={
                isLoading ||
                selectedContacts.length === 0 ||
                !selectedTemplate ||
                selectedDelays.length === 0
              }
            >
              {isLoading ? "Scheduling..." : "Schedule Follow-ups"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
