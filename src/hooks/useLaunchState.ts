import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchLaunchConfig, getLaunchStatus, type LaunchConfigRow } from "@/services/launch";

export function useLaunchState() {
  const [config, setConfig] = useState<LaunchConfigRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const channelNameRef = useRef(`launch-config-stream-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let mounted = true;

    fetchLaunchConfig()
      .then((nextConfig) => {
        if (!mounted) return;
        setConfig(nextConfig);
        setError(null);
      })
      .catch((err: Error) => {
        if (!mounted) return;
        setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const channel = supabase
      .channel(channelNameRef.current)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "launch_config", filter: "id=eq.global" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setConfig(null);
            return;
          }
          setConfig(payload.new as LaunchConfigRow);
          setError(null);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const status = useMemo(() => getLaunchStatus(config, nowMs), [config, nowMs]);

  return {
    ...status,
    loading,
    error,
  };
}
