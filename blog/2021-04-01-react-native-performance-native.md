---
slug: react-native-performance-native
title: ⚡️ React Native 启动速度优化——Native 篇（内含源码分析）
authors: skychx

description: 从 React Native 的启动到页面的第一次渲染完成，结合 React Native 的源码和 1.0 的新架构，一一分析 React Native 的启动性能优化之路
draft: false
tags: [react native, 跨端开发, 性能优化]
---

Web 开发有一个经典问题：「**浏览器中从输入 URL 到页面渲染的这个过程中都发生了什么？**」

据我考据这个问题起码有**十年**历史了。在日新月异学不动的前端圈子里，这个问题能一直被问，就是因为因为它是个非常好的问题，涉及非常多的知识点，平时做一些性能优化，都可以从这个问题出发，分析性能瓶颈，然后对症下药进行优化。

不过今天我们不谈 Web 的性能优化，只是借助刚刚的那个那个经典问题的分析思路，**从 React Native 的启动到页面的第一次渲染完成，结合 React Native 的源码和 1.0 的新架构，探索 React Native 的启动性能优化之路**。


{/* truncate */}


:::note 阅读提醒
1.文章中的源码内容为 RN 0.64 版本

2.源码分析内容涉及 `Objective-C`、`Java`、`C++`、`JavaScript` 四门语言，我尽量讲得通俗易懂一些，若实在不理解可以直接看结论
:::


## 0.React Native 启动流程

React Native 作为一个 Web 前端友好的混合开发框架，启动时可以大致分为两个部分：

- Native 容器的运行
- JavaScript 代码的运行

其中 Native 容器启动在现有架构（版本号小于 1.0.0）里：大致可以分为 3 个部分：

- Native 容器初始化
- Native Modules 的**全量**绑定
- JSEngine 的初始化

容器初始化后，舞台就交给了 JavaScript，流程可以细分为 2 个部分：

- JavaScript 代码的加载、解析和执行
- React 的调度与运行（例如 Fiber 的构建）

最后 JS Thread 把计算好的布局信息发送到 Native 端，计算 Shadow Tree，最后由 UI Thread 进行布局和渲染。

