/**
 * Background Contract Processing Worker
 * Part of Critical Path Optimization Guide implementation
 * Handles PDF generation, email sending, and batch operations in the background
 */

// Worker script for background contract processing
const backgroundWorkerScript = `
class BackgroundContractProcessor {
  constructor() {
    this.processingQueue = []
    this.isProcessing = false
    this.retryAttempts = new Map()
    this.maxRetries = 3
    this.retryDelay = 5000 // 5 seconds
  }

  async processMessage(data) {
    const { type, payload } = data

    switch (type) {
      case 'PROCESS_PDF_GENERATION':
        return await this.processPDFGeneration(payload)
      case 'PROCESS_EMAIL_BATCH':
        return await this.processEmailBatch(payload)
      case 'PROCESS_CONTRACT_BATCH':
        return await this.processContractBatch(payload)
      case 'CLEANUP_TEMP_FILES':
        return await this.cleanupTempFiles(payload)
      default:
        throw new Error(\`Unknown message type: \${type}\`)
    }
  }

  async processPDFGeneration({ contractId, priority = 'normal' }) {
    
    try {
      const response = await fetch('/api/contracts/background-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, background: true })
      })

      if (!response.ok) {
        throw new Error(\`PDF generation failed: \${response.status}\`)
      }

      const result = await response.json()
      
      return { success: true, result }
    } catch (error) {
      console.error(\`❌ Background: PDF generation failed for \${contractId}:\`, error)
      return { success: false, error: error.message }
    }
  }

  async processEmailBatch({ emails, templateType }) {
    
    const results = []
    const batchSize = 5 // Process 5 emails at a time
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (email) => {
        try {
          const response = await fetch('/api/emails/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...email,
              templateType,
              background: true
            })
          })

          if (!response.ok) {
            throw new Error(\`Email send failed: \${response.status}\`)
          }

          return { success: true, email: email.to }
        } catch (error) {
          return { success: false, email: email.to, error: error.message }
        }
      })

      const batchResults = await Promise.allSettled(batchPromises)
      results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason }))
      
      // Small delay between batches to avoid overwhelming the server
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return { success: true, results }
  }

  async processContractBatch({ contractIds, operation }) {
    
    const results = []
    
    for (const contractId of contractIds) {
      try {
        let result
        
        switch (operation) {
          case 'generate_pdf':
            result = await this.processPDFGeneration({ contractId })
            break
          case 'send_reminder':
            result = await this.sendContractReminder(contractId)
            break
          case 'update_status':
            result = await this.updateContractStatus(contractId, operation.status)
            break
          default:
            throw new Error(\`Unknown batch operation: \${operation}\`)
        }
        
        results.push({ contractId, success: result.success, result })
      } catch (error) {
        results.push({ contractId, success: false, error: error.message })
      }
    }

    return { success: true, results }
  }

  async sendContractReminder(contractId) {
    try {
      const response = await fetch('/api/contracts/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, background: true })
      })

      if (!response.ok) {
        throw new Error(\`Reminder send failed: \${response.status}\`)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async updateContractStatus(contractId, status) {
    try {
      const response = await fetch('/api/contracts/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, status, background: true })
      })

      if (!response.ok) {
        throw new Error(\`Status update failed: \${response.status}\`)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async cleanupTempFiles({ olderThan = 24 * 60 * 60 * 1000 }) {
    
    try {
      const response = await fetch('/api/cleanup/temp-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ olderThan, background: true })
      })

      if (!response.ok) {
        throw new Error(\`Cleanup failed: \${response.status}\`)
      }

      const result = await response.json()
      
      return { success: true, result }
    } catch (error) {
      console.error('❌ Background: Cleanup failed:', error)
      return { success: false, error: error.message }
    }
  }
}

const processor = new BackgroundContractProcessor()

self.addEventListener('message', async function(e) {
  const { id, type, payload } = e.data
  
  try {
    const result = await processor.processMessage({ type, payload })
    self.postMessage({ id, success: true, result })
  } catch (error) {
    console.error('Background worker error:', error)
    self.postMessage({ 
      id, 
      success: false, 
      error: error.message 
    })
  }
})

`;

