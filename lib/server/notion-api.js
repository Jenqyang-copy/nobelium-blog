import { NotionAPI } from 'notion-client'

const { NOTION_ACCESS_TOKEN, NOTION_ACTIVE_USER } = process.env

const client = new NotionAPI({
  authToken: NOTION_ACCESS_TOKEN,
  activeUser: NOTION_ACTIVE_USER,
})

function unwrapRecord(record) {
  const nestedValue = record?.value?.value
  if (!nestedValue) return record

  return {
    ...record,
    role: record.role ?? record.value?.role,
    value: nestedValue,
  }
}

function normalizeRecordMapTables(recordMap) {
  if (!recordMap) return recordMap

  for (const table of Object.keys(recordMap)) {
    const value = recordMap[table]
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue

    const normalized = {}
    let changed = false

    for (const [key, record] of Object.entries(value)) {
      const nextRecord = unwrapRecord(record)
      normalized[key] = nextRecord
      if (nextRecord !== record) changed = true
    }

    if (changed) {
      recordMap[table] = normalized
    }
  }

  return recordMap
}

function normalizeResponse(response) {
  if (!response || typeof response !== 'object') return response

  if (response.recordMap) {
    normalizeRecordMapTables(response.recordMap)
  }

  if (response.recordMapWithRoles) {
    normalizeRecordMapTables(response.recordMapWithRoles)
  }

  return response
}

const RETRIABLE_ERROR_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'ENOTFOUND',
  'ECONNREFUSED',
])

async function withRetries(fn, retries = 3) {
  let lastError

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const shouldRetry = RETRIABLE_ERROR_CODES.has(error?.code)
      if (!shouldRetry || attempt === retries - 1) break

      const delay = 500 * (attempt + 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

for (const method of ['getPage', 'getPageRaw', 'getBlocks', 'getCollectionData', 'getUsers']) {
  const original = client[method].bind(client)
  client[method] = async (...args) => normalizeResponse(await withRetries(() => original(...args)))
}

export default client
