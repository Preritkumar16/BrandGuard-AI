# BrandGuard AI

**An AI-Powered Brand Governance and Content Review Platform**

BrandGuard AI is a brand governance platform designed to help organisations maintain brand consistency across their digital content. It enables teams to review marketing assets against approved brand guidelines, identify potential inconsistencies, provide evidence-backed recommendations, and manage content approvals through a structured workflow.

The platform aims to make brand compliance reviews more organised, transparent, and efficient while keeping human reviewers involved in final approval decisions.

## Key Features

- **Overview Dashboard:** Provides a centralised view of brand compliance, asset activity, pending reviews, and important updates.
- **Asset Review Workspace:** Supports the review of submitted marketing content and the presentation of findings and recommendations.
- **Brand Sources Repository:** Organises approved brand guidelines and reference materials used during content reviews.
- **Reviews & Approvals:** Supports a structured review process, including feedback, revision requests, approvals, and rejections.
- **Evidence-Based Findings:** Connects review findings to relevant brand sources to improve transparency and traceability.
- **Role-Based Access Control:** Supports role-based workflows for different platform users.
- **Centralised API Integration:** Organises communication between the frontend and backend through dedicated service modules.

## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Motion

### Backend
- Python
- FastAPI
- REST APIs

### Development Tools
- Visual Studio Code
- Git and GitHub
- npm
- Swagger / OpenAPI

## Project Structure

```text
BrandGuard-AI/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── common/
│   │   │   ├── sources/
│   │   │   └── ui/
│   │   │
│   │   ├── services/
│   │   │   └── API/
│   │   │
│   │   ├── App.tsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
├── docs/
├── infrastructure/
└── README.md
```

## Getting Started

Follow these steps to run the frontend locally.

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- Git
- Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/Preritkumar16/BrandGuard-AI.git
```

### 2. Navigate to the Frontend

```bash
cd BrandGuard-AI/frontend
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

Vite will display the local development URL in the terminal. Open that URL in your browser.

### 5. Build the Frontend

To generate a production build:

```bash
npm run build
```

## Application Workflow

The intended application workflow follows these stages:

1. **Brand Setup:** Approved brand guidelines and reference sources are added to the platform.
2. **Content Submission:** Creators submit marketing assets for review.
3. **Content Analysis:** Submitted assets are evaluated against relevant brand sources.
4. **Findings and Recommendations:** Potential inconsistencies and supporting evidence are presented.
5. **Content Revision:** Creators review feedback and make necessary changes.
6. **Review and Approval:** Authorised reviewers approve, reject, or request further changes.

## Development Guidelines

- Keep frontend components reusable and maintainable.
- Separate API communication from UI components using service modules.
- Use TypeScript for type safety.
- Maintain consistency across the application's interface.
- Follow the documented API contracts when integrating backend functionality.
- Do not expose API keys, credentials, or sensitive configuration in source code.
- Keep frontend development changes within the `frontend/` directory unless otherwise agreed with the team.

## Important Notes

- BrandGuard AI is intended as a decision-support and brand governance platform.
- Review findings and recommendations should be supported by relevant brand evidence.
- Final content approval remains a human decision.
- The platform does not replace legal review or guarantee legal compliance.

## Project Status

**Development in Progress**

The frontend interface and its core application modules are under development. Backend integration and end-to-end workflow validation are subject to implementation and testing.

## Contributors

Developed as a collaborative academic project by students from engineering disciplines, combining frontend development, artificial intelligence, data science, and backend engineering.

---

**BrandGuard AI — Bringing consistency, transparency, and accountability to brand governance.**