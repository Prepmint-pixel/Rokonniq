/**
 * Email template variable system for personalized outreach
 */

export const AVAILABLE_VARIABLES = {
  // Contact information
  firstName: {
    label: "First Name",
    description: "Recipient's first name",
    example: "John",
    category: "Contact",
  },
  lastName: {
    label: "Last Name",
    description: "Recipient's last name",
    example: "Doe",
    category: "Contact",
  },
  fullName: {
    label: "Full Name",
    description: "Recipient's full name",
    example: "John Doe",
    category: "Contact",
  },
  email: {
    label: "Email",
    description: "Recipient's email address",
    example: "john@example.com",
    category: "Contact",
  },
  phone: {
    label: "Phone",
    description: "Recipient's phone number",
    example: "+1-555-0123",
    category: "Contact",
  },
  company: {
    label: "Company",
    description: "Recipient's company name",
    example: "Acme Corporation",
    category: "Contact",
  },
  jobTitle: {
    label: "Job Title",
    description: "Recipient's job title",
    example: "Marketing Manager",
    category: "Contact",
  },
  industry: {
    label: "Industry",
    description: "Recipient's industry",
    example: "Technology",
    category: "Contact",
  },

  // Interaction history
  lastInteraction: {
    label: "Last Interaction",
    description: "Date of last interaction",
    example: "2 days ago",
    category: "History",
  },
  lastInteractionType: {
    label: "Last Interaction Type",
    description: "Type of last interaction (meeting, call, email)",
    example: "meeting",
    category: "History",
  },
  meetingDate: {
    label: "Meeting Date",
    description: "Date of the meeting",
    example: "April 20, 2026",
    category: "History",
  },
  meetingTopic: {
    label: "Meeting Topic",
    description: "Topic discussed in the meeting",
    example: "Product Demo",
    category: "History",
  },
  notes: {
    label: "Notes",
    description: "Custom notes about the contact",
    example: "Interested in enterprise plan",
    category: "History",
  },

  // Engagement metrics
  cardViewCount: {
    label: "Card View Count",
    description: "Number of times contact viewed your card",
    example: "3",
    category: "Engagement",
  },
  qrScans: {
    label: "QR Code Scans",
    description: "Number of QR code scans",
    example: "2",
    category: "Engagement",
  },
  walletAdds: {
    label: "Wallet Adds",
    description: "Number of times added to wallet",
    example: "1",
    category: "Engagement",
  },

  // Lead information
  leadStatus: {
    label: "Lead Status",
    description: "Current status of the lead",
    example: "Qualified",
    category: "Lead",
  },
  leadScore: {
    label: "Lead Score",
    description: "Engagement score of the lead",
    example: "85",
    category: "Lead",
  },
  dealValue: {
    label: "Deal Value",
    description: "Estimated deal value",
    example: "$50,000",
    category: "Lead",
  },

  // Sender information
  senderName: {
    label: "Your Name",
    description: "Your name",
    example: "Jane Smith",
    category: "Sender",
  },
  senderTitle: {
    label: "Your Title",
    description: "Your job title",
    example: "Sales Director",
    category: "Sender",
  },
  senderCompany: {
    label: "Your Company",
    description: "Your company name",
    example: "Tech Solutions Inc",
    category: "Sender",
  },
};

export type AvailableVariable = keyof typeof AVAILABLE_VARIABLES;

/**
 * Extract variables from template text
 */
export function extractVariablesFromTemplate(template: string): AvailableVariable[] {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables: AvailableVariable[] = [];
  let match;

  while ((match = variableRegex.exec(template)) !== null) {
    const varName = match[1] as AvailableVariable;
    if (varName in AVAILABLE_VARIABLES && !variables.includes(varName)) {
      variables.push(varName);
    }
  }

  return variables;
}

/**
 * Validate template variables
 */
export function validateTemplateVariables(template: string): {
  valid: boolean;
  invalidVariables: string[];
  requiredVariables: AvailableVariable[];
} {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const invalidVariables: string[] = [];
  const requiredVariables: AvailableVariable[] = [];
  let match;

  while ((match = variableRegex.exec(template)) !== null) {
    const varName = match[1];
    if (!(varName in AVAILABLE_VARIABLES)) {
      if (!invalidVariables.includes(varName)) {
        invalidVariables.push(varName);
      }
    } else if (!requiredVariables.includes(varName as AvailableVariable)) {
      requiredVariables.push(varName as AvailableVariable);
    }
  }

  return {
    valid: invalidVariables.length === 0,
    invalidVariables,
    requiredVariables,
  };
}

/**
 * Substitute variables in template with contact data
 */
export function substituteVariables(
  template: string,
  contactData: Record<string, any>
): string {
  let result = template;
  const variableRegex = /\{\{(\w+)\}\}/g;

  result = result.replace(variableRegex, (match, varName) => {
    if (varName in contactData) {
      const value = contactData[varName];
      return value !== null && value !== undefined ? String(value) : match;
    }
    return match;
  });

  return result;
}

/**
 * Get sample data for template preview
 */
export function getSampleData(): Record<string, any> {
  return {
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
}

/**
 * Get variables by category
 */
export function getVariablesByCategory(category: string) {
  return Object.entries(AVAILABLE_VARIABLES)
    .filter(([_, config]) => config.category === category)
    .map(([key, config]) => ({
      key,
      ...config,
    }));
}

/**
 * Get all variable categories
 */
export function getVariableCategories(): string[] {
  const categories = new Set(
    Object.values(AVAILABLE_VARIABLES).map((v) => v.category)
  );
  return Array.from(categories).sort();
}

/**
 * Build contact data from CRM contact
 */
export function buildContactData(contact: any, engagement?: any): Record<string, any> {
  return {
    firstName: contact.firstName || "",
    lastName: contact.lastName || "",
    fullName: `${contact.firstName || ""} ${contact.lastName || ""}`.trim(),
    email: contact.email || "",
    phone: contact.phone || "",
    company: contact.company || "",
    jobTitle: contact.jobTitle || "",
    industry: contact.industry || "",
    lastInteraction: contact.lastInteraction || "",
    lastInteractionType: contact.lastInteractionType || "",
    meetingDate: contact.meetingDate || "",
    meetingTopic: contact.meetingTopic || "",
    notes: contact.notes || "",
    cardViewCount: engagement?.cardViewCount || 0,
    qrScans: engagement?.qrScans || 0,
    walletAdds: engagement?.walletAdds || 0,
    leadStatus: contact.leadStatus || "",
    leadScore: contact.leadScore || 0,
    dealValue: contact.dealValue || "",
    senderName: contact.senderName || "",
    senderTitle: contact.senderTitle || "",
    senderCompany: contact.senderCompany || "",
  };
}
