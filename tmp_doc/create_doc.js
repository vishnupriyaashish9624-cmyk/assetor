const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            // Title
            new Paragraph({
                text: "TRakio Asset Management Platform",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                text: "System Documentation & Module Summary",
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }), // Spacer

            // 1. Overview
            new Paragraph({ text: "1. Overview", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: "TRakio is a premium, enterprise-grade Asset Management Platform designed for tracking assets, managing premises, and handling employee operations. The platform supports multi-tenant configurations, enabling multiple companies to manage their assets independently.",
                        size: 24, // 12pt
                    }),
                ],
            }),
            new Paragraph({ text: "" }),

            // 2. Technical Stack
            new Paragraph({ text: "2. Technical Stack", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• Frontend: React Native (Expo Web), Zustand, Material Community Icons", bullet: { level: 0 } }),
            new Paragraph({ text: "• Backend: Node.js (Express)", bullet: { level: 0 } }),
            new Paragraph({ text: "• Database: PostgreSQL (Migrated for high scalability)", bullet: { level: 0 } }),
            new Paragraph({ text: "• Authentication: JWT (Secure session management)", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // 3. Core Modules
            new Paragraph({ text: "3. Core Modules", heading: HeadingLevel.HEADING_2 }),

            new Paragraph({ text: "A. Dashboard Module", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• KpiCard: Displays overall counts like Total, Assigned, and Available items.", bullet: { level: 0 } }),
            new Paragraph({ text: "• UsageTrendAreaChart: Area chart visualization for assets allocation over time.", bullet: { level: 0 } }),
            new Paragraph({ text: "• HealthDonutChart: Visual donut layouts showing overall health and status.", bullet: { level: 0 } }),
            new Paragraph({ text: "• CalendarCard: Shows scheduled maintenance logs.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "B. Premises Management", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• Support for Owned and Rental properties tracking.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Document uploads for property attachments (PDFs/Images).", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "C. Dynamic Module Builder", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• Dynamic Field Manager: Interface to create screens for modules dynamically.", bullet: { level: 0 } }),
            new Paragraph({ text: "• 20+ UI types Support: Textbox, Dropdown, Radio, Checkbox, Signature, Files.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Real-time Previews showing immediate visual configuration layout.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // 4. Deployment Setup
            new Paragraph({ text: "4. Deployment & Running", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• Backend API: Running on Node index.js server (Default Port 5031 / 5021)", bullet: { level: 0 } }),
            new Paragraph({ text: "• Frontend Site: Running with Npx Expo Expo bundler port 19006 or 8081", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // 5. Database Architecture
            new Paragraph({ text: "5. Database Tables for Dynamic Builder", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• module_sections: Holds screen items and titles.", bullet: { level: 0 } }),
            new Paragraph({ text: "• module_section_fields: Individual list maps that hold component mappings.", bullet: { level: 0 } }),
            new Paragraph({ text: "• module_section_field_options: Support structures for list arrays (radios, lists).", bullet: { level: 0 } }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("../Project_Documentation.docx", buffer);
    console.log("----------------------------------------");
    console.log("✅ Word Document created successfully!");
    console.log("Location: d:/Asset Web/Project_Documentation.docx");
    console.log("----------------------------------------");
}).catch(err => {
    console.error("Error creating document:", err);
});
