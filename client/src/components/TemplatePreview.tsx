import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

// Sample contact data for preview
const SAMPLE_DATA = {
  firstName: "John",
  lastName: "Doe",
  fullName: "John Doe",
  email: "john@example.com",
  phone: "+1-555-0123",
  company: "Acme Corporation",
  jobTitle: "Marketing Manager",
  industry: "Technology",
  lastInteraction: "2 days ago",
  lastInteractionType: "meeting",
  meetingDate: "April 20, 2026",
  meetingTopic: "Product Demo",
  notes: "Interested in enterprise plan",
  cardViewCount: 3,
  qrScans: 2,
  walletAdds: 1,
  leadStatus: "Qualified",
  leadScore: 85,
  dealValue: "$50,000",
  senderName: "Jane Smith",
  senderTitle: "Sales Director",
  senderCompany: "Tech Solutions Inc",
};

interface TemplatePreviewProps {
  subject: string;
  body: string;
}

export function TemplatePreview({ subject, body }: TemplatePreviewProps) {
  // Replace variables with sample data
  const replaceVariables = (text: string): string => {
    let result = text;
    Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, String(value));
    });
    return result;
  };

  const previewSubject = replaceVariables(subject);
  const previewBody = replaceVariables(body);

  // Extract variables used in template
  const extractVariables = (text: string): string[] => {
    const regex = /{{(\w+)}}/g;
    const variables: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  const usedVariables = [
    ...extractVariables(subject),
    ...extractVariables(body),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Preview
        </CardTitle>
        <CardDescription>
          How your email will look with sample data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Variables Used */}
        {usedVariables.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Variables Used:</p>
            <div className="flex flex-wrap gap-2">
              {usedVariables.map((variable) => (
                <Badge key={variable} variant="secondary">
                  {`{{${variable}}}`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Email Preview */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
          {/* Subject Line */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Subject
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {previewSubject || "(No subject)"}
            </p>
          </div>

          {/* Email Body */}
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
              Body
            </p>
            <div className="bg-white rounded border border-gray-200 p-3 text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {previewBody || "(No content)"}
            </div>
          </div>

          {/* Sample Contact Info */}
          <div className="border-t pt-3 bg-blue-50 rounded p-3">
            <p className="text-xs font-medium text-blue-900 mb-2">
              Sample Contact Data:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
              <div>
                <span className="font-medium">Name:</span> {SAMPLE_DATA.fullName}
              </div>
              <div>
                <span className="font-medium">Email:</span> {SAMPLE_DATA.email}
              </div>
              <div>
                <span className="font-medium">Company:</span>{" "}
                {SAMPLE_DATA.company}
              </div>
              <div>
                <span className="font-medium">Title:</span> {SAMPLE_DATA.jobTitle}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
