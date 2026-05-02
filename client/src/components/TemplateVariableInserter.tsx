import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Info } from "lucide-react";
import { toast } from "sonner";

// Variable categories and definitions
const VARIABLE_CATEGORIES = {
  Contact: [
    { key: "firstName", label: "First Name", example: "John" },
    { key: "lastName", label: "Last Name", example: "Doe" },
    { key: "fullName", label: "Full Name", example: "John Doe" },
    { key: "email", label: "Email", example: "john@example.com" },
    { key: "phone", label: "Phone", example: "+1-555-0123" },
    { key: "company", label: "Company", example: "Acme Corp" },
    { key: "jobTitle", label: "Job Title", example: "Manager" },
    { key: "industry", label: "Industry", example: "Technology" },
  ],
  History: [
    { key: "lastInteraction", label: "Last Interaction", example: "2 days ago" },
    { key: "lastInteractionType", label: "Interaction Type", example: "meeting" },
    { key: "meetingDate", label: "Meeting Date", example: "April 20, 2026" },
    { key: "meetingTopic", label: "Meeting Topic", example: "Product Demo" },
    { key: "notes", label: "Notes", example: "Interested in plan" },
  ],
  Engagement: [
    { key: "cardViewCount", label: "Card Views", example: "3" },
    { key: "qrScans", label: "QR Scans", example: "2" },
    { key: "walletAdds", label: "Wallet Adds", example: "1" },
  ],
  Lead: [
    { key: "leadStatus", label: "Lead Status", example: "Qualified" },
    { key: "leadScore", label: "Lead Score", example: "85" },
    { key: "dealValue", label: "Deal Value", example: "$50,000" },
  ],
  Sender: [
    { key: "senderName", label: "Your Name", example: "Jane Smith" },
    { key: "senderTitle", label: "Your Title", example: "Director" },
    { key: "senderCompany", label: "Your Company", example: "Tech Inc" },
  ],
};

interface TemplateVariableInserterProps {
  onInsertVariable: (variable: string) => void;
}

export function TemplateVariableInserter({
  onInsertVariable,
}: TemplateVariableInserterProps) {
  const [activeCategory, setActiveCategory] = useState("Contact");

  const copyToClipboard = (variable: string) => {
    const variableText = `{{${variable}}}`;
    navigator.clipboard.writeText(variableText);
    toast.success(`Copied {{${variable}}} to clipboard`);
  };

  const insertVariable = (variable: string) => {
    onInsertVariable(`{{${variable}}}`);
    toast.success(`Inserted {{${variable}}}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          Template Variables
        </CardTitle>
        <CardDescription>
          Insert dynamic variables to personalize emails for each recipient
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid w-full grid-cols-5">
            {Object.keys(VARIABLE_CATEGORIES).map((category) => (
              <TabsTrigger key={category} value={category} className="text-xs">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(VARIABLE_CATEGORIES).map(([category, variables]) => (
            <TabsContent key={category} value={category} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {variables.map((variable) => (
                  <div
                    key={variable.key}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {variable.label}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {`{{${variable.key}}}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {`e.g. ${variable.example}`}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(variable.key)}
                        title="Copy to clipboard"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => insertVariable(variable.key)}
                      >
                        Insert
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-900">
            <strong>Tip:</strong> Variables are replaced with actual contact data when
            emails are sent. Use {`{{firstName}}`} to personalize greetings, {`{{company}}`} for
            company-specific messaging, and {`{{leadScore}}`} for engagement-based follow-ups.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
