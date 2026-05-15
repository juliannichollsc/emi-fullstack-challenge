// Bonus — Public hook for state catalog consumers.
// Thin wrapper over useStateContext so feature internals stay encapsulated.
import { useStateContext } from '../context/StateContext';

export function useStateCatalog() {
  return useStateContext();
}
