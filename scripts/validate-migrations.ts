#!/usr/bin/env tsx

/**
 * Migration Validation Script
 *
 * This script validates that all migration files follow proper naming conventions
 * and are in sequential order without gaps. Used in CI pipeline.
 */

import fs from "fs"
import path from "path"

interface MigrationValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  migrationCount: number
  details: {
    files: string[]
    timestamps: string[]
    gaps: Array<{ from: string; to: string }>
    duplicates: string[]
  }
}

class MigrationValidator {
  private migrationsDir = path.join(process.cwd(), "supabase", "migrations")
  private result: MigrationValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    migrationCount: 0,
    details: {
      files: [],
      timestamps: [],
      gaps: [],
      duplicates: [],
    },
  }

  private validateMigrationFilename(filename: string): boolean {
    // Check if filename matches pattern: YYYYMMDDHHMMSS_description.sql
    const pattern = /^\d{14}_[a-z0-9_]+\.sql$/
    return pattern.test(filename)
  }

  private extractTimestamp(filename: string): string | null {
    const match = filename.match(/^(\d{14})_/)
    return match ? match[1] : null
  }

  private validateMigrationContent(filePath: string): boolean {
    try {
      const content = fs.readFileSync(filePath, "utf-8")

      // Check for required header
      if (!content.includes("-- Migration:")) {
        this.result.errors.push(`Missing migration header in ${path.basename(filePath)}`)
        return false
      }

      // Check for SQL syntax (basic validation)
      if (!content.trim()) {
        this.result.errors.push(`Empty migration file: ${path.basename(filePath)}`)
        return false
      }

      // Check for common SQL issues
      if (content.includes("DROP TABLE") && !content.includes("IF EXISTS")) {
        this.result.warnings.push(`Potentially unsafe DROP TABLE in ${path.basename(filePath)}`)
      }

      if (content.includes("DELETE FROM") && !content.includes("WHERE")) {
        this.result.warnings.push(`Potentially unsafe DELETE FROM in ${path.basename(filePath)}`)
      }

      return true
    } catch (error) {
      this.result.errors.push(`Failed to read migration file ${path.basename(filePath)}: ${error}`)
      return false
    }
  }

  private checkSequentialOrdering(timestamps: string[]): void {
    const sortedTimestamps = [...timestamps].sort()

    // Check for gaps
    for (let i = 1; i < sortedTimestamps.length; i++) {
      const current = parseInt(sortedTimestamps[i])
      const previous = parseInt(sortedTimestamps[i - 1])

      if (current - previous > 1) {
        this.result.details.gaps.push({
          from: sortedTimestamps[i - 1],
          to: sortedTimestamps[i],
        })
        this.result.warnings.push(
          `Gap detected between migrations: ${sortedTimestamps[i - 1]} -> ${sortedTimestamps[i]}`,
        )
      }
    }

    // Check for duplicates
    const duplicates = sortedTimestamps.filter(
      (timestamp, index) => sortedTimestamps.indexOf(timestamp) !== index,
    )

    if (duplicates.length > 0) {
      this.result.details.duplicates = duplicates
      this.result.errors.push(`Duplicate timestamps found: ${duplicates.join(", ")}`)
      this.result.isValid = false
    }
  }

  private validateIdempotency(filePath: string): void {
    try {
      const content = fs.readFileSync(filePath, "utf-8")
      const filename = path.basename(filePath)

      // Check for CREATE TABLE IF NOT EXISTS
      const createTableMatches = content.match(/CREATE TABLE\s+(\w+)/gi)
      if (createTableMatches) {
        createTableMatches.forEach((match) => {
          if (!match.includes("IF NOT EXISTS")) {
            this.result.warnings.push(`CREATE TABLE without IF NOT EXISTS in ${filename}: ${match}`)
          }
        })
      }

      // Check for CREATE INDEX IF NOT EXISTS
      const createIndexMatches = content.match(/CREATE INDEX\s+(\w+)/gi)
      if (createIndexMatches) {
        createIndexMatches.forEach((match) => {
          if (!match.includes("IF NOT EXISTS")) {
            this.result.warnings.push(`CREATE INDEX without IF NOT EXISTS in ${filename}: ${match}`)
          }
        })
      }

      // Check for ALTER TABLE ADD COLUMN IF NOT EXISTS
      const alterTableMatches = content.match(/ALTER TABLE\s+\w+\s+ADD COLUMN\s+(\w+)/gi)
      if (alterTableMatches) {
        alterTableMatches.forEach((match) => {
          if (!match.includes("IF NOT EXISTS")) {
            this.result.warnings.push(`ADD COLUMN without IF NOT EXISTS in ${filename}: ${match}`)
          }
        })
      }
    } catch (error) {
      this.result.errors.push(
        `Failed to validate idempotency for ${path.basename(filePath)}: ${error}`,
      )
    }
  }

  public validate(): MigrationValidationResult {
    console.log("🔍 Validating migrations...")

    if (!fs.existsSync(this.migrationsDir)) {
      this.result.errors.push("Migrations directory does not exist")
      this.result.isValid = false
      return this.result
    }

    const files = fs.readdirSync(this.migrationsDir)
    const sqlFiles = files.filter((file) => file.endsWith(".sql"))

    if (sqlFiles.length === 0) {
      this.result.warnings.push("No migration files found")
      return this.result
    }

    this.result.migrationCount = sqlFiles.length
    console.log(`📄 Found ${sqlFiles.length} migration files`)

    // Validate each migration file
    for (const file of sqlFiles) {
      this.result.details.files.push(file)

      // Validate filename format
      if (!this.validateMigrationFilename(file)) {
        this.result.errors.push(`Invalid migration filename format: ${file}`)
        this.result.isValid = false
        continue
      }

      // Extract and validate timestamp
      const timestamp = this.extractTimestamp(file)
      if (timestamp) {
        this.result.details.timestamps.push(timestamp)
      } else {
        this.result.errors.push(`Could not extract timestamp from filename: ${file}`)
        this.result.isValid = false
        continue
      }

      // Validate file content
      const filePath = path.join(this.migrationsDir, file)
      if (!this.validateMigrationContent(filePath)) {
        this.result.isValid = false
      }

      // Check for idempotency
      this.validateIdempotency(filePath)
    }

    // Check sequential ordering
    if (this.result.details.timestamps.length > 1) {
      this.checkSequentialOrdering(this.result.details.timestamps)
    }

    // Check for gaps
    if (this.result.details.gaps.length > 0) {
      this.result.isValid = false
    }

    return this.result
  }

  public printResults(): void {
    console.log("\n📊 Migration Validation Results")
    console.log("=".repeat(50))

    console.log(`📄 Total migrations: ${this.result.migrationCount}`)
    console.log(`✅ Valid: ${this.result.isValid ? "Yes" : "No"}`)

    if (this.result.errors.length > 0) {
      console.log("\n❌ Errors:")
      this.result.errors.forEach((error) => {
        console.log(`  - ${error}`)
      })
    }

    if (this.result.warnings.length > 0) {
      console.log("\n⚠️  Warnings:")
      this.result.warnings.forEach((warning) => {
        console.log(`  - ${warning}`)
      })
    }

    if (this.result.details.gaps.length > 0) {
      console.log("\n🕐 Gaps detected:")
      this.result.details.gaps.forEach((gap) => {
        console.log(`  - ${gap.from} -> ${gap.to}`)
      })
    }

    if (this.result.details.duplicates.length > 0) {
      console.log("\n🔄 Duplicate timestamps:")
      this.result.details.duplicates.forEach((duplicate) => {
        console.log(`  - ${duplicate}`)
      })
    }

    console.log("\n📋 Migration files:")
    this.result.details.files.sort().forEach((file) => {
      console.log(`  - ${file}`)
    })

    console.log("\n" + "=".repeat(50))

    if (this.result.isValid) {
      console.log("🎉 All migrations are valid!")
    } else {
      console.log("❌ Migration validation failed!")
      process.exit(1)
    }
  }
}

// Run validation
if (require.main === module) {
  const validator = new MigrationValidator()
  const result = validator.validate()
  validator.printResults()
}

export default MigrationValidator
