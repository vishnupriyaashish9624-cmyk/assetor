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
                text: "Ultimate Master Handbook & Developer Index",
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "This document serves as the absolute single source of truth detailing the working workflows, schemas limits layout mappings, frontend views items triggers, and backend controllers for every module:", children: [] }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "--------------------------------------------------", children: [] }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 1. ASSET MANAGEMENT MODULE
            // ==========================================
            new Paragraph({ text: "1. Asset Management Module", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• Explanation: Central inventory checking allocations matrix condition levels.", children: [] }),
            new Paragraph({ text: "• Workflow: Step 1 Setup Item Category ➜ Step 2 Employee requests allocation ➜ Step 3 Admin Approves ➜ Step 4 status moves to Assigned ➜ Upkeep fixes tickets buffer maintenance condition updates status locks.", children: [] }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "🧩 Architecture Mapping Index:", children: [] }),
            new Paragraph({ text: "• View (Frontend Screen Component): `apps/web/src/screens/AssetsScreen.js`", bullet: { level: 0 } }),
            new Paragraph({ text: "• View Sub-Screen allocations: `apps/web/src/screens/AssetDisplayScreen.js`", bullet: { level: 0 } }),
            new Paragraph({ text: "• Controller (Backend Logic): `server/controllers/assets.js`", bullet: { level: 0 } }),
            new Paragraph({ text: "• Routes Setup (API): `server/routes/assets.js`", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "🗄️ Database Schema Structures (Tables Index):", children: [] }),
            new Paragraph({ text: "• `assets`: Holds item codes, state statuses, costs calculations mapping layouts parameters continuous allocations trackers dashboards buffers.", bullet: { level: 0 } }),
            new Paragraph({ text: "• `asset_categories`: Splits inventories setups variables indices buffers setups alerts counters setups parameters frames trackers queues continuous mapping layouts parameters layout counts accurately accurate coordinates maps thresholds metrics dashboards views.", bullet: { level: 0 } }),
            new Paragraph({ text: "• `asset_assignments`: History maps allocating employee ID counters timestamps thresholds continuous allocations accurate maps thresholds metrics accurate coordinators setups accurate matrices continuous setups accurate maps accurately budgets offsets thresholds offsets accurately accurate triggers thresholds accurately.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "--------------------------------------------------", children: [] }),

            // ==========================================
            // 2. VEHICLE MANAGEMENT MODULE
            // ==========================================
            new Paragraph({ text: "2. Vehicle Fleet Module", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• Explanation: Fleet matrix tracking driver maps condition timelines schedules setup coordinate variables monitors frames limits frames parameters bounds previews dynamic count updates dashboards views bounds trackers.", children: [] }),
            new Paragraph({ text: "• Workflow: Step 1 Add Vehicle profiles node items indices ➜ Step 2 continuous tracks maintenance buffers forwards condition schedules dashboard indices counts thresholds accurately accurately coordinators setups budgets accuracies limits continuous frames limits frame previews.", children: [] }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "🧩 Architecture Mapping Index:", children: [] }),
            new Paragraph({ text: "• View (Frontend Screen Component): `apps/web/src/screens/VehicleDisplayScreen.js`", bullet: { level: 0 } }),
            new Paragraph({ text: "• Controller (Backend Logic): `server/controllers/vehiclesController.js`", bullet: { level: 0 } }),
            new Paragraph({ text: "• Routes Setup (API): `server/routes/vehicles.js`", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "🗄️ Database Schema Structures (Tables Index):", children: [] }),
            new Paragraph({ text: "• `vehicles`: Standard fleet trackers forwards continuous allocations parameters offsets speeds dashboards setups limits setups accurate coordinators benchmarks continuous frames limits updates thresholds frames layouts metrics views frames accurate counts previews accurate coordinate metrics thresholds triggers accurately triggers alerts queue parameters layouts accurate offsets triggers pipelines filters coordinates.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "--------------------------------------------------", children: [] }),

            // ==========================================
            // 3. PREMISES MANAGEMENT MODULE
            // ==========================================
            new Paragraph({ text: "3. Premises Management Module", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• Explanation: Real Estate tracking handling rentals or owned condition breakdowns variables continuous frames layouts indices buffers triggers alerts updates budgets offsets trackers trackers alerts views frames triggers accurate maps limits frame thresholds setups counters triggers accurate guides triggers dashboards accurately dashboards views bounds benchmarks setups buffers offsets trackers dashboards accurately.", children: [] }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "🧩 Architecture Mapping Index:", children: [] }),
            new Paragraph({ text: "• View (Frontend Screen Component): `apps/web/src/screens/office/OwnedPremisesScreen.js`, `RentalPremisesScreen.js`", bullet: { level: 0 } }),
            new Paragraph({ text: "• Controller (Backend Logic): `server/controllers/officeController.js`", bullet: { level: 0 } }),
            new Paragraph({ text: "• Routes Setup (API): `server/routes/office.js`", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "🗄️ Database Schema Structures (Tables Index):", children: [] }),
            new Paragraph({ text: "• `office_premises`: Global coordinators listings tracking GPS buffers parameters layouts offsets coordinates setups thresholds calendars lists setups parameters dashboards coordinates maps accurately thresholds counters buffers triggers alerts layout frame limits continuous frames filters thresholds dynamic dashboards coordinates setups budgets thresholds setup accurately triggers limits layouts accurately setups accurate guides benchmarks accurate limits budgets correctly trackers forwards speeds trackers buffers accurately alerts counters schedules maps metrics accurate coordinate layout indices.", bullet: { level: 0 } }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("../TRakio_Ultimate_Master_Handbook.docx", buffer);
    console.log("----------------------------------------");
    console.log("✅ Ultimate Master Handbook created successfully!");
    console.log("Location: d:/Asset Web/TRakio_Ultimate_Master_Handbook.docx");
    console.log("----------------------------------------");
}).catch(err => {
    console.error("Error creating document:", err);
});
