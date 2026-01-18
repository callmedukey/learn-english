const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Config plugin to add use_modular_headers! to the Podfile
 * Required for Firebase Swift pods to work with static libraries
 */
function withModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );

      let podfileContent = fs.readFileSync(podfilePath, "utf8");

      // Add use_modular_headers! after the platform line if not already present
      if (!podfileContent.includes("use_modular_headers!")) {
        podfileContent = podfileContent.replace(
          /(platform :ios.*\n)/,
          "$1\n# Required for Firebase Swift pods\nuse_modular_headers!\n"
        );
        fs.writeFileSync(podfilePath, podfileContent);
      }

      return config;
    },
  ]);
}

module.exports = withModularHeaders;
