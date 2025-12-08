/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "widget",
  icon: "https://github.com/expo.png",
  entitlements: {
    "com.apple.security.application-groups": [
      "group.com.dustindoan.tradecoinskills",
    ],
  },
  //color
  color: "#000000",
  backgroundColor: "#000000",
  borderColor: "#000000",
  borderWidth: 1,
  borderRadius: 10,
  borderStyle: "solid",
  borderOpacity: 1,
});
