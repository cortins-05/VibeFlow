const { withAndroidManifest, withAndroidColors, withAndroidStyles } = require('expo/config-plugins');
const path = require('path');
const fs = require('fs');

function buildResourceItem({ name, value }) {
  return { $: { name }, _: value };
}

function setColorItem(itemToAdd, colorFileContentsJSON) {
  if (colorFileContentsJSON.resources?.color) {
    const colorNameExists = colorFileContentsJSON.resources.color.filter((e) => e.$.name === itemToAdd.$.name)[0];
    if (colorNameExists) {
      colorNameExists._ = itemToAdd._;
    } else {
      colorFileContentsJSON.resources.color.push(itemToAdd);
    }
  } else {
    if (!colorFileContentsJSON.resources || typeof colorFileContentsJSON.resources === 'string') {
      colorFileContentsJSON.resources = {};
    }
    colorFileContentsJSON.resources.color = [itemToAdd];
  }
  return colorFileContentsJSON;
}

function addAndroidAutoMetaData(androidManifest) {
  const application = androidManifest.manifest.application[0];
  application.$['android:appCategory'] = 'audio';

  const existing = application['meta-data'] || [];
  const hasCarMeta = existing.some(
    (m) => m.$['android:name'] === 'com.google.android.gms.car.application'
  );
  if (!hasCarMeta) {
    existing.push({
      $: {
        'android:name': 'com.google.android.gms.car.application',
        'android:resource': '@xml/automotive_app_desc',
      },
    });
  }

  const hasColorMeta = existing.some(
    (m) => m.$['android:name'] === 'android.support.MUSIC_NOTIFICATION_CHANNEL_COLOR'
  );
  if (!hasColorMeta) {
    existing.push({
      $: {
        'android:name': 'android.support.MUSIC_NOTIFICATION_CHANNEL_COLOR',
        'android:resource': '@color/notificationColor',
      },
    });
  }

  application['meta-data'] = existing;
  return androidManifest;
}

function ensureAutomotiveXml(platformProjectRoot) {
  const resPath = path.join(platformProjectRoot, 'app/src/main/res');
  const xmlDir = path.join(resPath, 'xml');
  const xmlFile = path.join(xmlDir, 'automotive_app_desc.xml');

  if (!fs.existsSync(xmlDir)) {
    fs.mkdirSync(xmlDir, { recursive: true });
  }

  if (!fs.existsSync(xmlFile)) {
    fs.writeFileSync(
      xmlFile,
      '<?xml version="1.0" encoding="utf-8"?>\n<automotiveApp>\n    <uses name="media" />\n</automotiveApp>\n'
    );
  }
}

module.exports = function withAndroidAuto(config) {
  config = withAndroidManifest(config, (c) => {
    c.modResults = addAndroidAutoMetaData(c.modResults);
    ensureAutomotiveXml(c.modRequest.platformProjectRoot);
    return c;
  });

  config = withAndroidColors(config, (c) => {
    let xml = c.modResults;
    const colorItems = [
      { name: 'notificationColor', value: '#e5ff3a' },
      { name: 'colorAccent', value: '#e5ff3a' },
      { name: 'colorPrimaryDark', value: '#0b0c0b' },
      { name: 'colorSecondary', value: '#3df5e0' },
    ];
    for (const item of colorItems) {
      xml = setColorItem(buildResourceItem(item), xml);
    }
    c.modResults = xml;
    return c;
  });

  config = withAndroidStyles(config, (c) => {
    let xml = c.modResults;
    if (!xml.resources) xml.resources = {};
    if (!xml.resources.style) xml.resources.style = [];

    for (const style of xml.resources.style) {
      if (style.$.name === 'AppTheme') {
        const existingNames = (style.item || []).map((i) => i.$.name);
        const addItems = [
          { name: 'colorPrimaryDark', value: '@color/colorPrimaryDark' },
          { name: 'colorAccent', value: '@color/colorAccent' },
        ];
        for (const item of addItems) {
          if (!existingNames.includes(item.name)) {
            if (!style.item) style.item = [];
            style.item.push(buildResourceItem(item));
          }
        }
      }
    }

    c.modResults = xml;
    return c;
  });

  return config;
};
