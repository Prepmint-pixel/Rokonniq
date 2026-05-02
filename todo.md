# Digital Contact Card - Workflow Builder TODO

## Workflow Builder Feature

- [x] Design workflow schema and database tables (workflows, workflowSteps, workflowConditions, workflowExecutions)
- [x] Implement workflow engine backend (execution logic, trigger evaluation, action execution)
- [x] Build visual workflow builder UI with node-based editor (React Flow)
- [x] Integrate workflow execution with email and analytics systems
- [x] Create workflow management dashboard and testing tools
- [x] Write tests and save checkpoint

## Completed Features

- [x] Digital Contact Card with customization
- [x] Multi-card management
- [x] QR code generation and vCard export
- [x] Wallet integration (Apple & Google Wallet)
- [x] Analytics dashboard with tracking
- [x] CRM system with contact management
- [x] Gmail OAuth2 integration
- [x] Email templates and bulk scheduling
- [x] Email delivery dashboard with retry logic
- [x] Email template variables system (20+ variables)

## Current Requests

- [x] Add "Company" field to basic info section (under Job Title)

## Current Work

- [x] Implement database persistence for card data (save/load from server instead of localStorage)

## Profile Picture Upload Feature

- [x] Create tRPC procedure for profile picture upload
- [x] Update CustomizationPanel to use file upload instead of base64
- [x] Integrate with S3 storage for profile images
- [x] Update card display to load images from S3
- [x] Test profile picture upload and display


## Monetization & Stripe Integration

- [x] Set up Stripe integration with webdev_add_feature
- [x] Create subscription plans table in database (free, pro, enterprise)
- [x] Create pricing page with tier comparison
- [x] Implement checkout flow with Stripe
- [x] Add subscription management (upgrade, downgrade, cancel)
- [x] Implement feature gating based on subscription tier
- [x] Create onboarding flow for new users
- [x] Test payment flow end-to-end
- [x] Save checkpoint with monetization system


## Subscription Dashboard Feature

- [x] Add billing history database table
- [x] Create tRPC procedures for billing history and subscription management
- [x] Build subscription dashboard UI component
- [x] Create billing history table display
- [x] Implement upgrade/downgrade/cancel flows
- [x] Add confirmation dialogs and error handling
- [x] Write tests for subscription dashboard
- [x] Save checkpoint with dashboard complete


## Payment Method Management Feature

- [x] Add payment methods database table (store Stripe payment method IDs)
- [x] Create tRPC procedures for payment method CRUD operations
- [x] Build payment method UI in subscription dashboard
- [x] Implement add payment method form with Stripe Elements
- [x] Add set default payment method functionality
- [x] Implement delete payment method with confirmation
- [x] Add error handling and validation
- [x] Test payment method management end-to-end
- [x] Save checkpoint with payment methods complete


## Auto-Save Payment Method Feature

- [x] Create Stripe webhook handler for successful payment events (charge.succeeded, payment_intent.succeeded)
- [x] Extract payment method ID from successful Stripe events
- [x] Implement auto-save logic to store payment method after first transaction
- [x] Add "save for future use" checkbox to checkout form
- [x] Create UI notification when payment method is auto-saved
- [x] Add option to skip auto-save during checkout
- [x] Test auto-save with Stripe test mode transactions
- [x] Save checkpoint with auto-save feature complete


## Checkout Form Enhancement

- [x] Create checkout form component with payment details
- [x] Add "Save for future use" checkbox to checkout form
- [x] Wire checkbox to Stripe payment intent metadata
- [x] Update webhook handler to respect user's save preference
- [x] Add success notification when payment method is saved
- [x] Test checkout flow with save option enabled/disabled
- [x] Save checkpoint with checkout form complete


## Pricing Page Integration

- [x] Review current Pricing page structure
- [x] Replace subscription UI with CheckoutForm component
- [x] Update pricing page layout to showcase plans and checkout forms
- [x] Add plan comparison table above checkout forms
- [x] Implement plan selection and switching between plans
- [x] Test checkout flow from pricing page
- [x] Save checkpoint with pricing page integration complete


## Upgrade Recommendation Engine

