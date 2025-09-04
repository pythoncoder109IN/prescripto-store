import React, { createContext, useContext, useReducer, useEffect } from 'react'

const AppContext = createContext()

const initialState = {
  user: null,
  isAuthenticated: false,
  cart: [],
  orders: [],
  prescriptions: [],
  loading: false,
  error: null,
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    
    case 'LOGIN':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: true,
        loading: false 
      }
    
    case 'LOGOUT':
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false,
        cart: [],
        orders: [],
        prescriptions: []
      }
    
    case 'ADD_TO_CART':
      const existingItem = state.cart.find(item => item.id === action.payload.id)
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        }
      }
      return { ...state, cart: [...state.cart, action.payload] }
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload)
      }
    
    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      }
    
    case 'CLEAR_CART':
      return { ...state, cart: [] }
    
    case 'ADD_PRESCRIPTION':
      return {
        ...state,
        prescriptions: [...state.prescriptions, action.payload]
      }
    
    case 'ADD_ORDER':
      return {
        ...state,
        orders: [...state.orders, action.payload]
      }
    
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load user data from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('medcare_user')
    const savedCart = localStorage.getItem('medcare_cart')
    
    if (savedUser) {
      dispatch({ type: 'LOGIN', payload: JSON.parse(savedUser) })
    }
    
    if (savedCart) {
      const cart = JSON.parse(savedCart)
      cart.forEach(item => {
        dispatch({ type: 'ADD_TO_CART', payload: item })
      })
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('medcare_cart', JSON.stringify(state.cart))
  }, [state.cart])

  const login = (userData) => {
    localStorage.setItem('medcare_user', JSON.stringify(userData))
    dispatch({ type: 'LOGIN', payload: userData })
  }

  const logout = () => {
    localStorage.removeItem('medcare_user')
    localStorage.removeItem('medcare_cart')
    dispatch({ type: 'LOGOUT' })
  }

  const addToCart = (product, quantity = 1) => {
    dispatch({ 
      type: 'ADD_TO_CART', 
      payload: { ...product, quantity } 
    })
  }

  const removeFromCart = (productId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId })
  }

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      dispatch({ 
        type: 'UPDATE_CART_QUANTITY', 
        payload: { id: productId, quantity } 
      })
    }
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const addPrescription = (prescription) => {
    dispatch({ type: 'ADD_PRESCRIPTION', payload: prescription })
  }

  const addOrder = (order) => {
    dispatch({ type: 'ADD_ORDER', payload: order })
  }

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  const setError = (error) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }

  const value = {
    ...state,
    login,
    logout,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    addPrescription,
    addOrder,
    setLoading,
    setError,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}