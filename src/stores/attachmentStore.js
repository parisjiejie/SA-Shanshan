/**
 * 附件存储 - 使用 IndexedDB 存储大文件（照片/视频的base64数据）
 * 解决 localStorage 5MB 限制导致附件数据丢失/截断的问题
 */

const DB_NAME = 'sa_attachments'
const DB_VERSION = 1
const STORE_NAME = 'attachments'

let dbInstance = null

const openDB = () => {
  if (dbInstance) return Promise.resolve(dbInstance)
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = (e) => {
      dbInstance = e.target.result
      resolve(dbInstance)
    }
    request.onerror = (e) => {
      console.error('IndexedDB打开失败:', e)
      reject(e)
    }
  })
}

/**
 * 保存附件到 IndexedDB
 * @param {string} id - 附件ID
 * @param {object} attachment - { type: 'image'|'video', url: base64DataUrl, name: string }
 * @returns {string} 附件ID
 */
export const saveAttachment = async (id, attachment) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put({ id, ...attachment })
    tx.oncomplete = () => resolve(id)
    tx.onerror = (e) => reject(e)
  })
}

/**
 * 批量保存附件，返回引用列表（不含base64数据）
 * @param {Array} attachments - [{ type, url, name }]
 * @returns {Array} [{ id, type, name }] 不含url，用于存入工单
 */
export const saveAttachments = async (attachments) => {
  if (!attachments || attachments.length === 0) return []
  const refs = []
  for (const att of attachments) {
    const id = `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    await saveAttachment(id, att)
    refs.push({ id, type: att.type, name: att.name || '' })
  }
  return refs
}

/**
 * 读取单个附件
 * @param {string} id
 * @returns {object|null} { id, type, url, name }
 */
export const getAttachment = async (id) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = (e) => reject(e)
  })
}

/**
 * 批量读取附件，返回完整数据（含url）
 * @param {Array} refs - [{ id, type, name }] 工单中存的引用列表
 * @returns {Array} [{ id, type, url, name }]
 */
export const getAttachments = async (refs) => {
  if (!refs || refs.length === 0) return []
  const results = []
  for (const ref of refs) {
    const att = await getAttachment(ref.id || ref)
    if (att) {
      results.push(att)
    } else {
      // 兼容：如果IndexedDB中没有，可能是旧数据直接存了url
      if (ref.url) {
        results.push(ref)
      }
    }
  }
  return results
}

/**
 * 删除单个附件
 */
export const deleteAttachment = async (id) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = (e) => reject(e)
  })
}

/**
 * 删除工单关联的所有附件
 * @param {Array} refs - [{ id }] 或 [{ id, type, name }]
 */
export const deleteAttachments = async (refs) => {
  if (!refs || refs.length === 0) return
  for (const ref of refs) {
    const id = ref.id || ref
    if (typeof id === 'string') {
      await deleteAttachment(id)
    }
  }
}
