// filepath: /c:/Users/thoma/Mobile/Mobile-R/ios/YourAppName/AppDelegate.m
#import "AppDelegate.h"
#import <GoogleMaps/GoogleMaps.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  [GMSServices provideAPIKey:@"AIzaSyBtLW4mbOZNMU5GZyF502KnybtvteVAwlc"];
  ...
  return YES;
}
@end