- [x] Create usage tracking system to count user resources (cards, contacts, workflows)
- [x] Add recommendation engine logic to detect when users approach plan limits
- [x] Build recommendation UI component with upgrade suggestions
- [x] Create notification system for upgrade recommendations
- [x] Integrate recommendations into subscription dashboard
- [x] Add upgrade recommendation banner to home page
- [x] Test recommendation engine with different usage scenarios
- [x] Save checkpoint with recommendation engine complete


## Database Persistence Fix

- [x] Fix composite unique constraint on (userId, cardId) in digitalCards table
- [x] Apply database migration to update unique constraint
- [x] Re-enable server-side card persistence in Home.tsx
- [x] Implement debounced save to avoid race conditions
- [x] Write unit tests for card persistence (create, update, delete, duplicate prevention)
- [x] All tests passing (4/4 card router tests)

## Temporary Cross-Device Sync (localStorage)

- [x] Create export card data feature (JSON download)
- [x] Create import card data feature (JSON upload)
- [x] Add export/import UI buttons to Home page (Sync button)
- [x] Integrate CardSyncModal component into Home page
- [x] Test export/import flow with multiple cards
- [x] Save checkpoint with sync feature complete


## Lead Capture & Contact Management (From Wisery Video)

- [x] Design database schema for captured leads (capturedContacts table)
- [x] Create tRPC procedures for lead capture (create, read, list, export)
- [x] Build Lead Capture Form component for capturing visitor contact info
- [x] Implement form validation and submission
- [x] Add Contact Management Dashboard page with full CRUD
- [x] Create contacts list with sorting and display
- [x] Implement CSV export functionality for leads
- [x] Add lead analytics (total captured, by card)
- [x] Integrate lead capture form into app routing
- [x] Save checkpoint with lead capture complete

## Wallet Cards (Apple/Google Wallet Passes)

- [x] Design database schema for wallet cards (walletCards table)
- [x] Create wallet card customization UI (WalletCardCustomizer component)
- [x] Create tRPC router for wallet card operations (create, get, list, delete)
- [x] Implement placeholder Apple Wallet pass generation endpoint
- [x] Implement placeholder Google Wallet pass generation endpoint
- [x] Add "Add to Wallet" buttons for Apple/Google with loading states
- [x] Build wallet card preview in customizer modal
- [x] Add wallet card customization options (colors, logo, text, points, balance)
- [x] Write tests for wallet card generation (11 tests)
- [x] Integrate WalletCardCustomizer into card editing workflow (CustomizationPanel)
- [x] Add "Wallet Card" tab to CustomizationPanel
- [x] All tests passing (47/47)
- [x] Save checkpoint with wallet cards integration complete


## Real PKPass Generation (Apple Wallet)

- [x] Install passkit-generator library
- [x] Create PKPass certificate infrastructure (self-signed certificates created)
- [x] Create PKPass template structure and manifest (pass.json template)
- [x] Implement PKPass generation in walletCardRouter.generateApplePass
- [x] Add API endpoint for downloading .pkpass files (/api/wallet/apple-pass/:cardId)
- [x] Write unit tests for PKPass generation (9 tests)
- [x] All 56 tests passing
- [x] Save checkpoint with PKPass implementation complete


## PKPass Icon Asset Integration

- [x] Generate PNG icon assets (icon.png, icon@2x.png, icon@3x.png) - 1024x1024, 2048x2048, 3072x3072 PNG files
- [x] Create icon asset management utility (pkpassIcons.ts) - Load and validate PNG icons from local files
- [x] Update PKPass generation to include icons in bundle - PNG icons now embedded in all generated .pkpass files
- [x] Write unit tests for icon integration (9 tests) - File validation, PNG signatures, buffer properties
- [x] All 65 tests passing (including 9 new icon tests with PNG validation)
- [x] Verified PNG files: icon.png (9KB), icon@2x.png (26KB), icon@3x.png (50KB)
- [x] Save checkpoint with icon assets complete


## Custom Logo Upload for Wallet Passes

- [x] Update walletCards schema to add logoUrl field (already exists)
- [x] Create logo upload endpoint with file validation (logoUploadRouter.ts)
- [x] Integrate S3 storage for logo uploads (storagePut integration)
- [x] Update WalletCardCustomizer UI with logo upload component (file input, preview, delete)
- [x] Update PKPass generation to use custom logos (if available)
- [x] Add logo image processing (resize to 1024x1024, convert to PNG using sharp)
- [x] Write tests for logo upload functionality (9 tests)
- [x] All 74 tests passing
- [x] Save checkpoint with custom logo feature complete


