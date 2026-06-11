import { markRaw } from 'vue'

/**
 * 字段类型定义
 */
export const FieldCategories = {
  BASIC: 'basic',
  SELECT: 'select',
  BUSINESS: 'business',
  ADVANCED: 'advanced'
}

/**
 * 字段类型元数据
 */
export const FieldTypeMetadata = {
  // 基础类型
  text: {
    code: 'text',
    name: '文本',
    category: FieldCategories.BASIC,
    icon: 'Document',
    description: '单行文本输入',
    defaultConfig: {
      maxLength: 255,
      showWordLimit: true
    }
  },
  textarea: {
    code: 'textarea',
    name: '文本域',
    category: FieldCategories.BASIC,
    icon: 'DocumentCopy',
    description: '多行文本输入',
    defaultConfig: {
      rows: 3,
      maxLength: 2000,
      showWordLimit: true
    }
  },
  number: {
    code: 'number',
    name: '数字',
    category: FieldCategories.BASIC,
    icon: 'Sort',
    description: '数值输入',
    defaultConfig: {
      min: undefined,
      max: undefined,
      precision: 0,
      step: 1
    }
  },
  password: {
    code: 'password',
    name: '密码',
    category: FieldCategories.BASIC,
    icon: 'Lock',
    description: '密码输入',
    defaultConfig: {
      showPassword: true,
      maxLength: 50
    }
  },

  // 选择类型
  select: {
    code: 'select',
    name: '下拉选择',
    category: FieldCategories.SELECT,
    icon: 'ArrowDown',
    description: '单选下拉框',
    defaultConfig: {
      multiple: false,
      filterable: false,
      clearable: true
    }
  },
  multiSelect: {
    code: 'multiSelect',
    name: '多选下拉',
    category: FieldCategories.SELECT,
    icon: 'CircleCheck',
    description: '多选下拉框',
    defaultConfig: {
      multiple: true,
      filterable: true,
      clearable: true,
      collapseTags: true
    }
  },
  radio: {
    code: 'radio',
    name: '单选框',
    category: FieldCategories.SELECT,
    icon: 'Select',
    description: '单选按钮组',
    defaultConfig: {
      buttonStyle: false
    }
  },
  checkbox: {
    code: 'checkbox',
    name: '复选框',
    category: FieldCategories.SELECT,
    icon: 'Checkbox',
    description: '多选复选框',
    defaultConfig: {
      min: undefined,
      max: undefined
    }
  },
  switch: {
    code: 'switch',
    name: '开关',
    category: FieldCategories.SELECT,
    icon: 'SwitchButton',
    description: '布尔值开关',
    defaultConfig: {
      activeText: '',
      inactiveText: ''
    }
  },

  // 时间类型
  date: {
    code: 'date',
    name: '日期',
    category: FieldCategories.BASIC,
    icon: 'Calendar',
    description: '日期选择',
    defaultConfig: {
      format: 'YYYY-MM-DD',
      valueFormat: 'YYYY-MM-DD'
    }
  },
  datetime: {
    code: 'datetime',
    name: '日期时间',
    category: FieldCategories.BASIC,
    icon: 'Clock',
    description: '日期时间选择',
    defaultConfig: {
      format: 'YYYY-MM-DD HH:mm:ss',
      valueFormat: 'YYYY-MM-DD HH:mm:ss'
    }
  },
  time: {
    code: 'time',
    name: '时间',
    category: FieldCategories.BASIC,
    icon: 'Timer',
    description: '时间选择',
    defaultConfig: {
      format: 'HH:mm:ss',
      valueFormat: 'HH:mm:ss'
    }
  },

  // 业务类型
  customerSelector: {
    code: 'customerSelector',
    name: '客户选择',
    category: FieldCategories.BUSINESS,
    icon: 'User',
    description: '选择客户',
    defaultConfig: {
      multiple: false,
      searchable: true
    }
  },
  engineerSelector: {
    code: 'engineerSelector',
    name: '工程师选择',
    category: FieldCategories.BUSINESS,
    icon: 'UserFilled',
    description: '选择工程师',
    defaultConfig: {
      multiple: false,
      searchable: true,
      filterByRole: true
    }
  },
  assetSelector: {
    code: 'assetSelector',
    name: '设备选择',
    category: FieldCategories.BUSINESS,
    icon: 'Box',
    description: '选择设备资产',
    defaultConfig: {
      multiple: false,
      searchable: true,
      showAssetInfo: true
    }
  },
  partsSelector: {
    code: 'partsSelector',
    name: '配件选择',
    category: FieldCategories.BUSINESS,
    icon: 'Goods',
    description: '选择配件',
    defaultConfig: {
      multiple: true,
      showPrice: true,
      showInventory: true
    }
  },
  location: {
    code: 'location',
    name: '位置',
    category: FieldCategories.BUSINESS,
    icon: 'Location',
    description: '地理位置选择',
    defaultConfig: {
      autoLocate: true,
      showMap: true
    }
  },
  signature: {
    code: 'signature',
    name: '电子签名',
    category: FieldCategories.BUSINESS,
    icon: 'EditPen',
    description: '手写签名',
    defaultConfig: {
      width: 400,
      height: 200,
      penColor: '#000000',
      backgroundColor: '#ffffff'
    }
  },
  imageUpload: {
    code: 'imageUpload',
    name: '图片上传',
    category: FieldCategories.BUSINESS,
    icon: 'Picture',
    description: '上传图片',
    defaultConfig: {
      multiple: true,
      maxCount: 9,
      maxSize: 10,
      accept: 'image/*'
    }
  },
  fileUpload: {
    code: 'fileUpload',
    name: '文件上传',
    category: FieldCategories.BUSINESS,
    icon: 'Upload',
    description: '上传文件',
    defaultConfig: {
      multiple: true,
      maxCount: 5,
      maxSize: 50,
      accept: '*'
    }
  },
  rate: {
    code: 'rate',
    name: '评分',
    category: FieldCategories.BUSINESS,
    icon: 'Star',
    description: '星级评分',
    defaultConfig: {
      max: 5,
      allowHalf: true,
      showText: true
    }
  },
  barcodeScan: {
    code: 'barcodeScan',
    name: '条码扫描',
    category: FieldCategories.BUSINESS,
    icon: 'FullScreen',
    description: '扫描条形码/二维码',
    defaultConfig: {
      type: 'all',
      autoFill: true
    }
  },

  // 高级类型
  richText: {
    code: 'richText',
    name: '富文本',
    category: FieldCategories.ADVANCED,
    icon: 'Edit',
    description: '富文本编辑器',
    defaultConfig: {
      toolbar: ['bold', 'italic', 'underline', 'link', 'image'],
      height: 300
    }
  },
  table: {
    code: 'table',
    name: '表格',
    category: FieldCategories.ADVANCED,
    icon: 'Grid',
    description: '动态表格',
    defaultConfig: {
      columns: [],
      minRows: 1,
      maxRows: 100,
      showAddRow: true,
      showDeleteRow: true
    }
  },
  subForm: {
    code: 'subForm',
    name: '子表单',
    category: FieldCategories.ADVANCED,
    icon: 'List',
    description: '嵌套子表单',
    defaultConfig: {
      fields: [],
      multiple: true,
      minCount: 0,
      maxCount: 10
    }
  },
  computed: {
    code: 'computed',
    name: '计算字段',
    category: FieldCategories.ADVANCED,
    icon: 'Grid',
    description: '自动计算值',
    defaultConfig: {
      formula: '',
      precision: 2
    }
  },
  reference: {
    code: 'reference',
    name: '引用字段',
    category: FieldCategories.ADVANCED,
    icon: 'Link',
    description: '引用其他数据',
    defaultConfig: {
      source: '',
      field: '',
      filter: ''
    }
  },
  json: {
    code: 'json',
    name: 'JSON',
    category: FieldCategories.ADVANCED,
    icon: 'Connection',
    description: 'JSON数据',
    defaultConfig: {
      schema: {},
      showEditor: true
    }
  }
}

