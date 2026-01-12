import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

interface NetworkContextValue extends NetworkState {
  /**
   * Check current network status on demand
   */
  refresh: () => Promise<NetworkState>;
}

const NetworkContext = createContext<NetworkContextValue>({
  isConnected: true,
  isInternetReachable: true,
  type: null,
  refresh: async () => ({ isConnected: true, isInternetReachable: true, type: null }),
});

/**
 * Network connectivity provider
 * Monitors device network status and provides hooks for components
 * to react to connectivity changes (e.g., show offline banner, disable purchases)
 */
export function NetworkProvider({ children }: { children: ReactNode }) {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
  });

  const updateNetworkState = useCallback((state: NetInfoState) => {
    setNetworkState({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    });
  }, []);

  const refresh = useCallback(async (): Promise<NetworkState> => {
    const state = await NetInfo.fetch();
    const newState: NetworkState = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    };
    setNetworkState(newState);
    return newState;
  }, []);

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then(updateNetworkState);

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(updateNetworkState);

    return () => unsubscribe();
  }, [updateNetworkState]);

  return (
    <NetworkContext.Provider value={{ ...networkState, refresh }}>
      {children}
    </NetworkContext.Provider>
  );
}

/**
 * Hook to access network connectivity status
 *
 * @example
 * const { isConnected, isInternetReachable } = useNetwork();
 *
 * if (!isConnected) {
 *   return <OfflineBanner />;
 * }
 */
export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}

/**
 * Hook that returns true only when device has confirmed internet access
 * Use this for operations that require actual internet connectivity
 */
export function useIsOnline(): boolean {
  const { isConnected, isInternetReachable } = useNetwork();
  // isInternetReachable can be null while checking, treat as connected
  return isConnected && isInternetReachable !== false;
}
