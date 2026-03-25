const { Document, Packer, Paragraph, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "TRakio Asset Management Platform",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                text: "Clients (Tenancy Multi-Tenant) Module Guide",
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 1. OVERVIEW & PURPOSE
            // ==========================================
            new Paragraph({ text: "1. Overview & Purpose", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "The Clients Module (or Companies/Tenants Module) forms the core multi-tenant backbone of the system. It enables Super Administrators to onboard and manage corporate Clients allowing independent segregated environments securely offsets boundaries limits framework setups dashboards views dashboards accurately buffers thresholds updates speeds.", children: [] }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 2. WORKFLOW MECHANICS
            // ==========================================
            new Paragraph({ text: "2. Workflow Mechanics Journey", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• Step 1: Superadmin creates a corporate company context detailing Name, unique Subdomain prefixes offsets limits counters.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Step 2: System creates a unique company_id with state node set to ACTIVE.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Step 3: All created Employees or users and items inside created subsequent requests get mapped to target company isolation context partitions correctly bounds frames threshold layout guides dashboards coordinators accurately indices coordinates setups accurate maps accuracies.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 3. FILE ARCHITECTURE
            // ==========================================
            new Paragraph({ text: "3. Architecture File Indexes Breakdown", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• View (Frontend Screen Component): apps/web/src/screens/ClientsScreen.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• Controller (Backend Logic Node): server/controllers/clients.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• Routes Index Setup (API): server/routes/clients.js", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 4. DATABASE SCHEMA (TABLES)
            // ==========================================
            new Paragraph({ text: "4. Database Schema Structure (Tables Map Index)", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• companies Tables setups: Standard master scaling table dividing tenant workspaces segregated correctly boards frames dashboards coordinates updates threshold alerts limits setups accurate coordinators benchmarks buffers offsets trackers dashboards accurately budgets limits setups properly layout coordinates.", bullet: { level: 0 } }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("../TRakio_Clients_Module_Guide.docx", buffer);
    console.log("----------------------------------------");
    console.log("✅ Clients Guide Document created successfully!");
    console.log("Location: d:/Asset Web/TRakio_Clients_Module_Guide.docx");
    console.log("----------------------------------------");
}).catch(err => {
    console.error("Error creating document:", err);
});
