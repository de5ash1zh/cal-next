import { useState, useEffect, useCallback } from 'react'

// Hook to detect mobile devices
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setScreenSize({ width, height })
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return { isMobile, isTablet, screenSize }
}

// Hook for touch gestures
export function useTouchGestures() {
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [swipeDirection, setSwipeDirection] = useState(null)

  const minSwipeDistance = 50

  const onTouchStart = useCallback((e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }, [])

  const onTouchMove = useCallback((e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      setSwipeDirection('left')
    } else if (isRightSwipe) {
      setSwipeDirection('right')
    }

    // Reset after a short delay
    setTimeout(() => {
      setSwipeDirection(null)
    }, 100)
  }, [touchStart, touchEnd])

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swipeDirection,
    isSwiping: !!swipeDirection
  }
}

// Hook for mobile navigation
export function useMobileNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  const openMenu = useCallback(() => setIsMenuOpen(true), [])
  const closeMenu = useCallback(() => setIsMenuOpen(false), [])
  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), [])

  const nextTab = useCallback(() => {
    setActiveTab(prev => prev + 1)
  }, [])

  const prevTab = useCallback(() => {
    setActiveTab(prev => Math.max(0, prev - 1))
  }, [])

  const goToTab = useCallback((index) => {
    setActiveTab(index)
  }, [])

  return {
    isMenuOpen,
    activeTab,
    openMenu,
    closeMenu,
    toggleMenu,
    nextTab,
    prevTab,
    goToTab
  }
}

// Hook for responsive data loading
export function useResponsiveDataLoading() {
  const { isMobile, isTablet } = useMobileDetection()
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isMobile) {
      setPageSize(5)
    } else if (isTablet) {
      setPageSize(8)
    } else {
      setPageSize(12)
    }
  }, [isMobile, isTablet])

  const loadData = useCallback(async (loader, page = 1) => {
    setIsLoading(true)
    try {
      const data = await loader(page, pageSize)
      return data
    } catch (error) {
      console.error('Error loading data:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [pageSize])

  return {
    pageSize,
    isLoading,
    loadData
  }
}

// Hook for mobile-friendly forms
export function useMobileForm() {
  const { isMobile } = useMobileDetection()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})

  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1)
  }, [])

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }, [])

  const goToStep = useCallback((step) => {
    setCurrentStep(step)
  }, [])

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }, [errors])

  const validateStep = useCallback((validationRules) => {
    const stepErrors = {}
    
    Object.keys(validationRules).forEach(field => {
      const value = formData[field]
      const rules = validationRules[field]
      
      if (rules.required && !value) {
        stepErrors[field] = `${field} is required`
      } else if (rules.pattern && !rules.pattern.test(value)) {
        stepErrors[field] = rules.message || `Invalid ${field}`
      } else if (rules.minLength && value.length < rules.minLength) {
        stepErrors[field] = `${field} must be at least ${rules.minLength} characters`
      }
    })

    setErrors(prev => ({ ...prev, ...stepErrors }))
    return Object.keys(stepErrors).length === 0
  }, [formData])

  const submitForm = useCallback(async (submitter) => {
    try {
      const result = await submitter(formData)
      return result
    } catch (error) {
      console.error('Form submission error:', error)
      throw error
    }
  }, [formData])

  return {
    currentStep,
    formData,
    errors,
    isMobile,
    nextStep,
    prevStep,
    goToStep,
    updateField,
    validateStep,
    submitForm,
    setFormData
  }
}

// Hook for mobile-optimized tables
export function useMobileTable() {
  const { isMobile } = useMobileDetection()
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [filters, setFilters] = useState({})
  const [selectedRows, setSelectedRows] = useState([])

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }, [sortField])

  const handleFilter = useCallback((field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const toggleRowSelection = useCallback((id) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    )
  }, [])

  const selectAllRows = useCallback((ids) => {
    setSelectedRows(ids)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedRows([])
  }, [])

  return {
    sortField,
    sortDirection,
    filters,
    selectedRows,
    isMobile,
    handleSort,
    handleFilter,
    clearFilters,
    toggleRowSelection,
    selectAllRows,
    clearSelection
  }
}

// Hook for mobile-optimized modals
export function useMobileModal() {
  const { isMobile } = useMobileDetection()
  const [isOpen, setIsOpen] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [modalData, setModalData] = useState(null)

  const openModal = useCallback((type, data = null) => {
    setModalType(type)
    setModalData(data)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setModalType(null)
    setModalData(null)
  }, [])

  const openModalWithData = useCallback((type, data) => {
    openModal(type, data)
  }, [openModal])

  return {
    isOpen,
    modalType,
    modalData,
    isMobile,
    openModal,
    closeModal,
    openModalWithData
  }
}

// Hook for mobile-optimized search
export function useMobileSearch() {
  const { isMobile } = useMobileDetection()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])

  const performSearch = useCallback(async (searcher, term) => {
    if (!term.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searcher(term)
      setSearchResults(results)
      
      // Add to search history
      if (term && !searchHistory.includes(term)) {
        setSearchHistory(prev => [term, ...prev.slice(0, 9)])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [searchHistory])

  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setSearchResults([])
  }, [])

  const removeFromHistory = useCallback((term) => {
    setSearchHistory(prev => prev.filter(t => t !== term))
  }, [])

  const clearHistory = useCallback(() => {
    setSearchHistory([])
  }, [])

  return {
    searchTerm,
    searchResults,
    isSearching,
    searchHistory,
    isMobile,
    setSearchTerm,
    performSearch,
    clearSearch,
    removeFromHistory,
    clearHistory
  }
}
