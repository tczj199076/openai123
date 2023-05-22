declare module 'vue-matomo' {
    import { Plugin, RouteLocationNormalized } from 'vue';
  
    interface VueMatomoOptions {
      host: string;
      siteId: string | number;
      router?: any; // 如果使用router自动注册，应该声明router的类型
      requireConsent?: boolean;
      enableLinkTracking?: boolean;
      trackInitialView?: boolean;
      trackerFileName?: string;
      debug?: boolean;
      userId?: string;
    }
  
    interface MatomoTrackEvent {
      category: string;
      action: string;
      name?: string;
      value?: number;
    }
  
    // 定义VueMatomo插件的类型
    const VueMatomo: Plugin & {
      $matomo: {
        trackPageView(url?: string): void;
        trackEvent(event: MatomoTrackEvent): void;
        setUserId(userId: string): void;
      };
    };
  
    export default VueMatomo;
  }