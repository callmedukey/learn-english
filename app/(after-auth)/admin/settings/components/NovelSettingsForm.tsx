import React from "react";

import NovelSettingsFormClient from "./NovelSettingsFormClient";
import { getNovelSettings } from "../queries/settings-queries";

export default async function NovelSettingsForm() {
  const settings = await getNovelSettings();

  return <NovelSettingsFormClient initialSettings={settings} />;
}
