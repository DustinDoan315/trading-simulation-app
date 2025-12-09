/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: "widget",
  icon: 'https://github.com/expo.png',
  entitlements: {
    "com.apple.security.application-groups": ["group.com.dustin-widget.shared"],
  },
  frameworks: ["SwiftUI", "ActivityKit"],
  backgroundColor: "blue",
});