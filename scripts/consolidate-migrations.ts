#!/usr/bin/env tsx

/**
 * Migration Consolidation Script
 * 
 * This script consolidates all SQL migration files from the scripts directory
 * into the supabase/migrations directory with proper timestamped filenames.
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

interface MigrationFile {
  filename: string
  content: string
  timestamp: string
  description: string
}

class MigrationConsolidator {
  private migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
  private scriptsDir = path.join(process.cwd(), 'scripts')
  private consolidatedMigrations: MigrationFile[] = []

  constructor() {
    this.ensureMigrationsDirectory()
  }

  private ensureMigrationsDirectory(): void {
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true })
      console.log('✅ Created migrations directory')
    }
  }

  private extractTimestamp(filename: string): string {
    // Extract timestamp from existing migration files
    const timestampMatch = filename.match(/^(\d{8})_/)
    if (timestampMatch) {
      return timestampMatch[1]
    }

    // For files without timestamps, generate one
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hour = String(now.getHours()).padStart(2, '0')
    const minute = String(now.getMinutes()).padStart(2, '0')
    const second = String(now.getSeconds()).padStart(2, '0')
    
    return `${year}${month}${day}${hour}${minute}${second}`
  }

  private extractDescription(filename: string): string {
    // Remove timestamp and .sql extension
    let description = filename
      .replace(/^\d{8}_/, '')
      .replace(/^\d{14}_/, '')
      .replace(/\.sql$/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())

    return description
  }

  private readExistingMigrations(): void {
    console.log('📖 Reading existing migrations...')
    
    const files = fs.readdirSync(this.migrationsDir)
    const sqlFiles = files.filter(file => file.endsWith('.sql'))

    for (const file of sqlFiles) {
      const filePath = path.join(this.migrationsDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const timestamp = this.extractTimestamp(file)
      const description = this.extractDescription(file)

      this.consolidatedMigrations.push({
        filename: file,
        content,
        timestamp,
        description
      })
    }

    console.log(`✅ Found ${this.consolidatedMigrations.length} existing migrations`)
  }

  private readScriptsDirectory(): void {
    console.log('📖 Reading SQL files from scripts directory...')
    
    const files = fs.readdirSync(this.scriptsDir)
    const sqlFiles = files.filter(file => file.endsWith('.sql'))

    for (const file of sqlFiles) {
      const filePath = path.join(this.scriptsDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const timestamp = this.extractTimestamp(file)
      const description = this.extractDescription(file)

      // Check if this migration already exists
      const exists = this.consolidatedMigrations.some(m => 
        m.description === description || m.content === content
      )

      if (!exists) {
        this.consolidatedMigrations.push({
          filename: file,
          content,
          timestamp,
          description
        })
        console.log(`📄 Found new migration: ${file}`)
      } else {
        console.log(`⏭️  Skipping duplicate: ${file}`)
      }
    }
  }

  private sortMigrations(): void {
    this.consolidatedMigrations.sort((a, b) => {
      // Sort by timestamp first
      const timestampCompare = a.timestamp.localeCompare(b.timestamp)
      if (timestampCompare !== 0) return timestampCompare

      // If timestamps are equal, sort by description
      return a.description.localeCompare(b.description)
    })
  }

  private generateSequentialTimestamps(): void {
    console.log('🕐 Generating sequential timestamps...')
    
    let baseTimestamp = '20250729000000' // Start from a base timestamp
    
    for (let i = 0; i < this.consolidatedMigrations.length; i++) {
      const migration = this.consolidatedMigrations[i]
      const newTimestamp = (parseInt(baseTimestamp) + i).toString()
      
      migration.timestamp = newTimestamp
    }
  }

  private writeConsolidatedMigrations(): void {
    console.log('💾 Writing consolidated migrations...')
    
    // Backup existing migrations
    const backupDir = path.join(this.migrationsDir, 'backup_' + Date.now())
    if (fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
      const files = fs.readdirSync(this.migrationsDir)
      files.forEach(file => {
        if (file.endsWith('.sql')) {
          fs.copyFileSync(
            path.join(this.migrationsDir, file),
            path.join(backupDir, file)
          )
        }
      })
      console.log(`💾 Backed up existing migrations to ${backupDir}`)
    }

    // Remove existing migration files
    const files = fs.readdirSync(this.migrationsDir)
    files.forEach(file => {
      if (file.endsWith('.sql')) {
        fs.unlinkSync(path.join(this.migrationsDir, file))
      }
    })

    // Write new consolidated migrations
    for (const migration of this.consolidatedMigrations) {
      const newFilename = `${migration.timestamp}_${migration.description.replace(/\s+/g, '_').toLowerCase()}.sql`
      const filePath = path.join(this.migrationsDir, newFilename)
      
      // Add migration header
      const header = `-- Migration: ${migration.description}
-- Date: ${new Date().toISOString().split('T')[0]}
-- Description: ${migration.description}
-- Generated by: Migration Consolidation Script

`
      
      fs.writeFileSync(filePath, header + migration.content)
      console.log(`✅ Created: ${newFilename}`)
    }
  }

  private validateMigrations(): void {
    console.log('🔍 Validating migrations...')
    
    const files = fs.readdirSync(this.migrationsDir)
    const sqlFiles = files.filter(file => file.endsWith('.sql'))
    
    // Check for sequential numbering
    const timestamps = sqlFiles.map(file => {
      const match = file.match(/^(\d{14})_/)
      return match ? match[1] : null
    }).filter(Boolean).sort()

    // Check for gaps
    for (let i = 1; i < timestamps.length; i++) {
      const current = parseInt(timestamps[i])
      const previous = parseInt(timestamps[i - 1])
      if (current - previous > 1) {
        console.warn(`⚠️  Gap detected between migrations: ${previous} -> ${current}`)
      }
    }

    // Check for duplicate timestamps
    const duplicates = timestamps.filter((timestamp, index) => 
      timestamps.indexOf(timestamp) !== index
    )
    
    if (duplicates.length > 0) {
      throw new Error(`Duplicate timestamps found: ${duplicates.join(', ')}`)
    }

    console.log('✅ Migration validation passed')
  }

  private createMigrationIndex(): void {
    console.log('📋 Creating migration index...')
    
    const files = fs.readdirSync(this.migrationsDir)
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort()
    
    let indexContent = `# Migration Index

This file is automatically generated and lists all database migrations in chronological order.

## Migrations (${sqlFiles.length} total)

`
    
    for (const file of sqlFiles) {
      const filePath = path.join(this.migrationsDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const firstLine = content.split('\n')[0]
      const description = firstLine.replace('-- Migration: ', '').trim()
      
      indexContent += `### ${file}
- **Description**: ${description}
- **Size**: ${content.length} characters
- **Lines**: ${content.split('\n').length}

`
    }
    
    fs.writeFileSync(path.join(this.migrationsDir, 'MIGRATION_INDEX.md'), indexContent)
    console.log('✅ Created migration index')
  }

  public async consolidate(): Promise<void> {
    try {
      console.log('🚀 Starting migration consolidation...')
      
      this.readExistingMigrations()
      this.readScriptsDirectory()
      this.sortMigrations()
      this.generateSequentialTimestamps()
      this.writeConsolidatedMigrations()
      this.validateMigrations()
      this.createMigrationIndex()
      
      console.log('🎉 Migration consolidation completed successfully!')
      console.log(`📊 Total migrations: ${this.consolidatedMigrations.length}`)
      
    } catch (error) {
      console.error('❌ Migration consolidation failed:', error)
      process.exit(1)
    }
  }
}

// Run the consolidation
if (require.main === module) {
  const consolidator = new MigrationConsolidator()
  consolidator.consolidate()
}

export default MigrationConsolidator