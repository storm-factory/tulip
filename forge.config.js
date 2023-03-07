module.exports = {
  packagerConfig: {
    icon: './assets/icons/tulip'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          name: "tulip-roadbook",
          icon: './assets/icons/tulip.png',
        },
      }
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          name: "tulip-roadbook",
          icon: './assets/icons/tulip.png',
        },
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {"icon": "./assets/icons/tulip.icns"},
    },
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: './assets/icons/tulip.ico'
      },
    },
  ],
};
