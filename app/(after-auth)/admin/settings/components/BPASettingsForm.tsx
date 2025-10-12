import React from "react";

import BPASettingsFormClient from "./BPASettingsFormClient";
import { getBPASettings } from "../queries/settings-queries";

export default async function BPASettingsForm() {
  const settings = await getBPASettings();

  return <BPASettingsFormClient initialSettings={settings} />;
}