/**
 * 字段类型注册表
 * 管理所有可用的字段类型及其渲染器
 */
class FieldTypeRegistry {
  constructor() {
    this.types = new Map()
    this.renderers = new Map()
    this.validators = new Map()
    this.initialized = false
  }

  /**
   * 初始化默认字段类型
   */
  init() {
    if (this.initialized) return

    // 注册所有预定义类型
    Object.values(FieldTypeMetadata).forEach(typeDef => {
      this.register(typeDef)
    })

    this.initialized = true
    console.log('[FieldTypeRegistry] Initialized with', this.types.size, 'types')
  }

  /**
   * 注册字段类型
   * @param {Object} typeDef - 类型定义
   */
  register(typeDef) {
    if (!typeDef.code) {
      console.error('[FieldTypeRegistry] Type definition must have a code')
      return
    }

    this.types.set(typeDef.code, {
      ...typeDef,
      _registered: true
    })
  }

  /**
   * 注册字段渲染器
   * @param {string} typeCode - 字段类型编码
   * @param {Object} renderer - 渲染器组件
   */
  registerRenderer(typeCode, renderer) {
    this.renderers.set(typeCode, markRaw(renderer))
  }

  /**
   * 注册字段验证器
   * @param {string} typeCode - 字段类型编码
   * @param {Function} validator - 验证函数
   */
  registerValidator(typeCode, validator) {
    this.validators.set(typeCode, validator)
  }

