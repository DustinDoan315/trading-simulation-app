#!/usr/bin/env node

/**
 * Simple PostgreSQL syntax validator
 * This script checks if the production_schema.sql file contains valid PostgreSQL syntax
 */

const fs = require("fs");
const path = require("path");

// PostgreSQL keywords and functions that should be recognized
const postgresqlFeatures = [
  "CREATE EXTENSION IF NOT EXISTS",
  "IF NOT EXISTS",
  "UUID",
  "TIMESTAMP WITH TIME ZONE",
  "gen_random_uuid()",
  "CREATE OR REPLACE FUNCTION",
  "RETURNS TRIGGER",
  "CREATE TRIGGER",
  "FOR EACH ROW",
  "EXECUTE FUNCTION",
  "ENABLE ROW LEVEL SECURITY",
  "CREATE POLICY",
  "USING",
  "WITH CHECK",
  "auth.uid()",
  "auth.role()",
  "JSONB",
  "DECIMAL",
  "REFERENCES",
  "ON DELETE CASCADE",
  "ON DELETE SET NULL",
  "UNIQUE",
  "CHECK",
  "DEFAULT",
  "PRIMARY KEY",
  "FOREIGN KEY",
  "INDEX",
  "CONSTRAINT",
];

function validatePostgreSQLSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");

    console.log("🔍 Validating PostgreSQL syntax...");
    console.log(`📁 File: ${filePath}`);
    console.log(`📏 Size: ${content.length} characters`);

    // Check for basic PostgreSQL features
    let foundFeatures = 0;
    postgresqlFeatures.forEach((feature) => {
      if (content.includes(feature)) {
        foundFeatures++;
        console.log(`✅ Found: ${feature}`);
      }
    });

    // Check for common SQL Server syntax that shouldn't be in PostgreSQL
    const sqlServerFeatures = [
      "GO",
      "USE [",
      "CREATE DATABASE",
      "sp_",
      "@@",
      "IDENTITY",
      "GETDATE()",
      "ISNULL(",
      "TOP ",
      "WITH (NOLOCK)",
    ];

    let foundSQLServerFeatures = 0;
    sqlServerFeatures.forEach((feature) => {
      if (content.includes(feature)) {
        foundSQLServerFeatures++;
        console.log(`⚠️  Warning: Found SQL Server syntax: ${feature}`);
      }
    });

    // Basic structure validation
    const hasTables = content.includes("CREATE TABLE");
    const hasFunctions = content.includes("CREATE OR REPLACE FUNCTION");
    const hasTriggers = content.includes("CREATE TRIGGER");
    const hasPolicies = content.includes("CREATE POLICY");
    const hasIndexes = content.includes("CREATE INDEX");

    console.log("\n📊 Validation Summary:");
    console.log(
      `✅ PostgreSQL features found: ${foundFeatures}/${postgresqlFeatures.length}`
    );
    console.log(`⚠️  SQL Server features found: ${foundSQLServerFeatures}`);
    console.log(`📋 Tables: ${hasTables ? "✅" : "❌"}`);
    console.log(`🔧 Functions: ${hasFunctions ? "✅" : "❌"}`);
    console.log(`⚡ Triggers: ${hasTriggers ? "✅" : "❌"}`);
    console.log(`🔒 Policies: ${hasPolicies ? "✅" : "❌"}`);
    console.log(`📈 Indexes: ${hasIndexes ? "✅" : "❌"}`);

    if (foundFeatures > 10 && foundSQLServerFeatures === 0) {
      console.log(
        "\n🎉 Validation PASSED: File appears to contain valid PostgreSQL syntax!"
      );
      return true;
    } else if (foundSQLServerFeatures > 0) {
      console.log("\n❌ Validation FAILED: File contains SQL Server syntax!");
      return false;
    } else {
      console.log(
        "\n⚠️  Validation WARNING: File may not contain enough PostgreSQL-specific features."
      );
      return false;
    }
  } catch (error) {
    console.error("❌ Error reading file:", error.message);
    return false;
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const schemaPath = path.join(
    __dirname,
    "..",
    "database",
    "production_schema.sql"
  );
  const isValid = validatePostgreSQLSyntax(schemaPath);
  process.exit(isValid ? 0 : 1);
}

module.exports = { validatePostgreSQLSyntax };
