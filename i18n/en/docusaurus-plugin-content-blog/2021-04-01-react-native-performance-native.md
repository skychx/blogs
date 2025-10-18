---
slug: react-native-performance-native
title: ⚡️ React Native Startup Speed Optimization - Native Chapter (Including Source Code Analysis)
authors: skychx

description: From React Native startup to the first page render completion, combining React Native source code and the new 1.0 architecture, analyzing React Native's startup performance optimization path step by step
draft: false
tags: [react native, cross-platform development, performance optimization]
---

Web development has a classic question: "**What happens from entering a URL to page rendering in the browser?**"

According to my research, this question has at least **ten years** of history. In the ever-changing, hard-to-learn frontend circle, this question continues to be asked because it's a very good question involving many knowledge points. When doing some performance optimization, you can start from this question, analyze performance bottlenecks, and then optimize accordingly.

But today we're not talking about Web performance optimization. Just borrowing the analysis approach of that classic question, **from React Native startup to the first page render completion, combining React Native source code and the new 1.0 architecture, explore React Native's startup performance optimization path**.

{/* truncate */



:::note Reading Reminder
1. The source code content in the article is from RN version 0.64

2. The source code analysis involves four languages: `Objective-C`, `Java`, `C++`, and `JavaScript`. I try to explain it as simply as possible. If you really don't understand, you can directly read the conclusions
:::

## 0. React Native Startup Process

As a Web frontend-friendly hybrid development framework, React Native startup can be roughly divided into two parts:

- Native container runtime
- JavaScript code runtime

Among these, Native container startup in the existing architecture (version number less than 1.0.0) can be roughly divided into 3 parts:

- Native container initialization
- **Full** binding of Native Modules
- JSEngine initialization

After container initialization, the stage is handed over to JavaScript. The process can be subdivided into 2 parts:

- JavaScript code loading, parsing, and execution
- React scheduling and execution (such as Fiber construction)

Finally, the JS Thread sends the calculated layout information to the Native side, calculates the Shadow Tree, and finally the UI Thread performs layout and rendering.

:::note Article Navigation
For rendering performance optimization, you can refer to my previously written ["React Native Performance Optimization Guide"](https://supercodepower.com/react_native_performance_optimization_guides). I introduced common RN rendering optimization patterns from **rendering**, **images**, **animations**, **long lists**, and other directions. Interested readers can go check it out, so I won't introduce it much here.
:::

The above steps, I drew a diagram. Below I'll use this diagram as a directory to introduce the optimization directions of each step from left to right:

![](https://image-1255652541.file.myqcloud.com/uPic/rn_start_all.jpg)

:::note Tip
During React Native initialization, multiple tasks may execute **in parallel**, so the above diagram can only represent the general flow of React Native initialization and doesn't correspond one-to-one with the actual code execution sequence.
:::

## 1. Upgrade React Native

To improve React Native application performance, the most once-and-for-all method is to **upgrade the RN major version**. After our application was upgraded from 0.59 to 0.62, without doing any performance optimization work, our APP's startup time was directly shortened by 1/2. When React Native's new architecture is released, startup speed and rendering speed will be greatly enhanced.

Of course, RN version upgrades are not easy (spanning iOS, Android, JS three ends, compatible with breaking updates). I previously wrote an article ["React Native Upgrade Guide (0.59 -> 0.62)"](https://supercodepower.com/docs/react-native-upgrade/index). Friends with upgrade ideas can read and refer to it.

## 2. Native Container Initialization

![](https://image-1255652541.file.myqcloud.com/uPic/rn_start_native.jpg)

Container initialization definitely starts with the APP's entry file. Below I'll **select some key code** to sort out the initialization flow.

### iOS Source Code Analysis

#### 1. AppDelegate.m

`AppDelegate.m` is the iOS entry file with very concise code. The main content is as follows:

```objectivec
// AppDelegate.m

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  // 1. Initialize a RCTBridge to implement the method of loading jsbundle
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];

  // 2. Use RCTBridge to initialize a RCTRootView
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"RN64"
                                            initialProperties:nil];

  // 3. Initialize UIViewController
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];

  // 4. Assign RCTRootView to UIViewController's view
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}
```

Overall, the entry file does three things:

- Initialize a `RCTBridge` to implement the method of loading jsbundle
- Use `RCTBridge` to initialize a `RCTRootView`
- Assign `RCTRootView` to `UIViewController`'s view to implement UI mounting

From the entry source code, we can find that all initialization work **points to** `RCTRootView`, so let's see what `RCTRootView` does.

#### 2. RCTRootView

Let's first look at the header file of `RCTRootView`. Simplifying, we only look at some methods we care about:

```objectivec
// RCTRootView.h

@interface RCTRootView : UIView

// Initialization method used in AppDelegate.m
- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(nullable NSDictionary *)initialProperties NS_DESIGNATED_INITIALIZER;
```

From the header file, we can see:

- `RCTRootView` inherits from `UIView`, so it's essentially a UI component;
- When `RCTRootView` calls `initWithBridge` for initialization, it needs to pass in an already initialized `RCTBridge`

In the `RCTRootView.m` file, when `initWithBridge` initializes, it will listen to a series of JS loading listener functions. When it detects that the JS Bundle file has finished loading, it will call `AppRegistry.runApplication()` in JS to start the RN application.

After analyzing this, we find that `RCTRootView.m` only implements various event listeners for `RCTBridge`, **it's not the core of initialization**, so we need to turn to the `RCTBridge` file again.

#### 3. RCTBridge.m

In `RCTBridge.m`, the initialization call path is quite long. Posting all the source code would be too lengthy. In summary, it finally calls `(void)setUp`, with core code as follows:

```objectivec
- (Class)bridgeClass
{
  return [RCTCxxBridge class];
}

- (void)setUp {
  // Get bridgeClass, which defaults to RCTCxxBridge
  Class bridgeClass = self.bridgeClass;
  // Initialize RTCxxBridge
  self.batchedBridge = [[bridgeClass alloc] initWithParentBridge:self];
  // Start RTCxxBridge
  [self.batchedBridge start];
}
```

We can see that `RCTBridge` initialization again points to `RTCxxBridge`.

#### 4. RTCxxBridge.mm

`RTCxxBridge` can be said to be the **core** of React Native initialization. I checked some materials, and it seems `RTCxxBridge` was formerly known as `RCTBatchedBridge`, so we can roughly treat these two classes as the same thing.

Because `start` method of `RTCxxBridge` is called in `RCTBridge`, let's see what's done from the `start` method.

```objectivec
// RTCxxBridge.mm

- (void)start {
  // 1. Initialize JSThread, all subsequent js code will be executed in this thread
  _jsThread = [[NSThread alloc] initWithTarget:[self class] selector:@selector(runRunLoop) object:nil];
  [_jsThread start];

  // Create concurrent queue
  dispatch_group_t prepareBridge = dispatch_group_create();

  // 2. Register all native modules
  [self registerExtraModules];
  (void)[self _initializeModules:RCTGetModuleClasses() withDispatchGroup:prepareBridge lazilyDiscovered:NO];

  // 3. Initialize JSExecutorFactory instance
  std::shared_ptr<JSExecutorFactory> executorFactory;

  // 4. Initialize the underlying Instance instance, which is _reactInstance
  dispatch_group_enter(prepareBridge);
  [self ensureOnJavaScriptThread:^{
    [weakSelf _initializeBridge:executorFactory];
    dispatch_group_leave(prepareBridge);
  }];

  // 5. Load js code
  dispatch_group_enter(prepareBridge);
  __block NSData *sourceCode;
  [self
      loadSource:^(NSError *error, RCTSource *source) {
        if (error) {
          [weakSelf handleError:error];
        }

        sourceCode = source.data;
        dispatch_group_leave(prepareBridge);
      }
      onProgress:^(RCTLoadingProgress *progressData) {
      }
  ];

  // 6. After native modules and JS code are loaded, execute JS
  dispatch_group_notify(prepareBridge, dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
    RCTCxxBridge *strongSelf = weakSelf;
    if (sourceCode && strongSelf.loading) {
      [strongSelf executeSourceCode:sourceCode sync:NO];
    }
  });
}
```

The above code is quite long and uses some knowledge points of **GCD multithreading**. Described in text, the general flow is as follows:

1. Initialize js thread `_jsThread`
2. Register all `native modules` on the main thread
3. Prepare the bridge between `js` and `Native` and js runtime environment
4. Create message queue `RCTMessageThread` on JS thread, initialize `_reactInstance`
5. Load JS Bundle on JS thread
6. After all the above is done, execute JS code

Actually, each of the above six points can be explored further, but the source code content covered in this section is sufficient here. Interested readers can combine the reference materials I provide at the end and React Native source code for deeper exploration.

### Android Source Code Analysis

#### 1. MainActivity.java & MainApplication.java

Like iOS, for the startup process, we start analyzing from the entry file. Let's first look at `MainActivity.java`:

`MainActivity` inherits from `ReactActivity`, which inherits from `AppCompatActivity`:

```java
// MainActivity.java

public class MainActivity extends ReactActivity {
  // Return component name, consistent with js entry registration name
  @Override
  protected String getMainComponentName() {
    return "rn_performance_demo";
  }
}
```

Let's analyze from Android's entry file `MainApplication.java`:

```java
// MainApplication.java

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHost(this) {
        // Return ReactPackages needed by the app, add modules that need to be loaded,
        // This is where we need to add third-party packages when adding dependencies in our projects
        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          return packages;
        }

        // js bundle entry file, set to index.js
        @Override
        protected String getJSMainModuleName() {
          return "index";
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    // SoLoader: Load C++ underlying libraries
    SoLoader.init(this, /* native exopackage */ false);
  }
}
```

The `ReactApplication` interface is very simple, requiring us to create a `ReactNativeHost` object:

```java
public interface ReactApplication {
  ReactNativeHost getReactNativeHost();
}
```

From the above analysis, we can see everything points to the `ReactNativeHost` class. Let's look at it next.

#### 2. ReactNativeHost.java

`ReactNativeHost`'s main job is creating `ReactInstanceManager`:

```java
public abstract class ReactNativeHost {
  protected ReactInstanceManager createReactInstanceManager() {
    ReactMarker.logMarker(ReactMarkerConstants.BUILD_REACT_INSTANCE_MANAGER_START);
    ReactInstanceManagerBuilder builder =
        ReactInstanceManager.builder()
            // Application context
            .setApplication(mApplication)
            // JSMainModulePath is equivalent to the app's homepage js Bundle, can pass url to fetch js Bundle from server
            // Of course, this can only be used in dev mode
            .setJSMainModulePath(getJSMainModuleName())
            // Whether to enable dev mode
            .setUseDeveloperSupport(getUseDeveloperSupport())
            // Red box callback
            .setRedBoxHandler(getRedBoxHandler())
            .setJavaScriptExecutorFactory(getJavaScriptExecutorFactory())
            .setUIImplementationProvider(getUIImplementationProvider())
            .setJSIModulesPackage(getJSIModulePackage())
            .setInitialLifecycleState(LifecycleState.BEFORE_CREATE);

    // Add ReactPackage
    for (ReactPackage reactPackage : getPackages()) {
      builder.addPackage(reactPackage);
    }

    // Get js Bundle loading path
    String jsBundleFile = getJSBundleFile();
    if (jsBundleFile != null) {
      builder.setJSBundleFile(jsBundleFile);
    } else {
      builder.setBundleAssetName(Assertions.assertNotNull(getBundleAssetName()));
    }
    ReactInstanceManager reactInstanceManager = builder.build();
    return reactInstanceManager;
  }
}
```

#### 3. ReactActivityDelegate.java

Let's go back to `ReactActivity`. It doesn't do much itself; all functionality is handled by its delegate class `ReactActivityDelegate`, so let's directly see how `ReactActivityDelegate` is implemented:

```java
public class ReactActivityDelegate {
  protected void onCreate(Bundle savedInstanceState) {
    String mainComponentName = getMainComponentName();
    mReactDelegate =
        new ReactDelegate(
            getPlainActivity(), getReactNativeHost(), mainComponentName, getLaunchOptions()) {
          @Override
          protected ReactRootView createRootView() {
            return ReactActivityDelegate.this.createRootView();
          }
        };
    if (mMainComponentName != null) {
      // Load app page
      loadApp(mainComponentName);
    }
  }

  protected void loadApp(String appKey) {
    mReactDelegate.loadApp(appKey);
    // Activity's setContentView() method
    getPlainActivity().setContentView(mReactDelegate.getReactRootView());
  }
}
```

When `onCreate()` is called, it instantiates another `ReactDelegate`. Let's look at its implementation.

#### 4. ReactDelegate.java

In `ReactDelegate.java`, I see it does two things:

- Create `ReactRootView` as the root view
- Call `getReactNativeHost().getReactInstanceManager()` to start the RN application

```java
public class ReactDelegate {
  public void loadApp(String appKey) {
    if (mReactRootView != null) {
      throw new IllegalStateException("Cannot loadApp while app is already running.");
    }
    // Create ReactRootView as the root view
    mReactRootView = createRootView();
    // Start RN application
    mReactRootView.startReactApplication(
        getReactNativeHost().getReactInstanceManager(), appKey, mLaunchOptions);
  }
}
```

The basic startup process involving source code is sufficient for this section. Interested readers can combine the reference materials I provide at the end and React Native source code for deeper exploration.

### Optimization Suggestions

For applications where React Native is the main body, the APP needs to initialize the RN container immediately after startup. At this time, you can add a splash screen, wait for React Native initialization to complete, and then hide the splash screen; for hybrid development APPs where Native is the main body, we can try the following approach:

**Since initialization takes the longest time, why not initialize it in advance before officially entering the React Native container?**

This method is very common because many H5 containers do the same thing. Before officially entering the WebView webpage, first create a WebView container pool, initialize WebView in advance, and after entering the H5 container, directly load data and render to achieve instant webpage opening.

The concept of **RN container pool** looks mysterious, but it's actually just a `Map`, where the `key` is the RN page's `componentName` (i.e., the `appName` passed in `AppRegistry.registerComponent(appName, Component)`), and the `value` is an already instantiated `RCTRootView/ReactRootView`.

After the APP starts, find a trigger to initialize in advance. Before entering the RN container, first read the container pool. If there's a matching container, use it directly. If there's no match, reinitialize.

Write two simple examples. For iOS, you can build an RN container pool as shown below:

```objectivec
@property (nonatomic, strong) NSMutableDictionary<NSString *, RCTRootView *> *rootViewRool;

// Container pool
-(NSMutableDictionary<NSString *, RCTRootView *> *)rootViewRool {
  if (!_rootViewRool) {
    _rootViewRool = @{}.mutableCopy;
  }

  return _rootViewRool;
}


// Cache RCTRootView
-(void)cacheRootView:(NSString *)componentName path:(NSString *)path props:(NSDictionary *)props bridge:(RCTBridge *)bridge {
  // Initialize
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:componentName
                                            initialProperties:props];
  // After instantiation, it must be loaded to the bottom of the screen, otherwise it cannot trigger view rendering
  [[UIApplication sharedApplication].keyWindow.rootViewController.view insertSubview:rootView atIndex:0];
  rootView.frame = [UIScreen mainScreen].bounds;

  // Put the cached RCTRootView into the container pool
  NSString *key = [NSString stringWithFormat:@"%@_%@", componentName, path];
  self.rootViewRool[key] = rootView;
}


// Read container
-(RCTRootView *)getRootView:(NSString *)componentName path:(NSString *)path props:(NSDictionary *)props bridge:(RCTBridge *)bridge {
  NSString *key = [NSString stringWithFormat:@"%@_%@", componentName, path];
  RCTRootView *rootView = self.rootViewRool[key];
  if (rootView) {
    return rootView;
  }

  // Fallback logic
  return [[RCTRootView alloc] initWithBridge:bridge moduleName:componentName initialProperties:props];
}
```

For Android, build the RN container pool as follows:

```java
private HashMap<String, ReactRootView> rootViewPool = new HashMap<>();

// Create container
private ReactRootView createRootView(String componentName, String path, Bundle props, Context context) {
    ReactInstanceManager bridgeInstance = ((ReactApplication) application).getReactNativeHost().getReactInstanceManager();
    ReactRootView rootView = new ReactRootView(context);

    if(props == null) {
        props = new Bundle();
    }
    props.putString("path", path);

    rootView.startReactApplication(bridgeInstance, componentName, props);

    return rootView;
}

// Cache container
public void cahceRootView(String componentName, String path, Bundle props, Context context) {
    ReactRootView rootView = createRootView(componentName, path, props, context);
    String key = componentName + "_" + path;

    // Put the cached RCTRootView into the container pool
    rootViewPool.put(key, rootView);
}

// Read container
public ReactRootView getRootView(String componentName, String path, Bundle props, Context context) {
    String key = componentName + "_" + path;
    ReactRootView rootView = rootViewPool.get(key);

    if (rootView != null) {
        rootView.setAppProperties(newProps);
        rootViewPool.remove(key);
        return rootView;
    }

    // Fallback logic
    return createRootView(componentName, path, props, context);
}
```

Of course, because each `RCTRootView/ReactRootView` occupies a certain amount of memory, when to instantiate, how many containers to instantiate, pool size limits, and when to clear containers all need to be combined with business practice and exploration.

## 3. Native Modules Binding

![](https://image-1255652541.file.myqcloud.com/uPic/rn_start_nativeModules.jpg)

### iOS Source Code Analysis

iOS Native Modules have 3 parts, with the main part being the middle `_initializeModules` function:

```objectivec
// RCTCxxBridge.mm

- (void)start {
  // Initialize RCTBridge and call the moduleProvider returned in initWithBundleURL_moduleProvider_launchOptions to get native modules
  [self registerExtraModules];

  // Register all custom Native Modules
  (void)[self _initializeModules:RCTGetModuleClasses() withDispatchGroup:prepareBridge lazilyDiscovered:NO];

  // Initialize all lazy-loading native modules, only called when using Chrome debug
  [self registerExtraLazyModules];
}
```

Let's see what the `_initializeModules` function does:

```objectivec
// RCTCxxBridge.mm

- (NSArray<RCTModuleData *> *)_initializeModules:(NSArray<Class> *)modules
                               withDispatchGroup:(dispatch_group_t)dispatchGroup
                                lazilyDiscovered:(BOOL)lazilyDiscovered
{
    for (RCTModuleData *moduleData in _moduleDataByID) {
      if (moduleData.hasInstance && (!moduleData.requiresMainQueueSetup || RCTIsMainQueue())) {
        // Modules that were pre-initialized should ideally be set up before
        // bridge init has finished, otherwise the caller may try to access the
        // module directly rather than via `[bridge moduleForClass:]`, which won't
        // trigger the lazy initialization process. If the module cannot safely be
        // set up on the current thread, it will instead be async dispatched
        // to the main thread to be set up in _prepareModulesWithDispatchGroup:.
        (void)[moduleData instance];
      }
    }
    _moduleSetupComplete = YES;
    [self _prepareModulesWithDispatchGroup:dispatchGroup];
}
```

According to the comments of `_initializeModules` and `_prepareModulesWithDispatchGroup`, we can see that during JS Bundle loading (performed on the **JSThread**), iOS initializes all Native Modules on the **main thread** at the same time.

Combined with the previous source code analysis, we can see that when React Native iOS container initializes, it will **initialize all Native Modules**. If `Native Modules` are numerous, it will affect the startup time of the iOS RN container.

### Android Source Code Analysis

Regarding Native Module registration, `MainApplication.java` the entry file already gives clues:

```java
// MainApplication.java

protected List<ReactPackage> getPackages() {
  @SuppressWarnings("UnnecessaryLocalVariable")
  List<ReactPackage> packages = new PackageList(this).getPackages();
  // Packages that cannot be autolinked yet can be added manually here, for example:
  // packages.add(new MyReactNativePackage());
  return packages;
}
```

Since 0.60, React Native has enabled `auto link`. Installed third-party Native Modules are all in `PackageList`, so we can get all auto-linked Modules by just calling `getPackages()`.

In the source code, in the `ReactInstanceManager.java` file, it will run `createReactContext()` to create `ReactContext`. There's a step to register the `nativeModules` registry:

```java
// ReactInstanceManager.java

private ReactApplicationContext createReactContext(
  JavaScriptExecutor jsExecutor,
  JSBundleLoader jsBundleLoader) {

  // Register nativeModules registry
  NativeModuleRegistry nativeModuleRegistry = processPackages(reactContext, mPackages, false);
}
```

Following the function calls, we track to the `processPackages()` function, which uses a for loop to add all Native Modules from mPackages to the registry:

```java
// ReactInstanceManager.java

private NativeModuleRegistry processPackages(
    ReactApplicationContext reactContext,
    List<ReactPackage> packages,
    boolean checkAndUpdatePackageMembership) {
  // Create JavaModule registry Builder, used to create JavaModule registry,
  // JavaModule registry will register all JavaModule to CatalystInstance
  NativeModuleRegistryBuilder nativeModuleRegistryBuilder =
      new NativeModuleRegistryBuilder(reactContext, this);

  // Lock mPackages
  // mPackages type is List<ReactPackage>, corresponding to packages in MainApplication.java
  synchronized (mPackages) {
    for (ReactPackage reactPackage : packages) {
      try {
        // Loop through ReactPackage injected in Application, the processing process is to add each Module to the corresponding registry
        processPackage(reactPackage, nativeModuleRegistryBuilder);
      } finally {
        Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
      }
    }
  }

  NativeModuleRegistry nativeModuleRegistry;
  try {
    // Generate Java Module registry
    nativeModuleRegistry = nativeModuleRegistryBuilder.build();
  } finally {
    Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    ReactMarker.logMarker(BUILD_NATIVE_MODULE_REGISTRY_END);
  }

  return nativeModuleRegistry;
}
```

Finally, call `processPackage()` for actual registration:

```java
// ReactInstanceManager.java

private void processPackage(
    ReactPackage reactPackage,
    NativeModuleRegistryBuilder nativeModuleRegistryBuilder
) {
  nativeModuleRegistryBuilder.processPackage(reactPackage);
}
```

From the above flow, we can see that when Android registers `Native Modules`, it's **synchronous full registration**. If `Native Modules` are numerous, it will affect the startup time of the Android RN container.

### Optimization Suggestions

Honestly, **full Native Module binding in the existing architecture is unsolvable**: no matter whether you use this Native Method or not, the container will initialize all of them during startup. In the new RN architecture, TurboModules will solve this problem (the next section of this article will introduce).

If we have to optimize, there's actually another approach: you're doing full initialization, so why not reduce the number of Native Modules? In the new architecture, there's a step called **Lean Core**, which is to streamline the React Native core, moving some functions/components from RN's main project (such as the `WebView` component) to community maintenance. When you want to use them, you download and integrate them separately.

The main benefits of doing this are:

- More streamlined core, RN maintainers have more energy to maintain main functions
- Reduce Native Module binding time and redundant JS loading time. Smaller package size is more friendly to initialization performance (after we upgraded RN version to 0.62, initialization speed doubled, basically thanks to Lean Core)
- Accelerate iteration speed, optimize development experience, etc.

Now the **Lean Core** work is basically complete. More discussion can be seen in the [official issues discussion area](https://github.com/react-native-community/discussions-and-proposals/issues/6). We just need to upgrade the React Native version in sync to enjoy the results of **Lean Core**.

## 4. How Does RN's New Architecture Optimize Startup Performance

React Native's new architecture has been delayed for almost two years. Every time I ask about progress, the official reply is "don't rush it, don't rush it, it's in progress."

![](https://image-1255652541.file.myqcloud.com/uPic/79EL0.gif)

I personally waited for a whole year last year but got nothing. When RN updates to version 1.0.0, I don't care anymore. Although RN officials keep delaying, it has to be said that their new architecture has some substance. I've basically read all the articles and videos about RN's new architecture on the market, so I have an overall understanding of the new architecture.

![](https://image-1255652541.file.myqcloud.com/uPic/new-diagram-full.jpg)

Because the new architecture hasn't been officially released yet, there must be some differences in specific details. The specific execution details will have to wait for React Native officials.

### JSI

JSI's full name is **JavaScript Interface**, a framework written in C++. Its role is to **support JS directly calling Native methods**, instead of the current asynchronous communication through Bridge.

How to understand JS directly calling Native? Let's take the simplest example. When calling APIs like `setTimeout` `document.getElementById` in the browser, we're actually directly calling Native Code on the JS side. We can verify this in the browser console:

![](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-04-04_17-39-14.jpg)

For example, if I execute a command:

```javascript
let el = document.createElement('div')
```

The variable `el` holds not a JS object, but an object instantiated in C++. For the object held by el, we set some related properties:

```javascript
el.setAttribute('width', 100)
```

At this time, it's actually JS **synchronously calling** the `setWidth` method in C++ to change the width of this element.

The JSI in React Native's new architecture mainly serves this purpose. With JSI, we can use JS to directly get references to C++ objects (**Host Objects**), directly control UI, and directly call Native Module methods, saving the overhead of bridge asynchronous communication.

Below is a small example to see how Java/OC can expose synchronous calling methods to JS using JSI.

```cpp
#pragma once

#include <string>
#include <unordered_map>

#include <jsi/jsi.h>

// SampleJSIObject inherits from HostObject, representing an object exposed to JS
// For JS, it can directly synchronously call properties and methods on this object
class JSI_EXPORT SampleJSIObject : public facebook::jsi::HostObject {

public:

// Step 1
// Expose window.__SampleJSIObject to JavaScript
// This is a static function, generally called from ObjC/Java during application initialization
static void SampleJSIObject::install(jsi::Runtime &runtime) {
  runtime.global().setProperty(
      runtime,
      "__sampleJSIObject",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "__SampleJSIObject"),
          1,
          [binding](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
            // Return the content obtained when calling window.__SampleJSIObject
            return std::make_shared<SampleJSIObject>();
          }));
}

// Similar to getter, every time JS accesses this object, it goes through this method, acting like a wrapper
// For example, when we call window.__sampleJSIObject.method1(), this method will be called
jsi::Value TurboModule::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  // Method name being called
  // For example, when calling window.__sampleJSIObject.method1(), propNameUtf8 is method1
  std::string propNameUtf8 = propName.utf8(runtime);

  return jsi::Function::createFromHostFunction(
    runtime,
    propName,
    argCount,
    [](facebook::jsi::Runtime &rt, const facebook::jsi::Value &thisVal, const facebook::jsi::Value *args, size_t count) {
      if (propNameUtf8 == 'method1') {
        // Function processing logic when calling method1
      }
    });
}

std::vector<PropNameID> getPropertyNames(Runtime& rt){
}

}
```

The above example is quite brief. For a deeper understanding of JSI, you can read the ["React Native JSI Challenge"](https://medium.com/@christian.falch/https-medium-com-christian-falch-react-native-jsi-challenge-1201a69c8fbf) article or directly read the source code.

### TurboModules

From the previous source code analysis, we can know that in the existing architecture, during Native initialization, **all native modules are loaded fully**. As business iterates, native modules will only increase, and the time consumption here will become longer and longer.

TurboModules can solve this problem at once. In the new architecture, native modules are **lazy-loaded**, meaning they are only initialized and loaded when you call the corresponding native modules, which solves the problem of long initialization time due to full loading during initialization.

The calling path of TurboModules is roughly as follows:

1. First use JSI to create a top-level "Native Modules Proxy", called `global.__turboModuleProxy`
2. Access a Native Module, for example, to access `SampleTurboModule`, we first execute `require('NativeSampleTurboModule')` on the JavaScript side
3. In the NativeSampleTurboModule.js file, we first call `TurboModuleRegistry.getEnforcing()`, then call `global.__turboModuleProxy("SampleTurboModule")`
4. When calling `global.__turboModuleProxy`, it will call the Native method exposed by JSI in step 1. At this time, the C++ layer finds the ObjC/Java implementation through the passed string "SampleTurboModule" and finally returns a corresponding JSI object
5. Now we have the JSI object of `SampleTurboModule`, and we can use JavaScript to synchronously call properties and methods on the JSI object

Through the above steps, we can see that with TurboModules, Native Modules are only loaded when **first called**, which completely eliminates the time spent on **full loading** of Native Modules during React Native container initialization; at the same time, we can use JSI to achieve synchronous calling between JS and Native, with less time consumption and higher efficiency.

## Summary

This article mainly starts from the **Native** perspective, analyzes React Native **existing architecture**'s startup process from source code, summarizes several performance optimization points on the Native layer; and finally briefly introduces React Native's **new architecture**. The next article will explain how to optimize React Native startup speed from the **JavaScript** perspective.

### RN Performance Optimization Series Directory:

- [🎨 React Native Performance Optimization - Rendering Chapter](https://supercodepower.com/react_native_performance_optimization_guides)
- [⚡️ React Native Startup Speed Optimization - Native Chapter](https://supercodepower.com/react-native-performance-native)
- [⚡️ React Native Startup Speed Optimization - JS Chapter](https://supercodepower.com/react-native-performance-js)

## References

[React Native Performance Optimization Guide](https://supercodepower.com/react_native_performance_optimization_guides)

[React Native Upgrade Guide (0.59 -> 0.62)](https://supercodepower.com/docs/react-native-upgrade/index)

[Chain React 2019 - Ram Narasimhan - Performance in React Native](https://www.youtube.com/watch?v=nphKGWjhg2M)

[React Native's new architecture - Glossary of terms](http://blog.nparashuram.com/2019/01/react-natives-new-architecture-glossary.html#turbomodules)

[React Native JSI Challenge](https://medium.com/@christian.falch/https-medium-com-christian-falch-react-native-jsi-challenge-1201a69c8fbf)

[RFC0002: Turbo Modules ™](https://github.com/react-native-community/discussions-and-proposals/blob/master/proposals/0002-Turbo-Modules.md)

[ReactNative与iOS原生通信原理解析-初始化](https://mrgaogang.github.io/react/ReactNative%E4%B8%8EiOS%E5%8E%9F%E7%94%9F%E9%80%9A%E4%BF%A1%E5%8E%9F%E7%90%86%E8%A7%A3%E6%9E%90-%E5%88%9D%E5%A7%8B%E5%8C%96.html#%E7%BC%98%E8%B5%B7)

[React Native iOS 源码解析](http://slides.com/qianmeng/react-native-ios-sourceread)

[ReactNative源码篇：源码初识](https://github.com/sucese/react-native/blob/master/doc/ReactNative%E6%BA%90%E7%A0%81%E7%AF%87/1ReactNative%E6%BA%90%E7%A0%81%E7%AF%87%EF%BC%9A%E6%BA%90%E7%A0%81%E5%88%9D%E8%AF%86.md)

[如何用React Native预加载方案解决白屏问题](https://time.geekbang.org/dailylesson/detail/100056865)

----

Personal WeChat: **egg_labs**

<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/Uh1E2O.png" width="40%" />
</p>

<br />

<br />

<br />

<br />

<br />

:::note A small note
Welcome to follow the official account: **卤代烃实验室**: Focus on frontend technology, hybrid development, and graphics, only writing in-depth technical articles
:::