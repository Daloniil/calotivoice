import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type HomeTodayJumpConfig = {
  onPress: () => void;
};

type HomeChromeBridgeValue = {
  todayJump: HomeTodayJumpConfig | null;
  setTodayJump: (config: HomeTodayJumpConfig | null) => void;
};

const HomeChromeBridgeContext = createContext<HomeChromeBridgeValue | null>(null);

export function HomeChromeBridgeProvider({ children }: { children: ReactNode }) {
  const [todayJump, setTodayJumpState] = useState<HomeTodayJumpConfig | null>(null);

  const setTodayJump = useCallback((config: HomeTodayJumpConfig | null) => {
    setTodayJumpState(config);
  }, []);

  const value = useMemo(
    () => ({
      todayJump,
      setTodayJump,
    }),
    [todayJump, setTodayJump],
  );

  return <HomeChromeBridgeContext.Provider value={value}>{children}</HomeChromeBridgeContext.Provider>;
}

export function useHomeChromeBridge(): HomeChromeBridgeValue {
  const ctx = useContext(HomeChromeBridgeContext);
  if (!ctx) {
    throw new Error('useHomeChromeBridge must be used within HomeChromeBridgeProvider');
  }
  return ctx;
}

export function useHomeChromeBridgeOptional(): HomeChromeBridgeValue | null {
  return useContext(HomeChromeBridgeContext);
}
