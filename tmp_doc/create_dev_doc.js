const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
const fs = require('fs');

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            // ==========================================
            // TITLE SECTION
            // ==========================================
            new Paragraph({
                text: "TRakio Asset Management Platform",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                text: "Developer-View Comprehensive Documentation",
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 1. PROJECT PURPOSE
            // ==========================================
            new Paragraph({ text: "1. Project Purpose & Architecture", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: "TRakio is designed as a Multi-Tenant enterprise platform intended to handle the lifecycle and upkeep logs of company assets and physical office premises. It removes traditional static data boundaries by using a Dynamic Module Builder framework, enabling users to add, configure, and display visual screens for items scaling without editing core schemas.",
                        size: 24,
                    })
                ]
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "• High Scalability: Supports multiple independent companies (Tenants) segregated via company_id lists.", bullet: { level: 0 } }),
            new Paragraph({ text: "• Hybrid Framework: Direct relational endpoints for standard modules tied over dynamic tables mappings for elastic modules specs.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 2. MODULE CONNECTIONS & FLOW
            // ==========================================
            new Paragraph({ text: "2. Module Dependencies & Flow Map Connections", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "The system's modular dependencies follow structured hierarchical levels:", children: [] }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "• Tenancy Node Flow: Companies ➜ Users ➜ Roles", bullet: { level: 0 } }),
            new Paragraph({ text: "  All requests require visual token payloads tied to target company contexts verifying supervisor credentials.", children: [] }),

            new Paragraph({ text: "" }),
            new Paragraph({ text: "• Assets Distribution Node: Assets ➜ Employees ➜ Categories", bullet: { level: 0 } }),
            new Paragraph({ text: "  Updates holder-tied records on allocations while checking maintenance status open buffers.", children: [] }),

            new Paragraph({ text: "" }),
            new Paragraph({ text: "• Premises Assets Node: Office Premises ➜ Owned/Rental Maps", bullet: { level: 0 } }),
            new Paragraph({ text: "  Standardizes tracking on properties documents uploads tied up against location utilities.", children: [] }),

            new Paragraph({ text: "" }),
            new Paragraph({ text: "• Dynamic Map Node: Modules ➜ Sections ➜ Fields ➜ Options", bullet: { level: 0 } }),
            new Paragraph({ text: "  Allows defining custom array components mapped layouts drawn over parallel screens renders.", children: [] }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 3. DATABASE SCHEMA OVERVIEW
            // ==========================================
            new Paragraph({ text: "3. Database Schema Structural breakdown (Developer Index)", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "Below outlines the core system database tables mapped onto PostgreSQL backend:", children: [] }),
            new Paragraph({ text: "" }),

            // Table Group 1
            new Paragraph({ text: "A. System Core & Tenancy", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• companies: Base tenant table listing mapped domains/statuses.", bullet: { level: 0 } }),
            new Paragraph({ text: "• users: Accounts mapped onto roles hierarchy (SUPER_ADMIN, COMPANY_ADMIN, EMPLOYEE).", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // Table Group 2
            new Paragraph({ text: "B. Asset Management Framework", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• assets: Assets listing bound with category setups & assignment holder IDs.", bullet: { level: 0 } }),
            new Paragraph({ text: "• asset_assignments: Mapping historical paths on distribution allocations.", bullet: { level: 0 } }),
            new Paragraph({ text: "• maintenance_tickets: Buffers for services costs upkeep tasks schedules.", bullet: { level: 0 } }),
            new Paragraph({ text: "• asset_categories: Nested categories listing mappings.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // Table Group 3
            new Paragraph({ text: "C. Premises Management Structures", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• office_premises: Global setups tracking GPS coordinates, capacity, statuses.", bullet: { level: 0 } }),
            new Paragraph({ text: "• office_owned_details: Conditional records holding tax warranty timelines parameters.", bullet: { level: 0 } }),
            new Paragraph({ text: "• office_rental_details: Rent records holding due alerts payment timeline offsets.", bullet: { level: 0 } }),
            new Paragraph({ text: "• office_premises_documents: Physical asset map bindings supportive of uploads path arrays.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // Table Group 4
            new Paragraph({ text: "D. Dynamic Builder System Maps", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• modules: Base setup listing for company-enabled custom dashboard maps.", bullet: { level: 0 } }),
            new Paragraph({ text: "• module_sections: Group segments title containers supportive of ordering counts.", bullet: { level: 0 } }),
            new Paragraph({ text: "• module_section_fields: The container setup detailing field keys identifiers types arrays.", bullet: { level: 0 } }),
            new Paragraph({ text: "• module_section_field_options: Holds supporting dictionaries items (dropdowns, selects lists radios).", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),

            // ==========================================
            // 4. API CONNECTS GUIDE
            // ==========================================
            new Paragraph({ text: "4. Backend API Endpoints connection Matrix", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "All routes utilize standard HTTP methods (GET/POST/PUT/DELETE) running inside Node Express layers:", children: [] }),
            new Paragraph({ text: "" }),

            new Paragraph({ text: "• /api/auth: Login hooks handling token updates requests.", bullet: { level: 0 } }),
            new Paragraph({ text: "• /api/dashboard: Returns summarized analytics indices (KPI triggers, Area map visual counts buffers).", bullet: { level: 0 } }),
            new Paragraph({ text: "• /api/module-builder: Dynamic builder pipeline handling section and options CRUD triggers.", bullet: { level: 0 } }),
            new Paragraph({ text: "• /api/office: Office properties management endpoints linked triggers binding documents arrays uploads setups.", bullet: { level: 0 } }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("../Developer_Documentation_Review.docx", buffer);
    console.log("----------------------------------------");
    console.log("✅ Developer Documentation created successfully!");
    console.log("Location: d:/Asset Web/Developer_Documentation_Review.docx");
    console.log("----------------------------------------");
}).catch(err => {
    console.error("Error creating document:", err);
});
