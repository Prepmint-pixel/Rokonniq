import jwt from "jsonwebtoken";

/**
 * Google Wallet Pass Object
 * Represents a loyalty card pass that can be added to Google Wallet
 */
interface GoogleWalletPassObject {
  id: string;
  classId: string;
  genericObjects?: Array<{
    id: string;
    classId: string;
    genericClass: {
      id: string;
      cardTitle: {
        defaultValue: {
          language: string;
          value: string;
        };
      };
      description?: {
        defaultValue: {
          language: string;
          value: string;
        };
      };
      logo?: {
        sourceUri: {
          uri: string;
        };
      };
      heroImage?: {
        sourceUri: {
          uri: string;
        };
      };
      textModulesData?: Array<{
        header: string;
        body: string;
      }>;
    };
    genericObject: {
      id: string;
      classId: string;
      cardTitle?: {
        defaultValue: {
          language: string;
          value: string;
        };
      };
      textModulesData?: Array<{
        header: string;
        body: string;
      }>;
    };
  }>;
}

/**
 * Generate a Google Wallet pass JWT
 * Note: This requires proper Google Wallet API credentials and service account setup
 * For production use, you need:
 * 1. Google Wallet API enabled in Google Cloud Console
 * 2. Service account with appropriate permissions
 * 3. Private key from service account JSON file
 */
export async function generateGoogleWalletJWT(
  cardData: {
    title: string;
    description?: string;
    cardId: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    logoUrl?: string;
    points?: number;
    balance?: number;
  },
  serviceAccountKey?: {
    private_key: string;
    client_email: string;
    project_id: string;
  }
): Promise<string> {
  // Use environment variables for production credentials
  const productionKey = {
    private_key: process.env.GOOGLE_WALLET_PRIVATE_KEY,
    client_email: process.env.GOOGLE_WALLET_CLIENT_EMAIL,
    project_id: process.env.GOOGLE_WALLET_PROJECT_ID,
  };

  // Use provided key, production env vars, or fallback to test mode
  const key = serviceAccountKey || (productionKey.private_key ? productionKey : null);

  if (!key) {
    // Generate a test JWT with placeholder claims
    const payload = {
      iss: "google",
      aud: "google",
      typ: "savetogooglepay",
      origins: [process.env.VITE_FRONTEND_URL || "http://localhost:5173"],
      payload: {
        genericObjects: [
          {
            id: `${cardData.cardId}-${Date.now()}`,
            classId: "3388000000000001",
            genericClass: {
              id: "3388000000000001",
              cardTitle: {
                defaultValue: {
                  language: "en",
                  value: cardData.title,
                },
              },
              description: cardData.description
                ? {
                    defaultValue: {
                      language: "en",
                      value: cardData.description,
                    },
                  }
                : undefined,
              logo: cardData.logoUrl
                ? {
                    sourceUri: {
                      uri: cardData.logoUrl,
                    },
                  }
                : undefined,
              textModulesData: [
                ...(cardData.points
                  ? [
                      {
                        header: "Points",
                        body: cardData.points.toString(),
                      },
                    ]
                  : []),
                ...(cardData.balance
                  ? [
                      {
                        header: "Balance",
                        body: `$${(cardData.balance / 100).toFixed(2)}`,
                      },
                    ]
                  : []),
              ],
            },
            genericObject: {
              id: `${cardData.cardId}-${Date.now()}`,
              classId: "3388000000000001",
              cardTitle: {
                defaultValue: {
                  language: "en",
                  value: cardData.title,
                },
              },
              textModulesData: [
                ...(cardData.points
                  ? [
                      {
                        header: "Points",
                        body: cardData.points.toString(),
                      },
                    ]
                  : []),
                ...(cardData.balance
                  ? [
                      {
                        header: "Balance",
                        body: `$${(cardData.balance / 100).toFixed(2)}`,
                      },
                    ]
                  : []),
              ],
            },
          },
        ],
      },
    };

    // Test mode: Sign with a test key
    return jwt.sign(payload, "test-secret-key", {
      algorithm: "HS256",
      expiresIn: "1h",
    });
  }

  // Production: Sign JWT with actual Google service account credentials
  const payload = {
    iss: key.client_email,
    aud: "google",
    typ: "savetogooglepay",
    origins: [process.env.VITE_FRONTEND_URL || "https://rokonniq.io"],
    payload: {
      genericObjects: [
        {
          id: `${cardData.cardId}-${Date.now()}`,
          classId: `${key.project_id}.loyalty_class`,
          genericClass: {
            id: `${key.project_id}.loyalty_class`,
            cardTitle: {
              defaultValue: {
                language: "en",
                value: cardData.title,
              },
            },
            description: cardData.description
              ? {
                  defaultValue: {
                    language: "en",
                    value: cardData.description,
                  },
                }
              : undefined,
            logo: cardData.logoUrl
              ? {
                  sourceUri: {
                    uri: cardData.logoUrl,
                  },
                }
              : undefined,
            textModulesData: [
              ...(cardData.points
                ? [
                    {
                      header: "Points",
                      body: cardData.points.toString(),
                    },
                  ]
                : []),
              ...(cardData.balance
                ? [
                    {
                      header: "Balance",
                      body: `$${(cardData.balance / 100).toFixed(2)}`,
                    },
                  ]
                : []),
            ],
          },
          genericObject: {
            id: `${cardData.cardId}-${Date.now()}`,
            classId: `${key.project_id}.loyalty_class`,
            cardTitle: {
              defaultValue: {
                language: "en",
                value: cardData.title,
              },
            },
            textModulesData: [
              ...(cardData.points
                ? [
                    {
                      header: "Points",
                      body: cardData.points.toString(),
                    },
                  ]
                : []),
              ...(cardData.balance
                ? [
                    {
                      header: "Balance",
                      body: `$${(cardData.balance / 100).toFixed(2)}`,
                    },
                  ]
                : []),
            ],
          },
        },
      ],
    },
  };

  // Ensure private key has proper newlines for RS256 signing
  const privateKey = (key.private_key as string).replace(/\\n/g, "\n");
  
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "1h",
  });
}

/**
 * Create Google Wallet save URL
 * Users can click this URL to add the pass to their Google Wallet
 */
export function createGoogleWalletSaveUrl(jwt: string): string {
  return `https://pay.google.com/gp/v/save/${jwt}`;
}

/**
 * Validate Google Wallet JWT
 */
export function validateGoogleWalletJWT(token: string): boolean {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) return false;
    
    const header = decoded.header as any;
    const payload = decoded.payload as any;
    
    if (header.alg !== "RS256" && header.alg !== "HS256") return false;
    if (!payload.iss || !payload.aud) return false;
    
    return true;
  } catch {
    return false;
  }
}
