// @ts-check

/**
 * @typedef {"image" | "video"} ClipboardMediaKind
 */

/**
 * @typedef {Object} ClipboardMediaInput
 * @property {Blob | File | null} [blob]
 * @property {string | null} [url]
 * @property {Blob | File | null} [fallbackBlob]
 */

/**
 * @typedef {Object} ReplacementTarget
 * @property {string | null} [documentName]
 * @property {Array<object>} documents
 * @property {number} [requestedCount]
 * @property {boolean} [blocked]
 */

/**
 * @typedef {Object} PasteContext
 * @property {{x: number, y: number} | null} [mousePos]
 * @property {string | null} [activeDocumentName]
 * @property {string | null} [createDocumentName]
 * @property {ReplacementTarget | null} [replacementTarget]
 * @property {boolean} [requireCanvasFocus]
 */

/**
 * @typedef {Object} UploadDestination
 * @property {string} storedSource
 * @property {string} source
 * @property {string} target
 * @property {string} bucket
 * @property {string} endpoint
 */

/**
 * @typedef {UploadDestination & {
 *   key: string,
 *   label: string
 * }} UploadRoot
 */

/**
 * @typedef {"pass" | "warn" | "fail"} ReadinessStatus
 */

/**
 * @typedef {Object} ReadinessCheck
 * @property {string} id
 * @property {string} label
 * @property {ReadinessStatus} status
 * @property {string} summary
 * @property {string} remediation
 * @property {object | null} [details]
 */

/**
 * @typedef {Object} ReadinessSection
 * @property {string} id
 * @property {string} title
 * @property {ReadinessCheck[]} items
 */

/**
 * @typedef {Object} ReadinessReport
 * @property {string} generatedAt
 * @property {{pass: number, warn: number, fail: number}} statusCounts
 * @property {ReadinessSection[]} sections
 */

/**
 * @typedef {Object} SupportBundle
 * @property {string} generatedAt
 * @property {{id: string, title: string, version: string | null}} module
 * @property {{version: string | null}} foundry
 * @property {{id: string | null, title: string | null}} world
 * @property {{href: string | null, userAgent: string | null, isSecureContext: boolean, clipboardReadAvailable: boolean}} browser
 * @property {ReadinessReport} readiness
 * @property {{currentDestination: UploadRoot, knownUploadRoots: UploadRoot[]}} storage
 * @property {Array<{key: string, name: string, scope: string, config: boolean, value: unknown, defaultValue: unknown, differsFromDefault: boolean}>} settings
 * @property {Array<object>} logs
 */

/**
 * @typedef {Object} MediaAuditReference
 * @property {string} context
 * @property {string} documentType
 * @property {string} documentId
 * @property {string} documentName
 * @property {string} field
 * @property {string} path
 * @property {string} normalizedPath
 * @property {string} uploadRootKey
 * @property {string} uploadRootLabel
 * @property {string | null} [sceneId]
 * @property {string | null} [sceneName]
 * @property {string | null} [messageId]
 */

/**
 * @typedef {Object} MediaAuditGroup
 * @property {string} key
 * @property {string} context
 * @property {string} documentType
 * @property {string} uploadRootKey
 * @property {string} uploadRootLabel
 * @property {MediaAuditReference[]} references
 */

/**
 * @typedef {Object} MediaAuditReport
 * @property {string} generatedAt
 * @property {UploadRoot[]} uploadRoots
 * @property {MediaAuditReference[]} references
 * @property {MediaAuditGroup[]} groups
 * @property {{referenceCount: number, groupCount: number, rootCount: number}} summary
 */

module.exports = {};
