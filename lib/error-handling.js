/**
 * Safely executes a Firebase operation with proper error handling
 * @param {Function} operation - The Firebase operation to execute
 * @param {Object} options - Options for error handling
 * @returns {Promise<any>} - The result of the operation or null if it fails
 */
export const safeFirebaseOperation = async (operation, options = {}) => {
  const { fallbackValue = null, logError = true, errorMessage = "Firebase operation failed" } = options

  try {
    return await operation()
  } catch (error) {
    if (logError) {
      console.error(errorMessage, error)
    }

    // Handle specific Firebase errors
    if (error.code === "permission-denied") {
      console.warn("Firebase permission denied. User may be logged out or lacks permissions.")
    }

    return fallbackValue
  }
}

/**
 * Creates a safe unsubscribe function that won't throw errors
 * @param {Function} unsubscribeFunction - The original unsubscribe function
 * @returns {Function} - A safe unsubscribe function
 */
export const createSafeUnsubscribe = (unsubscribeFunction) => {
  return () => {
    try {
      if (typeof unsubscribeFunction === "function") {
        unsubscribeFunction()
      }
    } catch (error) {
      console.warn("Error during unsubscribe:", error)
    }
  }
}

/**
 * Checks if a user is authenticated before performing an operation
 * @param {Object} user - The user object
 * @param {Function} operation - The operation to perform if user is authenticated
 * @param {any} fallbackValue - The value to return if user is not authenticated
 * @returns {any} - The result of the operation or fallback value
 */
export const withAuthentication = (user, operation, fallbackValue = null) => {
  if (!user || !user.uid) {
    console.warn("Operation attempted without authentication")
    return fallbackValue
  }

  return operation(user)
}
