/* La app se juega en horizontal (mitad mapa, mitad menú): fija la orientación apaisada en los proyectos
   nativos que crea Capacitor. Android: android:screenOrientation="sensorLandscape" en la actividad
   (gira según cómo se sostenga, pero siempre apaisada). iOS: solo orientaciones horizontales en Info.plist.
   Lo llaman los scripts «android» e «ios» de package.json tras `npx cap add`. */
const fs = require("fs");
const path = require("path");
const man = path.join(__dirname, "android", "app", "src", "main", "AndroidManifest.xml");
if (fs.existsSync(man)) {
  let s = fs.readFileSync(man, "utf8");
  if (!/screenOrientation=/.test(s)) s = s.replace(/<activity\b/, '<activity android:screenOrientation="sensorLandscape"');
  else s = s.replace(/android:screenOrientation="[^"]*"/, 'android:screenOrientation="sensorLandscape"');
  fs.writeFileSync(man, s);
  console.log("Android: orientación horizontal");
}
const plist = path.join(__dirname, "ios", "App", "App", "Info.plist");
if (fs.existsSync(plist)) {
  let s = fs.readFileSync(plist, "utf8");
  const ori = "<array>\n\t\t<string>UIInterfaceOrientationLandscapeLeft</string>\n\t\t<string>UIInterfaceOrientationLandscapeRight</string>\n\t</array>";
  for (const k of ["UISupportedInterfaceOrientations", "UISupportedInterfaceOrientations~ipad"]) {
    const re = new RegExp(`(<key>${k.replace("~", "~")}</key>\\s*)<array>[\\s\\S]*?</array>`);
    if (re.test(s)) s = s.replace(re, `$1${ori}`);
    else s = s.replace(/<dict>/, `<dict>\n\t<key>${k}</key>\n\t${ori}`);
  }
  fs.writeFileSync(plist, s);
  console.log("iOS: orientación horizontal");
}
