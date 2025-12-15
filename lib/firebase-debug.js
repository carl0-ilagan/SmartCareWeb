// Firebase debugging utilities

/**
 * Logs Firebase errors with more context
 * @param {Error} error - The Firebase error
 * @param {string} operation - What operation was being performed
 * @param {string} collection - Which collection was being accessed
 */
export function logFirebaseError(error, operation, collection) {
    console.error(`Firebase ${operation} error on ${collection}:`, error)
  
    // Check for specific error codes
    if (error.code === "permission-denied") {
      console.error("PERMISSION DENIED: This is likely a Firebase security rules issue.")
      console.error("Try these steps:")
      console.error("1. Check if you are properly authenticated")
      console.error("2. Verify your user has the correct role/permissions")
      console.error("3. Check the Firestore rules in the Firebase console")
      console.error("4. For development, consider using more permissive rules temporarily")
    }
  
    if (error.code === "unauthenticated") {
      console.error("UNAUTHENTICATED: You need to be logged in to perform this operation.")
    }
  
    return error
  }
  
  /**
   * Wraps a Firebase operation with error handling
   * @param {Function} operation - The Firebase operation to perform
   * @param {string} operationName - Name of the operation for logging
   * @param {string} collectionName - Name of the collection being accessed
   * @returns {Promise} - The result of the operation or throws an error
   */
  export async function withFirebaseErrorHandling(operation, operationName, collectionName) {
    try {
      return await operation()
    } catch (error) {
      logFirebaseError(error, operationName, collectionName)
      throw error
    }
  }
  