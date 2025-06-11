import React from "react";

import RCSettingsFormClient from "./RCSettingsFormClient";
import { getRCSettings } from "../queries/settings-queries";

export default async function RCSettingsForm() {
  const settings = await getRCSettings();

  return <RCSettingsFormClient initialSettings={settings} />;
}
