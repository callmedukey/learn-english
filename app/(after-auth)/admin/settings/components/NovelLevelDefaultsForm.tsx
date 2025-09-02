import React from "react";

import NovelLevelDefaultsFormClient from "./NovelLevelDefaultsFormClient";
import { getARLevelDefaults } from "../queries/settings-queries";

export default async function NovelLevelDefaultsForm() {
  const arLevels = await getARLevelDefaults();

  return <NovelLevelDefaultsFormClient arLevels={arLevels} />;
}