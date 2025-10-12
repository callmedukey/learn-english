import React from "react";

import TimeframeConfigClient from "./timeframe-config-client";
import { getBPATimeframes } from "../queries/bpa-admin.query";

// Server component wrapper that fetches data
const TimeframeConfig = async () => {
  const timeframes = await getBPATimeframes();

  return <TimeframeConfigClient timeframes={timeframes} />;
};

export default TimeframeConfig;
