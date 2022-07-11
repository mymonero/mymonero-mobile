# MyMonero for Mobile

<p align="center">
  <img alt="MyMonero" src="https://user-images.githubusercontent.com/1645428/146000939-b06f8fd3-9ed2-4a5e-bdd6-3981281dde9c.png">
</p>

<p align="center">
  MyMonero for Mobile
</p>

<p align="center">
  <a href="https://snyk.io/test/github/mymonero/mymonero-mobile"><img src="https://snyk.io/test/github/mymonero/mymonero-mobile/badge.svg"></a>
  <a href="https://opensource.org/licenses/BSD-3-Clause"><img src="https://img.shields.io/badge/License-BSD%203--Clause-blue.svg"></a>
</p>

We've taken every precaution to make migration of data from the old iOS app as simple as possible. Nevertheless, we highly recommend ensuring that you back your mnemonic seed phrases up before installing the new iOS application.

## Summary


If you pick up any issues, please report all bugs on Github:
https://github.com/mymonero/mymonero-mobile/issues

This repository contains the source code for the MyMonero mobile applications. The packages on the Apple Store and on Google Play are built from this repository.

## Downloads

Download the latest iOS version from the Apple App Store or from the [Releases tab](https://github.com/mymonero/mymonero-mobile/releases/latest).

Download the latest Android version from the [Play Store](https://play.google.com/store/apps/details?id=com.mymonero.official_android_application) or from the [Releases tab](https://github.com/mymonero/mymonero-mobile/releases/latest).

Developers and pre-release testers who would like to use and work on the app can run it by obtaining the source and running one of the build commands below.

To get set up with the source code, please see **Getting the Source Code** below.

### Where is user data saved?

* Android: The data is encrypted and saved to the Android device using an implementation that leverages AndroidKeyStore and SharedPreferences.
* Web: The data is saved to the browser's local storage.
* iOS: MyMonero uses SwiftKeychainWrapper for persistence.

The plugin MyMonero uses for storage can be found [here](https://www.npmjs.com/package/capacitor-secure-storage-plugin)

#### Data storage warnings: 

* Android API < 18 does not support AndroidKeyStore. Android API < 18 values are stored fallback to being stored as simple base64 encoded strings. 
* Since web browsers don't have an equivalent of Android's secure storage, data is base64-encoded before being stored in the browser's Local Storage.

## Reporting Bugs & Making Feature Requests

If you would like to report an issue or share a feature request, please create a Github [Issue](https://github.com/mymonero/mymonero-mobile/issues) on this project.

If you're reporting a bug, be sure to include all information which we would need to reproduce the issue, such as the operating system and app version on which you saw the bug, and the steps you took, if you can tell. 

Please don't use the Issues tracker for general support or inquiries. You can also [contact us](https://mymonero.com/support) directly.

## Installation

Before installing, [download and install Node.js](https://nodejs.org/en/download/). For Android, you will also need [Android Studio](https://developer.android.com/studio). For iOS, you will need Xcode (available on the Apple App Store).

Clone the repo and install the dependencies.
```bash
git clone https://github.com/mymonero/mymonero-mobile.git
cd mymonero-mobile
```
```bash
npm install
```

To build the app
```bash
npm run build
```

Android: To build the app, run the command below. Android Studio will be opened automatically.
```bash
npm run build-android
```

iOS: To build the app, run the command below. XCode will be opened automatically.
```bash
npm run build-ios
```

To run the app in a web browser, run the following
```bash
npm start
```

This will build and package the web version of the application in the `dist` folder. Once that is done, it will initialise all necessary build files for your Android application. Finally, it will attempt to open the project in Android Studio.  

## Suggested development workflow

As the application is essentially a web application which gets transpiled into Java by Capacitor, rather than transpile and build each time, we do most of our development work by running a server that serves the `dist` folder, and accessing it in Chrome. Barring unusual cases, changes made and tested on Chrome will function properly once transpiled.

When developing in this fashion, one can run a server with hot-reload enabled by using the `npm run watch` command

## Debugging the application

### Android

Should you run into any issues with the transpiled application, you are able to debug the application by making use of Android WebView debugging and the Chrome browser. In order to do so, follow the instructions below: 

1. Add the following code snippet to the app/java/com.mymonero.android/MainActivity.java file inside the `onCreate()` function

```
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
    WebView.setWebContentsDebuggingEnabled(true);
}
```
2. Open Chrome
3. Navigate to chrome://inspect/#devices
4. Under "Remote Target", you should see a WebView titled "WebView in com.mymonero.android"
5. Click "inspect" to open the WebView in DevTools

### iOS

Coming soon

## Building for Production

1. Follow the steps under `Download and Build`.
2. Use Android Studio or/and Xcode to build the project executables

## Contributing

### Testing

Please submit any bugs as Issues unless they have already been reported.

Suggestions and feedback are very welcome!


### Developing

If you have an improvement to the codebase and would like to have your code shipped in the production MyMonero app, please submit a [pull request](https://help.github.com/articles/about-pull-requests/), even if it's still a WIP. We try to credit all contributors in app release notes.

* Merging PRs which involve integrating with any third-party services will require discussion and agreement.  

* We reserve the right to refuse to merge any PRs, such as those which introduce breaking changes.

### Donating

MyMonero Donation Address (XMR): 48yi8KBxh7fdZzwnX2kFCGALRcN1sNjwBHDfd5i9WLAWKs7G9rVbXNnbJTqZhhZCiudVtaMJKrXxmBeBR9kggBXr8X7PxPT

Proceeds from donations are used to fund development, R&D and hosting costs incurred by MyMonero. 

## License and Copyrights

See `LICENSE.txt` for license.

All app source code and assets copyright © 2014-2022 by MyMonero. All rights reserved.

## Acknowledgements

Contributors to each release are credited in release notes.

### Core Contributors

* 💱 `jkarlos` ([Karl Buys](https://github.com/karlbuys)) Lead maintainer; core developer

* 🍕 `Tekkzbadger` ([Devin Pearson](https://github.com/devinpearson)) Maintainer; core developer

* 🦄 `fluffyponyza` ([Riccardo Spagni](https://github.com/fluffypony)) Advisor; MyMonero founder; Monero core team member

* 🏂 `endogenic` ([Paul Shapiro](https://github.com/paulshapiro)) Former core maintainer; MyMonero core contributor

* 😎 `vtnerd` ([Lee Clagett](https://github.com/vtnerd)) Lead back-end developer

* 🍄 `luigi` Monero tech advisor; Main MyMonero JS core crypto contributor

* 🔥 `mds` ([Matt Smith](http://mds.is)) MVP designer

* 🌠 Your name here?

## License and Copyrights

See `LICENSE.txt` for license.

All app source code and assets copyright © 2014-2022 by MyMonero. All rights reserved.