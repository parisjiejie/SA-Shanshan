const DB_NAME = 'yamazen_product_db'
const DB_VERSION = 1
const STORE_PRODUCTS = 'products'
const STORE_FILES = 'files'

let db = null
let dbReady = null

function openDB() {
  if (dbReady) return dbReady
  dbReady = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
        db.createObjectStore(STORE_PRODUCTS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES, { keyPath: 'productId' })
      }
    }
    request.onsuccess = (event) => {
      db = event.target.result
      resolve(db)
    }
    request.onerror = () => reject(request.error)
  })
  return dbReady
}

async function getStore(storeName, mode = 'readonly') {
  const database = await openDB()
  const tx = database.transaction(storeName, mode)
  return tx.objectStore(storeName)
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getAllProducts() {
  const store = await getStore(STORE_PRODUCTS)
  return requestToPromise(store.getAll())
}

export async function getProductById(id) {
  const store = await getStore(STORE_PRODUCTS)
  return requestToPromise(store.get(id))
}

/** 深拷贝，剥离 Vue 响应式 Proxy，确保 IndexedDB structured clone 可用 */
function toPlain(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export async function saveProduct(product) {
  const store = await getStore(STORE_PRODUCTS, 'readwrite')
  return requestToPromise(store.put(toPlain(product)))
}

export async function deleteProduct(id) {
  const store = await getStore(STORE_PRODUCTS, 'readwrite')
  return requestToPromise(store.delete(id))
}

export async function saveProducts(products) {
  const store = await getStore(STORE_PRODUCTS, 'readwrite')
  return new Promise((resolve, reject) => {
    const tx = store.transaction
    products.forEach(p => store.put(toPlain(p)))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function saveFile(productId, file) {
  const store = await getStore(STORE_FILES, 'readwrite')
  const data = {
    productId,
    fileName: file.name,
    mimeType: file.type,
    data: file.data || file,
    size: file.size || file.data?.byteLength || 0
  }
  return requestToPromise(store.put(data))
}

export async function getFile(productId) {
  const store = await getStore(STORE_FILES)
  return requestToPromise(store.get(productId))
}

export async function getFileBlobUrl(productId) {
  const record = await getFile(productId)
  if (!record || !record.data) return null
  const blob = new Blob([record.data], { type: record.mimeType || 'application/pdf' })
  return URL.createObjectURL(blob)
}

export async function deleteFile(productId) {
  const store = await getStore(STORE_FILES, 'readwrite')
  return requestToPromise(store.delete(productId))
}

export async function hasProducts() {
  const store = await getStore(STORE_PRODUCTS)
  return requestToPromise(store.count()).then(c => c > 0)
}

const IMAGE_KEY_PREFIX = 'IMG_'

export async function saveImage(productId, file) {
  const store = await getStore(STORE_FILES, 'readwrite')
  const data = {
    productId: IMAGE_KEY_PREFIX + productId,
    fileName: file.name,
    mimeType: file.type,
    data: file.data || file,
    size: file.size || file.data?.byteLength || 0
  }
  return requestToPromise(store.put(data))
}

export async function getImage(productId) {
  const store = await getStore(STORE_FILES)
  return requestToPromise(store.get(IMAGE_KEY_PREFIX + productId))
}

export async function getImageBlobUrl(productId) {
  const record = await getImage(productId)
  if (!record || !record.data) return null
  const blob = new Blob([record.data], { type: record.mimeType || 'image/png' })
  return URL.createObjectURL(blob)
}

export async function deleteImage(productId) {
  const store = await getStore(STORE_FILES, 'readwrite')
  return requestToPromise(store.delete(IMAGE_KEY_PREFIX + productId))
}

export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}
