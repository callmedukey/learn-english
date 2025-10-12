import React from "react";

import BPALevelDefaultsFormClient from "./BPALevelDefaultsFormClient";
import { getBPALevelDefaults } from "../queries/settings-queries";

export default async function BPALevelDefaultsForm() {
  const bpaLevels = await getBPALevelDefaults();

  return <BPALevelDefaultsFormClient bpaLevels={bpaLevels} />;
}
