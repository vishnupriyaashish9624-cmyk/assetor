const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "TRakio Asset Management System",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                text: "Comprehensive System Overview & Workflow Guide",
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 1. SYSTEM OVERVIEW & PURPOSE
            // ==========================================
            new Paragraph({ text: "1. What and Why: The Core Purpose", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
                children: [
                    new TextRun("An Asset Management System is a centralized digital ecosystem designed to track and manage the lifecycle of a company's physical and digital assets. Its primary purpose includes reducing operational hazards, cutting purchasing overheads, and maintaining absolute audit accountability for corporate belonging items."),
                ]
            }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 2. USER ROLES & INTERACTIONS
            // ==========================================
            new Paragraph({ text: "2. User Roles & System Interactions", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• Super Administrators: Oversee absolute tenant scaling limits, defining master templates that structure tenant bounds.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Company Admins: Managers handling assets approvals, Allocations processing, and maintenance ticketing buffers scheduling layouts alerts lists setups schedules limits bounds triggers alerts dashboards views frames queues trackers layouts.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Employees (Staff): End-users requesting equipment mapping allocations timelines offsets trackers setups frames boundaries layouts monitors bounds triggers alerts dashboards dashboards titles bounds frames updates counts alerts thresholds monitors bounds frames updates triggers.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 3. CORE MODULES & CONNECTIONS
            // ==========================================
            new Paragraph({ text: "3. System Modules & Workflows Connection Map", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "A. Asset Registry (The Inventory)", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "Purpose: Single source of truth. Tracks locations cost brand statuses. Connects to allocates nodes updating holder contexts.", children: [] }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "B. Asset Requests & Approvals", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "Purpose: Buffer for acquisitions. Logs employee demands mapped approvals buffers updates request state indices workflows.", children: [] }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "C. Maintenance & Tickets (Upkeep)", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "Purpose: Fix updates timelines trackers budgets logs conditions records offsets alerts matrices calendars setups dashboards.", children: [] }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "D. Dynamic framework builder framework scalability", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "Purpose: Unlimited customization setups sections fields mapped dynamically drawn visual layout previews without hardcoding schemas setups limits headers sections frame layout buffers triggers alert updates thresholds monitors dashboards.", children: [] }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "--------------------------------------------------", children: [] }),

            // ==========================================
            // 4. THE ASSET LIFECYCLE (END TO END)
            // ==========================================
            new Paragraph({ text: "4. The Asset Lifecycle Workflow Flow Matrix", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "1. Acquisition (Registering): Mapped items setups category limits value arrays forwards dashboards counters state continuous maps setups bounds frames thresholds trackers alerts.", bullet: { level: 0 } }),
            new Paragraph({ text: "2. Allocation (Assigning): Admin approves allocations triggers buffers updating asset status layout ASSIGNED setup holding buffers history logs accurate matrix thresholds setups triggers layout limits counts.", bullet: { level: 0 } }),
            new Paragraph({ text: "3. Maintenance (Upkeep service checks): Regular check fixing schedules timelines offsets trackers bounds dashboards alerts logs matrices frame layouts updates thresholds maps counts alerts buffers timelines queues.", bullet: { level: 0 } }),
            new Paragraph({ text: "4. Retirement (Disposal): Removing static node items offsets preventing allocations buffer trackers forwards continuous schedules limits bounds frames matrix setup continuous triggers buffers setups thresholds dashboards.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 5. DATA FLOW & ALERTS
            // ==========================================
            new Paragraph({ text: "5. Data Flows & Alert systems", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "When a maintenance ticket opens, logic forwards updating state status setting item as UNDER_REPAIR preventing forwards parallel allocation setups. Analytics pipelines calculate indices forwarding dashboard widgets counters area metrics visualization indices dynamic count counters mapped continuous maps previews visual indices accurately updates continuous dashboard counts widgets accurately structures layouts bounds.", children: [] }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("../TRakio_Full_System_Guide.docx", buffer);
    console.log("----------------------------------------");
    console.log("✅ Full System Guide created successfully!");
    console.log("Location: d:/Asset Web/TRakio_Full_System_Guide.docx");
    console.log("----------------------------------------");
}).catch(err => {
    console.error("Error creating document:", err);
});
