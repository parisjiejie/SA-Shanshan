<template>
  <div class="product-library" :class="{ 'is-mobile': isMobile }">

    <!-- ==================== 移动端布局 ==================== -->
    <template v-if="isMobile">
      <!-- 固定顶部导航栏 -->
      <div class="mobile-nav-bar">
        <el-button link class="nav-back" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
        <span class="nav-title">山善产品库</span>
        <span class="nav-placeholder"></span>
      </div>

      <!-- 搜索栏 -->
      <div class="mobile-search-bar">
        <el-input
          v-model="mobileKeyword"
          placeholder="搜索产品名称、型号、品牌..."
          clearable
          @input="onMobileSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- 筛选标签区域 -->
      <div class="filter-section">
        <!-- Level 1 标签 -->
        <div class="filter-row">
          <span
            class="filter-tag"
            :class="{ active: !selectedL1 }"
            @click="selectL1(null)"
          >全部</span>
          <span
            v-for="cat in categoryTree"
            :key="cat.id"
            class="filter-tag"
            :class="{ active: selectedL1 === cat.id }"
            @click="selectL1(cat.id)"
          >{{ cat.label }}</span>
        </div>

        <!-- Level 2 标签 -->
        <div v-if="selectedL1 && l2Categories.length > 0" class="filter-row">
          <span
            class="filter-tag"
            :class="{ active: !selectedL2 }"
            @click="selectL2(null)"
          >全部</span>
          <span
            v-for="cat in l2Categories"
            :key="cat.id"
            class="filter-tag"
            :class="{ active: selectedL2 === cat.id }"
            @click="selectL2(cat.id)"
          >{{ cat.label }}</span>
        </div>

        <!-- Level 3 标签 -->
        <div v-if="selectedL2 && l3Categories.length > 0" class="filter-row">
          <span
            class="filter-tag"
            :class="{ active: !selectedL3 }"
            @click="selectL3(null)"
          >全部</span>
          <span
            v-for="cat in l3Categories"
            :key="cat.id"
            class="filter-tag"
            :class="{ active: selectedL3 === cat.id }"
            @click="selectL3(cat.id)"
          >{{ cat.label }}</span>
        </div>
      </div>

      <!-- 产品列表 -->
      <div class="product-list-mobile" v-loading="loading">
        <template v-if="mobileFilteredProducts.length > 0">
          <div
            v-for="product in mobileFilteredProducts"
            :key="product.id"
            class="product-card-mobile"
            @click="goToProductDetail(product)"
          >
            <div class="card-image-mobile" :style="{ backgroundColor: imageUrlMap[product.id] ? 'transparent' : (product.imageColor || '#409EFF') }">
              <img v-if="imageUrlMap[product.id]" :src="imageUrlMap[product.id]" class="card-img" />
              <el-icon v-else :size="36" color="#fff"><Box /></el-icon>
            </div>
            <div class="card-info-mobile">
              <div class="card-name-mobile">{{ product.name }}</div>
              <div class="card-model-mobile">{{ product.model }}</div>
              <div class="card-brand-mobile">{{ product.brand }}</div>
              <div class="card-price-row">
                <span class="card-price-mobile">¥{{ formatPrice(product.price) }}</span>
                <span v-if="product.hasPdf" class="card-pdf-tag">PDF</span>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="empty-state-mobile">
          <el-icon :size="48" color="#c0c4cc"><FolderOpened /></el-icon>
          <p>暂无匹配产品</p>
        </div>
      </div>
    </template>

    <!-- ==================== PC端布局 ==================== -->
    <template v-else>
      <el-card shadow="hover" class="mb-4">
        <template #header>
          <div class="card-header">
            <span><el-icon><Goods /></el-icon> 山善产品库</span>
            <div class="card-header-right">
              <el-button v-if="isAdmin" type="primary" size="small" @click="openAddDialog">
                <el-icon><Plus /></el-icon>
                新增产品
              </el-button>
              <span class="product-count">共 {{ allProducts.length }} 件产品</span>
            </div>
          </div>
        </template>

        <div class="search-bar">
          <el-input
            v-model="keyword"
            placeholder="搜索产品名称、型号、品牌..."
            clearable
            style="width: 360px"
            @input="onSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="pageSize" style="width: 120px" @change="currentPage = 1">
            <el-option :value="8" label="8条/页" />
            <el-option :value="16" label="16条/页" />
            <el-option :value="24" label="24条/页" />
          </el-select>
        </div>

        <div class="content-area" v-loading="loading">
          <template v-if="isSearching || isLeafCategory">
            <div class="section-label">
              <el-icon><Back /></el-icon>
              <span v-if="isSearching">搜索结果</span>
              <span v-else>
                <el-button link size="small" @click="goToCategory(null)">全部</el-button>
                <template v-for="(node, idx) in breadcrumb" :key="node.id">
                  <span class="bc-sep">/</span>
                  <el-button v-if="idx < breadcrumb.length - 1" link size="small" @click="goToCategory(node.id)">{{ node.label }}</el-button>
                  <span v-else class="bc-current">{{ node.label }}</span>
                </template>
              </span>
            </div>
            <div class="product-list" v-if="currentProducts.length > 0">
              <ProductCard
                v-for="product in pagedProducts"
                :key="product.id"
                :product="product"
                :is-admin="isAdmin"
                :image-url="imageUrlMap[product.id] || ''"
                @detail="showPreview"
                @edit="openEditDialog"
                @delete="handleDeleteProduct"
              />
            </div>
            <div v-else class="empty-state">
              <el-icon :size="60"><FolderOpened /></el-icon>
              <p>暂无匹配的产品</p>
            </div>
          </template>

          <template v-else>
            <template v-if="currentCategories.length > 0">
              <div class="section-label">
                <el-icon><Back /></el-icon>
                <el-button link size="small" @click="goToCategory(null)">全部</el-button>
                <template v-for="(node, idx) in breadcrumb" :key="node.id">
                  <span class="bc-sep">/</span>
                  <span class="bc-current">{{ node.label }}</span>
                </template>
              </div>
              <div class="category-grid">
                <div
                  v-for="cat in currentCategories"
                  :key="cat.id"
                  class="category-card"
                  @click="goToCategory(cat.id)"
                >
                  <div class="cat-icon">
                    <el-icon :size="32"><Folder /></el-icon>
                  </div>
                  <div class="cat-info">
                    <span class="cat-name">{{ cat.label }}</span>
                    <span class="cat-count">{{ getCatProductCount(cat) }} 件产品</span>
                  </div>
                  <el-icon class="cat-arrow"><ArrowRight /></el-icon>
                </div>
              </div>
            </template>
            <div v-else class="empty-state">
              <el-icon :size="60"><FolderOpened /></el-icon>
              <p>暂无分类数据</p>
            </div>
          </template>

          <div class="pagination mt-4" v-if="isLeafCategory && currentProducts.length > pageSize">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              layout="total, prev, pager, next"
              :total="currentProducts.length"
              @current-change="onPageChange"
            />
          </div>
        </div>
      </el-card>

      <!-- 新增/编辑产品对话框 -->
      <el-dialog
        :title="formMode === 'add' ? '新增产品' : '编辑产品'"
        v-model="formVisible"
        width="720px"
        :close-on-click-modal="false"
        @close="resetForm"
      >
        <el-form :model="form" :rules="formRules" ref="formRef" label-position="top" class="product-form">
          <!-- 基本信息 -->
          <div class="form-section">
            <div class="form-section-title">基本信息</div>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="产品名称" prop="name">
                  <el-input v-model="form.name" placeholder="输入产品名称" maxlength="50" show-word-limit />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="产品型号" prop="model">
                  <el-input v-model="form.model" placeholder="输入型号" maxlength="30" show-word-limit />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="品牌">
                  <el-input v-model="form.brand" placeholder="输入品牌" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="产品分类" prop="categoryPath">
                  <el-cascader
                    v-model="form.categoryPath"
                    :options="cascaderOptions"
                    :props="{ label: 'label', value: 'id', checkStrictly: false }"
                    placeholder="选择分类"
                    style="width: 100%"
                    clearable
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="产品描述">
              <el-input v-model="form.description" type="textarea" :rows="3" placeholder="输入产品描述" maxlength="500" show-word-limit />
            </el-form-item>
          </div>

          <!-- 价格与状态 -->
          <div class="form-section">
            <div class="form-section-title">价格与状态</div>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="参考价格（元）">
                  <el-input-number v-model="form.price" :min="0" :step="1000" controls-position="right" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="销售状态">
                  <el-select v-model="form.stock" style="width: 100%">
                    <el-option label="在售" value="在售" />
                    <el-option label="预售" value="预售" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 媒体资料 -->
          <div class="form-section">
            <div class="form-section-title">媒体资料</div>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="产品图片">
                  <div class="form-upload-area">
                    <el-upload
                      :auto-upload="false"
                      :limit="1"
                      accept=".jpg,.jpeg,.png,.webp"
                      :on-change="handleFormImageChange"
                      :show-file-list="false"
                      drag
                    >
                      <div v-if="form.imagePreview" class="form-upload-preview">
                        <img :src="form.imagePreview" class="form-preview-img" />
                        <div class="form-preview-overlay">点击替换</div>
                      </div>
                      <div v-else class="form-upload-placeholder">
                        <el-icon :size="32" color="#c0c4cc"><UploadFilled /></el-icon>
                        <p>拖拽或点击上传</p>
                        <span>jpg/png/webp</span>
                      </div>
                    </el-upload>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="产品资料（PDF）">
                  <div class="form-upload-area">
                    <el-upload
                      :auto-upload="false"
                      :limit="1"
                      accept=".pdf"
                      :on-change="handleFormPdfChange"
                      :show-file-list="false"
                      drag
                    >
                      <div v-if="form.pdfFile" class="form-upload-preview form-pdf-preview">
                        <el-icon :size="40" color="#409EFF"><Document /></el-icon>
                        <p class="form-pdf-name">{{ form.pdfFile.name }}</p>
                        <div class="form-preview-overlay">点击替换</div>
                      </div>
                      <div v-else class="form-upload-placeholder">
                        <el-icon :size="32" color="#c0c4cc"><UploadFilled /></el-icon>
                        <p>拖拽或点击上传</p>
                        <span>PDF格式</span>
                      </div>
                    </el-upload>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
        <template #footer>
          <el-button @click="formVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="formSaving">
            {{ formMode === 'add' ? '添加产品' : '保存修改' }}
          </el-button>
        </template>
      </el-dialog>

      <!-- 客户预览对话框 -->
      <el-dialog
        title="客户预览"
        v-model="detailVisible"
        width="480px"
        :close-on-click-modal="true"
        @close="onDetailClose"
      >
        <div v-if="detailProduct" class="preview-wrapper">
          <div class="phone-mockup">
            <div class="phone-notch"></div>
            <div class="phone-screen">
              <!-- 产品图片区 -->
              <div class="phone-hero" :style="{ backgroundColor: detailImageUrl ? 'transparent' : (detailProduct.imageColor || '#3B82F6') }">
                <img v-if="detailImageUrl" :src="detailImageUrl" class="phone-hero-img" />
                <el-icon v-else :size="60" color="rgba(255,255,255,0.85)"><Box /></el-icon>
              </div>
              <!-- 产品信息卡 -->
              <div class="phone-info-card">
                <h1 class="phone-product-name">{{ detailProduct.name }}</h1>
                <div class="phone-tags-row">
                  <el-tag size="small" effect="plain">
                    <el-icon style="margin-right:2px"><PriceTag /></el-icon>
                    {{ detailProduct.model }}
                  </el-tag>
                  <el-tag size="small" effect="plain" type="info">
                    <el-icon style="margin-right:2px"><OfficeBuilding /></el-icon>
                    {{ detailProduct.brand }}
                  </el-tag>
                </div>
                <div class="phone-price-row">
                  <span class="phone-price">¥{{ formatPrice(detailProduct.price) }}</span>
                  <el-tag :type="detailProduct.stock === '在售' ? 'success' : 'warning'" size="small" effect="dark">{{ detailProduct.stock }}</el-tag>
                </div>
                <div class="phone-category" v-if="catPathLabel">
                  <el-icon style="margin-right:4px;font-size:12px"><Collection /></el-icon>
                  <span>{{ catPathLabel }}</span>
                </div>
              </div>
              <!-- 产品描述 -->
              <div class="phone-section" v-if="detailProduct.description">
                <div class="phone-section-title">产品描述</div>
                <p class="phone-section-text">{{ detailProduct.description }}</p>
              </div>
              <!-- 产品规格 -->
              <div class="phone-section">
                <div class="phone-section-title">产品规格</div>
                <div class="phone-spec-item">
                  <span class="phone-spec-label">型号</span>
                  <span class="phone-spec-value">{{ detailProduct.model }}</span>
                </div>
                <div class="phone-spec-item">
                  <span class="phone-spec-label">品牌</span>
                  <span class="phone-spec-value">{{ detailProduct.brand }}</span>
                </div>
                <div class="phone-spec-item">
                  <span class="phone-spec-label">分类</span>
                  <span class="phone-spec-value">{{ catPathLabel || '-' }}</span>
                </div>
                <div class="phone-spec-item">
                  <span class="phone-spec-label">销售状态</span>
                  <el-tag :type="detailProduct.stock === '在售' ? 'success' : 'warning'" size="small">{{ detailProduct.stock }}</el-tag>
                </div>
              </div>
              <!-- PDF资料 -->
              <div class="phone-section" v-if="detailProduct.hasPdf">
                <div class="phone-section-title">产品资料</div>
                <el-button type="primary" size="small" style="width:100%;pointer-events:none">
                  <el-icon style="margin-right:4px"><Document /></el-icon> 查看产品资料PDF
                </el-button>
              </div>
              <!-- 底部操作栏模拟 -->
              <div class="phone-bottom-bar">
                <div class="phone-bottom-btn contact-btn">
                  <el-icon><Phone /></el-icon>
                  <span>联系咨询</span>
                </div>
                <div class="phone-bottom-btn back-btn">
                  <el-icon><Goods /></el-icon>
                  <span>返回产品库</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="detailVisible = false">关闭</el-button>
        </template>
      </el-dialog>
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  Goods, Search, Box, View, FolderOpened, PriceTag, OfficeBuilding,
  Collection, Back, Folder, ArrowRight, Document, UploadFilled, Delete,
  Edit, Plus, CircleCheck, Phone, ArrowLeft
} from '@element-plus/icons-vue'
import {
  allProducts, filteredProducts, categoryTree, loading,
  findCategoryById, getCategoryPath, getCategoryLabel,
  getProductsByCategory, getProductsByCategoryPath, getProductById, setSearchKeyword, loadProducts,
  uploadProductPdf,
  collectAllProductIds, addProduct, updateProduct, removeProduct,
  uploadProductImage, getProductImageUrl
} from '../stores/productStore.js'