## Google Wallet API Integration

- [x] Set up Google Wallet API credentials and JWT signing (jsonwebtoken library installed)
- [x] Create JWT signing utility for Google Wallet passes (googleWallet.ts with generateGoogleWalletJWT)
- [x] Implement Google Wallet pass template generation (pass object with loyalty card structure)
- [x] Create generateGooglePass endpoint with JWT signing (walletCardRouter.generateGooglePass)
- [x] Add Google Wallet button to WalletCardCustomizer UI (already present with loading state)
- [x] Integrate Google Wallet save button with pass generation (mutation wired up)
- [x] Write tests for Google Wallet JWT generation (12 tests covering JWT generation, validation, URL creation)
- [x] All 86 tests passing (including 12 new Google Wallet tests)
- [x] Save checkpoint with Google Wallet integration complete


## Production Google Wallet Setup

- [x] Set up environment variables for Google Wallet credentials (GOOGLE_WALLET_PRIVATE_KEY, GOOGLE_WALLET_CLIENT_EMAIL, GOOGLE_WALLET_PROJECT_ID)
- [x] Update googleWallet.ts to use production credentials from environment variables
- [x] Update JWT signing to use RS256 algorithm with production private key when available
- [x] Fallback to test mode (HS256) when credentials not provided
- [x] Fix private key formatting for RS256 signing (replace escaped newlines)
- [x] Update validateGoogleWalletJWT to properly validate RS256 tokens
- [x] Write production credential validation tests (6 new tests)
- [x] All 92 tests passing (including 6 production credential tests)
- [x] Google Wallet service account credentials successfully configured and validated
- [x] System ready to generate production Google Wallet passes with real JWT signing


## Wallet Pass Preview Modal

- [x] Design wallet pass preview component (Apple/Google Wallet mockups)
- [x] Create preview modal with realistic pass visualization
- [x] Add Apple Wallet pass preview mockup (loyalty card style with iPhone frame)
- [x] Add Google Wallet pass preview mockup (generic card style with Android frame)
- [x] Integrate preview modal into WalletCardCustomizer
- [x] Add "Preview" button to show pass preview before generation
- [x] Implement live preview updates on color/logo/points changes (real-time)
- [x] Add device frame mockups (iPhone for Apple, Android for Google)
- [x] Component renders correctly with all card data displayed
- [x] Save checkpoint with preview modal complete


## Card Sharing Regression Fix

- [x] Fixed SharedCard.tsx to handle ContactData instead of full Card object
- [x] Updated decodeCardData to return ContactData with cardStyle included
- [x] Fixed LeadCaptureForm integration to work with shared card data
- [x] Verified name display on shared card page (shows "Your Name" correctly)
- [x] Tested full shared card functionality (QR code, lead capture, social sharing)
- [x] All features working correctly on shared card page


## Wisery Feature Parity - Advanced Customization

- [x] Add gradient background support (linear and radial gradients)
- [x] Add gradient rotation/angle control slider
- [x] Add font customization (title font, text font, title size)
- [x] Add text color picker for fonts
- [x] Create pre-built theme system with theme templates
- [x] Implement "View all themes" gallery
- [x] Add reset design button (reset layout to defaults)
- [x] Add reset all button (reset all including user data)
- [x] Add remove branding toggle (hide Wisery-like branding)
- [x] Update database schema to store gradient and font settings
- [x] Update CustomizationPanel UI with new design section
- [x] Write tests for gradient and font features
- [x] Write tests for theme system
- [x] Test all features end-to-end


## Image Background Support

- [x] Update CardStyle interface to support image backgrounds (imageUrl, imageOpacity, imagePosition)
- [x] Create image upload handler with S3 storage integration
- [x] Add image background UI controls to CustomizationPanel (upload button, preview, remove button)
- [x] Update card rendering to display image backgrounds with overlay for text readability
- [x] Add image preview and management features (crop, position, opacity controls)
- [x] Test image upload and background rendering end-to-end
- [x] Verify image optimization and performance


## Image Crop & Position Tool

