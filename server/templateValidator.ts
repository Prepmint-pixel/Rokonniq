import { validateTemplateVariables, extractVariablesFromTemplate, AVAILABLE_VARIABLES } from "./templateVariables";

export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  requiredVariables: string[];
  missingVariables: string[];
}

/**
 * Comprehensive template validation
 */
export function validateTemplate(
  subject: string,
  body: string
): TemplateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredVariables: string[] = [];
  const missingVariables: string[] = [];

  // Validate subject
  if (!subject || subject.trim().length === 0) {
    errors.push("Subject line is required");
  } else if (subject.length > 200) {
    warnings.push(`Subject line is ${subject.length} characters (recommended max: 200)`);
  }

  // Validate body
  if (!body || body.trim().length === 0) {
    errors.push("Email body is required");
  } else if (body.length < 20) {
    warnings.push("Email body seems too short");
  }

  // Check for invalid variables in subject
  const subjectValidation = validateTemplateVariables(subject);
  if (!subjectValidation.valid) {
    errors.push(
      `Invalid variables in subject: ${subjectValidation.invalidVariables.join(", ")}`
    );
  }
  requiredVariables.push(...subjectValidation.requiredVariables);

  // Check for invalid variables in body
  const bodyValidation = validateTemplateVariables(body);
  if (!bodyValidation.valid) {
    errors.push(
      `Invalid variables in body: ${bodyValidation.invalidVariables.join(", ")}`
    );
  }
  requiredVariables.push(...bodyValidation.requiredVariables);

  // Remove duplicates
  const uniqueRequired = Array.from(new Set(requiredVariables));

  // Check for common mistakes
  if (subject.includes("{{") && !subject.includes("}}")) {
    errors.push("Unclosed variable in subject (missing }})");
  }
  if (body.includes("{{") && !body.includes("}}")) {
    errors.push("Unclosed variable in body (missing }})");
  }

  // Suggest common variables if template seems empty
  if (
    !subject.includes("{{") &&
    !body.includes("{{") &&
    body.length < 100
  ) {
    warnings.push(
      "Consider adding personalization variables like {{firstName}}, {{company}}, or {{jobTitle}}"
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    requiredVariables: uniqueRequired,
    missingVariables,
  };
}

/**
 * Check if contact has all required variables
 */
export function validateContactData(
  contactData: Record<string, any>,
  requiredVariables: string[]
): {
  valid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  for (const variable of requiredVariables) {
    const value = contactData[variable];
    if (value === null || value === undefined || value === "") {
      missingFields.push(variable);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Validate bulk email campaign
 */
export function validateBulkCampaign(
  subject: string,
  body: string,
  contacts: Array<Record<string, any>>
): {
  templateValid: boolean;
  contactsValid: boolean;
  templateErrors: string[];
  contactIssues: Array<{
    contactIndex: number;
    email?: string;
    missingFields: string[];
  }>;
} {
  const templateValidation = validateTemplate(subject, body);
  const contactIssues: Array<{
    contactIndex: number;
    email?: string;
    missingFields: string[];
  }> = [];

  // Validate each contact
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    const contactValidation = validateContactData(
      contact,
      templateValidation.requiredVariables
    );

    if (!contactValidation.valid) {
      contactIssues.push({
        contactIndex: i,
        email: contact.email,
        missingFields: contactValidation.missingFields,
      });
    }
  }

  return {
    templateValid: templateValidation.valid,
    contactsValid: contactIssues.length === 0,
    templateErrors: templateValidation.errors,
    contactIssues,
  };
}

/**
 * Get validation suggestions
 */
export function getValidationSuggestions(
  validation: TemplateValidationResult
): string[] {
  const suggestions: string[] = [];

  if (validation.errors.length > 0) {
    suggestions.push(`Fix ${validation.errors.length} error(s) before sending`);
  }

  if (validation.warnings.length > 0) {
    suggestions.push(`Review ${validation.warnings.length} warning(s)`);
  }

  if (validation.requiredVariables.length === 0) {
    suggestions.push(
      "Add personalization variables to increase engagement (e.g., {{firstName}}, {{company}})"
    );
  }

  // Suggest high-impact variables
  const highImpactVars = ["firstName", "company", "jobTitle"];
  const missingHighImpact = highImpactVars.filter(
    (v) => !validation.requiredVariables.includes(v)
  );

  if (missingHighImpact.length > 0) {
    suggestions.push(
      `Consider adding {{${missingHighImpact[0]}}} for better personalization`
    );
  }

  return suggestions;
}

/**
 * Generate template health score (0-100)
 */
export function getTemplateHealthScore(
  validation: TemplateValidationResult
): number {
  let score = 100;

  // Deduct for errors
  score -= validation.errors.length * 10;

  // Deduct for warnings
  score -= validation.warnings.length * 5;

  // Bonus for personalization
  if (validation.requiredVariables.length >= 3) {
    score += 10;
  }

  // Bonus for high-impact variables
  const highImpactVars = ["firstName", "company", "jobTitle"];
  const hasHighImpact = highImpactVars.filter((v) =>
    validation.requiredVariables.includes(v)
  ).length;
  score += hasHighImpact * 5;

  return Math.max(0, Math.min(100, score));
}