const ProductCard = {
  name: 'ProductCard',
  props: { product: Object, isAdmin: Boolean, imageUrl: String },
  emits: ['detail', 'edit', 'delete'],
  setup(props, { emit }) {
    const catLabel = computed(() => {
      const path = props.product.categoryPath
      if (path && path.length) return getCategoryLabel(path[path.length - 1])
      return ''
    })
    return { catLabel, Box, View, Edit, Delete }
  },
  template: `
    <div class="product-row" @click="$emit('detail', product)">
      <div class="product-row-img">
        <img v-if="imageUrl" :src="imageUrl" class="row-thumb" />
        <div v-else class="row-thumb-default" :style="{ backgroundColor: product.imageColor || '#409EFF' }">
          <el-icon :size="12" color="#fff"><Box /></el-icon>
        </div>
      </div>
      <span class="product-row-name">{{ product.name }}</span>
      <el-tag :type="product.stock === '在售' ? 'success' : 'warning'" size="small">{{ product.stock }}</el-tag>
      <div class="product-row-actions" @click.stop>
        <el-button type="primary" size="small" link @click="$emit('detail', product)">预览</el-button>
        <el-button v-if="isAdmin" size="small" link @click="$emit('edit', product)">编辑</el-button>
        <el-button v-if="isAdmin" type="danger" size="small" link @click="$emit('delete', product)">删除</el-button>
      </div>
    </div>
  `
}