- [x] Add crop/position properties to CardStyle interface (imageCropX, imageCropY, imageCropZoom)
- [x] Create ImageCropModal component with canvas-based preview and drag controls
- [x] Add crop tool button to CustomizationPanel image background section
- [x] Implement crop position state management with drag/resize controls
- [x] Update card rendering to apply crop coordinates to background-position and background-size
- [x] Test crop tool with various image sizes and aspect ratios
- [x] Verify crop settings persist across save/reload


## Theme Gallery with Live Previews

- [x] Create ThemeGalleryModal component with carousel/grid layout
- [x] Add theme preview card component showing live theme styling
- [x] Implement "View all themes" button in CustomizationPanel
- [x] Integrate theme gallery modal with apply theme functionality
- [x] Test all 4 themes in gallery and verify preview accuracy
- [x] Ensure smooth transitions when applying themes from gallery


## Theme Image Gallery

- [x] Generate showcase images for Professional theme (dark navy with blue accents)
- [x] Generate showcase images for Creative theme (purple/pink vibrant design)
- [x] Generate showcase images for Minimal theme (clean white/gray design)
- [x] Generate showcase images for Vibrant theme (bold orange/yellow design)
- [x] Create ThemeGalleryImages component to display theme showcase images
- [x] Integrate image gallery into ThemeGalleryModal for better visual preview
- [x] Test theme gallery with images and verify visual quality
- [x] Ensure images display correctly on all screen sizes


## Social Link Reordering with Drag-and-Drop

- [x] Update ContactData schema to add socialLinkOrder array (stores link IDs in custom order)
- [x] Add socialLinkVisibility object to ContactData (tracks which links are visible)
- [x] Create SocialLinkReorder component with drag-and-drop UI (using React Beautiful DnD or similar)
- [x] Add toggle visibility checkbox for each social link
- [x] Integrate reorder component into CustomizationPanel Social Links tab
- [x] Update card rendering to display links in custom order
- [x] Add reset social links order button
- [x] Test drag-and-drop with multiple links
- [x] Test visibility toggles work correctly
- [x] Verify order persists across save/reload
- [x] Test on mobile (touch drag-and-drop)


## Bug Fixes - Data Persistence & Wallet Generation

- [x] Fixed wallet card database error (getDb() not awaited in walletCardRouter - all 6 occurrences fixed)
- [x] Fixed data persistence issue (added cache invalidation after card updates in useCardPersistence)
- [x] Fixed React hooks violation in useCardPersistence (removed conditional useUtils() call)
- [x] All 92 tests passing after fixes

## Konniq Branding & Launch

- [x] Update project name to "Konniq" via Management UI Settings > General (DONE)
- [x] All critical bugs fixed (data persistence, wallet generation, React hooks)
- [x] All 92 unit tests passing
- [x] Verify app is working correctly in browser (card data persists, no errors)
- [x] Apple Wallet and Google Wallet card samples created and documented
- [ ] Publish the app via Management UI Publish button
- [ ] Verify Konniq branding displays on live site
- [ ] Check social media handle availability (@konniq on Twitter, Instagram, TikTok, LinkedIn)

## vCard Name Field Fix

- [x] Fixed vCard generation to include N (name) field with proper first/last name parsing
- [x] QR code now properly exports name field when scanned
- [x] All 92 tests passing after vCard fix
- [x] Production site updated with vCard fix

## Critical Data Persistence Fix

- [x] Identified root cause: address field in code but not in production database
- [x] Removed address field from cardRouter input schemas
- [x] Fixed "Unknown column 'address'" error that was preventing saves
- [x] Checkpoint saved with fix (manus-webdev://dca42091)
- [ ] Publish checkpoint to production to deploy fix
- [ ] Test that card saves now work without errors


## Wisery-Style Dashboard Redesign

- [x] Rewrite Home.tsx with Wisery-style two-panel layout (left editor + right card preview)
- [x] Add left sidebar with icon buttons (Profile, Blocks, Design, Themes)
- [x] Redesign social link buttons as full-width stacked buttons (Website, Instagram, TikTok, Facebook)
- [x] Apply clean modern styling with proper spacing and typography
- [ ] Fix address column database error that blocks card saves
- [x] Test all dashboard functionality with new layout
- [ ] Save checkpoint with new dashboard design
