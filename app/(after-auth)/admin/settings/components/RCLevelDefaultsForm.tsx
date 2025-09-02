import React from "react";

import RCLevelDefaultsFormClient from "./RCLevelDefaultsFormClient";
import { getRCLevelDefaults } from "../queries/settings-queries";

export default async function RCLevelDefaultsForm() {
  const rcLevels = await getRCLevelDefaults();

  return <RCLevelDefaultsFormClient rcLevels={rcLevels} />;
}