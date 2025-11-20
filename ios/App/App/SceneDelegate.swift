import UIKit
import Capacitor

@available(iOS 13.0, *)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    guard let windowScene = scene as? UIWindowScene else {
      return
    }

    let window = UIWindow(windowScene: windowScene)
    window.rootViewController = UIStoryboard(name: "Main", bundle: nil).instantiateInitialViewController()
    window.makeKeyAndVisible()

    self.window = window

    if let userActivity = connectionOptions.userActivities.first {
      _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity) { _ in }
    }

    if let urlContext = connectionOptions.urlContexts.first {
      _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: urlContext.url, options: [:])
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let urlContext = URLContexts.first else {
      return
    }

    var options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    if let sourceApp = urlContext.options.sourceApplication {
      options[.sourceApplication] = sourceApp
    }
    if let annotation = urlContext.options.annotation {
      options[.annotation] = annotation
    }
    options[.openInPlace] = urlContext.options.openInPlace

    _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: urlContext.url, options: options)
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity) { _ in }
  }
}