// Main worker manager class
export class BackgroundContractWorker {
  private worker: Worker | null = null;
  private messageId = 0;
  private pendingMessages = new Map<
    number,
    {
      resolve: (value: any) => void;
      reject: (reason: any) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker() {
    if (typeof Worker === 'undefined') {
      console.warn('Web Workers not supported in this environment');
      return;
    }

    try {
      const blob = new Blob([backgroundWorkerScript], {
        type: 'application/javascript',
      });
      this.worker = new Worker(URL.createObjectURL(blob));

      this.worker.addEventListener('message', e => {
        const { id, success, result, error } = e.data;
        const pending = this.pendingMessages.get(id);

        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingMessages.delete(id);

          if (success) {
            pending.resolve(result);
          } else {
            pending.reject(new Error(error));
          }
        }
      });

      this.worker.addEventListener('error', error => {
        console.error('Background worker error:', error);
      });
    } catch (error) {
      console.error('Failed to initialize background worker:', error);
    }
  }

  private sendMessage(
    type: string,
    payload: any,
    timeout = 30000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const id = ++this.messageId;
      const timeoutHandle = setTimeout(() => {
        this.pendingMessages.delete(id);
        reject(new Error('Worker message timeout'));
      }, timeout);

      this.pendingMessages.set(id, { resolve, reject, timeout: timeoutHandle });

      this.worker.postMessage({ id, type, payload });
    });
  }

  // Public API methods
  async processPDFGeneration(
    contractId: string,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ) {
    return this.sendMessage('PROCESS_PDF_GENERATION', { contractId, priority });
  }

  async processEmailBatch(
    emails: Array<{
      to: string;
      subject: string;
      content: string;
      [key: string]: any;
    }>,
    templateType: string
  ) {
    return this.sendMessage('PROCESS_EMAIL_BATCH', { emails, templateType });
  }

  async processContractBatch(contractIds: string[], operation: string) {
    return this.sendMessage('PROCESS_CONTRACT_BATCH', {
      contractIds,
      operation,
    });
  }

  async cleanupTempFiles(olderThan?: number) {
    return this.sendMessage('CLEANUP_TEMP_FILES', { olderThan });
  }

  // Batch operations with progress tracking
  async batchGeneratePDFs(contractIds: string[]) {
    const results = [];
    // let completed = 0;

    for (const contractId of contractIds) {
      try {
        const result = await this.processPDFGeneration(contractId);
        results.push({ contractId, success: true, result });
      } catch (error) {
        results.push({
          contractId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // completed++;
    }

    return results;
  }

  async batchSendReminders(contractIds: string[]) {
    return this.processContractBatch(contractIds, 'send_reminder');
  }

  // Health check
  getWorkerStatus() {
    return {
      isInitialized: this.worker !== null,
      pendingMessages: this.pendingMessages.size,
      isSupported: typeof Worker !== 'undefined',
    };
  }

  // Cleanup
  terminate() {
    if (this.worker) {
      // Clear all pending messages
      this.pendingMessages.forEach(({ timeout, reject }) => {
        clearTimeout(timeout);
        reject(new Error('Worker terminated'));
      });
      this.pendingMessages.clear();

      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Singleton instance
export const backgroundContractWorker = new BackgroundContractWorker();

// React hook for background processing
export function useBackgroundContractProcessor() {
  return {
    processPDFGeneration: (
      contractId: string,
      priority?: 'low' | 'normal' | 'high'
    ) => backgroundContractWorker.processPDFGeneration(contractId, priority),

    processEmailBatch: (emails: any[], templateType: string) =>
      backgroundContractWorker.processEmailBatch(emails, templateType),

    batchGeneratePDFs: (
      contractIds: string[],
      onProgress?: (progress: number, total: number) => void
    ) => backgroundContractWorker.batchGeneratePDFs(contractIds, onProgress),

    batchSendReminders: (
      contractIds: string[],
      onProgress?: (progress: number, total: number) => void
    ) => backgroundContractWorker.batchSendReminders(contractIds, onProgress),

    cleanupTempFiles: (olderThan?: number) =>
      backgroundContractWorker.cleanupTempFiles(olderThan),

    getWorkerStatus: () => backgroundContractWorker.getWorkerStatus(),
  };
}
