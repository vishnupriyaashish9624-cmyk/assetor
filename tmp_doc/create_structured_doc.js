const { Document, Packer, Paragraph, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "TRakio System Documentation",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                text: "All Core Modules (Following Client Template)",
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }),

            // ==========================================
            // MODULE 1: ASSETS
            // ==========================================
            new Paragraph({ text: "MODULE: ASSET MANAGEMENT", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "1. Frontend (UI Layer)", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "File Path: apps/web/src/screens/AssetsScreen.js", bullet: { level: 0 } }),
            new Paragraph({ text: "Purpose:", bullet: { level: 0 } }),
            new Paragraph({ text: "• Main screen for listing corporate asset inventories.", bullet: { level: 1 } }),
            new Paragraph({ text: "• Used to: Add, View, and Delete Assets.", bullet: { level: 1 } }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "2. Backend (API Layer)", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "Controller: server/controllers/assets.js", bullet: { level: 0 } }),
            new Paragraph({ text: "Purpose: Handles business logic for assets creation allocations upkeep counts.", bullet: { level: 0 } }),
            new Paragraph({ text: "Routes: server/routes/assets.js", bullet: { level: 0 } }),
            new Paragraph({ text: "Defines Endpoints: GET /api/assets, POST /api/assets", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "3. Database (Schema Layer)", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "Main Table: assets", bullet: { level: 0 } }),
            new Paragraph({ text: "Purpose: Stores items codes states assigned holder contexts.", bullet: { level: 0 } }),
            new Paragraph({ text: "Related Tables: asset_assignments (historical records maps).", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "--------------------------------------------------", children: [] }),

            // ==========================================
            // MODULE 2: VEHICLES
            // ==========================================
            new Paragraph({ text: "MODULE: VEHICLE MANAGEMENT", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "1. Frontend (UI Layer)", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "File Path: apps/web/src/screens/VehicleDisplayScreen.js", bullet: { level: 0 } }),
            new Paragraph({ text: "Purpose: Main fleet lists mapping allocations benchmarks bounds trackers.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "2. Backend (API Layer)", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "Controller: server/controllers/vehiclesController.js", bullet: { level: 0 } }),
            new Paragraph({ text: "Routes: server/routes/vehicles.js", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "3. Database (Schema Layer)", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "Main Table: vehicles", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "--------------------------------------------------", children: [] }),

            // ==========================================
            // MODULE 3: PREMISES
            // ==========================================
            new Paragraph({ text: "MODULE: PREMISES MANAGEMENT", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "1. Frontend (UI Layer)", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "File Path: apps/web/src/screens/office/OwnedPremisesScreen.js", bullet: { level: 0 } }),
            new Paragraph({ text: "Purpose: Tracks property layouts conditions specifications values calculations buffers guidelines.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "2. Backend (API Layer)", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "Controller: server/controllers/officeController.js", bullet: { level: 0 } }),
            new Paragraph({ text: "Routes: server/routes/office.js", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "3. Database (Schema Layer)", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "Main Table: office_premises", bullet: { level: 0 } }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("../TRakio_Structured_Modules_Documentation.docx", buffer);
    console.log("----------------------------------------");
    console.log("✅ Structured Modules Documentation created successfully!");
    console.log("Location: d:/Asset Web/TRakio_Structured_Modules_Documentation.docx");
    console.log("----------------------------------------");
}).catch(err => {
    console.error("Error creating document:", err);
});
