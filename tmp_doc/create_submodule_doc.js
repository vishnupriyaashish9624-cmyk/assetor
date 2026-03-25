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
                text: "Full Feature & Submodule Breakdown (UPDATED + VEHICLES)",
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "This guide details individual high-level Modules and their containing sub-features screens mapped according to user Nav setups:", children: [] }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 1. ASSET MANAGEMENT MODULE
            // ==========================================
            new Paragraph({ text: "1. Asset Management Module", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• Asset Registry: Central list track allocations items. Screen: `apps/web/src/screens/AssetsScreen.js`.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Asset Request: Employee lodges request tickets mapped dashboard approvals queues. Screen: `apps/web/src/screens/AssetRequestScreen.js`.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Asset Maintenance: Upkeep maintenance updates tickets schedule Condition track queues. Screen: `apps/web/src/screens/AssetMaintenanceScreen.js`.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // ==========================================
            // NEW: 2. VEHICLE MANAGEMENT MODULE
            // ==========================================
            new Paragraph({ text: "2. Vehicle Management Module", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "A. Vehicles Fleet Registry (Submodule)", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• Purpose: Centralized fleet checklist mapping locations allocations logs upkeep limits conditions.", children: [] }),
            new Paragraph({ text: "• Frontend Screen: apps/web/src/screens/VehicleDisplayScreen.js", children: [] }),
            new Paragraph({ text: "• Backend Logic: server/controllers/vehiclesController.js", children: [] }),
            new Paragraph({ text: "• Backend Routes: server/routes/vehicles.js", children: [] }),
            new Paragraph({ text: "• Working: Displays matrix index detailing vehicle specs linked allocation updates conditions maintenance buffers forwards supervisor dashboards view buffers.", children: [] }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 3. PREMISES MANAGEMENT MODULE
            // ==========================================
            new Paragraph({ text: "3. Premises Management Module", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• Owned Premises: Track updates property metrics layouts timelines buffers offsets alerts deadlocks. Screen: `office/OwnedPremisesScreen.js`.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Rental Premises: Due alerts payment timelines buffer tracking rentals metrics layouts schedules triggers. Screen: `office/RentalPremisesScreen.js`.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 4. HR & TENANCY MODULE
            // ==========================================
            new Paragraph({ text: "4. Operations & Security Module", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• Employee Registry: Standard positions buffers layouts trackers maps continuous coordinates setups. Screen: `EmployeesScreen.js`.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Roles access control layouts: Updates sidebar indices layout sidebar configurations matrices setup dashboards screens previews.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 5. DYNAMIC BUILDER
            // ==========================================
            new Paragraph({ text: "5. Dynamic Framework Builder System", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "• Module Management: Base creators screens enabling custom dashboards mapping layouts views.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Submodule Editor: Fieldbuilder workflows continuous draws dynamically updates tables configurations layouts indices bounds frames layouts titles frames.", bullet: { level: 0 } }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("../TRakio_Feature_Submodule_Guide.docx", buffer);
    console.log("----------------------------------------");
    console.log("✅ Feature Document Updated with Vehicle Module!");
    console.log("Location: d:/Asset Web/TRakio_Feature_Submodule_Guide.docx");
    console.log("----------------------------------------");
}).catch(err => {
    console.error("Error creating document:", err);
});