export default {
  name: 'ProductLibrary',
  components: {
    Goods, Search, Box, View, FolderOpened, PriceTag, OfficeBuilding,
    Collection, Back, Folder, ArrowRight, Document, UploadFilled, Delete,
    Edit, Plus, CircleCheck, Phone, ArrowLeft,
    ProductCard
  },
  setup() {
    const router = useRouter()
    const keyword = ref('')
    const currentCategoryId = ref(null)
    const detailVisible = ref(false)
    const detailProduct = ref(null)
    const detailImageUrl = ref('')
    const currentPage = ref(1)
    const pageSize = ref(8)
    const isMobile = ref(false)

    // 移动端筛选状态
    const selectedL1 = ref(null)
    const selectedL2 = ref(null)
    const selectedL3 = ref(null)
    const mobileKeyword = ref('')

    const formVisible = ref(false)
    const formMode = ref('add')
    const formSaving = ref(false)
    const formRef = ref(null)
    const formRules = {
      name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
      model: [{ required: true, message: '请输入产品型号', trigger: 'blur' }],
      categoryPath: [{ required: true, message: '请选择产品分类', trigger: 'change' }]
    }
    const form = reactive({
      id: '',
      name: '',
      model: '',
      brand: '山善精选',
      price: 0,
      stock: '在售',
      description: '',
      categoryPath: [],
      pdfFile: null,
      imageFile: null,
      imagePreview: ''
    })

    const cascaderOptions = buildCascaderOptions(categoryTree)

    function buildCascaderOptions(tree) {
      return tree.map(node => ({
        id: node.id,
        label: node.label,
        value: node.id,
        children: node.children ? buildCascaderOptions(node.children) : undefined
      }))
    }

    function resetForm() {
      form.id = ''
      form.name = ''
      form.model = ''
      form.brand = '山善精选'
      form.price = 0
      form.stock = '在售'
      form.description = ''
      form.categoryPath = []
      form.pdfFile = null
      form.imageFile = null
      form.imagePreview = ''
    }

    function openAddDialog() {
      formMode.value = 'add'
      resetForm()
      formVisible.value = true
    }

    function openEditDialog(product) {
      formMode.value = 'edit'
      form.id = product.id
      form.name = product.name
      form.model = product.model
      form.brand = product.brand
      form.price = product.price
      form.stock = product.stock
      form.description = product.description
      form.categoryPath = product.categoryPath || []
      form.pdfFile = null
      form.imageFile = null
      form.imagePreview = ''
      formVisible.value = true
    }

    function handleFormPdfChange(file) {
      form.pdfFile = file.raw
    }

    function handleFormImageChange(file) {
      form.imageFile = file.raw
      const reader = new FileReader()
      reader.onload = (e) => {
        form.imagePreview = e.target.result
      }
      reader.readAsDataURL(file.raw)
    }

    async function submitForm() {
      if (formRef.value) {
        try {
          await formRef.value.validate()
        } catch { return }
      }
      formSaving.value = true
      try {
        const data = {
          id: formMode.value === 'add' ? '' : form.id,
          name: form.name,
          model: form.model,
          brand: form.brand,
          price: form.price,
          stock: form.stock,
          description: form.description,
          categoryPath: [...form.categoryPath],
          imageColor: '#3B82F6',
          hasPdf: false,
          hasImage: false
        }
        if (formMode.value === 'add') {
          data.id = ''
          const saved = await addProduct(data)
          if (form.pdfFile) {
            await uploadProductPdf(saved.id, form.pdfFile)
          }
          if (form.imageFile) {
            await uploadProductImage(saved.id, form.imageFile)
          }
          ElMessage.success('产品添加成功')
        } else {
          await updateProduct(form.id, data)
          if (form.pdfFile) {
            await uploadProductPdf(form.id, form.pdfFile)
          }
          if (form.imageFile) {
            await uploadProductImage(form.id, form.imageFile)
          }
          ElMessage.success('产品更新成功')
        }
        formVisible.value = false
        resetForm()
      } catch (e) {
        ElMessage.error('操作失败: ' + (e.message || e))
      }
      formSaving.value = false
    }

    async function handleDeleteProduct(product) {
      try {
        await ElMessageBox.confirm(`确定要删除产品「${product.name}」吗？此操作不可恢复。`, '确认删除', {
          confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning'
        })
      } catch { return }
      try {
        await removeProduct(product.id)
        ElMessage.success('产品已删除')
      } catch (e) {
        ElMessage.error('删除失败')
      }
    }

    const isAdmin = computed(() => {
      try {
        const auth = JSON.parse(localStorage.getItem('staffAuth') || '{}')
        return auth.role === 'admin' || auth.role === 'assistant'
      } catch (e) { return false }
    })

    // ===== PC端逻辑 =====
    const isSearching = computed(() => keyword.value.trim().length > 0)

    const currentCategory = computed(() => {
      if (!currentCategoryId.value) return null
      return findCategoryById(currentCategoryId.value)
    })

    const isLeafCategory = computed(() => {
      const cat = currentCategory.value
      if (!cat) return false
      if (isSearching.value) return false
      return cat.level === 3 || (cat.productIds && !cat.children)
    })

    const breadcrumb = computed(() => {
      if (isSearching.value) return []
      if (!currentCategoryId.value) return []
      return getCategoryPath(currentCategoryId.value)
    })

    const currentCategories = computed(() => {
      if (isSearching.value) return []
      const cat = currentCategory.value
      if (!cat) return categoryTree
      if (cat.children) return cat.children
      return []
    })

    const currentProducts = computed(() => {
      if (isSearching.value) {
        return filteredProducts.value
      }
      if (isLeafCategory.value) {
        return getProductsByCategory(currentCategoryId.value)
      }
      return []
    })

    const pagedProducts = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      return currentProducts.value.slice(start, start + pageSize.value)
    })

    const catPathLabel = computed(() => {
      if (!detailProduct.value?.categoryPath) return ''
      return detailProduct.value.categoryPath.map(id => getCategoryLabel(id)).join(' > ')
    })

    const formatPrice = (val) => {
      if (val >= 10000) return (val / 10000).toFixed(1) + '万'
      return val.toLocaleString('zh-CN')
    }

    const getCatProductCount = (cat) => {
      if (cat.level === 3 || cat.productIds) {
        return (cat.productIds || []).length
      }
      return collectAllProductIds(cat).length
    }

    const onSearch = () => {
      setSearchKeyword(keyword.value)
      currentCategoryId.value = null
      currentPage.value = 1
    }

    const goToCategory = (catId) => {
      keyword.value = ''
      setSearchKeyword('')
      currentCategoryId.value = catId
      currentPage.value = 1
    }

    const onPageChange = () => {
    }

    const showPreview = async (product) => {
      detailProduct.value = product
      detailImageUrl.value = ''
      detailVisible.value = true
      if (product.hasImage) {
        try {
          const url = await getProductImageUrl(product.id)
          if (url) detailImageUrl.value = url
        } catch (e) {}
      }
    }

    const onDetailClose = () => {
      if (detailImageUrl.value) {
        URL.revokeObjectURL(detailImageUrl.value)
        detailImageUrl.value = ''
      }
      detailProduct.value = null
    }

    // ===== 移动端逻辑 =====
    const l2Categories = computed(() => {
      if (!selectedL1.value) return []
      const l1 = findCategoryById(selectedL1.value)
      return l1?.children || []
    })

    const l3Categories = computed(() => {
      if (!selectedL2.value) return []
      const l2 = findCategoryById(selectedL2.value)
      return l2?.children || []
    })

    const mobileFilteredProducts = computed(() => {
      // 搜索优先
      if (mobileKeyword.value.trim()) {
        const kw = mobileKeyword.value.trim().toLowerCase()
        return allProducts.value.filter(p =>
          p.name.toLowerCase().includes(kw) ||
          p.model.toLowerCase().includes(kw) ||
          p.brand.toLowerCase().includes(kw) ||
          p.description.toLowerCase().includes(kw)
        )
      }
      // 按分类路径筛选
      if (!selectedL1.value) return allProducts.value
      return getProductsByCategoryPath(selectedL1.value, selectedL2.value, selectedL3.value)
    })

    function selectL1(catId) {
      selectedL1.value = catId
      selectedL2.value = null
      selectedL3.value = null
    }

    function selectL2(catId) {
      selectedL2.value = catId
      selectedL3.value = null
    }

    function selectL3(catId) {
      selectedL3.value = catId
    }

    function onMobileSearch() {
      // 搜索时清空分类筛选
      if (mobileKeyword.value.trim()) {
        selectedL1.value = null
        selectedL2.value = null
        selectedL3.value = null
      }
    }

    function goToProductDetail(product) {
      router.push('/customer-product-detail?id=' + product.id)
    }

    // ===== 通用 =====
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768
    }

    const goBack = () => {
      router.back()
    }

    const imageUrlMap = reactive({})

    const loadProductImages = async () => {
      const products = allProducts.value
      for (const p of products) {
        if (p.hasImage) {
          try {
            const url = await getProductImageUrl(p.id)
            if (url) imageUrlMap[p.id] = url
          } catch (e) {}
        }
      }
    }

    onMounted(async () => {
      await loadProducts()
      await loadProductImages()
      checkMobile()
      window.addEventListener('resize', checkMobile)
    })

    return {
      keyword, currentCategoryId, detailVisible, detailProduct,
      detailImageUrl, currentPage, pageSize,
      isMobile, isAdmin, isSearching, isLeafCategory,
      breadcrumb, currentCategories, currentProducts, pagedProducts,
      catPathLabel, allProducts, categoryTree, loading,
      formVisible, formMode, formSaving, formRef, formRules, form, cascaderOptions,
      onSearch, goToCategory, onPageChange,
      showPreview, onDetailClose, formatPrice,
      openAddDialog, openEditDialog, handleFormPdfChange,
      submitForm, resetForm, handleDeleteProduct,
      getCatProductCount, goBack, imageUrlMap, handleFormImageChange,
      // 移动端
      selectedL1, selectedL2, selectedL3, mobileKeyword,
      l2Categories, l3Categories, mobileFilteredProducts,
      selectL1, selectL2, selectL3, onMobileSearch,
      goToProductDetail
    }
  }
}
</script>

