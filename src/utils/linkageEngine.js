/**
 * 联动规则引擎
 * 处理表单字段之间的联动逻辑
 */

export class LinkageEngine {
  constructor() {
    this.rules = []
    this.context = {}
    this.listeners = new Map()
  }

  /**
   * 添加联动规则
   * @param {Object} rule - 联动规则
   */
  addRule(rule) {
    this.rules.push({
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      trigger: rule.trigger, // 触发字段
      condition: rule.condition, // 条件表达式
      action: rule.action, // 执行动作
      priority: rule.priority || 0 // 优先级
    })
  }

  /**
   * 移除联动规则
   * @param {string} ruleId - 规则ID
   */
  removeRule(ruleId) {
    const index = this.rules.findIndex(r => r.id === ruleId)
    if (index >= 0) {
      this.rules.splice(index, 1)
    }
  }

  /**
   * 设置上下文数据
   * @param {Object} context - 表单数据上下文
   */
  setContext(context) {
    this.context = { ...context }
  }

  /**
   * 更新字段值
   * @param {string} fieldName - 字段名
   * @param {*} value - 字段值
   */
  setValue(fieldName, value) {
    const oldValue = this.context[fieldName]
    this.context[fieldName] = value
    
    // 触发值变化事件
    this.emit('valueChange', { fieldName, value, oldValue })
    
    // 执行联动规则
    this.executeRules(fieldName)
  }

  /**
   * 评估条件表达式
   * @param {string} condition - 条件表达式
   * @returns {boolean}
   */
  evaluateCondition(condition) {
    if (!condition) return true
    
    // 替换变量引用 {{fieldName}}
    const expr = condition.replace(/\{\{(\w+)\}\}/g, (match, fieldName) => {
      const value = this.context[fieldName]
      if (value === undefined || value === null) return 'null'
      if (typeof value === 'string') return `'${value}'`
      return String(value)
    })
    
    try {
      // 使用 Function 安全地执行表达式
      return new Function('return ' + expr)()
    } catch (e) {
      console.warn('[LinkageEngine] Condition evaluation error:', e)
      return false
    }
  }

  /**
   * 执行联动规则
   * @param {string} triggerField - 触发字段
   */
  executeRules(triggerField) {
    // 筛选相关规则并按优先级排序
    const relevantRules = this.rules
      .filter(rule => rule.trigger === triggerField || rule.trigger === '*')
      .sort((a, b) => b.priority - a.priority)
    
    relevantRules.forEach(rule => {
      const shouldExecute = this.evaluateCondition(rule.condition)
      if (shouldExecute) {
        this.applyAction(rule.action)
      }
    })
  }

  /**
   * 应用动作
   * @param {Object} action - 动作定义
   */
  applyAction(action) {
    switch (action.type) {
      case 'setValue':
        this.context[action.target] = action.value
        this.emit('valueChange', { 
          fieldName: action.target, 
          value: action.value,
          source: 'linkage'
        })
        break
        
      case 'show':
        this.emit('fieldVisibility', { 
          fieldName: action.target, 
          visible: true 
        })
        break
        
      case 'hide':
        this.emit('fieldVisibility', { 
          fieldName: action.target, 
          visible: false 
        })
        break
        
      case 'enable':
        this.emit('fieldDisabled', { 
          fieldName: action.target, 
          disabled: false 
        })
        break
        
      case 'disable':
        this.emit('fieldDisabled', { 
          fieldName: action.target, 
          disabled: true 
        })
        break
        
      case 'setOptions':
        this.emit('fieldOptions', { 
          fieldName: action.target, 
          options: action.options 
        })
        break
        
      case 'setRequired':
        this.emit('fieldRequired', { 
          fieldName: action.target, 
          required: action.required 
        })
        break
        
      case 'clear':
        this.context[action.target] = null
        this.emit('valueChange', { 
          fieldName: action.target, 
          value: null,
          source: 'linkage'
        })
        break
        
      default:
        console.warn('[LinkageEngine] Unknown action type:', action.type)
    }
  }

  /**
   * 注册事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index >= 0) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (e) {
          console.error('[LinkageEngine] Event handler error:', e)
        }
      })
    }
  }

  /**
   * 清除所有规则
   */
  clearRules() {
    this.rules = []
  }

  /**
   * 获取所有规则
   * @returns {Array}
   */
  getRules() {
    return [...this.rules]
  }

  /**
   * 导出规则配置
   * @returns {Array}
   */
  exportRules() {
    return this.rules.map(rule => ({
      trigger: rule.trigger,
      condition: rule.condition,
      action: rule.action,
      priority: rule.priority
    }))
  }

  /**
   * 导入规则配置
   * @param {Array} rules - 规则列表
   */
  importRules(rules) {
    rules.forEach(rule => this.addRule(rule))
  }
}

// 创建单例实例
export const linkageEngine = new LinkageEngine()

// 默认导出
export default LinkageEngine