:::note 文章指路
关于渲染部分的性能优化可以见我之前写的[《React Native 性能优化指南》](https://supercodepower.com/react_native_performance_optimization_guides)，我从**渲染**、**图片**、**动画**、**长列表**等方向介绍了 RN 渲染优化的常见套路，感兴趣的读者可以前往查看，我这里就不多介绍了。
:::

上面的几个步骤，我画了一张图，下面我以这张图为目录，从左向右介绍各个步骤的优化方向：

![](https://image-1255652541.file.myqcloud.com/uPic/rn_start_all.jpg)

:::note 提示
React Native 初始化时，有可能多个任务**并行执行**，所以上图只能表示 React Native 初始化的大致流程，并不和实际代码的执行时序一一对应。
:::


## 1.升级 React Native

想提升 React Native 应用的性能，最一劳永逸的方法就是**升级 RN 的大版本**了。我们的应用从 0.59 升级到 0.62 之后，我们的 APP 没有做任何的性能优化工作，启动时间直接缩短了 1/2。当 React Native 的新架构发布后，启动速度和渲染速度都会大大加强。

当然，RN 的版本升级并不容易（横跨 iOS Android JS 三端，兼容破坏性更新），我之前写过一篇[《React Native 升级指南（0.59 -> 0.62）》](https://supercodepower.com/docs/react-native-upgrade/index)的文章，如果有升级想法的老铁可以阅读参考一下。



## 2.Native 容器初始化

![](https://image-1255652541.file.myqcloud.com/uPic/rn_start_native.jpg)

容器的初始化肯定是从 APP 的入口文件开始分析，下面我会**挑选一些关键代码**，梳理一下初始化的流程。

### iOS 源码分析

#### 1.AppDelegate.m

`AppDelegate.m` 是 iOS 的入口文件，代码非常精简，主要内容如下所示：

```objectivec
// AppDelegate.m

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  // 1.初始化一个 RCTBridge 实现加载 jsbundle 的方法
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];

  // 2.利用 RCTBridge 初始化一个 RCTRootView
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"RN64"
                                            initialProperties:nil];

  // 3.初始化 UIViewController
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  
  // 4.将 RCTRootView 赋值给 UIViewController 的 view
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}
```

总的来看入口文件就做了三件事：

- 初始化一个 `RCTBridge` 实现加载 jsbundle 的方法
- 利用 `RCTBridge` 初始化一个 `RCTRootView`
- 将 `RCTRootView` 赋值给 `UIViewController` 的 view 实现 UI 的挂载

从入口源码我们可以发现，所有的初始化工作都**指向** `RCTRootView`，所以接下来我们看看 `RCTRootView` 干了些啥。

#### 2.RCTRootView

我们先看一下 `RCTRootView` 的头文件，删繁就简，我们只看我们关注的一些方法：

```objectivec
// RCTRootView.h

@interface RCTRootView : UIView

// AppDelegate.m 中用到的初始化方法
- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(nullable NSDictionary *)initialProperties NS_DESIGNATED_INITIALIZER;
```

从头文件看出：

- `RCTRootView` 继承自 `UIView`，所以它本质上就是一个 UI 组件；
- `RCTRootView` 调用 `initWithBridge` 初始化时要传入一个已经初始化的 `RCTBridge`

在 `RCTRootView.m`  文件里，`initWithBridge` 初始化时会监听一系列的 JS 加载监听函数，监听到 JS Bundle 文件加载结束后，就会调用 JS 里的 `AppRegistry.runApplication()`，启动 RN 应用。

分析到这里，我们发现 `RCTRootView.m` 只是实现了对 `RCTBridge` 的的各种事件监听，**并不是初始化的核心**，所以我们就又要转到 `RCTBridge` 这个文件上去。



#### 3.RCTBridge.m

`RCTBridge.m` 里，初始化的调用路径有些长，全贴源码有些长，总之最后调用的是 `(void)setUp`，核心代码如下：

```objectivec
- (Class)bridgeClass
{
  return [RCTCxxBridge class];
}

- (void)setUp {
  // 获取bridgeClass 默认是 RCTCxxBridge
  Class bridgeClass = self.bridgeClass;
  // 初始化 RTCxxBridge
  self.batchedBridge = [[bridgeClass alloc] initWithParentBridge:self];
  // 启动 RTCxxBridge
  [self.batchedBridge start];
}
```

我们可以看到，`RCTBridge` 的初始化又指向了 `RTCxxBridge`。



#### 4.RTCxxBridge.mm

`RTCxxBridge` 可以说是 React Native 初始化的**核心**，我查阅了一些资料，貌似 `RTCxxBridge` 曾用名为 `RCTBatchedBridge`，所以可以粗暴的把这两个类当成一回事儿。

因为在 `RCTBridge` 里调用了 `RTCxxBridge` 的 `start` 方法，我们就从 `start` 方法来看看做了些什么。

```objectivec
// RTCxxBridge.mm

- (void)start {
  // 1.初始化 JSThread，后续所有的 js 代码都在这个线程里面执行
  _jsThread = [[NSThread alloc] initWithTarget:[self class] selector:@selector(runRunLoop) object:nil];
  [_jsThread start];
  
  // 创建并行队列
  dispatch_group_t prepareBridge = dispatch_group_create();
  
  // 2.注册所有的 native modules
  [self registerExtraModules];
  (void)[self _initializeModules:RCTGetModuleClasses() withDispatchGroup:prepareBridge lazilyDiscovered:NO];
  
  // 3.初始化 JSExecutorFactory 实例
  std::shared_ptr<JSExecutorFactory> executorFactory;
  
  // 4.初始化底层 Instance 实例，也就是 _reactInstance
  dispatch_group_enter(prepareBridge);
  [self ensureOnJavaScriptThread:^{
    [weakSelf _initializeBridge:executorFactory];
    dispatch_group_leave(prepareBridge);
  }];
  
  // 5.加载 js 代码
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
  
  // 6.等待 native moudle 和 JS 代码加载完毕后就执行 JS
  dispatch_group_notify(prepareBridge, dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
    RCTCxxBridge *strongSelf = weakSelf;
    if (sourceCode && strongSelf.loading) {
      [strongSelf executeSourceCode:sourceCode sync:NO];
    }
  });
}
```

上面代码比较长，里面用到了 **GCD 多线程**的一些知识点，用文字描述大致是如下的流程：

1. 初始化 js 线程 `_jsThread`
2. 在主线程上注册所有 `native modules`
3. 准备 `js` 和 `Native` 之间的桥和 js 运行环境
4. 在 JS 线程上创建消息队列 `RCTMessageThread`，初始化 `_reactInstance`
5. 在 JS 线程上加载 JS Bundle
6. 等上面的事情全部做完后，执行 JS 代码



其实上面的六个点都可以深挖下去，但是本节涉及到的源码内容到这里就可以了，感兴趣的读者可以结合我最后给出的参考资料和 React Native 源码深挖探索一下。



### Android 源码分析

#### 1.MainActivity.java & MainApplication.java

和 iOS 一样，启动流程我们先从入口文件开始分析，我们先看 `MainActivity.java`：

`MainActivity` 继承自 `ReactActivity`，`ReactActivity` 又继承自 `AppCompatActivity`：

```java
// MainActivity.java

public class MainActivity extends ReactActivity {
  // 返回组件名，和 js 入口注册名字一致
  @Override
  protected String getMainComponentName() {
    return "rn_performance_demo";
  }
}
```

我们再从 Android 的入口文件 `MainApplication.java` 开始分析：

```java
// MainApplication.java

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHost(this) {
        // 返回 app 需要的 ReactPackage，添加需要加载的模块，
        // 这个地方就是我们在项目中添加依赖包时需要添加第三方 package 的地方
        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          return packages;
        }

        // js bundle 入口文件，设置为 index.js
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
    // SoLoader：加载C++底层库
    SoLoader.init(this, /* native exopackage */ false);
  }
}
```

`ReactApplication` 接口很简单，要求我们创建一个 `ReactNativeHost` 对象：

```java
public interface ReactApplication {
  ReactNativeHost getReactNativeHost();
}
```

从上面的分析我们可以看出一切指向了 `ReactNativeHost` 这个类，下面我们就看一下它。

#### 2.ReactNativeHost.java

`ReactNativeHost` 主要的工作就是创建了 `ReactInstanceManager`:

```java
public abstract class ReactNativeHost {
  protected ReactInstanceManager createReactInstanceManager() {
    ReactMarker.logMarker(ReactMarkerConstants.BUILD_REACT_INSTANCE_MANAGER_START);
    ReactInstanceManagerBuilder builder =
        ReactInstanceManager.builder()
            // 应用上下文
            .setApplication(mApplication)
            // JSMainModulePath 相当于应用首页的 js Bundle，可以传递 url 从服务器拉取 js Bundle
            // 当然这个只在 dev 模式下可以使用
            .setJSMainModulePath(getJSMainModuleName())
            // 是否开启 dev 模式
            .setUseDeveloperSupport(getUseDeveloperSupport())
            // 红盒的回调
            .setRedBoxHandler(getRedBoxHandler())
            .setJavaScriptExecutorFactory(getJavaScriptExecutorFactory())
            .setUIImplementationProvider(getUIImplementationProvider())
            .setJSIModulesPackage(getJSIModulePackage())
            .setInitialLifecycleState(LifecycleState.BEFORE_CREATE);

    // 添加 ReactPackage
    for (ReactPackage reactPackage : getPackages()) {
      builder.addPackage(reactPackage);
    }
    
    // 获取 js Bundle 的加载路径
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

#### 3.ReactActivityDelegate.java

我们再回到 `ReactActivity`，它自己并没有做什么事情，所有的功能都由它的委托类 `ReactActivityDelegate` 来完成，所以我们直接看`ReactActivityDelegate`是怎么实现的：

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
      // 载入 app 页面
      loadApp(mainComponentName);
    }
  }
  
  protected void loadApp(String appKey) {
    mReactDelegate.loadApp(appKey);
    // Activity 的 setContentView() 方法
    getPlainActivity().setContentView(mReactDelegate.getReactRootView());
  }
}
```

`onCreate()` 的时候又实例化了一个 `ReactDelegate`，我们再看看它的实现。



#### 4.ReactDelegate.java

在 `ReactDelegate.java` 里，我没看见它做了两件事：

- 创建 `ReactRootView` 作为根视图
- 调用 `getReactNativeHost().getReactInstanceManager()` 启动 RN 应用

```java
public class ReactDelegate {
  public void loadApp(String appKey) {
    if (mReactRootView != null) {
      throw new IllegalStateException("Cannot loadApp while app is already running.");
    }
    // 创建 ReactRootView 作为根视图
    mReactRootView = createRootView();
    // 启动 RN 应用
    mReactRootView.startReactApplication(
        getReactNativeHost().getReactInstanceManager(), appKey, mLaunchOptions);
  }
}
```

基础的启动流程本节涉及到的源码内容到这里就可以了，感兴趣的读者可以结合我最后给出的参考资料和 React Native 源码深挖探索一下。



### 优化建议

对于 React Native 为主体的应用，APP 启动后就要立马初始化 RN 容器，这时候可以加一个启动屏（splash screen
），等 React Native 初始化后再隐藏启动屏；以 Native 为主的混合开发 APP，我们可以尝试以下思路：

**既然初始化耗时最长，我们在正式进入 React Native 容器前提前初始化不就好了？**

这个方法非常的常见，因为很多 H5 容器也是这样做的。正式进入 WebView 网页前，先做一个 WebView 容器池，提前初始化 WebView，进入 H5 容器后，直接加载数据渲染，以达到网页秒开的效果。

**RN 容器池**这个概念看着很玄乎，其实就是一个 `Map`，`key` 为 RN 页面的 `componentName`（即 `AppRegistry.registerComponent(appName, Component)` 中传入的 `appName`），`value` 就是一个已经实例化的 `RCTRootView/ReactRootView`。

APP 启动后找个触发时机提前初始化，进入 RN 容器前先读容器池，如果有匹配的容器，直接拿来用即可，没有匹配的再重新初始化。

写两个很简单的案例，iOS 可以如下图所示，构建 RN 容器池：

```objectivec
@property (nonatomic, strong) NSMutableDictionary<NSString *, RCTRootView *> *rootViewRool;

// 容器池
-(NSMutableDictionary<NSString *, RCTRootView *> *)rootViewRool {
  if (!_rootViewRool) {
    _rootViewRool = @{}.mutableCopy;
  }
  
  return _rootViewRool;
}


// 缓存 RCTRootView
-(void)cacheRootView:(NSString *)componentName path:(NSString *)path props:(NSDictionary *)props bridge:(RCTBridge *)bridge {
  // 初始化
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:componentName
                                            initialProperties:props];
  // 实例化后要加载到屏幕的最下面，否则不能触发视图渲染
  [[UIApplication sharedApplication].keyWindow.rootViewController.view insertSubview:rootView atIndex:0];
  rootView.frame = [UIScreen mainScreen].bounds;
  
  // 把缓存好的 RCTRootView 放到容器池中
  NSString *key = [NSString stringWithFormat:@"%@_%@", componentName, path];
  self.rootViewRool[key] = rootView;
}


// 读取容器
-(RCTRootView *)getRootView:(NSString *)componentName path:(NSString *)path props:(NSDictionary *)props bridge:(RCTBridge *)bridge {
  NSString *key = [NSString stringWithFormat:@"%@_%@", componentName, path];
  RCTRootView *rootView = self.rootViewRool[key];
  if (rootView) {
    return rootView;
  }
  
  // 兜底逻辑
  return [[RCTRootView alloc] initWithBridge:bridge moduleName:componentName initialProperties:props];
}
```



Android 如下构建 RN 容器池：

```java
private HashMap<String, ReactRootView> rootViewPool = new HashMap<>();

// 创建容器
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

// 缓存容器
public void cahceRootView(String componentName, String path, Bundle props, Context context) {
    ReactRootView rootView = createRootView(componentName, path, props, context);
    String key = componentName + "_" + path;

    // 把缓存好的 RCTRootView 放到容器池中
    rootViewPool.put(key, rootView);
}

// 读取容器
public ReactRootView getRootView(String componentName, String path, Bundle props, Context context) {
    String key = componentName + "_" + path;
    ReactRootView rootView = rootViewPool.get(key);

    if (rootView != null) {
        rootView.setAppProperties(newProps);
        rootViewPool.remove(key);
        return rootView;
    }

    // 兜底逻辑
    return createRootView(componentName, path, props, context);
}
```



当然，由于每次 `RCTRootView/ReactRootView` 都要占用一定的内存，所以什么时候实例化，实例化几个容器，池的大小限制，什么时候清除容器，都需要结合业务进行实践和摸索。



## 3.Native Modules 绑定

![](https://image-1255652541.file.myqcloud.com/uPic/rn_start_nativeModules.jpg)



### iOS 源码分析

iOS 的 Native Modules 有 3 块儿内容，大头是中间的 `_initializeModules` 函数：

```objectivec
// RCTCxxBridge.mm

- (void)start {
  // 初始化 RCTBridge 时调用 initWithBundleURL_moduleProvider_launchOptions 中的 moduleProvider 返回的 native modules
  [self registerExtraModules];
  
  // 注册所有的自定义 Native Module
  (void)[self _initializeModules:RCTGetModuleClasses() withDispatchGroup:prepareBridge lazilyDiscovered:NO];
  
  // 初始化所有懒加载的 native module，只有用 Chrome debug 时才会调用
  [self registerExtraLazyModules];
}
```



我们看看 `_initializeModules` 函数做了什么：

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

根据 `_initializeModules` 和 `_prepareModulesWithDispatchGroup` 的注释，可以看出 iOS 在 JS Bundle 加载的过程中（在 **JSThead 线程**进行），同时在**主线程**初始化所有的 Native Modules。



结合前面的源码分析，我们可以看出 React Native iOS 容器初始化的时候，会**初始化所有的 Native Modules**，若 `Native Modules` 比较多，就会影响 iOS RN 容器的启动时间。



### Android 源码分析

关于 Native Modules 的注册，其实在 `MainApplication.java` 这个入口文件里已经给出了线索：

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

由于 0.60 之后 React Native 启用了 `auto link`，安装的第三方 Native Modules 都在 `PackageList` 里，所以我们只要 `getPackages()` 一下就能获取  `auto link` 的 Modules。

源码里，在 `ReactInstanceManager.java` 这个文件中，会运行 `createReactContext()` 创建 `ReactContext`，这里面有一步就是注册 `nativeModules` 的注册表：

```java
// ReactInstanceManager.java

private ReactApplicationContext createReactContext(
  JavaScriptExecutor jsExecutor, 
  JSBundleLoader jsBundleLoader) {
  
  // 注册 nativeModules 注册表
  NativeModuleRegistry nativeModuleRegistry = processPackages(reactContext, mPackages, false);
}
```



根据函数调用，我们追踪到 `processPackages()` 这个函数里，利用一个 for 循环把 mPackages 里的 Native Modules 全部加入注册表：

```java
// ReactInstanceManager.java

private NativeModuleRegistry processPackages(
    ReactApplicationContext reactContext,
    List<ReactPackage> packages,
    boolean checkAndUpdatePackageMembership) {
  // 创建 JavaModule 注册表 Builder，用来创建 JavaModule 注册表，
  // JavaModule 注册表将所有的 JavaModule 注册到 CatalystInstance 中
  NativeModuleRegistryBuilder nativeModuleRegistryBuilder =
      new NativeModuleRegistryBuilder(reactContext, this);

  // 给 mPackages 加锁
  // mPackages 类型为 List<ReactPackage>，与 MainApplication.java 里的 packages 对应
  synchronized (mPackages) {
    for (ReactPackage reactPackage : packages) {
      try {
        // 循环处理我们在 Application 里注入的 ReactPackage，处理的过程就是把各自的 Module 添加到对应的注册表中
        processPackage(reactPackage, nativeModuleRegistryBuilder);
      } finally {
        Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
      }
    }
  }

  NativeModuleRegistry nativeModuleRegistry;
  try {
    // 生成 Java Module 注册表
    nativeModuleRegistry = nativeModuleRegistryBuilder.build();
  } finally {
    Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    ReactMarker.logMarker(BUILD_NATIVE_MODULE_REGISTRY_END);
  }

  return nativeModuleRegistry;
}
```



最后调用 `processPackage()` 进行真正的注册： 

```java
// ReactInstanceManager.java

private void processPackage(
    ReactPackage reactPackage,
    NativeModuleRegistryBuilder nativeModuleRegistryBuilder
) {
  nativeModuleRegistryBuilder.processPackage(reactPackage);
}
```

从上面的流程可以看出，Android 注册 `Native Modules` 的时候是**同步全量注册**的，若 `Native Modules` 比较多，就会影响 Android RN 容器的启动时间。



### 优化建议

说实话，**Native Modules 全量绑定在现有的架构里是无解的**：不管这个 Native Methods 你有没有用到，容器启动时先全部初始化一遍。在新的 RN 架构里，TurboModules 会解决这个问题（本文下一小节会介绍）。

如果非要说优化，其实还有个思路，你不是全量初始化吗，那我让 Native Modules 的数量减少不就行了？新架构里有一步叫做 **Lean Core**，就是精简 React Native 核心，把一些功能/组件从 RN 的主工程项目里移出去（例如 `WebView` 组件），交给社区维护，你想用的时候再单独下载集成。

这样做的好处主要有几点：

- 核心更加精简，RN 维护者有更多的精力维护主要功能
- 减小 Native Modules 的绑定耗时和多余的 JS 加载时间，包体积的减小，对初始化性能更友好（我们升级 RN 版本到 0.62 后初始化速度提升一倍，基本都是 Lean Core 的功劳）
- 加快迭代速度，优化开发体验等

现在 **Lean Core** 的工作基本已经完成，更多讨论可见[官方 issues 讨论区](https://github.com/react-native-community/discussions-and-proposals/issues/6)，我们只要同步升级 React Native 版本就可以享用 **Lean Core** 的成果。





## 4.RN 新架构如何优化启动性能

React Native 新架构已经跳票快两年了，每次问进度，官方回复都是“别催了别催了在做了在做了”。

![](https://image-1255652541.file.myqcloud.com/uPic/79EL0.gif)

我个人去年期待了一整年，但是啥都没等到，所以 RN 啥时候更新到 1.0.0 版本，我已经不在乎了。虽然 RN 官方一直在鸽，但是不得不说他们的新架构还是有些东西的，市面上存在关于 RN 新架构的文章和视频我基本都看了一遍，所以个人对新架构还是有个整体的认知。

![](https://image-1255652541.file.myqcloud.com/uPic/new-diagram-full.jpg)

因为新架构还没有正式放出，所以具体细节上肯定还存在一些差异，具体执行细节还是要等 React Native 官方为准。



### JSI

JSI 的全名是 **JavaScript Interface**，一个用 C++ 写的框架，作用是**支持 JS 直接调用 Native 方法**，而不是现在通过 Bridge 异步通讯。

JS 直接调用 Native 如何理解呢？我们举一个最简单的例子。在浏览器上调用 `setTimeout` `document.getElementById` 这类 API 的时候，其实就是在 JS 侧直接调用 Native Code，我们可以在浏览器控制台里验证一下：

![](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-04-04_17-39-14.jpg)

比如说我执行了一条命令：

```javascript
let el = document.createElement('div')
```

变量 `el` 持有的不是一个 JS 对象，而是一个在 C++ 中被实例化的对象。对于 el 持有的这个对象我们再设置一下相关属性：

```javascript
el.setAttribute('width', 100)
```

这时候其实是 JS **同步调用** C++ 中的 `setWidth` 方法，改变这个元素的宽度。



React Native 新架构中的 JSI，主要就是起这个作用的，借助 JSI，我们可以用 JS 直接获得 C++ 对象的引用（**Host Objects**），进而直接控制 UI，直接调用 Native Modules 的方法，省去 bridge 异步通讯的开销。

下面我们举个小例子，来看一下 Java/OC 如何借助 JSI 向 JS 暴露同步调用的方法。

```cpp
#pragma once

#include <string>
#include <unordered_map>

#include <jsi/jsi.h>

// SampleJSIObject 继承自 HostObject，表示这个一个暴露给 JS 的对象
// 对于 JS 来说，JS 可以直接同步调用这个对象上的属性和方法
class JSI_EXPORT SampleJSIObject : public facebook::jsi::HostObject {

public: 

// 第一步
// 将 window.__SampleJSIObject 暴露给JavaScript
// 这是一个静态函数，一般在应用初始化时从 ObjC/Java 中调用
static void SampleJSIObject::install(jsi::Runtime &runtime) {
  runtime.global().setProperty(
      runtime,
      "__sampleJSIObject",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "__SampleJSIObject"),
          1,
          [binding](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
            // 返回调用 window.__SampleJSIObject 时得到的内容
            return std::make_shared<SampleJSIObject>();
          }));
}

// 类似于 getter，每次 JS 访问这个对象的时候，都要经过这个方法，作用类似于一个包装器
// 比如说我们调用 window.__sampleJSIObject.method1()，这个方法就会被调用
jsi::Value TurboModule::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  // 调用方法名
  // 比如说调用 window.__sampleJSIObject.method1() 时，propNameUtf8 就是 method1
  std::string propNameUtf8 = propName.utf8(runtime);

  return jsi::Function::createFromHostFunction(
    runtime,
    propName,
    argCount,
    [](facebook::jsi::Runtime &rt, const facebook::jsi::Value &thisVal, const facebook::jsi::Value *args, size_t count) {
      if (propNameUtf8 == 'method1') {
        // 调用 method1 时，相关的函数处理逻辑
      }
    });
}
  
std::vector<PropNameID> getPropertyNames(Runtime& rt){
}
  
}
```

上面的例子比较简短，想要深入了解 JSI，可以看[《React Native JSI Challenge》](https://medium.com/@christian.falch/https-medium-com-christian-falch-react-native-jsi-challenge-1201a69c8fbf)这篇文章或直接阅读源码。



### TurboModules

经过前面的源码分析，我们可以得知，现有架构里，Native 初始化时会**全量加载 native modules**，随着业务的迭代，native modules 只会越来越多，这里的耗时会越来越长。

TurboModules 就可以一次性解决这个问题。在新架构里，native modules 是**懒加载**的，也就是说只有你调用相应的 native modules 时才会初始化加载，这样就解决了初始化全量加载耗时较长的问题。



TurboModules 的调用路径大概是这样的：

1. 先用 JSI 创建一个顶层的「Native Modules Proxy」，称之为 `global.__turboModuleProxy`
2. 访问一个 Native Modules，比如说要访问 `SampleTurboModule`，我们先在 JavaScript 侧执行 `require('NativeSampleTurboModule')`
3. 在 NativeSampleTurboModule.js 这个文件里，我们先调用 `TurboModuleRegistry.getEnforcing()`，然后就会调用 `global.__turboModuleProxy("SampleTurboModule")`
4. 调用 `global.__turboModuleProxy` 的时候，就会调用第一步 JSI 暴露的 Native 方法，这时候 C++ 层通过传入的字符串 "SampleTurboModule"，找到 ObjC/Java 的实现，最后返回一个对应的 JSI 对象
5. 现在我们得到了 `SampleTurboModule` 的 JSI 对象，就可以用 JavaScript 同步调用 JSI 对象上的属性和方法



通过上面的步骤，我们可以看到借助 TurboModules， Native Modules 只有**初次调用**的时候才会加载，这样就彻底干掉 React Native 容器初始化时**全量加载** Native Modules 时的时间；同时我们可以借助 JSI 实现 JS 和 Native 的同步调用，耗时更少，效率更高。



## 总结

本文主要从 **Native** 的角度出发，从源码分析 React Native **现有架构**的启动流程，总结了几个 Native 层的性能优化点；最后又简单介绍了一下React Native 的**新架构**。下一篇文章我会讲解如何从 **JavaScript** 入手，优化 React Native 的启动速度。

### RN 性能优化系列目录：

- [🎨 React Native 性能优化——Render 篇](https://supercodepower.com/react_native_performance_optimization_guides)
- [⚡️ React Native 启动速度优化——Native 篇](https://supercodepower.com/react-native-performance-native)
- [⚡️ React Native 启动速度优化——JS 篇](https://supercodepower.com/react-native-performance-js)



## 参考

[React Native 性能优化指南](https://supercodepower.com/react_native_performance_optimization_guides)

[React Native 升级指南（0.59 -> 0.62）](https://supercodepower.com/docs/react-native-upgrade/index)

[Chain React 2019 - Ram Narasimhan - Performance in React Native](https://www.youtube.com/watch?v=nphKGWjhg2M)

[React Native's new architecture - Glossary of terms](http://blog.nparashuram.com/2019/01/react-natives-new-architecture-glossary.html#turbomodules)

[React Native JSI Challenge](https://medium.com/@christian.falch/https-medium-com-christian-falch-react-native-jsi-challenge-1201a69c8fbf)

[RFC0002: Turbo Modules ™](https://github.com/react-native-community/discussions-and-proposals/blob/master/proposals/0002-Turbo-Modules.md)

[ReactNative与iOS原生通信原理解析-初始化](https://mrgaogang.github.io/react/ReactNative%E4%B8%8EiOS%E5%8E%9F%E7%94%9F%E9%80%9A%E4%BF%A1%E5%8E%9F%E7%90%86%E8%A7%A3%E6%9E%90-%E5%88%9D%E5%A7%8B%E5%8C%96.html#%E7%BC%98%E8%B5%B7)

[React Native iOS 源码解析](http://slides.com/qianmeng/react-native-ios-sourceread)

[ReactNative源码篇：源码初识](https://github.com/sucese/react-native/blob/master/doc/ReactNative%E6%BA%90%E7%A0%81%E7%AF%87/1ReactNative%E6%BA%90%E7%A0%81%E7%AF%87%EF%BC%9A%E6%BA%90%E7%A0%81%E5%88%9D%E8%AF%86.md)

[如何用React Native预加载方案解决白屏问题](https://time.geekbang.org/dailylesson/detail/100056865)

----

个人微信：**egg_labs**

<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/Uh1E2O.png" width="40%" />
</p>

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::


