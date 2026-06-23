<template>
  <div class="detail-page">
    <!-- Fixed top nav bar -->
    <div class="nav-bar">
      <div class="nav-left" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </div>
      <span class="nav-title">产品详情</span>
      <span class="nav-right"></span>
    </div>

    <!-- Loading state -->
    <div v-if="!product && !notFound" class="loading-state">
      <el-icon class="loading-icon" :size="40"><Box /></el-icon>
      <p>加载中...</p>
    </div>

    <!-- Not found state -->
    <div v-if="notFound" class="not-found-state">
      <el-icon :size="60" color="#c0c4cc"><Box /></el-icon>
      <p>产品不存在或已被删除</p>
      <el-button type="primary" size="large" @click="goBack">返回产品库</el-button>
    </div>

    <!-- Product content -->
    <template v-if="product">
      <!-- Product image area -->
      <div class="product-hero" :style="{ backgroundColor: imageUrl ? 'transparent' : (product.imageColor || '#3B82F6') }">
        <img v-if="imageUrl" :src="imageUrl" class="hero-image" />
        <el-icon v-else class="hero-icon" :size="80"><Box /></el-icon>
        <div class="product-hero-gradient"></div>
      </div>

      <!-- Product info section -->
      <div class="info-card">
        <h1 class="product-name">{{ product.name }}</h1>
        <div class="product-tags-row">
          <el-tag size="small" effect="plain">
            <el-icon style="margin-right: 2px"><PriceTag /></el-icon>
            {{ product.model }}
          </el-tag>
          <el-tag size="small" effect="plain" type="info">
            <el-icon style="margin-right: 2px"><OfficeBuilding /></el-icon>
            {{ product.brand }}
          </el-tag>
        </div>
        <div class="price-row">
          <span class="product-price">¥{{ formatPrice(product.price) }}</span>
          <el-tag
            :type="product.stock === '在售' ? 'success' : 'warning'"
            size="small"
            effect="dark"
          >
            <el-icon v-if="product.stock === '在售'" style="margin-right: 2px"><CircleCheck /></el-icon>
            {{ product.stock }}
          </el-tag>
        </div>
        <div class="category-path" v-if="categoryPathLabel">
          <el-icon style="margin-right: 4px; font-size: 13px"><Collection /></el-icon>
          <span>{{ categoryPathLabel }}</span>
        </div>
      </div>

      <!-- Product description section -->
      <div class="section-card" v-if="product.description">
        <div class="section-title">产品描述</div>
        <p class="section-content">{{ product.description }}</p>
      </div>

      <!-- Product specs section -->
      <div class="section-card">
        <div class="section-title">产品规格</div>
        <div class="spec-list">
          <div class="spec-item">
            <span class="spec-label">型号</span>
            <span class="spec-value">{{ product.model }}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">品牌</span>
            <span class="spec-value">{{ product.brand }}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">分类</span>
            <span class="spec-value">{{ categoryPathLabel || '-' }}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">销售状态</span>
            <span class="spec-value">
              <el-tag
                :type="product.stock === '在售' ? 'success' : 'warning'"
                size="small"
              >{{ product.stock }}</el-tag>
            </span>
          </div>
        </div>
      </div>

      <!-- PDF section -->
      <div class="section-card" v-if="product.hasPdf">
        <div class="section-title">产品资料</div>
        <div v-if="!pdfVisible">
          <el-button
            type="primary"
            size="large"
            class="pdf-button"
            @click="loadPdf"
            :loading="pdfLoading"
          >
            <el-icon style="margin-right: 6px"><Document /></el-icon>
            查看产品资料PDF
          </el-button>
        </div>
        <div v-else class="pdf-container">
          <iframe
            v-if="pdfBlobUrl"
            :src="pdfBlobUrl"
            width="100%"
            height="500px"
            frameborder="0"
            class="pdf-iframe"
          ></iframe>
          <div v-else class="pdf-placeholder">
            <el-icon :size="32"><Document /></el-icon>
            <span>正在加载产品资料...</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Bottom action bar -->
    <div class="bottom-bar" v-if="product">
      <a href="tel:4008220907" class="bottom-btn contact-btn">
        <el-icon><Phone /></el-icon>
        <span>联系咨询</span>
      </a>
      <button class="bottom-btn back-btn" @click="goBack">
        <el-icon><Goods /></el-icon>
        <span>返回产品库</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, Box, Document, Phone, PriceTag, OfficeBuilding,
  Collection, Goods, CircleCheck
} from '@element-plus/icons-vue'
import { getProductById, getPdfBlobUrl, getCategoryLabel, loadProducts, getProductImageUrl } from '../stores/productStore.js'

