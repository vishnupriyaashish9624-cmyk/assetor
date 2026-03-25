const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            // ==========================================
            // MAIN TITLE
            // ==========================================
            new Paragraph({
                text: "TRakio Asset Management Platform",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                text: "Full System Operations & Workflow Guide (Developer View)",
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }),

            // ==========================================
            // MODULES & WORKING EXPLANATIONS
            // ==========================================
            new Paragraph({ text: "1. Core Modules: Working & Mechanics", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "Below detailed the logic flow mechanics of each top-level dashboard concept:", children: [] }),
            new Paragraph({ text: "" }),

            // --- A. Dashboard ---
            new Paragraph({ text: "A. Analytics Dashboard", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• Purpose: Overview visual monitoring for supervisor roles.", children: [] }),
            new Paragraph({ text: "• How it works: On dashboard mount, the app initiates `fetchStats()` making calls towards `/api/dashboard/summary`. State update pushes items quantities into responsive chart canvases (Area and Donut node plugins) displaying metric allocations accurately.", children: [] }),
            new Paragraph({ text: "" }),

            // --- B. Premises Management ---
            new Paragraph({ text: "B. Premises Management Node", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• Purpose: Detailed location tracker for office real estate assets.", children: [] }),
            new Paragraph({ text: "• How it works: Handles Owned vs Rental splits. Standard triggers post physical dimension coordinates address variables. If 'Rental', standard schedules render next due thresholds calculators setup buffers alerting supervisor queues.", children: [] }),
            new Paragraph({ text: "" }),

            // --- C. Asset Lifecycle ---
            new Paragraph({ text: "C. Assets Upkeep Lifecycle", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• Purpose: Hardware or software items logistics mapping counts sets.", children: [] }),
            new Paragraph({ text: "• How it works: Users create parent maps (Categories ➜ Assets), assignment endpoints map historical employee maps linked logs. Upkeep utilizes a ticketer timeline node buffering maintenance schedules logs maintaining continuous condition variables accurately.", children: [] }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "--------------------------------------------------", children: [] }),

            // ==========================================
            // 2. DYNAMIC MODULES & SUBMODULES (DEEP DIVE)
            // ==========================================
            new Paragraph({ text: "2. The Dynamic Module Builder & Submodule Workflow", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "This framework creates visual interface layouts dynamically from visual field arrays mapped on DB levels:", children: [] }),
            new Paragraph({ text: "" }),

            // --- Submodule Logic ---
            new Paragraph({ text: "Concept 1: The 'Module Container'", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "The outer shell tying up a context slug tied over corporate tenant isolation boundaries (e.g., creating a module called 'Vehicles Setup').", children: [] }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "Concept 2: Submodules (Sections)", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• What they are: Conceptual buckets inside a module grouping layouts datasets logically.", children: [] }),
            new Paragraph({ text: "• How they work: If creating a 'Premises' Module, Submodule section list setups would operate sections like 'Identity Info', 'Specs Specifications', or 'Details Upkeeps'. Groups arrays logically for step mapping wizards.", children: [] }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "Concept 3: Dynamic Fields Setup", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• Mechanics: Field Builder layouts fetch section indices via POST workflows rendering visual input widgets arrays drawn over parallel forms previews based on target types parameters limits dynamically.", children: [] }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "--------------------------------------------------", children: [] }),

            // ==========================================
            // 3. CODEPATHS DIRECTORY MAP
            // ==========================================
            new Paragraph({ text: "3. Developer Code File Links Index", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• Modules Creator: `apps/web/src/screens/modules/ModulesHomeScreen.js` -> `server/controllers/moduleBuilderController.js`.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Submodules Router: `apps/web/src/screens/modules/ModuleSectionsScreen.js` -> `server/controllers/moduleSections.js`.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Setup buffers Layouts: `apps/web/src/screens/modules/SubModulesScreen.js`.", bullet: { level: 0 } }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("../TRakio_Developer_Master_Guide.docx", buffer);
    console.log("----------------------------------------");
    console.log("✅ Master Guide Documentation created successfully!");
    console.log("Location: d:/Asset Web/TRakio_Developer_Master_Guide.docx");
    console.log("----------------------------------------");
}).catch(err => {
    console.error("Error creating document:", err);
});