  /**
   * 获取字段类型定义
   * @param {string} code - 类型编码
   * @returns {Object|null}
   */
  getType(code) {
    return this.types.get(code) || null
  }

  /**
   * 获取字段渲染器
   * @param {string} code - 类型编码
   * @returns {Object|null}
   */
  getRenderer(code) {
    return this.renderers.get(code) || null
  }

  /**
   * 获取字段验证器
   * @param {string} code - 类型编码
   * @returns {Function|null}
   */
  getValidator(code) {
    return this.validators.get(code) || null
  }

  /**
   * 获取所有字段类型
   * @returns {Array}
   */
  getAllTypes() {
    return Array.from(this.types.values())
  }

  /**
   * 按分类获取字段类型
   * @param {string} category - 分类编码
   * @returns {Array}
   */
  getTypesByCategory(category) {
    return this.getAllTypes().filter(type => type.category === category)
  }

  /**
   * 获取所有分类
   * @returns {Array}
   */
  getCategories() {
    const categories = [
      { code: FieldCategories.BASIC, name: '基础字段', icon: 'Document' },
      { code: FieldCategories.SELECT, name: '选择字段', icon: 'ArrowDown' },
      { code: FieldCategories.BUSINESS, name: '业务字段', icon: 'Briefcase' },
      { code: FieldCategories.ADVANCED, name: '高级字段', icon: 'MagicStick' }
    ]
    return categories
  }

  /**
   * 检查类型是否存在
   * @param {string} code - 类型编码
   * @returns {boolean}
   */
  hasType(code) {
    return this.types.has(code)
  }

  /**
   * 获取类型的默认配置
   * @param {string} code - 类型编码
   * @returns {Object}
   */
  getDefaultConfig(code) {
    const type = this.getType(code)
    return type?.defaultConfig || {}
  }

  /**
   * 创建字段配置
   * @param {string} typeCode - 类型编码
   * @param {Object} overrides - 覆盖配置
   * @returns {Object}
   */
  createFieldConfig(typeCode, overrides = {}) {
    const type = this.getType(typeCode)
    if (!type) {
      throw new Error(`Unknown field type: ${typeCode}`)
    }

    return {
      type: typeCode,
      ...type.defaultConfig,
      ...overrides
    }
  }

  /**
   * 注销字段类型
   * @param {string} code - 类型编码
   */
  unregister(code) {
    this.types.delete(code)
    this.renderers.delete(code)
    this.validators.delete(code)
  }
}

// 创建单例实例
export const fieldTypeRegistry = new FieldTypeRegistry()

// 默认导出
export default fieldTypeRegistry
