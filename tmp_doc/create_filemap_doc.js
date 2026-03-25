const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
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
                text: "Developer View - Master File & Route Map Documentation",
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "Below provides a visual diagram map connecting front-end modules screens to back-end controllers file pipelines mapping for easy configuration editing:", children: [] }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 1. DASHBOARD MODULE
            // ==========================================
            new Paragraph({ text: "1. Dashboard & Reports Module", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "💻 Frontend Screen Files:", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• apps/web/src/screens/dashboard/CompanyAdminDashboard.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• apps/web/src/screens/SuperadminDashboardScreen.js", bullet: { level: 0 } }),

            new Paragraph({ text: "🧩 Components Files (Sub-elements lists):", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• apps/web/src/components/KpiCard.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• apps/web/src/components/UsageTrendAreaChart.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• apps/web/src/components/CategoryBarChart.js", bullet: { level: 0 } }),

            new Paragraph({ text: "⚙️ Backend Service Files:", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• Routes: server/routes/dashboard.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• Logic: server/controllers/dashboard.js", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 2. PREMISES MANAGEMENT
            // ==========================================
            new Paragraph({ text: "2. Premises Management Module", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "💻 Frontend Screen Files:", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• apps/web/src/screens/office/OwnedPremisesScreen.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• apps/web/src/screens/office/RentalPremisesScreen.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• apps/web/src/screens/PremisesMasterScreen.js", bullet: { level: 0 } }),

            new Paragraph({ text: "⚙️ Backend Service Files:", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• Routes: server/routes/office.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• Logic: server/controllers/officeController.js", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 3. DYNAMIC MODULE BUILDER
            // ==========================================
            new Paragraph({ text: "3. Dynamic Module Builder System", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "💻 Frontend Screen Files (Modules Renders):", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• apps/web/src/screens/modules/ModulesHomeScreen.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• apps/web/src/screens/modules/ModuleDetailsScreen.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• apps/web/src/screens/modules/ModuleSectionsScreen.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• apps/web/src/screens/modules/SubModulesScreen.js", bullet: { level: 0 } }),

            new Paragraph({ text: "⚙️ Backend Service Files:", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• Routes: server/routes/moduleBuilder.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• Logic: server/controllers/moduleBuilderController.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• Options logic: server/controllers/moduleSections.js", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 4. ASSETS & MAINTENANCE
            // ==========================================
            new Paragraph({ text: "4. Assets & Upkeep Module", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "💻 Frontend Screen Files:", children: [] }),
            new Paragraph({ text: "• apps/web/src/screens/AssetsScreen.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• apps/web/src/screens/AssetMaintenanceScreen.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• apps/web/src/screens/AssetRequestScreen.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• apps/web/src/screens/AssetCategoriesScreen.js", bullet: { level: 0 } }),

            new Paragraph({ text: "⚙️ Backend Service Files:", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• Routes: server/routes/assets.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• Logic: server/controllers/assets.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• Categories logic: server/controllers/assetCategoriesController.js", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 5. CORE HR MANAGEMENT
            // ==========================================
            new Paragraph({ text: "5. Tenants, Employees & Security Module", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "💻 Frontend Screen Files:", children: [] }),
            new Paragraph({ text: "• apps/web/src/screens/EmployeesScreen.js (Positions layouts)", bullet: { level: 0 } }),
            new Paragraph({ text: "• apps/web/src/screens/ClientsScreen.js (Company setups)", bullet: { level: 0 } }),
            new Paragraph({ text: "• apps/web/src/screens/RolesScreen.js (Sidebar permissions)", bullet: { level: 0 } }),

            new Paragraph({ text: "⚙️ Backend Service Files:", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• Users accounts routes: server/routes/auth.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• Employees logic: server/controllers/employees.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• Departments logic: server/controllers/companyModulesController.js", bullet: { level: 0 } }),
            new Paragraph({ text: "• Roles logic: server/controllers/roles.js", bullet: { level: 0 } }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("../Developer_Files_Map_Documentation.docx", buffer);
    console.log("----------------------------------------");
    console.log("✅ Files Map Documentation created successfully!");
    console.log("Location: d:/Asset Web/Developer_Files_Map_Documentation.docx");
    console.log("----------------------------------------");
}).catch(err => {
    console.error("Error creating document:", err);
});
