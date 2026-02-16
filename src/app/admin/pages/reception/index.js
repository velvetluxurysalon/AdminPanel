// Main component export
export { default } from './Reception.jsx';

// Export hooks
export { useReceptionData, useReceptionStates } from './hooks.js';

// Export utilities
export { calculateTotals, filterVisitsByStatus, getStatusBadge } from './utils.js';

// Export handlers
export {
  handleCheckInSuccess,
  handleStartService,
  handleAddItemsClick,
  handleAssignStaff,
  handleAddSelectedItems,
  handleServiceComplete,
  handleReadyForCheckout,
  handleCheckoutClick,
  handleCompletePayment,
  handleRemoveItem
} from './handlers.js';