<style scoped>
.product-library { background: #f0f2f5; min-height: 100vh; }

/* ===== 移动端导航栏 ===== */
.mobile-nav-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; background: #fff;
  border-bottom: 1px solid #ebeef5; position: fixed; top: 0; left: 0; right: 0;
  z-index: 10;
}
.nav-back { display: flex; align-items: center; gap: 4px; color: #409eff; font-size: 14px; }
.nav-title { font-size: 16px; font-weight: 600; color: #303133; }
.nav-placeholder { width: 48px; }

/* ===== 移动端搜索栏 ===== */
.mobile-search-bar {
  padding: 8px 12px; background: #fff;
  position: fixed; top: 49px; left: 0; right: 0; z-index: 9;
}

/* ===== 移动端筛选标签 ===== */
.filter-section {
  padding: 8px 12px 4px; background: #fff;
  position: fixed; top: 97px; left: 0; right: 0; z-index: 8;
  border-bottom: 1px solid #f0f0f0;
}
.filter-row {
  display: flex; align-items: center; gap: 8px;
  overflow-x: auto; white-space: nowrap; flex-wrap: nowrap;
  padding-bottom: 8px;
  -webkit-overflow-scrolling: touch;
}
.filter-row::-webkit-scrollbar { display: none; }
.filter-row { -ms-overflow-style: none; scrollbar-width: none; }

.filter-tag {
  display: inline-block; padding: 5px 14px; border-radius: 16px;
  font-size: 12px; color: #606266; background: #f4f4f5;
  cursor: pointer; flex-shrink: 0; transition: all 0.2s;
  user-select: none;
}
.filter-tag.active {
  background: #409eff; color: #fff;
}

/* ===== 移动端产品列表 ===== */
.product-list-mobile {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 10px; padding: 10px;
  margin-top: 150px; /* 为固定导航+搜索+筛选留空间 */
  min-height: 300px;
}

.product-card-mobile {
  background: #fff; border-radius: 8px; overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  cursor: pointer; transition: transform 0.2s;
}
.product-card-mobile:active {
  transform: scale(0.98);
}

.card-image-mobile {
  height: 120px; display: flex; justify-content: center; align-items: center; overflow: hidden;
}

.card-image-mobile .card-img {
  width: 100%; height: 100%; object-fit: cover;
}

.card-info-mobile {
  padding: 10px;
}

.card-name-mobile {
  font-size: 13px; font-weight: 600; color: #303133;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  margin-bottom: 4px;
}

.card-model-mobile {
  font-size: 11px; color: #909399;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  margin-bottom: 2px;
}

.card-brand-mobile {
  font-size: 11px; color: #909399;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  margin-bottom: 6px;
}

.card-price-row {
  display: flex; align-items: center; justify-content: space-between;
}

.card-price-mobile {
  font-size: 15px; font-weight: 700; color: #e6a23c;
}

.card-pdf-tag {
  display: inline-block; padding: 1px 6px; border-radius: 3px;
  font-size: 10px; color: #fff; background: #67c23a;
  font-weight: 500;
}

/* ===== 移动端空状态 ===== */
.empty-state-mobile {
  grid-column: 1 / -1;
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 0; color: #c0c4cc;
}
.empty-state-mobile p {
  margin-top: 12px; font-size: 14px; color: #909399;
}

/* ===== 移动端整体适配 ===== */
.product-library.is-mobile {
  background: #f5f5f5;
}
.product-library.is-mobile .el-card {
  border-radius: 0; border: none;
}
.product-library.is-mobile .el-card .el-card__header {
  padding: 12px 16px;
}
.product-library.is-mobile .card-header {
  font-size: 14px;
}
.product-library.is-mobile .search-bar {
  flex-direction: column; align-items: stretch;
}
.product-library.is-mobile .search-bar .el-input {
  width: 100% !important;
}

/* ===== PC端样式 ===== */
.card-header {
  display: flex; justify-content: space-between; align-items: center;
  font-weight: 600; font-size: 15px; color: #303133;
}

.card-header-right {
  display: flex; align-items: center; gap: 12px;
}

.product-count { font-size: 13px; color: #909399; font-weight: normal; }

.search-bar {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;
}

.content-area { min-height: 200px; }

.section-label {
  display: flex; align-items: center; gap: 6px; margin-bottom: 16px;
  font-size: 14px; color: #303133; font-weight: 500;
}

.bc-sep { color: #c0c4cc; font-size: 12px; }
.bc-current { color: #409eff; font-size: 13px; }

.category-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
}

.category-card {
  display: flex; align-items: center; gap: 14px;
  padding: 18px 20px; background: #fff; border: 1px solid #ebeef5;
  border-radius: 10px; cursor: pointer; transition: all 0.25s;
}

.category-card:hover {
  box-shadow: 0 4px 14px rgba(0,0,0,0.08);
  border-color: #409eff; transform: translateY(-1px);
}

.cat-icon { color: #409eff; flex-shrink: 0; }
.cat-info { flex: 1; }
.cat-name { font-size: 14px; font-weight: 600; color: #303133; display: block; }
.cat-count { font-size: 12px; color: #909399; margin-top: 2px; }
.cat-arrow { color: #c0c4cc; font-size: 14px; }

/* ===== PC端产品列表（紧凑行式） ===== */
.product-list {
  display: flex; flex-direction: column; gap: 0;
  border: 1px solid #ebeef5; border-radius: 8px; overflow: hidden;
}

.product-list :deep(.product-row) {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; background: #fff;
  cursor: pointer; transition: background 0.2s;
  border-bottom: 1px solid #f5f5f5;
}
.product-list :deep(.product-row:last-child) { border-bottom: none; }
.product-list :deep(.product-row:hover) { background: #f5f7fa; }

.product-list :deep(.product-row-img) { flex-shrink: 0; width: 28px; height: 28px; }
.product-list :deep(.row-thumb) {
  width: 28px; height: 28px; border-radius: 4px; object-fit: cover;
  display: block;
}
.product-list :deep(.row-thumb-default) {
  width: 28px; height: 28px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
}

.product-list :deep(.product-row-name) {
  flex: 1; font-size: 13px; font-weight: 400; color: #303133;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  line-height: 1;
}

.product-list :deep(.product-row-actions) {
  display: flex; align-items: center; gap: 4px; flex-shrink: 0;
}
.product-list :deep(.product-row-actions .el-button) { font-size: 12px; padding: 4px 0; }

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 60px 0; color: #c0c4cc;
}
.empty-state p { margin-top: 12px; font-size: 14px; color: #909399; }

.pagination { display: flex; justify-content: flex-end; }
.mt-4 { margin-top: 16px; }
.mb-4 { margin-bottom: 16px; }

/* ===== 手机预览模拟 ===== */
.preview-wrapper {
  display: flex; justify-content: center;
}

.phone-mockup {
  width: 375px; border: 6px solid #1a1a1a; border-radius: 36px;
  overflow: hidden; background: #f5f5f5;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  position: relative;
}

.phone-notch {
  width: 120px; height: 24px; background: #1a1a1a;
  border-radius: 0 0 16px 16px; margin: 0 auto;
  position: relative; z-index: 2;
}

.phone-screen {
  height: 640px; overflow-y: auto; padding-bottom: 60px;
}

.phone-hero {
  height: 180px; display: flex; align-items: center; justify-content: center;
  position: relative;
}
.phone-hero-img {
  width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;
}

.phone-info-card {
  background: #fff; border-radius: 16px 16px 0 0;
  margin-top: -16px; position: relative; z-index: 1;
  padding: 16px;
}
.phone-product-name {
  font-size: 17px; font-weight: 700; color: #303133;
  margin: 0 0 10px; line-height: 1.4;
}
.phone-tags-row {
  display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap;
}
.phone-price-row {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
}
.phone-price {
  font-size: 20px; font-weight: 700; color: #e6a23c;
}
.phone-category {
  font-size: 12px; color: #909399; display: flex; align-items: center;
}

.phone-section {
  background: #fff; border-radius: 10px; margin: 10px 12px; padding: 12px;
}
.phone-section-title {
  font-size: 14px; font-weight: 600; color: #303133;
  border-left: 3px solid #409eff; padding-left: 8px; margin: 0 0 10px;
}
.phone-section-text {
  font-size: 13px; color: #606266; line-height: 1.7; margin: 0;
}

.phone-spec-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid #f5f5f5;
}
.phone-spec-item:last-child { border-bottom: none; }
.phone-spec-label { font-size: 13px; color: #909399; }
.phone-spec-value { font-size: 13px; color: #303133; font-weight: 500; }

.phone-bottom-bar {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 52px; background: #fff;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.06);
  display: flex; gap: 10px; padding: 0 12px; align-items: center;
}
.phone-bottom-btn {
  flex: 1; height: 38px; border-radius: 8px;
  font-size: 13px; font-weight: 500;
  display: flex; align-items: center; justify-content: center; gap: 4px;
}
.phone-bottom-btn.contact-btn {
  background: #fff; border: 1px solid #409eff; color: #409eff;
}
.phone-bottom-btn.back-btn {
  background: #409eff; color: #fff;
}

/* ===== 表单样式 ===== */
.form-section {
  margin-bottom: 20px; padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}
.form-section:last-child { border-bottom: none; margin-bottom: 0; }

.form-section-title {
  font-size: 14px; font-weight: 600; color: #303133;
  margin-bottom: 16px; padding-left: 10px;
  border-left: 3px solid #409eff;
}

.form-upload-area {
  width: 100%;
}
.form-upload-area :deep(.el-upload) {
  width: 100%;
}
.form-upload-area :deep(.el-upload-dragger) {
  width: 100%; height: 160px; display: flex; align-items: center; justify-content: center;
  border-radius: 8px; padding: 0;
}

.form-upload-placeholder {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.form-upload-placeholder p { margin: 0; font-size: 13px; color: #606266; }
.form-upload-placeholder span { font-size: 11px; color: #c0c4cc; }

.form-upload-preview {
  position: relative; width: 100%; height: 160px;
  display: flex; align-items: center; justify-content: center;
}
.form-preview-img {
  max-width: 100%; max-height: 150px; border-radius: 6px; object-fit: contain;
}
.form-preview-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(0,0,0,0.5); color: #fff; text-align: center;
  font-size: 12px; padding: 4px 0; border-radius: 0 0 8px 8px;
}
.form-pdf-preview {
  flex-direction: column; gap: 4px;
}
.form-pdf-name {
  margin: 0; font-size: 12px; color: #606266;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 200px;
}

@media (max-width: 1400px) {
  .category-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .category-grid { grid-template-columns: 1fr; }
  .search-bar { flex-direction: column; align-items: stretch; }
  .search-bar .el-input { width: 100% !important; }
}
</style>