const route = useRoute()
const router = useRouter()

const product = ref(null)
const notFound = ref(false)
const pdfVisible = ref(false)
const pdfLoading = ref(false)
const pdfBlobUrl = ref(null)
const imageUrl = ref('')

const categoryPathLabel = computed(() => {
  if (!product.value?.categoryPath) return ''
  return product.value.categoryPath.map(id => getCategoryLabel(id)).join(' > ')
})

const formatPrice = (val) => {
  if (val >= 10000) return (val / 10000).toFixed(1) + '万'
  return val.toLocaleString('zh-CN')
}

const goBack = () => {
  router.back()
}

const loadPdf = async () => {
  if (!product.value) return
  pdfLoading.value = true
  pdfVisible.value = true
  try {
    pdfBlobUrl.value = await getPdfBlobUrl(product.value.id)
  } catch (e) {
    console.error('加载PDF失败:', e)
  }
  pdfLoading.value = false
}

onMounted(async () => {
  const id = route.query.id
  if (!id) {
    notFound.value = true
    return
  }

  // Ensure products are loaded
  await loadProducts()

  const p = getProductById(id)
  if (!p) {
    notFound.value = true
    return
  }
  product.value = p

  if (p.hasImage) {
    try {
      const url = await getProductImageUrl(p.id)
      if (url) imageUrl.value = url
    } catch (e) {}
  }
})

onUnmounted(() => {
  if (pdfBlobUrl.value) {
    URL.revokeObjectURL(pdfBlobUrl.value)
    pdfBlobUrl.value = null
  }
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = ''
  }
})
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

/* Nav bar */
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 100;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #409eff;
  font-size: 14px;
  cursor: pointer;
  min-width: 60px;
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.nav-right {
  min-width: 60px;
}

/* Loading & not found */
.loading-state,
.not-found-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: #909399;
  gap: 12px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.not-found-state p {
  font-size: 15px;
  color: #909399;
  margin: 0;
}

/* Product hero */
.product-hero {
  margin-top: 48px;
  height: 220px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-icon {
  color: rgba(255, 255, 255, 0.85);
}

.hero-image {
  width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;
}

.product-hero-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.15), transparent);
}

/* Info card */
.info-card {
  background: #fff;
  border-radius: 16px 16px 0 0;
  margin-top: -20px;
  position: relative;
  z-index: 1;
  padding: 20px 16px;
}

.product-name {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 12px;
  line-height: 1.4;
}

.product-tags-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.product-price {
  font-size: 22px;
  font-weight: 700;
  color: #e6a23c;
}

.category-path {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  line-height: 1.5;
}

/* Section card */
.section-card {
  background: #fff;
  border-radius: 12px;
  margin: 12px;
  padding: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  border-left: 3px solid #409eff;
  padding-left: 10px;
  margin: 0 0 12px;
}

.section-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
  margin: 0;
}

/* Spec list */
.spec-list {
  display: flex;
  flex-direction: column;
}

.spec-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.spec-item:last-child {
  border-bottom: none;
}

.spec-label {
  font-size: 14px;
  color: #909399;
  flex-shrink: 0;
}

.spec-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  text-align: right;
}

/* PDF section */
.pdf-button {
  width: 100%;
  height: 48px;
  font-size: 15px;
  border-radius: 10px;
}

.pdf-container {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.pdf-iframe {
  display: block;
}

.pdf-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #c0c4cc;
  gap: 8px;
  font-size: 14px;
}

/* Bottom bar */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.06);
  display: flex;
  gap: 12px;
  padding: 0 16px;
  align-items: center;
  z-index: 100;
}

.bottom-btn {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  border: none;
  text-decoration: none;
  transition: opacity 0.2s;
}

.bottom-btn:active {
  opacity: 0.85;
}

.contact-btn {
  background: #fff;
  border: 1px solid #409eff;
  color: #409eff;
}

.back-btn {
  background: #409eff;
  color: #fff;
}
</style>
